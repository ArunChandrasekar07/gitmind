"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Loader2, GitCommit,
  Brain, BarChart2, GitBranch, Download, BookmarkPlus,
  Filter, SortAsc, RefreshCw,
} from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";
import { TopLoader } from "@/components/layout/TopLoader";
import { analyzeAPI, BatchAnalysisResponse } from "@/lib/api";
import { CommitRow } from "@/components/commit/CommitRow";
import { RepoSummary } from "@/components/repo/RepoSummary";
import { RepoHeaderSkeleton, CommitRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingStages } from "@/components/shared/LoadingStages";
import { getRiskFromAnalysis } from "@/components/commit/RiskBadge";
import { useAuthStore } from "@/lib/store";
import { pingBackend } from "@/lib/api";
import { toast } from "sonner";

const ANALYSIS_STAGES = [
  { id: "connect", label: "Connecting to GitHub API" },
  { id: "fetch", label: "Fetching commit history" },
  { id: "diff", label: "Reading commit diffs" },
  { id: "analyze", label: "Running AI analysis pipeline" },
  { id: "build", label: "Building intelligence report" },
];

const EXAMPLE_REPOS = [
  "https://github.com/vercel/ai",
  "https://github.com/langchain-ai/langchain",
  "https://github.com/supabase/supabase",
];

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<BatchAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchCommit, setSearchCommit] = useState("");

  useEffect(() => {
    pingBackend();
  }, []);

  const handleAnalyze = useCallback(
    async (targetUrl?: string) => {
      const repoUrl = targetUrl || url;
      if (!repoUrl.trim()) {
        toast.error("Please enter a GitHub repository URL");
        return;
      }

      setIsLoading(true);
      setResult(null);
      setError("");
      setCurrentStage(0);
      setFilterRisk("all");
      setSearchCommit("");

      const stageInterval = setInterval(() => {
        setCurrentStage((p) => Math.min(p + 1, ANALYSIS_STAGES.length - 1));
      }, 700);

      try {
        const data = await analyzeAPI.analyzeBatch(repoUrl, limit);
        clearInterval(stageInterval);
        setResult(data);

        // Save to history
        const riskCounts = data.analyzed_commits.reduce(
          (acc, item) => {
            const risk = getRiskFromAnalysis(item.analysis);
            if (risk === "danger") acc.danger++;
            else if (risk === "warn") acc.warn++;
            else acc.safe++;
            return acc;
          },
          { safe: 0, warn: 0, danger: 0 }
        );

        const historyItem = {
          id: `${Date.now()}`,
          repo_url: repoUrl,
          repo_name: data.repo.full_name,
          analyzed_at: new Date().toISOString(),
          total_commits: data.total,
          risk_counts: riskCounts,
          language: data.repo.language || "",
        };

        const stored = localStorage.getItem("gitmind-history");
        const history = stored ? JSON.parse(stored) : [];
        const updated = [
          historyItem,
          ...history.filter((h: { repo_url: string }) => h.repo_url !== repoUrl),
        ].slice(0, 50);
        localStorage.setItem("gitmind-history", JSON.stringify(updated));

        toast.success(
          `Analyzed ${data.total} commits from ${data.repo.name}`
        );
      } catch (err: unknown) {
        clearInterval(stageInterval);
        const msg =
          err instanceof Error ? err.message : "Analysis failed";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [url, limit]
  );

  useEffect(() => {
    const initialUrl = searchParams.get("url");
    if (initialUrl) {
      setUrl(initialUrl);
      handleAnalyze(initialUrl);
    }
  }, []);

  /* ── filtered commits ─────────────────────────────────── */
  const filteredCommits = result?.analyzed_commits.filter((item) => {
    const risk = getRiskFromAnalysis(item.analysis);
    const matchesRisk =
      filterRisk === "all" ||
      (filterRisk === "safe" && risk === "safe") ||
      (filterRisk === "warn" && risk === "warn") ||
      (filterRisk === "danger" && risk === "danger");
    const matchesSearch =
      !searchCommit ||
      item.commit.message
        .toLowerCase()
        .includes(searchCommit.toLowerCase()) ||
      item.commit.author
        .toLowerCase()
        .includes(searchCommit.toLowerCase()) ||
      item.commit.short_sha
        .toLowerCase()
        .includes(searchCommit.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const riskCounts = result
    ? result.analyzed_commits.reduce(
        (acc, item) => {
          const risk = getRiskFromAnalysis(item.analysis);
          if (risk === "danger") acc.danger++;
          else if (risk === "warn") acc.warn++;
          else acc.safe++;
          return acc;
        },
        { safe: 0, warn: 0, danger: 0 }
      )
    : { safe: 0, warn: 0, danger: 0 };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "hsl(220 16% 6%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopLoader />

      {/* ── TOP NAV ──────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          height: "52px",
          display: "flex",
          alignItems: "center",
          background: "hsl(220 16% 6% / 0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid hsl(220 10% 11%)",
          padding: "0 20px",
          gap: "12px",
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 8px",
            background: "none",
            border: "none",
            borderRadius: "6px",
            color: "hsl(215 12% 48%)",
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            flexShrink: 0,
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "hsl(210 20% 80%)";
            e.currentTarget.style.background = "hsl(220 12% 13%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "hsl(215 12% 48%)";
            e.currentTarget.style.background = "none";
          }}
        >
          <ArrowLeft size={13} />
          <span style={{ display: "none" }} className="sm-show">
            Home
          </span>
        </button>

        <Wordmark size={22} />

        {/* Search bar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "hsl(220 12% 11%)",
            border: "1px solid hsl(220 12% 15%)",
            borderRadius: "8px",
            padding: "0 10px",
            height: "34px",
            maxWidth: "560px",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "hsl(38 92% 54% / 0.5)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 0 3px hsl(38 92% 54% / 0.08)";
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "hsl(220 12% 15%)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <GitBranch
            size={13}
            style={{ color: "hsl(215 12% 40%)", flexShrink: 0 }}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="github.com/owner/repository"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "12px",
              color: "hsl(210 20% 88%)",
              fontFamily: "Inter, sans-serif",
              minWidth: 0,
            }}
          />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "11px",
              color: "hsl(215 12% 45%)",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              flexShrink: 0,
            }}
          >
            {[5, 10, 20, 30].map((n) => (
              <option
                key={n}
                value={n}
                style={{ background: "hsl(222 18% 12%)" }}
              >
                {n} commits
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => handleAnalyze()}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            background: isLoading
              ? "hsl(38 92% 54% / 0.5)"
              : "hsl(38 92% 54%)",
            border: "none",
            borderRadius: "7px",
            color: "hsl(220 16% 6%)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          {isLoading ? (
            <Loader2
              size={13}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Search size={13} />
          )}
          <span style={{ display: "none" }} className="sm-show">
            Analyze
          </span>
        </button>

        {/* Auth shortcut */}
        {isAuthenticated && (
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "5px 10px",
              background: "hsl(220 12% 12%)",
              border: "1px solid hsl(220 12% 18%)",
              borderRadius: "6px",
              color: "hsl(215 12% 52%)",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              flexShrink: 0,
              transition: "background 0.15s",
              display: "none",
            }}
            className="md-show"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "hsl(220 12% 15%)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "hsl(220 12% 12%)")
            }
          >
            Dashboard
          </button>
        )}
      </nav>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: "900px", width: "100%", margin: "0 auto", padding: "20px" }}>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: "80px",
                paddingBottom: "80px",
              }}
            >
              {/* Animated logo */}
              <div style={{ position: "relative", marginBottom: "36px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: "hsl(38 92% 54% / 0.08)",
                    border: "1px solid hsl(38 92% 54% / 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Brain
                    size={28}
                    style={{ color: "hsl(38 92% 58%)" }}
                  />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "20px",
                    border: "2px solid transparent",
                    borderTopColor: "hsl(38 92% 54%)",
                    borderRightColor: "hsl(38 92% 54% / 0.3)",
                  }}
                />
              </div>

              <LoadingStages
                stages={ANALYSIS_STAGES}
                currentStage={currentStage}
              />

              {/* shimmer bar */}
              <div
                style={{
                  marginTop: "28px",
                  width: "200px",
                  height: "2px",
                  background: "hsl(220 12% 13%)",
                  borderRadius: "1px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(90deg, transparent, hsl(38 92% 54%), transparent)",
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton while loading */}
        {isLoading && (
          <div style={{ display: "none" }}>
            <RepoHeaderSkeleton />
            {Array.from({ length: 5 }).map((_, i) => (
              <CommitRowSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <ErrorState
            message={error}
            onRetry={() => handleAnalyze()}
          />
        )}

        {/* Empty state */}
        {!isLoading && !error && !result && (
          <div
            style={{
              paddingTop: "60px",
              paddingBottom: "40px",
            }}
          >
            <EmptyState
              icon={GitBranch}
              title="Ready to analyze"
              description="Enter a GitHub repository URL in the search bar above to get started."
            />

            {/* Example repos */}
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "hsl(215 12% 42%)",
                  alignSelf: "center",
                }}
              >
                Try these repos:
              </span>
              {EXAMPLE_REPOS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setUrl(r);
                    handleAnalyze(r);
                  }}
                  style={{
                    padding: "5px 12px",
                    background: "hsl(220 12% 11%)",
                    border: "1px solid hsl(220 12% 16%)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "hsl(215 12% 52%)",
                    cursor: "pointer",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "hsl(38 92% 62%)";
                    e.currentTarget.style.borderColor =
                      "hsl(38 92% 54% / 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "hsl(215 12% 52%)";
                    e.currentTarget.style.borderColor =
                      "hsl(220 12% 16%)";
                  }}
                >
                  {r.replace("https://github.com/", "")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Repo summary */}
              <RepoSummary
                repo={result.repo}
                summary={result.summary}
                commitCount={result.total}
                riskCounts={riskCounts}
              />

              {/* Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                  flexWrap: "wrap",
                }}
              >
                {/* Commit search */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    background: "hsl(220 12% 11%)",
                    border: "1px solid hsl(220 12% 15%)",
                    borderRadius: "7px",
                    padding: "5px 10px",
                    flex: 1,
                    minWidth: "180px",
                  }}
                >
                  <Search
                    size={12}
                    style={{ color: "hsl(215 12% 42%)", flexShrink: 0 }}
                  />
                  <input
                    value={searchCommit}
                    onChange={(e) => setSearchCommit(e.target.value)}
                    placeholder="Search commits..."
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontSize: "12px",
                      color: "hsl(210 20% 88%)",
                      fontFamily: "Inter, sans-serif",
                      width: "100%",
                    }}
                  />
                </div>

                {/* Risk filter */}
                <div style={{ display: "flex", gap: "5px" }}>
                  {[
                    { key: "all", label: "All" },
                    { key: "safe", label: "Safe" },
                    { key: "warn", label: "Warn" },
                    { key: "danger", label: "Risk" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterRisk(f.key)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: filterRisk === f.key ? 600 : 400,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        transition: "all 0.15s",
                        background:
                          filterRisk === f.key
                            ? "hsl(38 92% 54% / 0.12)"
                            : "hsl(220 12% 11%)",
                        border:
                          filterRisk === f.key
                            ? "1px solid hsl(38 92% 54% / 0.3)"
                            : "1px solid hsl(220 12% 15%)",
                        color:
                          filterRisk === f.key
                            ? "hsl(38 92% 62%)"
                            : "hsl(215 12% 50%)",
                      }}
                    >
                      {f.label}
                      {f.key !== "all" && result && (
                        <span
                          style={{
                            marginLeft: "4px",
                            opacity: 0.7,
                          }}
                        >
                          {f.key === "safe"
                            ? riskCounts.safe
                            : f.key === "warn"
                            ? riskCounts.warn
                            : riskCounts.danger}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Re-analyze */}
                <button
                  onClick={() => handleAnalyze()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    background: "hsl(220 12% 11%)",
                    border: "1px solid hsl(220 12% 15%)",
                    borderRadius: "7px",
                    color: "hsl(215 12% 50%)",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "hsl(210 20% 80%)";
                    e.currentTarget.style.borderColor =
                      "hsl(222 14% 24%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "hsl(215 12% 50%)";
                    e.currentTarget.style.borderColor =
                      "hsl(220 12% 15%)";
                  }}
                >
                  <RefreshCw size={12} />
                  <span style={{ display: "none" }} className="sm-show">
                    Re-analyze
                  </span>
                </button>
              </div>

              {/* Result count */}
              <p
                style={{
                  fontSize: "11px",
                  color: "hsl(215 12% 40%)",
                  marginBottom: "8px",
                }}
              >
                {filteredCommits?.length ?? 0} of {result.total} commits ·
                click any row to expand AI intelligence
              </p>

              {/* Commit list */}
              {filteredCommits && filteredCommits.length > 0 ? (
                <div
                  style={{
                    background: "hsl(220 14% 9%)",
                    border: "1px solid hsl(220 12% 13%)",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  {filteredCommits.map((item, i) => (
                    <CommitRow
                      key={item.commit.sha}
                      commit={item.commit}
                      analysis={item.analysis}
                      owner={result.repo.owner}
                      repo={result.repo.name}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Filter}
                  title="No commits match"
                  description={`No commits match the current filter "${filterRisk}". Try changing the filter.`}
                  action={
                    <button
                      onClick={() => setFilterRisk("all")}
                      style={{
                        padding: "7px 14px",
                        background: "hsl(38 92% 54%)",
                        border: "none",
                        borderRadius: "7px",
                        color: "hsl(220 16% 6%)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Clear filter
                    </button>
                  }
                />
              )}

              {/* Footer */}
              <p
                style={{
                  textAlign: "center",
                  marginTop: "28px",
                  fontSize: "11px",
                  color: "hsl(215 12% 35%)",
                  paddingBottom: "20px",
                }}
              >
                GitMind · Built by Arun C · VIT Vellore · Powered by Gemini AI
                + GitHub API
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) { .sm-show { display: inline !important; } }
        @media (min-width: 768px) { .md-show { display: block !important; } }
      `}</style>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "hsl(220 16% 6%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2
            size={24}
            style={{
              color: "hsl(38 92% 58%)",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}