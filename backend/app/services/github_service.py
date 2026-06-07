import httpx
from typing import List, Dict, Any, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"

HEADERS = {
    "Authorization": f"token {settings.github_token}",
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def parse_repo_url(url: str) -> tuple[str, str]:
    """Extract owner and repo from GitHub URL."""
    url = url.strip().rstrip("/")
    if "github.com/" in url:
        parts = url.split("github.com/")[-1].split("/")
        if len(parts) >= 2:
            return parts[0], parts[1].replace(".git", "")
    raise ValueError(f"Invalid GitHub URL: {url}")


async def get_repo_info(owner: str, repo: str) -> Dict[str, Any]:
    """Fetch repository metadata."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}",
            headers=HEADERS,
            timeout=15,
        )
        if response.status_code == 404:
            raise ValueError(f"Repository {owner}/{repo} not found or is private.")
        response.raise_for_status()
        data = response.json()
        return {
            "name": data["name"],
            "full_name": data["full_name"],
            "description": data.get("description", ""),
            "language": data.get("language", "Unknown"),
            "stars": data["stargazers_count"],
            "forks": data["forks_count"],
            "owner": data["owner"]["login"],
            "avatar": data["owner"]["avatar_url"],
            "default_branch": data["default_branch"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
            "html_url": data["html_url"],
            "topics": data.get("topics", []),
        }


async def get_commits(
    owner: str,
    repo: str,
    limit: int = 30,
    branch: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Fetch recent commits from a repository."""
    params = {"per_page": min(limit, 100)}
    if branch:
        params["sha"] = branch

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/commits",
            headers=HEADERS,
            params=params,
            timeout=20,
        )
        response.raise_for_status()
        commits = response.json()

        return [
            {
                "sha": c["sha"],
                "short_sha": c["sha"][:7],
                "message": c["commit"]["message"],
                "author": c["commit"]["author"]["name"],
                "author_email": c["commit"]["author"].get("email", ""),
                "avatar": c["author"]["avatar_url"] if c.get("author") else None,
                "date": c["commit"]["author"]["date"],
                "url": c["html_url"],
                "additions": None,
                "deletions": None,
                "files_changed": None,
            }
            for c in commits
        ]


async def get_commit_detail(
    owner: str, repo: str, sha: str
) -> Dict[str, Any]:
    """Get detailed info about a specific commit including file changes."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/commits/{sha}",
            headers=HEADERS,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        stats = data.get("stats", {})
        files = data.get("files", [])

        return {
            "sha": data["sha"],
            "short_sha": data["sha"][:7],
            "message": data["commit"]["message"],
            "author": data["commit"]["author"]["name"],
            "date": data["commit"]["author"]["date"],
            "additions": stats.get("additions", 0),
            "deletions": stats.get("deletions", 0),
            "files_changed": len(files),
            "files": [
                {
                    "filename": f["filename"],
                    "status": f["status"],
                    "additions": f.get("additions", 0),
                    "deletions": f.get("deletions", 0),
                    "patch": f.get("patch", "")[:2000],
                }
                for f in files[:10]
            ],
        }