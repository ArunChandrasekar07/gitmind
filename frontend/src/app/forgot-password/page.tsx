"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";
import { TopLoader } from "@/components/layout/TopLoader";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset`,
        }
      );
      if (err) { setError(err.message); return; }
      setSent(true);
    } catch {
      setError("Failed to send reset email.");
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
          background: "hsl(222 20% 7%)",
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
            maxWidth: "380px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link
            href="/login"
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
            Back to sign in
          </Link>

          <div
            style={{
              background: "hsl(222 18% 10%)",
              border: "1px solid hsl(222 14% 15%)",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)",
            }}
          >
            <Wordmark size={26} />

            {sent ? (
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
                  Check your inbox
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "hsl(215 12% 52%)",
                    marginBottom: "24px",
                    lineHeight: 1.6,
                  }}
                >
                  We sent a password reset link to{" "}
                  <strong style={{ color: "hsl(210 20% 78%)" }}>{email}</strong>
                </p>
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    background: "hsl(188 94% 48%)",
                    borderRadius: "8px",
                    color: "hsl(222 20% 7%)",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Back to sign in
                </Link>
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
                    Reset password
                  </h1>
                  <p style={{ fontSize: "13px", color: "hsl(215 12% 50%)" }}>
                    Enter your email and we'll send you a reset link.
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
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        disabled={isLoading}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "hsl(222 16% 12%)",
                          border: "1px solid hsl(222 14% 18%)",
                          borderRadius: "8px",
                          color: "hsl(210 20% 94%)",
                          fontSize: "13px",
                          outline: "none",
                          fontFamily: "Inter, sans-serif",
                          transition: "border-color 0.15s, box-shadow 0.15s",
                          boxSizing: "border-box",
                          opacity: isLoading ? 0.6 : 1,
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            "hsl(188 94% 48% / 0.6)";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px hsl(188 94% 48% / 0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            "hsl(222 14% 18%)";
                          e.currentTarget.style.boxShadow = "none";
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
                        background: "hsl(188 94% 48%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "hsl(222 20% 7%)",
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
                        "Send reset link"
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