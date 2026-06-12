"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  GitBranch, Brain, Zap, Shield, BarChart2,
  ArrowRight, Search, ChevronRight, Star,
  GitCommit, Check, Terminal, Sparkles,
  Eye, Plus, Minus, ExternalLink, ChevronDown,
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Wordmark, Logo } from "@/components/layout/Logo";
import { TopLoader } from "@/components/layout/TopLoader";
import { pingBackend } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

/* ── animated section wrapper ─────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── demo data ─────────────────────────────────────────────────────── */
const DEMO_COMMITS = [
  { sha: "3f8a2b1", msg: "feat: add parallel route interception for modals", author: "sarah-k", risk: "safe", cat: "feat", additions: 234, deletions: 12, time: "2m ago" },
  { sha: "a1c9d4e", msg: "fix: memory leak in WebSocket connection pool", author: "mike-dev", risk: "danger", cat: "fix", additions: 8, deletions: 45, time: "1h ago" },
  { sha: "b2e7f8c", msg: "refactor: extract auth middleware to separate layer", author: "arun-c", risk: "safe", cat: "refactor", additions: 156, deletions: 89, time: "3h ago" },
  { sha: "c3g1h2i", msg: "perf: add Redis caching for expensive DB queries", author: "lisa-r", risk: "warn", cat: "perf", additions: 67, deletions: 23, time: "5h ago" },
  { sha: "d4j5k6l", msg: "security: patch SQL injection in user input handler", author: "sec-bot", risk: "danger", cat: "security", additions: 15, deletions: 8, time: "1d ago" },
  { sha: "e5k7l8m", msg: "docs: update API reference for v3 endpoints", author: "dev-mike", risk: "safe", cat: "docs", additions: 88, deletions: 34, time: "2d ago" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Commit Intelligence",
    desc: "Every commit explained in plain English. Understand intent, impact, and architectural decisions without reading raw diffs.",
    color: "hsl(38 92% 58%)",
    bg: "hsl(38 92% 54% / 0.08)",
    border: "hsl(38 92% 54% / 0.2)",
  },
  {
    icon: Shield,
    title: "Risk Detection",
    desc: "Automatically identifies commits introducing bugs, security vulnerabilities, or breaking API changes before they cause incidents.",
    color: "hsl(0 70% 62%)",
    bg: "hsl(0 70% 56% / 0.08)",
    border: "hsl(0 70% 56% / 0.2)",
  },
  {
    icon: Zap,
    title: "Real-Time Streaming",
    desc: "Token-by-token AI analysis streamed live. No polling, no waiting — results appear as the intelligence engine works.",
    color: "hsl(38 95% 58%)",
    bg: "hsl(38 95% 54% / 0.08)",
    border: "hsl(38 95% 54% / 0.2)",
  },
  {
    icon: BarChart2,
    title: "Repository Health",
    desc: "Quantified health score derived from commit patterns, risk distribution, and development velocity signals.",
    color: "hsl(258 80% 70%)",
    bg: "hsl(258 80% 65% / 0.08)",
    border: "hsl(258 80% 65% / 0.2)",
  },
  {
    icon: TrendingUp,
    title: "Engineering Analytics",
    desc: "Understand development patterns, contributor activity, and codebase evolution over time.",
    color: "hsl(152 68% 48%)",
    bg: "hsl(152 68% 42% / 0.08)",
    border: "hsl(152 68% 42% / 0.2)",
  },
  {
    icon: GitBranch,
    title: "Any Public Repository",
    desc: "Works instantly with any public GitHub repository. No configuration, no integrations — just paste a URL.",
    color: "hsl(199 89% 58%)",
    bg: "hsl(199 89% 48% / 0.08)",
    border: "hsl(199 89% 48% / 0.2)",
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Paste a GitHub URL",
    desc: "Any public repository. No setup, no tokens, no configuration required.",
    icon: GitBranch,
  },
  {
    step: "02",
    title: "AI analyzes commit history",
    desc: "GitMind fetches diffs via GitHub API and runs each through the intelligence pipeline.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Get engineering intelligence",
    desc: "Risk scores, commit categories, plain-English explanations, and a repository health report.",
    icon: BarChart2,
  },
];

const PRICING_FEATURES = [
  "Unlimited repository analysis",
  "AI commit explanations",
  "Risk detection (Safe / Warning / Danger)",
  "Repository health score",
  "Real-time streaming analysis",
  "Commit category classification",
  "Engineering recommendations",
  "No credit card required",
];

