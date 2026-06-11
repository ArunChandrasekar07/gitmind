"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export type RiskLevel = "safe" | "warn" | "danger" | null;

export function getRiskFromAnalysis(text: string): RiskLevel {
  if (!text) return null;
  if (text.includes("🔴")) return "danger";
  if (text.includes("🟡")) return "warn";
  if (text.includes("🟢")) return "safe";
  return "safe";
}

interface RiskBadgeProps {
  risk: RiskLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const RISK_CONFIG = {
  safe: {
    label: "Safe",
    icon: CheckCircle2,
    color: "hsl(152 68% 48%)",
    bg: "hsl(152 68% 42% / 0.1)",
    border: "hsl(152 68% 42% / 0.3)",
  },
  warn: {
    label: "Warning",
    icon: AlertTriangle,
    color: "hsl(38 95% 60%)",
    bg: "hsl(38 95% 54% / 0.1)",
    border: "hsl(38 95% 54% / 0.3)",
  },
  danger: {
    label: "Risk",
    icon: XCircle,
    color: "hsl(0 70% 64%)",
    bg: "hsl(0 70% 56% / 0.1)",
    border: "hsl(0 70% 56% / 0.3)",
  },
};

export function RiskBadge({
  risk,
  showLabel = true,
  size = "sm",
}: RiskBadgeProps) {
  if (!risk) return null;
  const config = RISK_CONFIG[risk];
  const Icon = config.icon;
  const iconSize = size === "sm" ? 11 : 13;
  const fontSize = size === "sm" ? "11px" : "12px";
  const padding = size === "sm" ? "2px 7px" : "3px 10px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding,
        borderRadius: "5px",
        fontSize,
        fontWeight: 500,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        lineHeight: 1.5,
      }}
    >
      <Icon size={iconSize} />
      {showLabel && config.label}
    </span>
  );
}

export function RiskDot({ risk }: { risk: RiskLevel }) {
  if (!risk) return null;
  const colors = {
    safe: "hsl(152 68% 45%)",
    warn: "hsl(38 95% 57%)",
    danger: "hsl(0 70% 58%)",
  };
  return (
    <div
      style={{
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: colors[risk],
        flexShrink: 0,
      }}
    />
  );
}