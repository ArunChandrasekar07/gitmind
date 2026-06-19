"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";
import { TopLoader } from "@/components/layout/TopLoader";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Supabase sends the recovery token in the URL hash (#access_token=...&type=recovery).
  // The supabase-js client automatically parses this and creates a session on load —
  // we just need to wait for it and confirm it's actually a recovery session.
  useEffect(() => {
    const checkSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError(
          "This reset link is invalid or has expired. Please request a new one."
        );
        setSessionReady(false);
      } else {
        setSessionReady(true);
      }
      setCheckingSession(false);
    };

    checkSession();

    // Also listen for the PASSWORD_RECOVERY event in case the session
    // takes a moment to resolve from the URL hash on first paint.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setSessionReady(true);
          setError("");
          setCheckingSession(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            width: "100%",
            maxWidth: "380px",
            position: "relative",
            zIndex: 1,
          }}
        >
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

            {checkingSession ? (
              <div
                style={{
                  marginTop: "40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  paddingBottom: "20px",
                }}
              >
                <Loader2
                  size={20}
                  style={{
                    color: "hsl(38 92% 58%)",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p style={{ fontSize: "13px", color: "hsl(215 12% 52%)" }}>
                  Verifying reset link...
                </p>
              </div>
            ) : success ? (
              <div style={{ marginTop: "28px", textAlign: "center" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background: "hsl(152 68% 42% / 0.1)",
                    border: "1px solid hsl(152 68% 42% / 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <CheckCircle2
                    size={22}
                    style={{ color: "hsl(152 68% 48%)" }}
                  />
                </div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "hsl(210 20% 94%)",
                    letterSpacing: "-0.025em",
                    marginBottom: "8px",
                  }}
                >
                  Password updated
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "hsl(215 12% 52%)",
                    lineHeight: 1.6,
                  }}
                >
                  Redirecting you to sign in...
                </p>
              </div>
            ) : !sessionReady ? (
              <div style={{ marginTop: "28px", textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: "hsl(0 70% 68%)",
                    lineHeight: 1.6,
                    marginBottom: "20px",
                  }}
                >
                  {error}
                </p>
                <a
                  href="/forgot-password"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    background: "hsl(38 92% 54%)",
                    borderRadius: "8px",
                    color: "hsl(220 16% 6%)",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Request new link
                </a>
              </div>
            ) : (
              <>
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
                    Set a new password
                  </h1>
                  <p style={{ fontSize: "13px", color: "hsl(215 12% 50%)" }}>
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "hsl(215 12% 60%)",
                          marginBottom: "6px",
                        }}
                      >
                        New password
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={isLoading}
                          style={{
                            width: "100%",
                            padding: "10px 40px 10px 12px",
                            background: "hsl(220 12% 11%)",
                            border: "1px solid hsl(220 12% 16%)",
                            borderRadius: "8px",
                            color: "hsl(210 20% 94%)",
                            fontSize: "13px",
                            outline: "none",
                            fontFamily: "Inter, sans-serif",
                            boxSizing: "border-box",
                            opacity: isLoading ? 0.6 : 1,
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
                            padding: 0,
                          }}
                        >
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "hsl(215 12% 60%)",
                          marginBottom: "6px",
                        }}
                      >
                        Confirm password
                      </label>
                      <input
                        type={showPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "hsl(220 12% 11%)",
                          border: "1px solid hsl(220 12% 16%)",
                          borderRadius: "8px",
                          color: "hsl(210 20% 94%)",
                          fontSize: "13px",
                          outline: "none",
                          fontFamily: "Inter, sans-serif",
                          boxSizing: "border-box",
                          opacity: isLoading ? 0.6 : 1,
                        }}
                      />
                    </div>

                    {error && (
                      <div
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
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{
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
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.65 : 1,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {isLoading ? (
                        <Loader2
                          size={14}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        <>
                          Update password
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}