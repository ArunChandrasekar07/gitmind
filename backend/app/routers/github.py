from fastapi import APIRouter, HTTPException, Query
from app.services.github_service import (
    parse_repo_url, get_repo_info, get_commits, get_commit_detail
)
from app.schemas.repo import RepoAnalysisResponse, CommitAnalysisRequest
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/repo")
async def fetch_repo(
    url: str = Query(..., description="GitHub repository URL"),
    limit: int = Query(default=20, ge=5, le=50),
):
    """Fetch repository info and recent commits."""
    try:
        owner, repo = parse_repo_url(url)
        repo_info, commits = await __import__("asyncio").gather(
            get_repo_info(owner, repo),
            get_commits(owner, repo, limit),
        )
        return {
            "repo": repo_info,
            "commits": commits,
            "total_commits": len(commits),
            "owner": owner,
            "repo_name": repo,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"GitHub fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch repository data.")


@router.get("/commit")
async def fetch_commit_detail(
    owner: str = Query(...),
    repo: str = Query(...),
    sha: str = Query(...),
):
    """Get detailed info about a specific commit."""
    try:
        detail = await get_commit_detail(owner, repo, sha)
        return detail
    except Exception as e:
        logger.error(f"Commit detail error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch commit details.")