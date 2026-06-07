from pydantic import BaseModel
from typing import List, Optional, Any


class RepoRequest(BaseModel):
    url: str
    limit: int = 20


class CommitFile(BaseModel):
    filename: str
    status: str
    additions: int
    deletions: int
    patch: Optional[str] = None


class CommitInfo(BaseModel):
    sha: str
    short_sha: str
    message: str
    author: str
    date: str
    url: str
    additions: Optional[int] = None
    deletions: Optional[int] = None
    files_changed: Optional[int] = None
    files: Optional[List[CommitFile]] = None
    avatar: Optional[str] = None


class RepoInfo(BaseModel):
    name: str
    full_name: str
    description: Optional[str]
    language: Optional[str]
    stars: int
    forks: int
    owner: str
    avatar: str
    default_branch: str
    created_at: str
    updated_at: str
    html_url: str
    topics: List[str]


class AnalyzedCommit(BaseModel):
    commit: CommitInfo
    analysis: str


class RepoAnalysisResponse(BaseModel):
    repo: RepoInfo
    commits: List[CommitInfo]
    total_commits: int


class CommitAnalysisRequest(BaseModel):
    owner: str
    repo: str
    sha: str


class BatchAnalysisRequest(BaseModel):
    url: str
    limit: int = 10