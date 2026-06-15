const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  owner: string;
  avatar: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  topics: string[];
}

export interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface CommitInfo {
  sha: string;
  short_sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  additions?: number;
  deletions?: number;
  files_changed?: number;
  files?: CommitFile[];
  avatar?: string;
}

export interface AnalyzedCommit {
  commit: CommitInfo;
  analysis: string;
}

export interface BatchAnalysisResponse {
  repo: RepoInfo;
  summary: string;
  analyzed_commits: AnalyzedCommit[];
  total: number;
}

export const pingBackend = () =>
  fetch(`${API_URL}/health`).catch(() => {});

export const githubAPI = {
  fetchRepo: async (url: string, limit = 20) => {
    const response = await fetch(
      `${API_URL}/api/v1/github/repo?url=${encodeURIComponent(url)}&limit=${limit}`
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to fetch repository");
    }
    return response.json();
  },
};

export const analyzeAPI = {
  analyzeCommit: async (owner: string, repo: string, sha: string) => {
    const response = await fetch(`${API_URL}/api/v1/analyze/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo, sha }),
    });
    if (!response.ok) throw new Error("Analysis failed");
    return response.json();
  },

  analyzeBatch: async (
    url: string,
    limit = 10,
    signal?: AbortSignal
  ): Promise<BatchAnalysisResponse> => {
    const res = await fetch(`${API_URL}/api/v1/analyze/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, limit }),
      signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Analysis failed");
    }
    return res.json();
  },

  streamCommit: async (
    owner: string,
    repo: string,
    sha: string,
    onToken: (text: string) => void,
    onDone: () => void,
  ) => {
    const response = await fetch(`${API_URL}/api/v1/analyze/commit/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo, sha }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token") onToken(data.text);
            if (data.type === "done") onDone();
          } catch { /* ignore */ }
        }
      }
    }
  },
};