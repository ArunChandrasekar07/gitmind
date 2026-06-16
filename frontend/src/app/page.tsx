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
    a: "GitMind was built by Arun C, focused on AI-powered developer tools and engineering intelligence.",
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

function GuestBadge({
  guestUsed,
  guestTotal,
  onSignup,
}: {
  guestUsed: number;
  guestTotal: number;
  onSignup: () => void;
}) {
  const [visible, setVisible] = useState(true);
const [dismissed, setDismissed] = useState(false);
  
  const ticking = useRef(false);

  useEffect(() => {
  const timer = setTimeout(() => setDismissed(true), 2000);
  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  setVisible(window.scrollY <= 120 && !dismissed);
  const onScroll = () => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      setVisible(window.scrollY <= 120 && !dismissed);
      ticking.current = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, [dismissed]);

  return (
    <motion.div
      animate={{
        y: visible ? 0 : 16,
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.97,
      }}
      transition={{ duration: dismissed ? 0.6 : 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
      onClick={onSignup}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 14px",
        background: "hsl(220 14% 10% / 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid hsl(220 12% 20%)",
        borderRadius: "12px",
        boxShadow:
          "0 4px 24px hsl(0 0% 0% / 0.45), 0 0 0 1px hsl(38 92% 54% / 0.08)",
        cursor: "pointer",
        pointerEvents: visible ? "auto" : "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "hsl(38 92% 54% / 0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 24px hsl(0 0% 0% / 0.5), 0 0 0 1px hsl(38 92% 54% / 0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "hsl(220 12% 20%)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 24px hsl(0 0% 0% / 0.45), 0 0 0 1px hsl(38 92% 54% / 0.08)";
      }}
    >
      {/* Dot progress */}
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {Array.from({ length: guestTotal }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              background:
                i < guestUsed ? "hsl(38 92% 54%)" : "hsl(220 12% 22%)",
              scale: i < guestUsed ? 1 : 0.85,
            }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
            }}
          />
        ))}
      </div>

      {/* Text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "hsl(38 10% 82%)",
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          {guestTotal - guestUsed} of {guestTotal} free left
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "hsl(220 8% 45%)",
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          Sign up for unlimited
        </span>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [url, setUrl] = useState("");
  const [activeCommit, setActiveCommit] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [guestUsed, setGuestUsed] = useState(0);
  const [guestTotal] = useState(5);

  useEffect(() => {
    pingBackend();
    const t = setInterval(
      () => setActiveCommit((p) => (p + 1) % DEMO_COMMITS.length),
      2200
    );
    return () => clearInterval(t);
  }, []);

  // ── Guest limit helpers ─────────────────────────────────
  const GUEST_KEY      = "gitmind_guest_count";
  const GUEST_DATE_KEY = "gitmind_guest_date";

  const getGuestCount = (): number => {
    if (typeof window === "undefined") return 0;
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem(GUEST_DATE_KEY);
    if (savedDate !== today) {
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
    setGuestUsed(count);
  };

  useEffect(() => {
    setGuestUsed(getGuestCount());
  }, []);

  const handleAnalyze = () => {
    if (!url.trim()) return;

    if (!isAuthenticated) {
      const used = getGuestCount();
      if (used >= guestTotal) {
        setShowModal(true);
        return;
      }
      router.push(`/analyze?url=${encodeURIComponent(url)}&limit=5`);
      // Show modal after first completed analysis via URL flag — handled below
      return;
    }

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
              maxWidth: "1180px",
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
          className="lp-hero-section"
          style={{
            position: "relative",
            zIndex: 1,
            paddingTop: "140px",
            paddingBottom: "80px",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
            <div
              className="lp-hero-grid"
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
                    className="lp-url-row"
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
                    "vercel/next.js",
                    "torvalds/linux",
                    "microsoft/vscode",
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
                        e.currentTarget.style.borderColor = "hsl(222 14% 19%)";
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
                      {[
                        "hsl(0 70% 56%)",
                        "hsl(38 95% 54%)",
                        "hsl(152 68% 42%)",
                      ].map((c) => (
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
                      ))}
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
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star size={10} style={{ color: "hsl(38 95% 56%)" }} />
                        124k
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Eye size={10} />
                        2.1k
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
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
                      const risk =
                        RISK_COLORS[c.risk as keyof typeof RISK_COLORS];
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
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
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
        {/* ── INTELLIGENCE STRIP ──────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            zIndex: 1,
            padding: "0 24px",
            borderTop: "1px solid hsl(220 12% 11%)",
          }}
        >
          <div
            className="lp-stats-grid"
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
            }}
          >
            {[
              {
                value: "Commit-level",
                label: "AI granularity",
                sub: "Every diff analyzed individually",
              },
              {
                value: "3-model",
                label: "Fallback chain",
                sub: "Gemini → Groq → fallback",
              },
              {
                value: "< 30s",
                label: "Full repo analysis",
                sub: "From URL to insights",
              },
              {
                value: "Zero",
                label: "Configuration",
                sub: "Paste URL. That's it.",
              },
            ].map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.06}>
                <div
                  style={{
                    padding: "28px 24px",
                    borderRight: i < 3 ? "1px solid hsl(220 12% 11%)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      letterSpacing: "-0.035em",
                      color: "hsl(45 95% 68%)",
                      marginBottom: "3px",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "hsl(38 10% 82%)",
                      marginBottom: "2px",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "hsl(220 8% 42%)",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.sub}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── RISK INTELLIGENCE ────────────────────────────────────── */}
        <section
          id="features"
          className="lp-section-tall"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "96px 24px",
            borderTop: "1px solid hsl(220 12% 11%)",
          }}
        >
          <div
            className="lp-risk-grid"
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "72px",
              alignItems: "center",
            }}
          >
            {/* Left — Risk visualization */}
            <FadeUp>
              <div>
                {/* Section label */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "1px",
                      background: "hsl(38 92% 54%)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "hsl(38 92% 58%)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Risk Detection
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: "clamp(24px, 3.5vw, 34px)",
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.15,
                    marginBottom: "14px",
                    color: "hsl(38 10% 94%)",
                  }}
                >
                  Know which commits
                  <br />
                  are dangerous
                  <br />
                  <span
                    style={{
                      color: "hsl(45 95% 68%)",
                    }}
                  >
                    before they ship.
                  </span>
                </h2>

                <p
                  style={{
                    fontSize: "14px",
                    color: "hsl(220 8% 50%)",
                    lineHeight: 1.75,
                    marginBottom: "28px",
                    maxWidth: "400px",
                  }}
                >
                  GitMind classifies every commit as Safe, Warning, or High Risk
                  based on the actual diff — security patches, memory issues,
                  breaking changes, and more.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {[
                    {
                      level: "High Risk",
                      color: "hsl(0 70% 62%)",
                      bg: "hsl(0 70% 54% / 0.1)",
                      border: "hsl(0 70% 54% / 0.25)",
                      dot: "hsl(0 70% 58%)",
                      desc: "Memory leaks, SQL injection, breaking API changes",
                    },
                    {
                      level: "Warning",
                      color: "hsl(38 92% 62%)",
                      bg: "hsl(38 92% 54% / 0.1)",
                      border: "hsl(38 92% 54% / 0.25)",
                      dot: "hsl(38 92% 58%)",
                      desc: "Missing error handling, performance regressions",
                    },
                    {
                      level: "Safe",
                      color: "hsl(152 60% 48%)",
                      bg: "hsl(152 60% 40% / 0.1)",
                      border: "hsl(152 60% 40% / 0.25)",
                      dot: "hsl(152 60% 44%)",
                      desc: "Documentation, refactoring, test additions",
                    },
                  ].map((r) => (
                    <div
                      key={r.level}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "11px 14px",
                        background: r.bg,
                        border: `1px solid ${r.border}`,
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: r.dot,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: r.color,
                          flexShrink: 0,
                          minWidth: "72px",
                        }}
                      >
                        {r.level}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "hsl(220 8% 55%)",
                        }}
                      >
                        {r.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Right — Risk breakdown visual */}
            <FadeUp delay={0.1}>
              <div
                style={{
                  background: "hsl(220 14% 9%)",
                  border: "1px solid hsl(220 12% 13%)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid hsl(220 10% 11%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "hsl(220 8% 60%)",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    tiangolo / fastapi · risk report
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "hsl(152 60% 46%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={11} />
                    Healthy
                  </span>
                </div>

                {/* Health score bar */}
                <div style={{ padding: "18px 18px 14px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "hsl(220 8% 48%)",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      Repository Health
                    </span>
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "hsl(152 60% 48%)",
                        letterSpacing: "-0.03em",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      88
                      <span
                        style={{
                          fontSize: "12px",
                          color: "hsl(220 8% 42%)",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        /100
                      </span>
                    </span>
                  </div>

                  {/* Segmented bar */}
                  <div
                    style={{
                      height: "6px",
                      borderRadius: "3px",
                      background: "hsl(220 12% 14%)",
                      overflow: "hidden",
                      display: "flex",
                      gap: "2px",
                      marginBottom: "12px",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "70%" }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                      style={{
                        height: "100%",
                        background: "hsl(152 60% 44%)",
                        borderRadius: "3px",
                      }}
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "20%" }}
                      transition={{
                        duration: 0.8,
                        delay: 0.5,
                        ease: "easeOut",
                      }}
                      style={{
                        height: "100%",
                        background: "hsl(38 92% 54%)",
                        borderRadius: "3px",
                      }}
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "10%" }}
                      transition={{
                        duration: 0.8,
                        delay: 0.7,
                        ease: "easeOut",
                      }}
                      style={{
                        height: "100%",
                        background: "hsl(0 70% 54%)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "11px",
                    }}
                  >
                    {[
                      { label: "14 safe", color: "hsl(152 60% 46%)" },
                      { label: "4 warnings", color: "hsl(38 92% 60%)" },
                      { label: "2 risks", color: "hsl(0 70% 60%)" },
                    ].map((l) => (
                      <span
                        key={l.label}
                        style={{ color: l.color, fontWeight: 600 }}
                      >
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risk commits */}
                <div style={{ borderTop: "1px solid hsl(220 10% 11%)" }}>
                  {[
                    {
                      sha: "c3g1h2i",
                      msg: "fix: connection pool not releasing on timeout",
                      risk: "danger",
                      cat: "fix",
                    },
                    {
                      sha: "d4j5k6l",
                      msg: "perf: skip validation for internal API calls",
                      risk: "warn",
                      cat: "perf",
                    },
                    {
                      sha: "e5k7l8m",
                      msg: "feat: add OAuth2 bearer token authentication",
                      risk: "safe",
                      cat: "feat",
                    },
                  ].map((c, i) => {
                    const riskColor =
                      c.risk === "danger"
                        ? "hsl(0 70% 58%)"
                        : c.risk === "warn"
                          ? "hsl(38 92% 57%)"
                          : "hsl(152 60% 44%)";
                    const catColor =
                      c.cat === "fix"
                        ? {
                            color: "hsl(0 70% 62%)",
                            bg: "hsl(0 70% 54% / 0.1)",
                          }
                        : c.cat === "perf"
                          ? {
                              color: "hsl(38 92% 60%)",
                              bg: "hsl(38 92% 54% / 0.1)",
                            }
                          : {
                              color: "hsl(199 89% 58%)",
                              bg: "hsl(199 89% 48% / 0.1)",
                            };
                    return (
                      <div
                        key={c.sha}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 18px",
                          borderBottom:
                            i < 2 ? "1px solid hsl(220 10% 10%)" : "none",
                          borderLeft: `2px solid ${riskColor}`,
                        }}
                      >
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: riskColor,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: 600,
                            color: catColor.color,
                            background: catColor.bg,
                            flexShrink: 0,
                          }}
                        >
                          {c.cat}
                        </span>
                        <span
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "10px",
                            color: "hsl(38 92% 55%)",
                            flexShrink: 0,
                          }}
                        >
                          {c.sha}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            fontSize: "11px",
                            color: "hsl(220 8% 62%)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.msg}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── COMMIT INTELLIGENCE ──────────────────────────────────── */}
        <section
          className="lp-section-tall"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "96px 24px",
            borderTop: "1px solid hsl(220 12% 11%)",
            background: "hsl(220 14% 8%)",
          }}
        >
          <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
            <FadeUp>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "1px",
                    background: "hsl(38 92% 54%)",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "hsl(38 92% 58%)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Commit Intelligence
                </span>
                <div
                  style={{
                    width: "20px",
                    height: "1px",
                    background: "hsl(38 92% 54%)",
                  }}
                />
              </div>
              <h2
                style={{
                  textAlign: "center",
                  fontSize: "clamp(24px, 3.5vw, 36px)",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                  color: "hsl(38 10% 94%)",
                  marginBottom: "12px",
                  lineHeight: 1.15,
                }}
              >
                Every commit. Explained.
              </h2>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "14px",
                  color: "hsl(220 8% 48%)",
                  maxWidth: "500px",
                  margin: "0 auto 56px",
                  lineHeight: 1.7,
                }}
              >
                GitMind reads the actual diff — not just the commit message. The
                AI understands context, intent, and impact.
              </p>
            </FadeUp>

            {/* 3-column capability cards — GitMind style */}
            <div
              className="lp-commit-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1px",
                background: "hsl(220 12% 12%)",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid hsl(220 12% 12%)",
              }}
            >
              {[
                {
                  number: "01",
                  title: "Plain-English Explanations",
                  desc: "What changed, what it means, and what you should know — without reading a single line of diff.",
                  tag: "AI → Language",
                },
                {
                  number: "02",
                  title: "Diff-Aware Risk Scoring",
                  desc: "Analyzes the actual code delta, not just the commit message. Catches risks that messages hide.",
                  tag: "Diff → Risk",
                },
                {
                  number: "03",
                  title: "Category Classification",
                  desc: "Automatically classifies each commit as feat, fix, refactor, perf, security, docs, or chore.",
                  tag: "Code → Category",
                },
              ].map((c, i) => (
                <FadeUp key={c.number} delay={i * 0.07}>
                  <motion.div
                    whileHover={{
                      background: "hsl(220 14% 11%)",
                      transition: { duration: 0.15 },
                    }}
                    style={{
                      background: "hsl(220 14% 9%)",
                      padding: "28px 24px",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "hsl(38 92% 54% / 0.5)",
                        }}
                      >
                        {c.number}
                      </span>
                      <span
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: "hsl(38 92% 62%)",
                          background: "hsl(38 92% 54% / 0.08)",
                          border: "1px solid hsl(38 92% 54% / 0.18)",
                          fontWeight: 600,
                        }}
                      >
                        {c.tag}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "hsl(38 10% 90%)",
                        marginBottom: "8px",
                        letterSpacing: "-0.015em",
                        lineHeight: 1.3,
                      }}
                    >
                      {c.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "hsl(220 8% 48%)",
                        lineHeight: 1.7,
                      }}
                    >
                      {c.desc}
                    </p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section
          id="workflow"
          className="lp-section-tall"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "96px 24px",
            borderTop: "1px solid hsl(220 12% 11%)",
          }}
        >
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <FadeUp>
              <div style={{ textAlign: "center", marginBottom: "52px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "1px",
                      background: "hsl(38 92% 54%)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "hsl(38 92% 58%)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    How it works
                  </span>
                  <div
                    style={{
                      width: "20px",
                      height: "1px",
                      background: "hsl(38 92% 54%)",
                    }}
                  />
                </div>
                <h2
                  style={{
                    fontSize: "clamp(24px, 3.5vw, 34px)",
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    color: "hsl(38 10% 94%)",
                    lineHeight: 1.15,
                  }}
                >
                  URL in. Intelligence out.
                  <br />
                  <span style={{ color: "hsl(45 95% 68%)" }}>
                    In under 30 seconds.
                  </span>
                </h2>
              </div>
            </FadeUp>

            {/* Vertical timeline — unique to GitMind */}
            <div style={{ position: "relative", paddingLeft: "40px" }}>
              {/* Timeline line */}
              <div
                style={{
                  position: "absolute",
                  left: "11px",
                  top: "6px",
                  bottom: "6px",
                  width: "1px",
                  background:
                    "linear-gradient(to bottom, hsl(38 92% 54% / 0.6), hsl(38 92% 54% / 0.08))",
                }}
              />

              {[
                {
                  step: "01",
                  title: "Paste any public GitHub URL",
                  desc: "No tokens. No setup. No OAuth. Just paste a URL like github.com/owner/repo and hit analyze.",
                  detail: "github.com/tiangolo/fastapi",
                  isCode: true,
                },
                {
                  step: "02",
                  title: "GitHub API fetches commit history",
                  desc: "GitMind pulls the full commit log and fetches the actual diff for each commit — not just metadata.",
                  detail:
                    "Fetching 20 commits · Reading diffs · Building context",
                  isCode: true,
                },
                {
                  step: "03",
                  title: "AI pipeline analyzes each diff",
                  desc: "Gemini processes every diff independently. Each commit gets an explanation, risk level, and category.",
                  detail: "Gemini 2.5 Flash → Groq fallback → response",
                  isCode: true,
                },
                {
                  step: "04",
                  title: "Intelligence report delivered",
                  desc: "Repository health score, per-commit AI explanations, risk breakdown, and engineering summary — all instant.",
                  detail: "Report ready in < 30s",
                  isCode: false,
                },
              ].map((w, i) => (
                <FadeUp key={w.step} delay={i * 0.08}>
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: i < 3 ? "36px" : "0",
                    }}
                  >
                    {/* Node */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-40px",
                        top: "3px",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "hsl(220 14% 9%)",
                        border: "2px solid hsl(38 92% 54% / 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "hsl(38 92% 54%)",
                        }}
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "5px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "hsl(38 92% 54% / 0.55)",
                          }}
                        >
                          {w.step}
                        </span>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "hsl(38 10% 90%)",
                            letterSpacing: "-0.015em",
                          }}
                        >
                          {w.title}
                        </h3>
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "hsl(220 8% 48%)",
                          lineHeight: 1.65,
                          marginBottom: "10px",
                        }}
                      >
                        {w.desc}
                      </p>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 10px",
                          background: "hsl(220 14% 10%)",
                          border: "1px solid hsl(220 12% 15%)",
                          borderRadius: "6px",
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "11px",
                          color: "hsl(38 92% 58%)",
                        }}
                      >
                        <span style={{ color: "hsl(220 8% 38%)" }}>›</span>
                        {w.detail}
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── OPEN SOURCE / FREE ───────────────────────────────────── */}
        <section
          id="pricing"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "80px 24px",
            borderTop: "1px solid hsl(220 12% 11%)",
            background: "hsl(220 14% 8%)",
          }}
        >
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div
              className="lp-pricing-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "48px",
                alignItems: "center",
              }}
            >
              {/* Left */}
              <FadeUp>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "1px",
                        background: "hsl(38 92% 54%)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "hsl(38 92% 58%)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Free forever
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: "clamp(24px, 3vw, 32px)",
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      color: "hsl(38 10% 94%)",
                      marginBottom: "12px",
                      lineHeight: 1.2,
                    }}
                  >
                    No subscription.
                    <br />
                    No credit card.
                    <br />
                    <span style={{ color: "hsl(45 95% 68%)" }}>No limits.</span>
                  </h2>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "hsl(220 8% 48%)",
                      lineHeight: 1.7,
                      marginBottom: "28px",
                      maxWidth: "360px",
                    }}
                  >
                    GitMind is built as a portfolio project and engineering
                    tool. Analyze any public repository, any time, completely
                    free.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/analyze")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
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
                    Start analyzing
                    <ArrowRight size={14} />
                  </motion.button>
                </div>
              </FadeUp>

              {/* Right — feature list terminal style */}
              <FadeUp delay={0.1}>
                <div
                  style={{
                    background: "hsl(220 14% 9%)",
                    border: "1px solid hsl(220 12% 13%)",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid hsl(220 10% 11%)",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "11px",
                      color: "hsl(220 8% 40%)",
                      display: "flex",
                      gap: "5px",
                    }}
                  >
                    <span style={{ color: "hsl(152 60% 46%)" }}>✓</span>
                    gitmind --plan free --limits none
                  </div>
                  <div style={{ padding: "16px 14px" }}>
                    {[
                      "Unlimited repo analysis",
                      "AI commit explanations",
                      "Risk detection (3 levels)",
                      "Repository health scoring",
                      "Real-time streaming AI",
                      "Commit category classification",
                      "Engineering recommendations",
                      "Export-ready summaries",
                    ].map((f, i) => (
                      <div
                        key={f}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "7px 0",
                          borderBottom:
                            i < 7 ? "1px solid hsl(220 10% 10%)" : "none",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "11px",
                            color: "hsl(38 92% 58%)",
                            flexShrink: 0,
                          }}
                        >
                          +
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "hsl(220 8% 65%)",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section
          id="faq"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "80px 24px",
            borderTop: "1px solid hsl(220 12% 11%)",
          }}
        >
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <FadeUp>
              <div style={{ marginBottom: "40px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "1px",
                      background: "hsl(38 92% 54%)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "hsl(38 92% 58%)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    FAQ
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    color: "hsl(38 10% 94%)",
                  }}
                >
                  Questions about GitMind
                </h2>
              </div>
            </FadeUp>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {FAQS.map((faq, i) => (
                <FadeUp key={faq.q} delay={i * 0.04}>
                  <div
                    style={{
                      borderBottom: "1px solid hsl(220 12% 11%)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 0",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        textAlign: "left",
                        gap: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color:
                            openFaq === i
                              ? "hsl(38 92% 62%)"
                              : "hsl(38 10% 82%)",
                          transition: "color 0.15s",
                        }}
                      >
                        {faq.q}
                      </span>
                      <span
                        style={{
                          fontSize: "16px",
                          color: "hsl(220 8% 40%)",
                          flexShrink: 0,
                          fontWeight: 300,
                          transform:
                            openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                          display: "inline-block",
                        }}
                      >
                        +
                      </span>
                    </button>

                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.18 }}
                          style={{ overflow: "hidden" }}
                        >
                          <p
                            style={{
                              paddingBottom: "16px",
                              fontSize: "13px",
                              color: "hsl(220 8% 50%)",
                              lineHeight: 1.75,
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

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            zIndex: 1,
            padding: "80px 24px",
            borderTop: "1px solid hsl(220 12% 11%)",
          }}
        >
          <FadeUp>
            <div
              style={{
                maxWidth: "700px",
                margin: "0 auto",
              }}
            >
              {/* Terminal-style CTA block */}
              <div
                style={{
                  background: "hsl(220 14% 9%)",
                  border: "1px solid hsl(220 12% 14%)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 0 48px hsl(38 92% 54% / 0.06)",
                }}
              >
                {/* Terminal header */}
                <div
                  style={{
                    padding: "11px 16px",
                    borderBottom: "1px solid hsl(220 10% 11%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "hsl(220 14% 8%)",
                  }}
                >
                  <div style={{ display: "flex", gap: "5px" }}>
                    {[
                      "hsl(0 70% 56%)",
                      "hsl(38 95% 54%)",
                      "hsl(152 68% 42%)",
                    ].map((c) => (
                      <div
                        key={c}
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: c,
                          opacity: 0.6,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "11px",
                      color: "hsl(220 8% 36%)",
                      marginLeft: "6px",
                    }}
                  >
                    gitmind analyze
                  </span>
                </div>

                {/* Content */}
                <div className="lp-cta-content" style={{ padding: "36px 40px" }}>
                  <h2
                    style={{
                      fontSize: "clamp(22px, 3vw, 30px)",
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      marginBottom: "10px",
                      color: "hsl(38 10% 94%)",
                      lineHeight: 1.2,
                    }}
                  >
                    Ready to understand any codebase?
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "hsl(220 8% 48%)",
                      marginBottom: "28px",
                      lineHeight: 1.65,
                    }}
                  >
                    Paste a GitHub URL. Get AI-powered engineering intelligence
                    in seconds.
                    <br />
                    No signup required to analyze.
                  </p>

                  {/* Fake terminal line */}
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "12px",
                      color: "hsl(38 92% 58%)",
                      marginBottom: "24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: "hsl(220 8% 36%)" }}>$</span>
                    gitmind analyze github.com/vercel/next.js
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "14px",
                        background: "hsl(38 92% 54%)",
                        borderRadius: "1px",
                        verticalAlign: "text-bottom",
                      }}
                    />
                  </div>

                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push("/analyze")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
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
                      <Search size={14} />
                      Analyze a repository
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push("/signup")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
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
                      Explore Dashboard
                    </motion.button>
                  </div>
                </div>
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
            borderTop: "1px solid hsl(220 12% 10%)",
          }}
        >
          <div
            className="lp-footer-inner"
            style={{
              maxWidth: "1180px",
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
                color: "hsl(220 8% 36%)",
                textAlign: "center",
              }}
            >
              Built by <span style={{ color: "hsl(220 8% 54%)" }}>Arun C</span>{" "}
              · Powered by Gemini · Groq · GitHub API
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
                color: "hsl(220 8% 38%)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "hsl(38 92% 58%)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "hsl(220 8% 38%)")
              }
            >
              <GitBranch size={13} />
              GitHub
            </a>
          </div>
        </footer>
      </div>

      {/* ── Guest counter badge with scroll behavior ─────── */}
      {!isAuthenticated && (
        <GuestBadge
          guestUsed={guestUsed}
          guestTotal={guestTotal}
          onSignup={() => router.push("/signup")}
        />
      )}

      {/* ── Premium modal ────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "hsl(220 16% 6% / 0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "440px",
                background: "hsl(220 14% 9%)",
                border: "1px solid hsl(38 92% 54% / 0.2)",
                borderRadius: "16px",
                padding: "36px 32px 32px",
                boxShadow:
                  "0 0 0 1px hsl(38 92% 54% / 0.1), 0 32px 64px hsl(0 0% 0% / 0.6)",
                position: "relative",
              }}
            >
              {/* Close */}
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "none",
                  border: "none",
                  color: "hsl(220 8% 40%)",
                  cursor: "pointer",
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "4px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                ×
              </button>

              {/* Icon */}
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "hsl(38 92% 54% / 0.1)",
                  border: "1px solid hsl(38 92% 54% / 0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                }}
              >
                <Logo size={60} />
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "hsl(38 10% 94%)",
                  marginBottom: "10px",
                  lineHeight: 1.2,
                  textAlign: "center",
                  width: "100%",
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
                  textAlign: "center",
                  maxWidth: "340px",
                  margin: "0 auto 24px auto",
                }}
              >
                You've used all {guestTotal} free analyses. Create an account or
                sign in to unlock unlimited analysis, save history, access your
                dashboard, and explore advanced AI insights.
              </p>

              {/* Feature pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "7px",
                  marginBottom: "24px",
                }}
              >
                {[
                  "Unlimited analyses",
                  "Analysis history",
                  "Save repositories",
                  "Up to 30 commits",
                  "Dashboard",
                  "Advanced AI insights",
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

              {/* CTAs */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push("/signup")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "hsl(38 92% 54%)",
                    border: "none",
                    borderRadius: "9px",
                    color: "hsl(220 16% 6%)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push("/login")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "hsl(220 12% 13%)",
                    border: "1px solid hsl(220 12% 20%)",
                    borderRadius: "9px",
                    color: "hsl(220 8% 72%)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Sign In
                </motion.button>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "hsl(220 8% 38%)",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    padding: "6px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "hsl(220 8% 55%)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "hsl(220 8% 38%)")
                  }
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes pulse-live {
          0%, 100% { box-shadow: 0 0 0 0 hsl(152 68% 48% / 0.4); }
          50% { box-shadow: 0 0 0 5px hsl(152 68% 48% / 0); }
        }

        /* Desktop nav links */
        @media (min-width: 768px) {
          .md-show { display: block !important; }
        }

        /* ── MOBILE ONLY — landing page ── */
        @media (max-width: 768px) {

          /* Hero: single column, hide demo widget */
          .lp-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .lp-hero-grid > *:last-child {
            display: none !important;
          }

          /* Hero section: reduce top padding */
          .lp-hero-section {
            padding-top: 100px !important;
            padding-bottom: 48px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          /* Hero URL input: stack on very small screens */
          .lp-url-row {
            flex-direction: column !important;
            padding: 10px !important;
            gap: 8px !important;
          }
          .lp-url-row button {
            width: 100% !important;
            justify-content: center !important;
          }

          /* Stats strip: 2 columns */
          .lp-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          /* Remove right border from 2nd item (now end of row) */
          .lp-stats-grid > *:nth-child(2) > div {
            border-right: none !important;
          }

          .lp-risk-grid > * {
         min-width: 0 !important;
         }

          /* Risk section: stack */
          .lp-risk-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
            
          /* Commit intelligence: 1 col */
          .lp-commit-grid {
            grid-template-columns: 1fr !important;
          }

          /* Pricing: stack */
          .lp-pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }

          /* CTA terminal: reduce padding */
          .lp-cta-content {
            padding: 24px 20px !important;
          }

          /* Section padding reduction across all sections */
          section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          /* Large section top/bottom padding: reduce from 96px */
          .lp-section-tall {
            padding-top: 56px !important;
            padding-bottom: 56px !important;
          }

          /* Guest badge: smaller on mobile */
          .lp-guest-badge {
            bottom: 12px !important;
            right: 12px !important;
            padding: 7px 10px !important;
          }

          /* Footer: center stack */
          .lp-footer-inner {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
        }

        /* Very small screens — under 400px */
        @media (max-width: 400px) {
          .lp-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .lp-hero-grid h1 {
            font-size: 30px !important;
          }
        }
      `}</style>
    </>
  );
}