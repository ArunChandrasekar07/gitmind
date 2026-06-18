"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Loader2, GitCommit,
  Brain, GitBranch, RefreshCw, Filter, BookmarkPlus,
  Check,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Wordmark } from "@/components/layout/Logo";
import { TopLoader } from "@/components/layout/TopLoader";
import { analyzeAPI, BatchAnalysisResponse, pingBackend } from "@/lib/api";
import { CommitRow } from "@/components/commit/CommitRow";
import { RepoSummary } from "@/components/repo/RepoSummary";
import { RepoHeaderSkeleton, CommitRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingStages } from "@/components/shared/LoadingStages";
import { getRiskFromAnalysis } from "@/components/commit/RiskBadge";
import { useAuthStore, getNotificationsEnabled } from "@/lib/store";
import { toast } from "sonner";
import {
  saveAnalysisToHistory,
  createAnalysisSession,
  updateAnalysisSession,
  getLatestAnalysisSession,
  saveRepository,
} from "@/lib/db";

const ANALYSIS_STAGES = [
  { id: "connect", label: "Connecting to GitHub API" },
  { id: "fetch", label: "Fetching commit history" },
  { id: "diff", label: "Reading commit diffs" },
  { id: "analyze", label: "Running AI analysis pipeline" },
  { id: "build", label: "Building intelligence report" },
];

