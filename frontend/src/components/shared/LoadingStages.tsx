"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface Stage {
  id: string;
  label: string;
}

interface LoadingStagesProps {
  stages: Stage[];
  currentStage: number;
}

export function LoadingStages({ stages, currentStage }: LoadingStagesProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {stages.map((stage, i) => {
        const isDone = i < currentStage;
        const isActive = i === currentStage;
        const isPending = i > currentStage;

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              opacity: isPending ? 0.3 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDone
                  ? "hsl(38 92% 54% / 0.15)"
                  : isActive
                  ? "hsl(38 92% 54% / 0.1)"
                  : "hsl(220 12% 13%)",
                border: isDone
                  ? "1px solid hsl(38 92% 54% / 0.4)"
                  : isActive
                  ? "1px solid hsl(38 92% 54% / 0.3)"
                  : "1px solid hsl(220 12% 18%)",
              }}
            >
              {isDone ? (
                <Check size={11} style={{ color: "hsl(38 92% 58%)" }} />
              ) : isActive ? (
                <Loader2
                  size={11}
                  style={{
                    color: "hsl(38 92% 58%)",
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "hsl(215 12% 40%)",
                  }}
                />
              )}
            </div>

            <span
              style={{
                fontSize: "13px",
                color: isDone
                  ? "hsl(215 12% 58%)"
                  : isActive
                  ? "hsl(38 92% 66%)"
                  : "hsl(215 12% 45%)",
                fontWeight: isActive ? 500 : 400,
                transition: "color 0.2s",
              }}
            >
              {stage.label}
            </span>
          </motion.div>
        );
      })}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}