const FAQS = [
  {
    q: "How does GitMind analyze repositories?",
    a: "GitMind fetches commit diffs via the GitHub REST API, then runs each commit through a multi-model AI pipeline. The AI explains what changed, why it matters, and assigns a risk classification based on the code changes.",
  },
  {
    q: "Does it work with private repositories?",
    a: "Currently GitMind works with public GitHub repositories. Private repository support with OAuth token authentication is on the roadmap.",
  },
  {
    q: "How accurate is the risk detection?",
    a: "The AI identifies common risk patterns including security vulnerabilities, breaking API changes, missing error handling, and performance regressions. It's a signal to guide review, not a replacement for human judgment.",
  },
  {
    q: "Is GitMind really free?",
    a: "Yes — completely free with no usage limits. Analyze as many repositories as you need with no credit card required.",
  },
  {
    q: "Who built GitMind?",
    a: "GitMind was built by Arun C, a software engineer from VIT Vellore specializing in AI, LLMs, and developer tools.",
  },
];

const RISK_COLORS = {
  safe: { dot: "hsl(152 68% 45%)", border: "hsl(152 68% 42% / 0.5)", label: "Safe", color: "hsl(152 68% 48%)" },
  warn: { dot: "hsl(38 95% 57%)", border: "hsl(38 95% 54% / 0.5)", label: "Warning", color: "hsl(38 95% 60%)" },
  danger: { dot: "hsl(0 70% 58%)", border: "hsl(0 70% 56% / 0.5)", label: "Risk", color: "hsl(0 70% 62%)" },
};

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  feat: { color: "hsl(199 89% 58%)", bg: "hsl(199 89% 48% / 0.1)" },
  fix: { color: "hsl(0 70% 62%)", bg: "hsl(0 70% 56% / 0.1)" },
  refactor: { color: "hsl(258 80% 70%)", bg: "hsl(258 80% 65% / 0.1)" },
  perf: { color: "hsl(38 95% 60%)", bg: "hsl(38 95% 54% / 0.1)" },
  security: { color: "hsl(328 75% 68%)", bg: "hsl(328 75% 60% / 0.1)" },
  docs: { color: "hsl(152 68% 50%)", bg: "hsl(152 68% 42% / 0.1)" },
  chore: { color: "hsl(215 12% 55%)", bg: "hsl(215 12% 50% / 0.1)" },
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [url, setUrl] = useState("");
  const [activeCommit, setActiveCommit] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    pingBackend();
    const t = setInterval(
      () => setActiveCommit((p) => (p + 1) % DEMO_COMMITS.length),
      2200
    );
    return () => clearInterval(t);
  }, []);

  const handleAnalyze = () => {
    if (!url.trim()) return;
    router.push(`/analyze?url=${encodeURIComponent(url)}`);
  };

  return (
    <>
      <TopLoader />
      <div
        style={{
          minHeight: "100vh",
          background: "hsl(220 16% 6%)",
          color: "hsl(210 20% 94%)",
          overflowX: "hidden",
        }}
      >
        {/* Ambient background */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-10%",
              left: "30%",
              width: "600px",
              height: "500px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, hsl(38 92% 54% / 0.06) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "40%",
              right: "-5%",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, hsl(258 80% 65% / 0.04) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        {/* Engineering grid */}
        <div
          className="bg-grid-subtle"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            height: "56px",
            display: "flex",
            alignItems: "center",
            background: "hsl(220 16% 6% / 0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid hsl(222 14% 12%)",
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
              width: "100%",
              margin: "0 auto",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Wordmark size={26} />

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {[
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#workflow" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
               <a 
                  key={item.label}
                  href={item.href}
                  style={{
                    padding: "6px 12px",
                    fontSize: "13px",
                    color: "hsl(215 12% 52%)",
                    textDecoration: "none",
                    borderRadius: "6px",
                    transition: "color 0.15s, background 0.15s",
                    display: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "hsl(210 20% 88%)";
                    e.currentTarget.style.background = "hsl(220 12% 12%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "hsl(215 12% 52%)";
                    e.currentTarget.style.background = "transparent";
                  }}
                  className="md-show"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isAuthenticated ? (
                <button
                  onClick={() => router.push("/analyze")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    background: "hsl(38 92% 54%)",
                    border: "none",
                    borderRadius: "7px",
                    color: "hsl(220 16% 6%)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Open GitMind
                  <ArrowRight size={13} />
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={{
                      padding: "7px 13px",
                      fontSize: "13px",
                      color: "hsl(215 12% 55%)",
                      textDecoration: "none",
                      borderRadius: "7px",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "hsl(210 20% 88%)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "hsl(215 12% 55%)")
                    }
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      background: "hsl(38 92% 54%)",
                      border: "none",
                      borderRadius: "7px",
                      color: "hsl(220 16% 6%)",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Get started
                    <ArrowRight size={13} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.nav>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            zIndex: 1,
            paddingTop: "140px",
            paddingBottom: "80px",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "60px",
                alignItems: "center",
              }}
            >
              {/* Left — copy */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ marginBottom: "20px" }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 12px",
                      background: "hsl(38 92% 54% / 0.08)",
                      border: "1px solid hsl(38 92% 54% / 0.2)",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "hsl(188 94% 58%)",
                    }}
                  >
                    <Sparkles size={11} />
                    Repository Intelligence Platform
                    <ChevronRight size={11} style={{ opacity: 0.6 }} />
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  style={{
                    fontSize: "clamp(36px, 5vw, 52px)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.08,
                    marginBottom: "20px",
                    color: "hsl(210 20% 96%)",
                  }}
                >
                  Understand any
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(38 92% 58%) 0%, hsl(32 96% 65%) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    codebase
                  </span>{" "}
                  instantly.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: "16px",
                    color: "hsl(215 12% 52%)",
                    lineHeight: 1.7,
                    marginBottom: "32px",
                    maxWidth: "440px",
                  }}
                >
                  GitMind is an engineering intelligence platform. Paste any
                  GitHub URL — AI explains every commit, detects risky changes,
                  and scores repository health.
                </motion.p>

                {/* URL Input */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ marginBottom: "14px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      background: "hsl(220 14% 9%)",
                      border: "1px solid hsl(220 12% 15%)",
                      borderRadius: "10px",
                      padding: "6px 6px 6px 14px",
                      alignItems: "center",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onFocus={() => {}}
                  >
                    <GitBranch
                      size={15}
                      style={{
                        color: "hsl(215 12% 42%)",
                        flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                      placeholder="github.com/owner/repository"
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        fontSize: "13px",
                        color: "hsl(210 20% 88%)",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                    <button
                      onClick={handleAnalyze}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "hsl(38 92% 54%)",
                        border: "none",
                        borderRadius: "7px",
                        color: "hsl(220 16% 6%)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Search size={13} />
                      Analyze
                    </button>
                  </div>
                </motion.div>

                {/* Example repos */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "hsl(215 12% 40%)",
                    }}
                  >
                    Try:
                  </span>
                  {[
                    "facebook/react",
                    "vercel/next.js",
                    "ArunChandrasekar07/devmind",
                  ].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setUrl(`https://github.com/${r}`);
                      }}
                      style={{
                        padding: "3px 9px",
                        background: "hsl(220 12% 12%)",
                        border: "1px solid hsl(222 14% 19%)",
                        borderRadius: "5px",
                        fontSize: "11px",
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
                          "hsl(222 14% 19%)";
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </motion.div>
              </div>

              {/* Right — product demo */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div
                  style={{
                    background: "hsl(220 14% 9%)",
                    border: "1px solid hsl(222 14% 16%)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                      "0 24px 64px hsl(0 0% 0% / 0.5), 0 0 0 1px hsl(222 14% 16%)",
                  }}
                >
                  {/* Window chrome */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "11px 14px",
                      borderBottom: "1px solid hsl(222 14% 14%)",
                      background: "hsl(222 18% 9%)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "5px" }}>
                      {["hsl(0 70% 56%)", "hsl(38 95% 54%)", "hsl(152 68% 42%)"].map(
                        (c) => (
                          <div
                            key={c}
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: c,
                              opacity: 0.7,
                            }}
                          />
                        )
                      )}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontSize: "11px",
                        color: "hsl(215 12% 42%)",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      <Logo size={12} />
                      vercel / next.js — 24 commits
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "10px",
                        color: "hsl(152 68% 50%)",
                        fontWeight: 500,
                      }}
                    >
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "hsl(152 68% 48%)",
                          animation: "pulse-live 2s infinite",
                        }}
                      />
                      LIVE
                    </div>
                  </div>

                  {/* Health bar */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid hsl(220 10% 11%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "11px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        color: "hsl(215 12% 45%)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Star size={10} style={{ color: "hsl(38 95% 56%)" }} />
                        124k
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Eye size={10} />
                        2.1k
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <GitBranch size={10} />
                        main
                      </span>
                    </div>
                    <span
                      style={{
                        color: "hsl(152 68% 50%)",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 size={11} />
                      Health 91/100
                    </span>
                  </div>

                  {/* Commit list */}
                  <div>
                    {DEMO_COMMITS.map((c, i) => {
                      const risk = RISK_COLORS[c.risk as keyof typeof RISK_COLORS];
                      const cat = CAT_COLORS[c.cat] || CAT_COLORS.docs;
                      const isActive = i === activeCommit;
                      return (
                        <motion.div
                          key={c.sha}
                          animate={{
                            background: isActive
                              ? "hsl(38 92% 54% / 0.04)"
                              : "hsl(38 92% 54% / 0)",
                          }}
                          transition={{ duration: 0.3 }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "9px 14px",
                            borderBottom: "1px solid hsl(222 14% 12%)",
                            borderLeft: `2px solid ${
                              isActive ? risk.dot : "hsl(38 92% 54% / 0)"
                            }`,
                            transition: "border-left-color 0.3s",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: risk.dot,
                              flexShrink: 0,
                              opacity: isActive ? 1 : 0.5,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "10px",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              fontWeight: 600,
                              flexShrink: 0,
                              color: cat.color,
                              background: cat.bg,
                            }}
                          >
                            {c.cat}
                          </span>
                          <span
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "10px",
                              color: "hsl(38 92% 58%)",
                              flexShrink: 0,
                              opacity: 0.7,
                            }}
                          >
                            {c.sha}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: "11px",
                              color: isActive
                                ? "hsl(210 20% 88%)"
                                : "hsl(215 12% 50%)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: isActive ? 500 : 400,
                              transition: "color 0.3s",
                            }}
                          >
                            {c.msg}
                          </span>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                flexShrink: 0,
                              }}
                            >
                              {[0, 1, 2].map((j) => (
                                <motion.div
                                  key={j}
                                  style={{
                                    width: "3px",
                                    height: "3px",
                                    borderRadius: "50%",
                                    background: "hsl(38 92% 58%)",
                                  }}
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{
                                    duration: 0.7,
                                    repeat: Infinity,
                                    delay: j * 0.15,
                                  }}
                                />
                              ))}
                            </motion.div>
                          )}
                          <span
                            style={{
                              fontSize: "10px",
                              color: "hsl(215 12% 38%)",
                              flexShrink: 0,
                            }}
                          >
                            {c.time}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      padding: "8px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: "hsl(215 12% 38%)",
                    }}
                  >
                    <span>6 of 24 commits shown</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Brain size={9} style={{ color: "hsl(38 92% 54%)" }} />
                      GitMind Intelligence
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            zIndex: 1,
            padding: "40px 24px",
            borderTop: "1px solid hsl(222 14% 12%)",
            borderBottom: "1px solid hsl(222 14% 12%)",
          }}
        >
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "24px",
                textAlign: "center",
              }}
            >
              {[
                { value: "< 30s", label: "Full analysis" },
                { value: "3-tier", label: "AI fallback" },
                { value: "100%", label: "Free forever" },
                { value: "Any", label: "Public repo" },
              ].map((s, i) => (
                <FadeUp key={s.label} delay={i * 0.07}>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      background:
                        "linear-gradient(135deg, hsl(38 92% 58%) 0%, hsl(32 96% 65%) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      marginBottom: "4px",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "hsl(215 12% 48%)",
                    }}
                  >
                    {s.label}
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────── */}
        <section
          id="features"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "100px 24px",
          }}
        >
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <FadeUp className="text-center" style={{ marginBottom: "56px" }}>
              <div style={{ textAlign: "center", marginBottom: "56px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "hsl(38 92% 58%)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  Capabilities
                </span>
                <h2
                  style={{
                    fontSize: "clamp(28px, 4vw, 40px)",
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    marginBottom: "12px",
                    color: "hsl(210 20% 94%)",
                  }}
                >
                  Engineering intelligence,
                  <br />
                  not just AI summaries.
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "hsl(215 12% 50%)",
                    maxWidth: "520px",
                    margin: "0 auto",
                    lineHeight: 1.7,
                  }}
                >
                  Built for developers who need precise answers, not marketing
                  copy.
                </p>
              </div>
            </FadeUp>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              {FEATURES.map((f, i) => (
                <FadeUp key={f.title} delay={i * 0.06}>
                  <motion.div
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    style={{
                      background: "hsl(220 14% 9%)",
                      border: "1px solid hsl(220 12% 13%)",
                      borderRadius: "10px",
                      padding: "22px",
                      height: "100%",
                      cursor: "default",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "hsl(222 14% 22%)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "hsl(220 12% 13%)")
                    }
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "9px",
                        background: f.bg,
                        border: `1px solid ${f.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <f.icon size={17} style={{ color: f.color }} />
                    </div>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "hsl(210 20% 92%)",
                        marginBottom: "7px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "hsl(215 12% 50%)",
                        lineHeight: 1.65,
                      }}
                    >
                      {f.desc}
                    </p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ─────────────────────────────────────────────── */}
        <section
          id="workflow"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "80px 24px",
            borderTop: "1px solid hsl(222 14% 12%)",
            background: "hsl(222 18% 8%)",
          }}
        >
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <FadeUp>
              <div style={{ textAlign: "center", marginBottom: "56px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "hsl(38 92% 58%)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  Workflow
                </span>
                <h2
                  style={{
                    fontSize: "clamp(26px, 3.5vw, 36px)",
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    color: "hsl(210 20% 94%)",
                  }}
                >
                  From URL to intelligence
                  <br />
                  in under 30 seconds.
                </h2>
              </div>
            </FadeUp>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "32px",
                position: "relative",
              }}
            >
              {/* connector line */}
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "calc(33% - 20px)",
                  right: "calc(33% - 20px)",
                  height: "1px",
                  background:
                    "linear-gradient(90deg, hsl(38 92% 54% / 0.3), hsl(38 92% 54% / 0.3))",
                  display: "none",
                }}
              />

              {WORKFLOW.map((w, i) => (
                <FadeUp key={w.step} delay={i * 0.1}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "hsl(38 92% 54% / 0.08)",
                        border: "1px solid hsl(38 92% 54% / 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 14px",
                        position: "relative",
                      }}
                    >
                      <w.icon
                        size={19}
                        style={{ color: "hsl(38 92% 58%)" }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "hsl(220 16% 6%)",
                          border: "1px solid hsl(38 92% 54% / 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "hsl(38 92% 62%)",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "hsl(210 20% 90%)",
                        marginBottom: "7px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {w.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "hsl(215 12% 48%)",
                        lineHeight: 1.65,
                      }}
                    >
                      {w.desc}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────── */}
        <section
          id="pricing"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "100px 24px",
          }}
        >
          <div style={{ maxWidth: "440px", margin: "0 auto" }}>
            <FadeUp>
              <div style={{ textAlign: "center", marginBottom: "36px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "hsl(38 92% 58%)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  Pricing
                </span>
                <h2
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    color: "hsl(210 20% 94%)",
                    marginBottom: "8px",
                  }}
                >
                  Free. No limits.
                </h2>
                <p style={{ fontSize: "14px", color: "hsl(215 12% 50%)" }}>
                  Analyze as many repositories as you want.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <motion.div
                whileHover={{ y: -3 }}
                style={{
                  background: "hsl(220 14% 9%)",
                  border: "1px solid hsl(38 92% 54% / 0.25)",
                  borderRadius: "12px",
                  padding: "28px",
                  boxShadow:
                    "0 0 40px hsl(38 92% 54% / 0.08), 0 0 0 1px hsl(38 92% 54% / 0.15)",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "42px",
                      fontWeight: 800,
                      letterSpacing: "-0.05em",
                      color: "hsl(210 20% 96%)",
                    }}
                  >
                    $0
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "hsl(215 12% 48%)",
                      marginLeft: "6px",
                    }}
                  >
                    / forever
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "hsl(215 12% 42%)",
                    marginBottom: "24px",
                  }}
                >
                  No credit card required
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "24px",
                  }}
                >
                  {PRICING_FEATURES.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "13px",
                        color: "hsl(210 16% 78%)",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "hsl(38 92% 54% / 0.1)",
                          border: "1px solid hsl(38 92% 54% / 0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Check
                          size={10}
                          style={{ color: "hsl(38 92% 62%)" }}
                        />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push("/analyze")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "12px",
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
                  Start analyzing for free
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            </FadeUp>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section
          id="faq"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "80px 24px",
            borderTop: "1px solid hsl(222 14% 12%)",
          }}
        >
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <FadeUp>
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "hsl(38 92% 58%)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  FAQ
                </span>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    color: "hsl(210 20% 94%)",
                  }}
                >
                  Common questions
                </h2>
              </div>
            </FadeUp>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {FAQS.map((faq, i) => (
                <FadeUp key={faq.q} delay={i * 0.04}>
                  <div
                    style={{
                      background: "hsl(220 14% 9%)",
                      border: "1px solid hsl(220 12% 13%)",
                      borderRadius: "9px",
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "hsl(220 12% 18%)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor =
                        "hsl(220 12% 13%)")
                    }
                  >
                    <button
                      onClick={() =>
                        setOpenFaq(openFaq === i ? null : i)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "15px 18px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        textAlign: "left",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "hsl(210 20% 88%)",
                        }}
                      >
                        {faq.q}
                      </span>
                      <ChevronDown
                        size={15}
                        style={{
                          color: "hsl(215 12% 45%)",
                          flexShrink: 0,
                          transform:
                            openFaq === i
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>

                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <p
                            style={{
                              padding: "0 18px 15px",
                              fontSize: "13px",
                              color: "hsl(215 12% 52%)",
                              lineHeight: 1.7,
                              borderTop: "1px solid hsl(222 14% 14%)",
                              paddingTop: "12px",
                              margin: 0,
                            }}
                          >
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            zIndex: 1,
            padding: "80px 24px",
            background: "hsl(222 18% 8%)",
            borderTop: "1px solid hsl(222 14% 12%)",
          }}
        >
          <FadeUp>
            <div
              style={{
                maxWidth: "560px",
                margin: "0 auto",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "hsl(38 92% 54% / 0.08)",
                  border: "1px solid hsl(38 92% 54% / 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Terminal
                  size={22}
                  style={{ color: "hsl(38 92% 58%)" }}
                />
              </div>
              <h2
                style={{
                  fontSize: "clamp(26px, 3.5vw, 34px)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  marginBottom: "12px",
                  color: "hsl(210 20% 94%)",
                  lineHeight: 1.15,
                }}
              >
                Ready to understand
                <br />
                any codebase?
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "hsl(215 12% 50%)",
                  marginBottom: "28px",
                  lineHeight: 1.65,
                }}
              >
                Paste a GitHub URL and get AI-powered engineering intelligence
                in seconds. No signup required to analyze.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/analyze")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "11px 22px",
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
                  <Search size={14} />
                  Analyze a repository
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/signup")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "11px 22px",
                    background: "hsl(220 12% 13%)",
                    border: "1px solid hsl(222 14% 22%)",
                    borderRadius: "8px",
                    color: "hsl(210 20% 85%)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Create free account
                </motion.button>
              </div>
            </div>
          </FadeUp>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer
          style={{
            position: "relative",
            zIndex: 1,
            padding: "24px",
            borderTop: "1px solid hsl(222 14% 12%)",
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <Wordmark size={22} />
            <p
              style={{
                fontSize: "12px",
                color: "hsl(215 12% 40%)",
                textAlign: "center",
              }}
            >
              Built by{" "}
              <span style={{ color: "hsl(215 12% 58%)" }}>Arun C</span> ·
              VIT Vellore · Powered by Gemini · Groq · GitHub API
            </p>
            <a
              href="https://github.com/ArunChandrasekar07/gitmind"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "hsl(215 12% 42%)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "hsl(210 20% 75%)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "hsl(215 12% 42%)")
              }
            >
              <GitBranch size={13} />
              GitHub
            </a>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { box-shadow: 0 0 0 0 hsl(152 68% 48% / 0.4); }
          50% { box-shadow: 0 0 0 5px hsl(152 68% 48% / 0); }
        }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-grid { grid-template-columns: 1fr 1fr !important; }
          .workflow-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 580px) {
          .feature-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 768px) {
          .md-show { display: block !important; }
        }
      `}</style>
    </>
  );
}