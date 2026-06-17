"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GitBranch, Clock, AlertTriangle, CheckCircle2,
  XCircle, ExternalLink, Plus, Brain, ArrowRight,
  BarChart2, TrendingUp, Zap,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { formatRelativeTime } from "@/lib/utils";
import { getAnalysisHistory } from "@/lib/db";

interface HistoryItem {
  id: string;
  repo_url: string;
  repo_name: string;
  analyzed_at: string;
  total_commits: number;
  risk_counts: { safe: number; warn: number; danger: number };
  language: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  border,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{
        background: "hsl(220 14% 9%)",
        border: "1px solid hsl(220 12% 13%)",
        borderRadius: "10px",
        padding: "18px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: bg,
          border: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "hsl(210 20% 94%)",
          marginBottom: "3px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "hsl(215 12% 48%)" }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const data = await getAnalysisHistory(user.id, 20);
      setHistory(
        data.map((h) => ({
          id: h.id,
          repo_url: h.repo_url,
          repo_name: h.repo_name,
          analyzed_at: h.analyzed_at,
          total_commits: h.total_commits,
          risk_counts: {
            safe: h.risk_safe,
            warn: h.risk_warn,
            danger: h.risk_danger,
          },
          language: h.language || "",
        }))
      );
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const greeting = () => {
    const h = new Date().getHours();
    const name = user?.full_name?.split(" ")[0] || "there";
    if (h < 12) return `Good morning, ${name}`;
    if (h < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const totalCommits = history.reduce((a, h) => a + h.total_commits, 0);
  const totalRisks = history.reduce(
    (a, h) => a + h.risk_counts.danger + h.risk_counts.warn,
    0
  );
  if (loading) return null;
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "28px" }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "hsl(210 20% 94%)",
            marginBottom: "4px",
          }}
        >
          {greeting()}
        </h1>
        <p style={{ fontSize: "13px", color: "hsl(215 12% 48%)" }}>
          {history.length > 0
            ? `You've analyzed ${history.length} repositor${history.length !== 1 ? "ies" : "y"} · ${totalCommits} commits reviewed`
            : "Start by analyzing a GitHub repository below"}
        </p>
      </motion.div>

