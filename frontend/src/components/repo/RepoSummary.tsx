"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Star,
  GitFork,
  ExternalLink,
  Code2,
  Calendar,
  GitBranch,
} from "lucide-react";
import { RepoInfo } from "@/lib/api";
import { HealthScore } from "./HealthScore";
import { formatDateShort } from "@/lib/utils";

interface RepoSummaryProps {
  repo: RepoInfo;
  summary: string;
  commitCount: number;
  riskCounts: { safe: number; warn: number; danger: number };
}

export function RepoSummary({
  repo,
  summary,
  commitCount,
  riskCounts,
}: RepoSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "hsl(222 18% 10%)",
        border: "1px solid hsl(222 14% 15%)",
        borderRadius: "10px",
        marginBottom: "12px",
        overflow: "hidden",
      }}
    >
      {/* Repo header */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid hsl(222 14% 14%)",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <img
            src={repo.avatar}
            alt={repo.owner}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              border: "1px solid hsl(222 14% 18%)",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "5px",
                flexWrap: "wrap",
              }}
            >
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "hsl(210 20% 94%)",
                  letterSpacing: "-0.02em",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "hsl(188 94% 58%)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "hsl(210 20% 94%)")
                }
              >
                {repo.full_name}
                <ExternalLink size={13} style={{ opacity: 0.5 }} />
              </a>
              <span
                style={{
                  padding: "1px 7px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "hsl(188 94% 56%)",
                  background: "hsl(188 94% 48% / 0.1)",
                  border: "1px solid hsl(188 94% 48% / 0.2)",
                }}
              >
                {commitCount} commits
              </span>
            </div>

            {repo.description && (
              <p
                style={{
                  fontSize: "13px",
                  color: "hsl(215 12% 55%)",
                  marginBottom: "10px",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {repo.description}
              </p>
            )}

            {/* Meta row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                fontSize: "12px",
                color: "hsl(215 12% 48%)",
              }}
            >
              {repo.language && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Code2 size={11} />
                  {repo.language}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={11} style={{ color: "hsl(38 95% 58%)" }} />
                {repo.stars.toLocaleString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <GitFork size={11} />
                {repo.forks.toLocaleString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <GitBranch size={11} />
                {repo.default_branch}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={11} />
                {formatDateShort(repo.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Topics */}
        {repo.topics.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "12px",
            }}
          >
            {repo.topics.map((t) => (
              <span
                key={t}
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: "hsl(215 12% 55%)",
                  background: "hsl(222 16% 13%)",
                  border: "1px solid hsl(222 14% 18%)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Health score */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid hsl(222 14% 14%)",
        }}
      >
        <HealthScore
          safe={riskCounts.safe}
          warn={riskCounts.warn}
          danger={riskCounts.danger}
          total={commitCount}
        />
      </div>

      {/* AI summary */}
      {summary && (
        <div style={{ padding: "16px 20px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "hsl(188 94% 56%)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "10px",
            }}
          >
            Intelligence Summary
          </p>
          <div
            style={{
              fontSize: "13px",
              color: "hsl(210 16% 78%)",
              lineHeight: 1.7,
            }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p style={{ marginBottom: "6px" }}>{children}</p>
                ),
                strong: ({ children }) => (
                  <strong style={{ color: "hsl(210 20% 92%)", fontWeight: 600 }}>
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul style={{ paddingLeft: "16px", marginBottom: "6px" }}>
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li style={{ marginBottom: "3px" }}>{children}</li>
                ),
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
}