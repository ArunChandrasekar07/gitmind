"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Minus,
  FileCode2,
  Loader2,
  Brain,
} from "lucide-react";
import { CommitInfo, analyzeAPI } from "@/lib/api";
import { CategoryBadge, getCategoryFromText, getCategoryFromMessage } from "./CategoryBadge";
import { RiskBadge, RiskDot, getRiskFromAnalysis } from "./RiskBadge";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface CommitRowProps {
  commit: CommitInfo;
  analysis?: string;
  owner: string;
  repo: string;
  index: number;
}

export function CommitRow({
  commit,
  analysis: initAnalysis,
  owner,
  repo,
  index,
}: CommitRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState(initAnalysis || "");
  const [streaming, setStreaming] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleToggle = async () => {
    if (analysis) { setExpanded(!expanded); return; }
    if (isAnalyzing) { setExpanded(!expanded); return; }
    setExpanded(true);
    setIsAnalyzing(true);
    let buf = "";
    try {
      await analyzeAPI.streamCommit(
        owner, repo, commit.sha,
        (t) => { buf += t; setStreaming(buf); },
        () => { setAnalysis(buf); setIsAnalyzing(false); }
      );
    } catch {
      toast.error("Analysis failed");
      setIsAnalyzing(false);
    }
  };

  const display = analysis || streaming;
  const risk = getRiskFromAnalysis(display);
  const category = display
    ? getCategoryFromText(display)
    : getCategoryFromMessage(commit.message);
  const firstLine = commit.message.split("\n")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.35), duration: 0.25 }}
      style={{
        borderBottom: "1px solid hsl(220 10% 11%)",
        borderLeft: `2px solid ${
          risk === "danger"
            ? "hsl(0 70% 56% / 0.5)"
            : risk === "warn"
            ? "hsl(38 95% 54% / 0.5)"
            : risk === "safe"
            ? "hsl(152 68% 42% / 0.35)"
            : "transparent"
        }`,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.background =
          "hsl(222 18% 11%)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.background = "transparent")
      }
    >
      {/* Main row */}
      <div
        onClick={handleToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Risk dot */}
        <RiskDot risk={risk} />

        {/* Category */}
        <CategoryBadge category={category} size="sm" />

        {/* SHA */}
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "11px",
            color: "hsl(38 92% 58%)",
            background: "hsl(38 92% 54% / 0.08)",
            padding: "2px 6px",
            borderRadius: "4px",
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}
        >
          {commit.short_sha}
        </span>

        {/* Message */}
        <span
          style={{
            flex: 1,
            fontSize: "13px",
            color: "hsl(210 20% 90%)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {firstLine}
        </span>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {/* Risk badge (if analyzed) */}
          {risk && <RiskBadge risk={risk} showLabel={false} />}

          {commit.additions !== undefined && (
            <>
              <span
                style={{
                  fontSize: "11px",
                  color: "hsl(152 68% 48%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                <Plus size={9} />
                {commit.additions}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "hsl(0 70% 60%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                <Minus size={9} />
                {commit.deletions}
              </span>
            </>
          )}

          {commit.avatar ? (
            <img
              src={commit.avatar}
              alt={commit.author}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: "1px solid hsl(220 12% 18%)",
              }}
            />
          ) : (
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "hsl(222 16% 18%)",
                border: "1px solid hsl(222 14% 22%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 600,
                color: "hsl(215 12% 58%)",
              }}
            >
              {commit.author[0]?.toUpperCase()}
            </div>
          )}

          <span
            style={{
              fontSize: "11px",
              color: "hsl(215 12% 45%)",
              whiteSpace: "nowrap",
            }}
          >
            {formatRelativeTime(commit.date)}
          </span>

          <a
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: "hsl(215 12% 42%)",
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "hsl(210 20% 80%)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "hsl(215 12% 42%)")
            }
          >
            <ExternalLink size={12} />
          </a>

          {isAnalyzing ? (
            <Loader2
              size={13}
              style={{
                color: "hsl(38 92% 58%)",
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <div style={{ color: "hsl(215 12% 40%)" }}>
              {expanded ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                borderTop: "1px solid hsl(220 10% 11%)",
                padding: "16px",
                background: "hsl(222 20% 8%)",
              }}
            >
              {/* Files changed */}
              {commit.files && commit.files.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "hsl(215 12% 48%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 500,
                    }}
                  >
                    <FileCode2 size={11} />
                    {commit.files.length} file
                    {commit.files.length > 1 ? "s" : ""} changed
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {commit.files.map((f) => (
                      <span
                        key={f.filename}
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontFamily: "JetBrains Mono, monospace",
                          color:
                            f.status === "added"
                              ? "hsl(152 68% 50%)"
                              : f.status === "removed"
                              ? "hsl(0 70% 60%)"
                              : "hsl(215 12% 58%)",
                          background:
                            f.status === "added"
                              ? "hsl(152 68% 42% / 0.1)"
                              : f.status === "removed"
                              ? "hsl(0 70% 56% / 0.1)"
                              : "hsl(220 12% 13%)",
                          border: `1px solid ${
                            f.status === "added"
                              ? "hsl(152 68% 42% / 0.25)"
                              : f.status === "removed"
                              ? "hsl(0 70% 56% / 0.25)"
                              : "hsl(220 12% 18%)"
                          }`,
                        }}
                      >
                        {f.filename.split("/").pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div
                style={{
                  background: "hsl(222 18% 11%)",
                  border: "1px solid hsl(220 12% 16%)",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "5px",
                      background: "hsl(38 92% 54% / 0.12)",
                      border: "1px solid hsl(38 92% 54% / 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Brain size={11} style={{ color: "hsl(188 94% 55%)" }} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "hsl(38 92% 66%)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    GitMind Intelligence
                  </span>
                  {isAnalyzing && (
                    <div style={{ display: "flex", gap: "3px", marginLeft: "4px" }}>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: "hsl(38 92% 58%)",
                          }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.18,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {!display && isAnalyzing ? (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "hsl(215 12% 50%)",
                      fontStyle: "italic",
                    }}
                  >
                    Analyzing commit diff...
                  </p>
                ) : (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "hsl(210 16% 82%)",
                      lineHeight: 1.7,
                    }}
                    className="prose-gitmind"
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p style={{ marginBottom: "8px"}}>
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong style={{ color: "hsl(210 20% 94%)", fontWeight: 600 }}>
                            {children}
                          </strong>
                        ),
                        code: ({ children }) => (
                          <code
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "11px",
                              background: "hsl(222 20% 14%)",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              color: "hsl(188 94% 58%)",
                            }}
                          >
                            {children}
                          </code>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ paddingLeft: "16px", marginBottom: "8px" }}>
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li style={{ marginBottom: "3px" }}>{children}</li>
                        ),
                      }}
                    >
                      {display}
                    </ReactMarkdown>
                    {isAnalyzing && (
                      <span
                        className="blink"
                        style={{
                          display: "inline-block",
                          width: "2px",
                          height: "14px",
                          background: "hsl(38 92% 58%)",
                          marginLeft: "2px",
                          borderRadius: "1px",
                          verticalAlign: "text-bottom",
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}