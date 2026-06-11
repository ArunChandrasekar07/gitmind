"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "hsl(0 70% 56% / 0.1)",
          border: "1px solid hsl(0 70% 56% / 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <AlertTriangle size={20} style={{ color: "hsl(0 70% 64%)" }} />
      </div>
      <h3
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "hsl(210 20% 88%)",
          marginBottom: "6px",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "hsl(215 12% 52%)",
          maxWidth: "320px",
          lineHeight: 1.6,
          marginBottom: onRetry ? "20px" : "0",
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "hsl(222 16% 13%)",
            border: "1px solid hsl(222 14% 22%)",
            borderRadius: "8px",
            color: "hsl(210 20% 88%)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.15s",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "hsl(222 16% 17%)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "hsl(222 16% 13%)")
          }
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </motion.div>
  );
}