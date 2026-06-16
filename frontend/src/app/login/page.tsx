"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";
import { TopLoader } from "@/components/layout/TopLoader";
import { signInWithGoogle, signInWithGitHub, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";

/* ── shared styles ─────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    background: "hsl(220 16% 6%)",
    display: "flex",
    position: "relative" as const,
    overflow: "hidden",
  },
  left: {
    flex: "0 0 420px",
    display: "flex",
    flexDirection: "column" as const,
    padding: "40px",
    borderRight: "1px solid hsl(220 10% 11%)",
    overflowY: "auto" as const,
  },
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    position: "relative" as const,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "hsl(220 12% 11%)",
    border: "1px solid hsl(220 12% 16%)",
    borderRadius: "8px",
    color: "hsl(210 20% 94%)",
    fontSize: "13px",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box" as const,
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "hsl(215 12% 60%)",
    marginBottom: "6px",
    letterSpacing: "0.01em",
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "11px 16px",
    background: "hsl(38 92% 54%)",
    border: "none",
    borderRadius: "8px",
    color: "hsl(220 16% 6%)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    transition: "opacity 0.15s",
  },
  oauthBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 16px",
    background: "hsl(220 12% 12%)",
    border: "1px solid hsl(220 12% 18%)",
    borderRadius: "8px",
    color: "hsl(210 20% 88%)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    transition: "background 0.15s, border-color 0.15s",
  },
};

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err || !data.session) {
        setError(err?.message || "Invalid credentials");
        return;
      }
      const u = data.session.user;
      setUser(
        {
          id: u.id,
          email: u.email ?? "",
          full_name:
            u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
          avatar_url: u.user_metadata?.avatar_url ?? null,
        },
        data.session.access_token
      );
      router.push("/dashboard");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading("google");
    setError("");
    const { error } = await signInWithGoogle();
    if (error) {
      setError("Google sign-in failed.");
      setOauthLoading(null);
    }
  };

  const handleGitHub = async () => {
    setOauthLoading("github");
    setError("");
    const { error } = await signInWithGitHub();
    if (error) {
      setError("GitHub sign-in failed.");
      setOauthLoading(null);
    }
  };

  const disabled = isLoading || !!oauthLoading;

  return (
    <>
      <TopLoader />
      <div style={S.page}>
        {/* dot grid */}
        <div
          className="bg-dots"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        />

        {/* Left panel */}
        <div style={{ ...S.left, zIndex: 1 }} className="login-left-panel">
          {/* Back */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "hsl(215 12% 48%)",
              textDecoration: "none",
              marginBottom: "40px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "hsl(210 20% 80%)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "hsl(215 12% 48%)")
            }
          >
            <ArrowLeft size={14} />
            Back
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Wordmark size={28} />

            <div style={{ marginTop: "32px", marginBottom: "28px" }}>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "hsl(210 20% 94%)",
                  letterSpacing: "-0.03em",
                  marginBottom: "6px",
                }}
              >
                Sign in
              </h1>
              <p style={{ fontSize: "13px", color: "hsl(215 12% 50%)" }}>
                Repository intelligence for engineering teams
              </p>
            </div>

            {/* OAuth */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              <button
                onClick={handleGoogle}
                disabled={disabled}
                style={{
                  ...S.oauthBtn,
                  opacity: disabled ? 0.55 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.background = "hsl(222 16% 16%)";
                    e.currentTarget.style.borderColor = "hsl(222 14% 26%)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(220 12% 12%)";
                  e.currentTarget.style.borderColor = "hsl(220 12% 18%)";
                }}
              >
                {oauthLoading === "google" ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <button
                onClick={handleGitHub}
                disabled={disabled}
                style={{
                  ...S.oauthBtn,
                  opacity: disabled ? 0.55 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.background = "hsl(222 16% 16%)";
                    e.currentTarget.style.borderColor = "hsl(222 14% 26%)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(220 12% 12%)";
                  e.currentTarget.style.borderColor = "hsl(220 12% 18%)";
                }}
              >
                {oauthLoading === "github" ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <GitHubIcon />
                )}
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "hsl(222 14% 16%)" }} />
              <span style={{ fontSize: "12px", color: "hsl(215 12% 38%)" }}>
                or email
              </span>
              <div style={{ flex: 1, height: "1px", background: "hsl(222 14% 16%)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Email */}
                <div>
                  <label style={S.label}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    disabled={disabled}
                    style={{ ...S.input, opacity: disabled ? 0.6 : 1 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "hsl(38 92% 54% / 0.6)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px hsl(38 92% 54% / 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "hsl(220 12% 16%)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Password</label>
                    <Link
                      href="/forgot-password"
                      style={{
                        fontSize: "12px",
                        color: "hsl(38 92% 58%)",
                        textDecoration: "none",
                      }}
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={disabled}
                      style={{
                        ...S.input,
                        paddingRight: "40px",
                        opacity: disabled ? 0.6 : 1,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "hsl(38 92% 54% / 0.6)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px hsl(38 92% 54% / 0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "hsl(220 12% 16%)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{
                        position: "absolute",
                        right: "11px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "hsl(215 12% 45%)",
                        display: "flex",
                        alignItems: "center",
                        padding: 0,
                      }}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "10px 12px",
                      background: "hsl(0 70% 56% / 0.1)",
                      border: "1px solid hsl(0 70% 56% / 0.25)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "hsl(0 70% 68%)",
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={disabled}
                  style={{
                    ...S.primaryBtn,
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p
              style={{
                marginTop: "20px",
                fontSize: "13px",
                color: "hsl(215 12% 48%)",
                textAlign: "center",
              }}
            >
              No account?{" "}
              <Link
                href="/signup"
                style={{
                  color: "hsl(38 92% 62%)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Create one free
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Right panel — product showcase */}
        <div
          style={{
            ...S.right,
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
          className="hidden md:flex"
        >
          <div style={{ maxWidth: "480px", width: "100%" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "hsl(38 92% 58%)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "12px",
              }}
            >
              Repository Intelligence
            </p>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "hsl(210 20% 94%)",
                letterSpacing: "-0.03em",
                marginBottom: "8px",
                lineHeight: 1.2,
              }}
            >
              Understand any codebase
              <br />
              in seconds.
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "hsl(215 12% 52%)",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              GitMind analyzes commit history, detects risky changes, and
              generates engineering intelligence for any GitHub repository.
            </p>

            {/* Mini commit preview */}
            <div
              style={{
                background: "hsl(220 14% 9%)",
                border: "1px solid hsl(222 14% 16%)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid hsl(222 14% 14%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "hsl(215 12% 48%)",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "hsl(38 92% 54%)",
                    animation: "pulse-glow 2s infinite",
                  }}
                />
                vercel/next.js — 24 commits analyzed
              </div>
              {[
                { sha: "a3f8b12", msg: "feat: add parallel route interception", cat: "feat", risk: "safe" },
                { sha: "c9d2e41", msg: "fix: memory leak in edge runtime handler", cat: "fix", risk: "danger" },
                { sha: "f7a1c88", msg: "perf: optimize RSC payload serialization", cat: "perf", risk: "warn" },
              ].map((c, i) => (
                <div
                  key={c.sha}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    borderBottom: i < 2 ? "1px solid hsl(220 10% 11%)" : "none",
                    borderLeft: `2px solid ${
                      c.risk === "danger"
                        ? "hsl(0 70% 56% / 0.5)"
                        : c.risk === "warn"
                        ? "hsl(38 95% 54% / 0.5)"
                        : "hsl(152 68% 42% / 0.35)"
                    }`,
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background:
                        c.risk === "danger"
                          ? "hsl(0 70% 58%)"
                          : c.risk === "warn"
                          ? "hsl(38 95% 57%)"
                          : "hsl(152 68% 45%)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "10px",
                      color: "hsl(38 92% 58%)",
                      background: "hsl(38 92% 54% / 0.08)",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      flexShrink: 0,
                    }}
                  >
                    {c.sha}
                  </span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "10px",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontWeight: 600,
                      flexShrink: 0,
                      color:
                        c.cat === "feat"
                          ? "hsl(199 89% 58%)"
                          : c.cat === "fix"
                          ? "hsl(0 70% 64%)"
                          : "hsl(38 95% 60%)",
                      background:
                        c.cat === "feat"
                          ? "hsl(199 89% 48% / 0.1)"
                          : c.cat === "fix"
                          ? "hsl(0 70% 56% / 0.1)"
                          : "hsl(38 95% 54% / 0.1)",
                    }}
                  >
                    {c.cat}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "12px",
                      color: "hsl(210 16% 78%)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 hsl(38 92% 54% / 0.4); }
          50% { box-shadow: 0 0 0 6px hsl(188 94% 48% / 0); }
        }
        @media (max-width: 768px) {
          .hidden { display: none !important; }
          
          /* Login panel: full width on mobile, remove fixed 420px */
          .login-left-panel {
            flex: 1 1 100% !important;
            min-width: 0 !important;
            width: 100% !important;
            padding: 24px 20px !important;
            border-right: none !important;
            border-bottom: 1px solid hsl(220 10% 11%) !important;
          }
        }
      `}</style>
    </>
  );
}