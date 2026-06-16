from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.github_service import (
    parse_repo_url, get_repo_info, get_commits,
    get_commit_detail,
)
from app.services.ai_service import (
    analyze_commit, generate_repo_summary, stream_commit_analysis
)
from app.schemas.repo import BatchAnalysisRequest, CommitAnalysisRequest
import logging
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/commit")
async def analyze_single_commit(request: CommitAnalysisRequest):
    """Analyze a single commit with AI."""
    try:
        detail = await get_commit_detail(request.owner, request.repo, request.sha)
        analysis = analyze_commit(detail)
        return {"sha": request.sha, "analysis": analysis, "commit": detail}
    except Exception as e:
        logger.error(f"Commit analysis error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed.")


@router.post("/commit/stream")
async def stream_single_commit(request: CommitAnalysisRequest):
    """Stream analysis of a single commit."""
    try:
        detail = await get_commit_detail(request.owner, request.repo, request.sha)

        def generate():
            yield f"data: {json.dumps({'type': 'commit', 'data': detail})}\n\n"
            for chunk in stream_commit_analysis(detail):
                yield f"data: {json.dumps({'type': 'token', 'text': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except Exception as e:
        logger.error(f"Stream error: {e}")
        raise HTTPException(status_code=500, detail="Stream failed.")


@router.post("/batch")
async def analyze_batch(request: BatchAnalysisRequest):
    """
    Fetch + analyze multiple commits at once.
    Returns repo info + analyzed commits.
    """
    try:
        owner, repo = parse_repo_url(request.url)
        repo_info = await get_repo_info(owner, repo)
        commits = await get_commits(owner, repo, request.limit)

        # First fetch commit details (async)
        commit_details = []
        for commit in commits:
            try:
                detail = await get_commit_detail(owner, repo, commit["sha"])
                commit_details.append(detail)
            except Exception as e:
                logger.error(f"Failed fetching commit {commit['sha']}: {e}")
                commit_details.append(commit)

        def _analyze_one(detail):
            try:
                return {
                    "commit": detail,
                    "analysis": analyze_commit(detail),
                }
            except Exception as e:
                logger.error(f"Analysis failed: {e}")
                return {
                    "commit": detail,
                    "analysis": "Analysis unavailable for this commit.",
                }

        # Parallel AI analysis
        analyzed = [None] * len(commit_details)

        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_index = {
                executor.submit(_analyze_one, detail): i
                for i, detail in enumerate(commit_details)
            }

            for future in as_completed(future_to_index):
                idx = future_to_index[future]
                analyzed[idx] = future.result()

        # Generate overall summary
        summary = generate_repo_summary(
            repo_info,
            commits,
            [a["analysis"] for a in analyzed],
        )

        return {
            "repo": repo_info,
            "summary": summary,
            "analyzed_commits": analyzed,
            "total": len(analyzed),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Batch analysis error: {e}")
        raise HTTPException(status_code=500, detail="Batch analysis failed.")