const EXAMPLE_REPOS = [
  "https://github.com/tensorflow/tensorflow.git",
  "https://github.com/pytorch/pytorch.git",
  "https://github.com/microsoft/TypeScript.git",
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [proAnimState, setProAnimState] = useState<
    "hidden" | "visible" | "flying" | "done"
  >("hidden");
  const [selectorGlow, setSelectorGlow] = useState(false);
  const [upsellTooltip, setUpsellTooltip] = useState<number | null>(null);
  const hasRestoredRef = useRef(false);
  /* ── Navbar hide on scroll ── */
  const [navVisible, setNavVisible] = useState(true);
  const navTickRef = useRef(false);
  const handleAnalyzeRef = useRef<((url?: string, limit?: number, sessionId?: string | null) => Promise<void>) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // ── Guest limit enforcement ────────────────────────────────
  const GUEST_KEY      = "gitmind_guest_count";
  const GUEST_DATE_KEY = "gitmind_guest_date";
  const GUEST_TOTAL    = 5;

  const getGuestCount = (): number => {
    if (typeof window === "undefined") return 0;
    const today = new Date().toDateString();
    if (localStorage.getItem(GUEST_DATE_KEY) !== today) {
      localStorage.setItem(GUEST_DATE_KEY, today);
      localStorage.setItem(GUEST_KEY, "0");
      return 0;
    }
    return parseInt(localStorage.getItem(GUEST_KEY) || "0", 10);
  };

  const incrementGuestCount = () => {
    if (typeof window === "undefined") return;
    const count = getGuestCount() + 1;
    localStorage.setItem(GUEST_KEY, String(count));
  };
  
  // ── Compute risk counts ────────────────────────────────────
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

  const healthScore = result
    ? Math.round(
        ((riskCounts.safe + riskCounts.warn * 0.5) /
          Math.max(result.total, 1)) *
          100
      )
    : null;

  // ── Save to Supabase repo list ──────────────────────────────
  const handleSaveRepo = async () => {
    if (!user?.id || !result) return;
    await saveRepository(user.id, {
      url: result.repo.html_url,
      name: result.repo.full_name,
      description: result.repo.description,
      language: result.repo.language,
      stars: result.repo.stars,
    });
    setSavedSuccess(true);
    toast.success("Repository saved");
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // ── Main analysis function ─────────────────────────────────
  const handleAnalyze = useCallback(
    async (
      targetUrl?: string,
      targetLimit?: number,
      existingSessionId?: string | null
    ) => {
      const repoUrl = targetUrl || url;
      const repoLimit = targetLimit ?? limit;

      if (!repoUrl.trim()) {
        toast.error("Please enter a GitHub repository URL");
        return;
      }

      // ── Enforce guest limit ──────────────────────────────
if (!isAuthenticated) {
  const used = getGuestCount();
  if (used >= GUEST_TOTAL) {
    setError("guest_limit");
    setIsLoading(false);
    return;
  }
  incrementGuestCount();
}

      // Cancel any in-flight request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setResult(null);
      setError("");
      setCurrentStage(0);
      setFilterRisk("all");
      setSearchCommit("");
      setSessionRestored(false);

      // Create or reuse session
      let activeSessionId = existingSessionId || null;
      if (!activeSessionId) {
        activeSessionId = await createAnalysisSession(
          user?.id || null,
          repoUrl,
          repoLimit
        );
        if (activeSessionId) setSessionId(activeSessionId);
      }

      const stageInterval = setInterval(() => {
        setCurrentStage((p) => Math.min(p + 1, ANALYSIS_STAGES.length));
      }, 700);

      try {
        const data = await analyzeAPI.analyzeBatch(repoUrl, repoLimit, controller.signal);
        clearInterval(stageInterval);
        setResult(data);

        const rc = data.analyzed_commits.reduce(
          (acc, item) => {
            const risk = getRiskFromAnalysis(item.analysis);
            if (risk === "danger") acc.danger++;
            else if (risk === "warn") acc.warn++;
            else acc.safe++;
            return acc;
          },
          { safe: 0, warn: 0, danger: 0 }
        );

        const hs = Math.round(
          ((rc.safe + rc.warn * 0.5) / Math.max(data.total, 1)) * 100
        );

        // Save to Supabase in parallel
        if (user?.id) {
          await Promise.all([
            // Save to history
            saveAnalysisToHistory(user.id, data, rc, hs),
            // Update session
            activeSessionId
              ? updateAnalysisSession(activeSessionId, {
                  status: "complete",
                  result_json: data,
                  completed_at: new Date().toISOString(),
                })
              : Promise.resolve(),
          ]);
        } else if (activeSessionId) {
          // Anonymous user — just update session
          await updateAnalysisSession(activeSessionId, {
            status: "complete",
            result_json: data,
            completed_at: new Date().toISOString(),
          });
        }

        if (getNotificationsEnabled()) {
          toast.success(`Analyzed ${data.total} commits from ${data.repo.name}`);
        }
      } catch (err: unknown) {
        clearInterval(stageInterval);

        // AbortError = user left page or started new analysis — silent exit
        if (
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("abort"))
        ) {
          setIsLoading(false);
          return; // no toast, no state update, clean exit
        }

        // Check if component is still mounted before updating state
        if (abortControllerRef.current?.signal.aborted) {
          setIsLoading(false);
          return;
        }

        const msg = err instanceof Error ? err.message : "Analysis failed";
        setError(msg);
        toast.error(msg);

        if (activeSessionId) {
          await updateAnalysisSession(activeSessionId, {
            status: "error",
            error_message: msg,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [url, limit, user]
  );
  // ── Restore last session on mount ──────────────────────────
  useEffect(() => {
    pingBackend();

    const restoreSession = async () => {
      if (hasRestoredRef.current) return;
      hasRestoredRef.current = true;

      const initialUrl = searchParams.get("url");
      if (initialUrl) {
        setUrl(initialUrl);
        // Delay to let handleAnalyze be defined
        setTimeout(() => handleAnalyzeRef.current?.(initialUrl), 0);
        return;
      }

      if (user?.id) {
        const session = await getLatestAnalysisSession(user.id);
        if (session) {
          setUrl(session.repo_url);
          setLimit(session.limit_count);
          setSessionId(session.id);

          if (session.status === "complete" && session.result_json) {
            setResult(session.result_json);
            setSessionRestored(true);
            toast.success("Previous analysis restored");
          } else if (session.status === "loading") {
            toast.info("Resuming previous analysis...");
            setTimeout(() => handleAnalyzeRef.current?.(session.repo_url, session.limit_count, session.id), 0);
          }
        }
      }
    };

    restoreSession();
    return () => {
      // Cancel any in-flight request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [user?.id]);

  useEffect(() => {
  handleAnalyzeRef.current = handleAnalyze;
}, [handleAnalyze]);

useEffect(() => {
  if (isAuthenticated) return;
  if (sessionStorage.getItem("gitmind_pro_anim")) return;
  sessionStorage.setItem("gitmind_pro_anim", "1");
  const t1 = setTimeout(() => setProAnimState("visible"), 300);
  const t2 = setTimeout(() => setProAnimState("flying"), 1100);
  const t3 = setTimeout(() => setSelectorGlow(true), 1400);
  const t4 = setTimeout(() => { setProAnimState("done"); setSelectorGlow(false); }, 2400);
  return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
}, [isAuthenticated]);
  useEffect(() => {
    const onScroll = () => {
      if (navTickRef.current) return;
      navTickRef.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y <= 60) {
  setNavVisible(true);   // only at top
} else {
  setNavVisible(false);  // hidden everywhere else
}
        navTickRef.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Filtered commits ───────────────────────────────────────
  const filteredCommits = result?.analyzed_commits.filter((item) => {
    const risk = getRiskFromAnalysis(item.analysis);
    const matchesRisk =
      filterRisk === "all" ||
      (filterRisk === "safe" && risk === "safe") ||
      (filterRisk === "warn" && risk === "warn") ||
      (filterRisk === "danger" && risk === "danger");
    const matchesSearch =
      !searchCommit ||
      item.commit.message.toLowerCase().includes(searchCommit.toLowerCase()) ||
      item.commit.author.toLowerCase().includes(searchCommit.toLowerCase()) ||
      item.commit.short_sha.toLowerCase().includes(searchCommit.toLowerCase());
    return matchesRisk && matchesSearch;
  });

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
      {/* ── TOP NAV ──────────────────────────────────────── */}
      <motion.nav
        animate={{ y: navVisible ? 0 : -80, opacity: navVisible ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "hsl(220 16% 6% / 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid hsl(220 12% 11%)",
        }}
      >
        {/* Row 1 — brand + actions */}
        <div
          className="analyze-nav-row1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px 0",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => router.push("/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 10px",
                background: "hsl(220 12% 12%)",
                border: "1px solid hsl(220 12% 17%)",
                borderRadius: "7px",
                color: "hsl(220 8% 55%)",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "hsl(38 10% 80%)";
                e.currentTarget.style.borderColor = "hsl(220 12% 24%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "hsl(220 8% 55%)";
                e.currentTarget.style.borderColor = "hsl(220 12% 17%)";
              }}
            >
              <ArrowLeft size={13} />
              <span>Home</span>
            </button>
            <span className="analyze-wordmark">
              <Wordmark size={24} />
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {sessionRestored && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 9px",
                  background: "hsl(152 60% 40% / 0.12)",
                  border: "1px solid hsl(152 60% 40% / 0.25)",
                  borderRadius: "5px",
                  fontSize: "11px",
                  color: "hsl(152 60% 48%)",
                  fontWeight: 500,
                }}
              >
                <Check size={10} />
                Restored
              </span>
            )}
            {result && isAuthenticated && (
              <button
                onClick={handleSaveRepo}
                title="Save repository"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 10px",
                  background: savedSuccess
                    ? "hsl(152 60% 40% / 0.12)"
                    : "hsl(220 12% 12%)",
                  border: `1px solid ${
                    savedSuccess ? "hsl(152 60% 40% / 0.3)" : "hsl(220 12% 17%)"
                  }`,
                  borderRadius: "7px",
                  color: savedSuccess ? "hsl(152 60% 48%)" : "hsl(220 8% 52%)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {savedSuccess ? (
                  <Check size={13} />
                ) : (
                  <BookmarkPlus size={13} />
                )}
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  padding: "6px 12px",
                  background: "hsl(220 12% 12%)",
                  border: "1px solid hsl(220 12% 17%)",
                  borderRadius: "7px",
                  color: "hsl(220 8% 55%)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "hsl(38 10% 80%)";
                  e.currentTarget.style.borderColor = "hsl(220 12% 24%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "hsl(220 8% 55%)";
                  e.currentTarget.style.borderColor = "hsl(220 12% 17%)";
                }}
              >
                Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Row 2 — search bar full width */}
        <div className="analyze-nav-row2" style={{ padding: "10px 20px 12px" }}>
          <div
            className="analyze-search-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              maxWidth: "860px",
              margin: "0 auto",
            }}
          >
            {/* URL input */}
            <div
              className="analyze-url-input"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "40px",
                padding: "0 12px",
                background: "hsl(220 14% 10%)",
                border: "1px solid hsl(220 12% 16%)",
                borderRadius: "9px",
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
                  "hsl(220 12% 16%)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <GitBranch
                size={14}
                style={{ color: "hsl(220 8% 38%)", flexShrink: 0 }}
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="https://github.com/owner/repository"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  color: "hsl(38 10% 88%)",
                  fontFamily: "Inter, sans-serif",
                  minWidth: 0,
                }}
              />
            </div>

            {/* Commit count — gated for guests */}
            <div
              className="analyze-commit-select"
              style={{ position: "relative", flexShrink: 0 }}
            >
              {/* PRO pill — appears once, flies into selector */}
              {!isAuthenticated && proAnimState !== "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={
                    proAnimState === "visible"
                      ? { opacity: 1, y: -26, scale: 1 }
                      : proAnimState === "flying"
                        ? { opacity: 0, y: 0, scale: 0.5 }
                        : { opacity: 0, y: 0, scale: 0.8 }
                  }
                  transition={{
                    duration: proAnimState === "flying" ? 0.35 : 0.25,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "hsl(38 92% 54%)",
                    borderRadius: "5px",
                    padding: "2px 7px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "hsl(220 16% 6%)",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "0.04em",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                >
                  PRO
                </motion.div>
              )}

              <select
                value={isAuthenticated ? limit : Math.min(limit, 10)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isAuthenticated && val > 10) {
                    router.push("/signup");
                    return;
                  }
                  setLimit(val);
                }}
                onMouseEnter={(e) => {
                  if (!isAuthenticated) {
                    const val = Number((e.target as HTMLSelectElement).value);
                    setUpsellTooltip(val);
                  }
                }}
                onMouseLeave={() => setUpsellTooltip(null)}
                onFocus={() => {
                  if (!isAuthenticated) setUpsellTooltip(0);
                }}
                onBlur={() => setUpsellTooltip(null)}
                style={{
                  height: "40px",
                  padding: "0 32px 0 10px",
                  background: "hsl(220 14% 10%)",
                  border: selectorGlow
                    ? "1px solid hsl(38 92% 54% / 0.8)"
                    : "1px solid hsl(220 12% 16%)",
                  boxShadow: selectorGlow
                    ? "0 0 0 3px hsl(38 92% 54% / 0.15), 0 0 10px hsl(38 92% 54% / 0.2)"
                    : "none",
                  borderRadius: "9px",
                  color: "hsl(220 8% 58%)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  transition: "border 0.3s, box-shadow 0.4s",
                }}
              >
                {[
                  { value: 5, label: "5 commits", guestOk: true },
                  { value: 10, label: "10 commits", guestOk: true },
                  { value: 20, label: "20 commits", guestOk: false },
                  { value: 30, label: "30 commits", guestOk: false },
                ].map((opt) => {
                  const locked = !isAuthenticated && !opt.guestOk;
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={locked}
                      style={{
                        background: "hsl(220 14% 10%)",
                        color: locked ? "hsl(220 8% 32%)" : "hsl(220 8% 70%)",
                      }}
                    >
                      {locked ? `🔒 ${opt.label}` : opt.label}
                    </option>
                  );
                })}
              </select>

              {/* Hover tooltip */}
              {!isAuthenticated && upsellTooltip !== null && (
                <div
                  className="commit-tooltip"
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    right: 0,
                    background: "hsl(220 14% 12%)",
                    border: "1px solid hsl(38 92% 54% / 0.3)",
                    borderRadius: "7px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    color: "hsl(38 10% 82%)",
                    fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap",
                    zIndex: 50,
                    pointerEvents: "none",
                  }}
                >
                  Login to unlock 10+ commit analysis
                </div>
              )}

              {/* Chevron icon */}
              <div
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "hsl(220 8% 40%)",
                  display: "flex",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="currentColor"
                >
                  <path
                    d="M2 3.5L5 6.5L8 3.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Analyze button */}
            <button
              className="analyze-btn"
              onClick={() => handleAnalyze()}
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                height: "40px",
                padding: "0 18px",
                background: isLoading
                  ? "hsl(38 92% 54% / 0.5)"
                  : "hsl(38 92% 54%)",
                border: "none",
                borderRadius: "9px",
                color: "hsl(220 16% 6%)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                flexShrink: 0,
                transition: "opacity 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {isLoading ? (
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Search size={14} />
              )}
              Analyze
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main
        className="analyze-main"
        style={{
          flex: 1,
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="gm-loading"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: "72px",
                paddingBottom: "72px",
              }}
            >
              {/* Signature element — progress ring where the moving dot IS the progress indicator,
                  not a decorative spinner. Orbits exactly to currentStage, then settles into a
                  slow perpetual drift once all stages are visually complete (never freezes). */}
              <div style={{ position: "relative", width: "96px", height: "96px", marginBottom: "34px", perspective: "700px" }}>

                <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                  <circle cx="48" cy="48" r="42" fill="none" stroke="hsl(220 12% 14%)" strokeWidth="2.5" />
                  <motion.circle
                    cx="48" cy="48" r="42" fill="none"
                    stroke="hsl(38 92% 54%)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 42 * (1 - Math.min(currentStage + 1, ANALYSIS_STAGES.length) / ANALYSIS_STAGES.length),
                    }}
                    transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
                  />
                </svg>

                {/* Leading dot — rides the exact tip of the progress arc.
                    Before completion: jumps to each stage's angle.
                    After completion: gentle perpetual orbit signals "still working", not frozen. */}
                <motion.div
                  animate={{
                    rotate:
                      currentStage > ANALYSIS_STAGES.length - 1
                        ? [360 * Math.min(currentStage + 1, ANALYSIS_STAGES.length) / ANALYSIS_STAGES.length, 360 * Math.min(currentStage + 1, ANALYSIS_STAGES.length) / ANALYSIS_STAGES.length + 360]
                        : 360 * Math.min(currentStage + 1, ANALYSIS_STAGES.length) / ANALYSIS_STAGES.length,
                  }}
                  transition={
                    currentStage > ANALYSIS_STAGES.length - 1
                      ? { duration: 2.4, repeat: Infinity, ease: "linear" }
                      : { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }
                  }
                  style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: "50%",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "hsl(38 92% 60%)",
                      boxShadow: "0 0 10px hsl(38 92% 54% / 0.9), 0 0 2px hsl(38 92% 70%)",
                      transform: "translateX(-50%)",
                    }}
                  />
                </motion.div>

                {/* Core — icon swaps with real 3D flip per stage */}
                <div
                  style={{
                    position: "absolute",
                    inset: "14px",
                    borderRadius: "50%",
                    background: "hsl(220 14% 9%)",
                    border: "1px solid hsl(220 12% 16%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStage}
                      initial={{ opacity: 0, rotateY: -90, scale: 0.6 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                      exit={{ opacity: 0, rotateY: 90, scale: 0.6 }}
                      transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {currentStage === 0 && <GitBranch size={24} style={{ color: "hsl(199 89% 58%)" }} />}
                      {currentStage === 1 && <GitCommit size={24} style={{ color: "hsl(38 92% 58%)" }} />}
                      {currentStage === 2 && <Search size={24} style={{ color: "hsl(258 80% 70%)" }} />}
                      {currentStage === 3 && (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                          <Brain size={24} style={{ color: "hsl(38 92% 58%)" }} />
                        </motion.div>
                      )}
                      {currentStage >= 4 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 14 }}
                        >
                          <Check size={24} style={{ color: "hsl(152 60% 50%)" }} />
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Stage counter */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-26px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "10px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "hsl(220 8% 40%)",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}
                >
                  {currentStage >= ANALYSIS_STAGES.length - 1
                    ? "FINALIZING"
                    : `${String(currentStage + 1).padStart(2, "0")} / ${String(ANALYSIS_STAGES.length).padStart(2, "0")}`}
                </div>
              </div>

              {/* Stage list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px", width: "fit-content", margin: "20px auto 0" }}>
                {ANALYSIS_STAGES.map((stage, i) => {
                  const isDone = i < currentStage;
                  const isActive = i === currentStage;
                  return (
                    <motion.div
                      key={stage.id}
                      animate={{ opacity: isDone || isActive ? 1 : 0.35 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: "flex", alignItems: "center", gap: "10px" }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isDone
                            ? "hsl(152 60% 40% / 0.15)"
                            : isActive
                              ? "hsl(38 92% 54% / 0.15)"
                              : "hsl(220 12% 13%)",
                          border: isDone
                            ? "1px solid hsl(152 60% 40% / 0.4)"
                            : isActive
                              ? "1px solid hsl(38 92% 54% / 0.4)"
                              : "1px solid hsl(220 12% 16%)",
                        }}
                      >
                        {isDone && <Check size={9} style={{ color: "hsl(152 60% 50%)" }} />}
                        {isActive && (
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                            style={{ width: "5px", height: "5px", borderRadius: "50%", background: "hsl(38 92% 58%)" }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "hsl(38 10% 90%)" : isDone ? "hsl(220 8% 55%)" : "hsl(220 8% 38%)",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {stage.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              {/* Bottom animated loading line */}
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

        {/* Error */}
        {!isLoading && error && error !== "guest_limit" && (
          <ErrorState message={error} onRetry={() => handleAnalyze()} />
        )}

        {/* Guest limit wall */}
        {!isLoading && error === "guest_limit" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "80px",
              paddingBottom: "80px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "hsl(38 92% 54% / 0.1)",
                border: "1px solid hsl(38 92% 54% / 0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Logo size={60} />
            </div>

            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "hsl(38 10% 94%)",
                marginBottom: "8px",
              }}
            >
              Unlock More with GitMind
            </h2>

            <p
              style={{
                fontSize: "13px",
                color: "hsl(220 8% 52%)",
                lineHeight: 1.7,
                marginBottom: "24px",
                maxWidth: "360px",
              }}
            >
              You've used all {GUEST_TOTAL} free analyses today. Create a free
              account to unlock unlimited analyses, history, and dashboard
              access.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "7px",
                justifyContent: "center",
                marginBottom: "28px",
              }}
            >
              {[
                "Unlimited analyses",
                "Analysis history",
                "Save repositories",
                "Up to 30 commits",
                "Dashboard",
              ].map((f) => (
                <span
                  key={f}
                  style={{
                    padding: "4px 10px",
                    background: "hsl(38 92% 54% / 0.08)",
                    border: "1px solid hsl(38 92% 54% / 0.18)",
                    borderRadius: "20px",
                    fontSize: "11px",
                    color: "hsl(38 92% 62%)",
                    fontWeight: 500,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => router.push("/signup")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 22px",
                  background: "hsl(38 92% 54%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "hsl(220 16% 6%)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Create free account
              </button>
              <button
                onClick={() => router.push("/login")}
                style={{
                  padding: "10px 20px",
                  background: "none",
                  border: "1px solid hsl(220 12% 18%)",
                  borderRadius: "8px",
                  color: "hsl(220 8% 62%)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Sign in
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && !error && !result && (
          <div style={{ paddingTop: "60px" }}>
            <EmptyState
              icon={GitBranch}
              title="Ready to analyze"
              description="Enter a GitHub repository URL above to get started."
            />
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
                  color: "hsl(220 8% 40%)",
                  alignSelf: "center",
                }}
              >
                Try:
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
                    background: "hsl(220 14% 10%)",
                    border: "1px solid hsl(220 12% 16%)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "JetBrains Mono, monospace",
                    color: "hsl(220 8% 50%)",
                    cursor: "pointer",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "hsl(38 92% 60%)";
                    e.currentTarget.style.borderColor = "hsl(38 92% 54% / 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "hsl(220 8% 50%)";
                    e.currentTarget.style.borderColor = "hsl(220 12% 16%)";
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
              <RepoSummary
                repo={result.repo}
                summary={result.summary}
                commitCount={result.total}
                riskCounts={riskCounts}
              />

              {/* Toolbar */}
              <div
                className="analyze-toolbar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    background: "hsl(220 14% 10%)",
                    border: "1px solid hsl(220 12% 15%)",
                    borderRadius: "7px",
                    padding: "5px 10px",
                    flex: 1,
                    minWidth: "180px",
                  }}
                >
                  <Search
                    size={12}
                    style={{ color: "hsl(220 8% 40%)", flexShrink: 0 }}
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
                      color: "hsl(38 10% 88%)",
                      fontFamily: "Inter, sans-serif",
                      width: "100%",
                    }}
                  />
                </div>

                <div
                  className="analyze-filter-row"
                  style={{ display: "flex", gap: "4px" }}
                >
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
                        background:
                          filterRisk === f.key
                            ? "hsl(38 92% 54% / 0.12)"
                            : "hsl(220 14% 10%)",
                        border:
                          filterRisk === f.key
                            ? "1px solid hsl(38 92% 54% / 0.3)"
                            : "1px solid hsl(220 12% 15%)",
                        color:
                          filterRisk === f.key
                            ? "hsl(38 92% 62%)"
                            : "hsl(220 8% 48%)",
                        transition: "all 0.12s",
                      }}
                    >
                      {f.label}
                      {f.key !== "all" && (
                        <span style={{ marginLeft: "4px", opacity: 0.7 }}>
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

                <button
                  onClick={() => handleAnalyze()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    background: "hsl(220 14% 10%)",
                    border: "1px solid hsl(220 12% 15%)",
                    borderRadius: "7px",
                    color: "hsl(220 8% 48%)",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <p
                style={{
                  fontSize: "11px",
                  color: "hsl(220 8% 38%)",
                  marginBottom: "8px",
                }}
              >
                {filteredCommits?.length ?? 0} of {result.total} commits · click
                any row to expand AI intelligence
              </p>

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
                  description={`No commits match "${filterRisk}". Try changing the filter.`}
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

              <p
                style={{
                  textAlign: "center",
                  marginTop: "28px",
                  fontSize: "11px",
                  color: "hsl(220 8% 32%)",
                  paddingBottom: "20px",
                }}
              >
                GitMind · Built by Arun C · Powered by Gemini · Groq · GitHub
                API
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── MOBILE ONLY — analyze page ── */
        @media (max-width: 768px) {

          /* Nav Row 1: tighten spacing */
          .analyze-nav-row1 {
            padding: 8px 12px 0 !important;
            gap: 8px !important;
          }
          
          /* Hide wordmark text on very small screens to save space */
          .analyze-wordmark {
            display: none !important;
          }

          /* Nav Row 2: stack input above button row */
          .analyze-nav-row2 {
            padding: 8px 12px 10px !important;
          }
          
          .analyze-search-row {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }

          /* URL input takes full width on mobile */
          .analyze-url-input {
            min-width: 0 !important;
            width: 100% !important;
            flex: 1 1 100% !important;
          }

          /* Row 3: select left, analyze right — spread full width */
          .analyze-search-row {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }

          .analyze-commit-select {
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }

          .analyze-commit-select select {
            width: 100% !important;
            padding-right: 28px !important;
          }

          /* Chevron stays inside its wrapper */
          .analyze-commit-select > div[style] {
            right: 10px !important;
          }

          .analyze-btn {
            flex: 1 1 auto !important;
            justify-content: center !important;
          }

          .analyze-btn {
            flex-shrink: 0 !important;
          }

          /* Main padding reduced on mobile */
          .analyze-main {
            padding: 12px !important;
          }

          /* Toolbar: search takes full width, filters wrap */
          .analyze-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 6px !important;
          }

          .analyze-filter-row {
            display: flex !important;
            gap: 4px !important;
            flex-wrap: wrap !important;
          }

          .analyze-filter-row button {
            flex: 1 !important;
            min-width: 48px !important;
            font-size: 11px !important;
            padding: 5px 6px !important;
          }

          .commit-tooltip {
            right: 50% !important;
            transform: translateX(50%) !important;
         }
        }
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
              color: "hsl(38 92% 54%)",
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