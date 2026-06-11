"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "12px",
          background: "hsl(222 16% 13%)",
          border: "1px solid hsl(222 14% 18%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <Icon
          size={22}
          style={{ color: "hsl(215 12% 52%)" }}
        />
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
          marginBottom: action ? "20px" : "0",
        }}
      >
        {description}
      </p>
      {action}
    </motion.div>
  );
}