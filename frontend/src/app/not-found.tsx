"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "hsl(220 16% 6%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
      }}
    >
      <div
        className="bg-dots"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          maxWidth: "400px",
        }}
      >
        <Wordmark size={30} className="justify-center mb-10" />

        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "hsl(220 12% 12%)",
            border: "1px solid hsl(220 12% 18%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <GitBranch size={24} style={{ color: "hsl(215 12% 48%)" }} />
        </div>

        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "hsl(220 12% 16%)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            marginBottom: "16px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "hsl(210 20% 88%)",
            letterSpacing: "-0.025em",
            marginBottom: "8px",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "hsl(215 12% 50%)",
            lineHeight: 1.6,
            marginBottom: "28px",
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "hsl(220 12% 12%)",
              border: "1px solid hsl(220 12% 18%)",
              borderRadius: "8px",
              color: "hsl(210 20% 88%)",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "hsl(220 12% 15%)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "hsl(220 12% 12%)")
            }
          >
            <ArrowLeft size={13} />
            Home
          </Link>
          <Link
            href="/analyze"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "hsl(38 92% 54%)",
              border: "none",
              borderRadius: "8px",
              color: "hsl(220 16% 6%)",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Analyze a repo
          </Link>
        </div>
      </motion.div>
    </div>
  );
}