      {/* Quick action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ marginBottom: "24px" }}
      >
        <div
          onClick={() => router.push("/analyze")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(220 12% 13%)",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
            gap: "16px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "hsl(38 92% 54% / 0.3)";
            (e.currentTarget as HTMLElement).style.background =
              "hsl(222 18% 11%)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "hsl(220 12% 13%)";
            (e.currentTarget as HTMLElement).style.background =
              "hsl(220 14% 9%)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "hsl(38 92% 54% / 0.08)",
                border: "1px solid hsl(38 92% 54% / 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Brain size={18} style={{ color: "hsl(38 92% 58%)" }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "hsl(210 20% 90%)",
                  marginBottom: "2px",
                }}
              >
                Analyze a repository
              </div>
              <div style={{ fontSize: "12px", color: "hsl(215 12% 48%)" }}>
                Paste any public GitHub URL for instant AI intelligence
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 13px",
              background: "hsl(38 92% 54%)",
              borderRadius: "7px",
              color: "hsl(220 16% 6%)",
              fontSize: "12px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <Plus size={13} />
            New
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {history.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <StatCard
            icon={GitBranch}
            label="Repos analyzed"
            value={history.length}
            color="hsl(199 89% 58%)"
            bg="hsl(199 89% 48% / 0.08)"
            border="hsl(199 89% 48% / 0.2)"
            delay={0.08}
          />
          <StatCard
            icon={BarChart2}
            label="Commits reviewed"
            value={totalCommits}
            color="hsl(258 80% 70%)"
            bg="hsl(258 80% 65% / 0.08)"
            border="hsl(258 80% 65% / 0.2)"
            delay={0.12}
          />
          <StatCard
            icon={AlertTriangle}
            label="Issues flagged"
            value={totalRisks}
            color="hsl(38 95% 58%)"
            bg="hsl(38 95% 54% / 0.08)"
            border="hsl(38 95% 54% / 0.2)"
            delay={0.16}
          />
        </div>
      )}

      {/* Recent analyses */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "hsl(210 20% 80%)",
            }}
          >
            Recent analyses
          </h2>
          {history.length > 5 && (
            <button
              onClick={() => router.push("/dashboard/history")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                color: "hsl(38 92% 58%)",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                padding: 0,
              }}
            >
              View all
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div
            style={{
              background: "hsl(220 14% 9%)",
              border: "1px solid hsl(220 12% 13%)",
              borderRadius: "10px",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "hsl(220 12% 12%)",
                border: "1px solid hsl(220 12% 16%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <GitBranch size={22} style={{ color: "hsl(215 12% 42%)" }} />
            </div>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "hsl(210 20% 82%)",
                marginBottom: "6px",
                letterSpacing: "-0.02em",
              }}
            >
              No analyses yet
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "hsl(215 12% 48%)",
                marginBottom: "18px",
              }}
            >
              Analyze your first repository to see it here.
            </p>
            <button
              onClick={() => router.push("/analyze")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "hsl(38 92% 54%)",
                border: "none",
                borderRadius: "7px",
                color: "hsl(220 16% 6%)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Plus size={13} />
              Analyze a repository
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "hsl(220 14% 9%)",
              border: "1px solid hsl(220 12% 13%)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {history.slice(0, 7).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 + i * 0.04 }}
                onClick={() =>
                  router.push(
                    `/analyze?url=${encodeURIComponent(item.repo_url)}`
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 16px",
                  borderBottom:
                    i < Math.min(history.length, 7) - 1
                      ? "1px solid hsl(220 10% 11%)"
                      : "none",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "hsl(222 18% 12%)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "transparent")
                }
              >
                {/* Icon */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "hsl(220 12% 13%)",
                    border: "1px solid hsl(220 12% 16%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <GitBranch
                    size={14}
                    style={{ color: "hsl(215 12% 48%)" }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "hsl(210 20% 88%)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "2px",
                    }}
                  >
                    {item.repo_name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "hsl(215 12% 44%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{item.total_commits} commits</span>
                    {item.language && (
                      <>
                        <span
                          style={{
                            width: "3px",
                            height: "3px",
                            borderRadius: "50%",
                            background: "hsl(215 12% 40%)",
                            flexShrink: 0,
                          }}
                        />
                        <span>{item.language}</span>
                      </>
                    )}
                    <span
                      style={{
                        width: "3px",
                        height: "3px",
                        borderRadius: "50%",
                        background: "hsl(215 12% 40%)",
                        flexShrink: 0,
                      }}
                    />
                    <span>{formatRelativeTime(item.analyzed_at)}</span>
                  </div>
                </div>

                {/* Risk pills */}
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    flexShrink: 0,
                    alignItems: "center",
                  }}
                >
                  {item.risk_counts.danger > 0 && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "hsl(0 70% 64%)",
                        background: "hsl(0 70% 56% / 0.1)",
                        border: "1px solid hsl(0 70% 56% / 0.25)",
                      }}
                    >
                      <XCircle size={10} />
                      {item.risk_counts.danger}
                    </span>
                  )}
                  {item.risk_counts.warn > 0 && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "hsl(38 95% 60%)",
                        background: "hsl(38 95% 54% / 0.1)",
                        border: "1px solid hsl(38 95% 54% / 0.25)",
                      }}
                    >
                      <AlertTriangle size={10} />
                      {item.risk_counts.warn}
                    </span>
                  )}
                  {item.risk_counts.danger === 0 &&
                    item.risk_counts.warn === 0 && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "hsl(152 68% 48%)",
                          background: "hsl(152 68% 42% / 0.1)",
                          border: "1px solid hsl(152 68% 42% / 0.25)",
                        }}
                      >
                        <CheckCircle2 size={10} />
                        Safe
                      </span>
                    )}
                  <ExternalLink
                    size={12}
                    style={{ color: "hsl(215 12% 38%)", marginLeft: "2px" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}