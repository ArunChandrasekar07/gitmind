"use client";

import { motion } from "framer-motion";

interface HealthScoreProps {
  safe: number;
  warn: number;
  danger: number;
  total: number;
}

export function HealthScore({ safe, warn, danger, total }: HealthScoreProps) {
  if (total === 0) return null;

  const score = Math.round(
    ((safe + warn * 0.5) / total) * 100
  );

  const color =
    score >= 80
      ? "hsl(152 68% 45%)"
      : score >= 60
      ? "hsl(38 95% 57%)"
      : "hsl(0 70% 58%)";

  const label =
    score >= 80 ? "Healthy" : score >= 60 ? "Moderate" : "Needs Attention";

  const safeWidth = (safe / total) * 100;
  const warnWidth = (warn / total) * 100;
  const dangerWidth = (danger / total) * 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Score row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "hsl(215 12% 50%)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Repository Health
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color,
              letterSpacing: "-0.03em",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {score}
          </span>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color }}>
              {label}
            </div>
            <div style={{ fontSize: "10px", color: "hsl(215 12% 42%)" }}>
              /100
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          borderRadius: "2px",
          background: "hsl(222 16% 16%)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeWidth}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: "hsl(152 68% 42%)", height: "100%" }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${warnWidth}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          style={{ background: "hsl(38 95% 54%)", height: "100%" }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dangerWidth}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          style={{ background: "hsl(0 70% 56%)", height: "100%" }}
        />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "14px" }}>
        {[
          { label: "Safe", count: safe, color: "hsl(152 68% 48%)" },
          { label: "Warning", count: warn, color: "hsl(38 95% 60%)" },
          { label: "Risk", count: danger, color: "hsl(0 70% 62%)" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "11px", color: "hsl(215 12% 50%)" }}>
              {item.count} {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}