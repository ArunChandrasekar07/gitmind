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

const S = {
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

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (err) { setError(err.message); return; }
      if (data.session) {
        const u = data.session.user;
        setUser(
          {
            id: u.id,
            email: u.email ?? "",
            full_name: name || null,
            avatar_url: null,
          },
          data.session.access_token
        );
        router.push("/dashboard");
      } else {
        setError("Check your email to confirm your account.");
      }
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading("google");
    const { error } = await signInWithGoogle();
    if (error) { setError("Google sign-in failed."); setOauthLoading(null); }
  };

  const handleGitHub = async () => {
    setOauthLoading("github");
    const { error } = await signInWithGitHub();
    if (error) { setError("GitHub sign-in failed."); setOauthLoading(null); }
  };

  const disabled = isLoading || !!oauthLoading;

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "hsl(38 92% 54% / 0.6)";
    e.currentTarget.style.boxShadow = "0 0 0 3px hsl(38 92% 54% / 0.1)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "hsl(220 12% 16%)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <>
      <TopLoader />
      <div
        style={{
          minHeight: "100vh",
          background: "hsl(220 16% 6%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          position: "relative",
        }}
      >
        <div
          className="bg-dots"
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            width: "100%",
            maxWidth: "400px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "hsl(215 12% 48%)",
              textDecoration: "none",
              marginBottom: "28px",
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

          <div
            style={{
              background: "hsl(220 14% 9%)",
              border: "1px solid hsl(220 12% 13%)",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)",
            }}
          >
            <Wordmark size={26} />

            <div style={{ margin: "24px 0 26px" }}>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "hsl(210 20% 94%)",
                  letterSpacing: "-0.03em",
                  marginBottom: "5px",
                }}
              >
                Create account
              </h1>
              <p style={{ fontSize: "13px", color: "hsl(215 12% 50%)" }}>
                Start analyzing repositories for free
              </p>
            </div>

            {/* OAuth */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
              {[
                { key: "google", label: "Continue with Google", icon: <GoogleIcon />, fn: handleGoogle },
                { key: "github", label: "Continue with GitHub", icon: <GitHubIcon />, fn: handleGitHub },
              ].map((o) => (
                <button
                  key={o.key}
                  onClick={o.fn}
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
                  {oauthLoading === o.key ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    o.icon
                  )}
                  {o.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ flex: 1, height: "1px", background: "hsl(222 14% 16%)" }} />
              <span style={{ fontSize: "12px", color: "hsl(215 12% 38%)" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "hsl(222 14% 16%)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={S.label}>Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arun C"
                    disabled={disabled}
                    style={{ ...S.input, opacity: disabled ? 0.6 : 1 }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

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
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                <div>
                  <label style={S.label}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      disabled={disabled}
                      style={{
                        ...S.input,
                        paddingRight: "40px",
                        opacity: disabled ? 0.6 : 1,
                      }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
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

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
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
                      Create account
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <p
                  style={{
                    fontSize: "11px",
                    color: "hsl(215 12% 40%)",
                    textAlign: "center",
                  }}
                >
                  By creating an account you agree to our terms of service.
                </p>
              </div>
            </form>

            <p
              style={{
                marginTop: "18px",
                fontSize: "13px",
                color: "hsl(215 12% 48%)",
                textAlign: "center",
              }}
            >
              Have an account?{" "}
              <Link
                href="/login"
                style={{ color: "hsl(38 92% 62%)", fontWeight: 500, textDecoration: "none" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}