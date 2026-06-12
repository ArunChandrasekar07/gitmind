"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, GitBranch, Trash2, ExternalLink,
  AlertTriangle, XCircle, CheckCircle2,
  Clock, Filter,
} from "lucide-react";
import { formatRelativeTime, formatDate } from "@/lib/utils";

interface HistoryItem {
  id: string;
  repo_url: string;
  repo_name: string;
  analyzed_at: string;
  total_commits: number;
  risk_counts: { safe: number; warn: number; danger: number };
  language: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  useEffect(() => {
    const stored = localStorage.getItem("gitmind-history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, []);

  const filtered = history.filter((h) => {
    const matchSearch = h.repo_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchRisk =
      filterRisk === "all" ||
      (filterRisk === "clean" &&
        h.risk_counts.danger === 0 &&
        h.risk_counts.warn === 0) ||
      (filterRisk === "warn" && h.risk_counts.warn > 0) ||
      (filterRisk === "risk" && h.risk_counts.danger > 0);
    return matchSearch && matchRisk;
  });

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("gitmind-history", JSON.stringify(updated));
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem("gitmind-history");
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "22px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "hsl(210 20% 94%)",
              marginBottom: "3px",
            }}
          >
            Analysis History
          </h1>
          <p style={{ fontSize: "13px", color: "hsl(215 12% 48%)" }}>
            {history.length} repositor{history.length !== 1 ? "ies" : "y"}{" "}
            analyzed
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              padding: "7px 13px",
              background: "hsl(220 12% 11%)",
              border: "1px solid hsl(0 70% 56% / 0.2)",
              borderRadius: "7px",
              color: "hsl(0 70% 62%)",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "hsl(0 70% 56% / 0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "hsl(220 12% 11%)")
            }
          >
            Clear all
          </button>
        )}
      </motion.div>

      {/* Toolbar */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "hsl(220 12% 11%)",
              border: "1px solid hsl(220 12% 15%)",
              borderRadius: "7px",
              padding: "7px 11px",
              flex: 1,
              minWidth: "200px",
            }}
          >
            <Search
              size={13}
              style={{ color: "hsl(215 12% 42%)", flexShrink: 0 }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories..."
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "hsl(210 20% 88%)",
                fontFamily: "Inter, sans-serif",
                width: "100%",
              }}
            />
          </div>

          {/* Risk filter */}
          {[
            { key: "all", label: "All" },
            { key: "clean", label: "Clean" },
            { key: "warn", label: "Warnings" },
            { key: "risk", label: "Risks" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterRisk(f.key)}
              style={{
                padding: "7px 12px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: filterRisk === f.key ? 600 : 400,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                background:
                  filterRisk === f.key
                    ? "hsl(38 92% 54% / 0.1)"
                    : "hsl(220 12% 11%)",
                border:
                  filterRisk === f.key
                    ? "1px solid hsl(38 92% 54% / 0.28)"
                    : "1px solid hsl(220 12% 15%)",
                color:
                  filterRisk === f.key
                    ? "hsl(38 92% 62%)"
                    : "hsl(215 12% 50%)",
                transition: "all 0.12s",
              }}
            >
              {f.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* List */}
      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(220 12% 13%)",
            borderRadius: "10px",
            padding: "56px 24px",
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
            <Clock size={22} style={{ color: "hsl(215 12% 42%)" }} />
          </div>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "hsl(210 20% 82%)",
              marginBottom: "6px",
            }}
          >
            No history yet
          </h3>
          <p style={{ fontSize: "13px", color: "hsl(215 12% 48%)" }}>
            Your analyzed repositories will appear here.
          </p>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(220 12% 13%)",
            borderRadius: "10px",
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "13px", color: "hsl(215 12% 48%)" }}>
            No results for "{search || filterRisk}"
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          style={{
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(220 12% 13%)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() =>
                router.push(
                  `/analyze?url=${encodeURIComponent(item.repo_url)}`
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderBottom:
                  i < filtered.length - 1
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
              <div
                style={{
                  width: "34px",
                  height: "34px",
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
                  size={15}
                  style={{ color: "hsl(215 12% 48%)" }}
                />
              </div>

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
                    color: "hsl(215 12% 42%)",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>{item.total_commits} commits</span>
                  {item.language && <span>{item.language}</span>}
                  <span>{formatDate(item.analyzed_at)}</span>
                </div>
              </div>

              {/* Risk */}
              <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                {item.risk_counts.danger > 0 && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "hsl(0 70% 64%)",
                      background: "hsl(0 70% 56% / 0.1)",
                      border: "1px solid hsl(0 70% 56% / 0.22)",
                    }}
                  >
                    <XCircle size={9} />
                    {item.risk_counts.danger}
                  </span>
                )}
                {item.risk_counts.warn > 0 && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "hsl(38 95% 60%)",
                      background: "hsl(38 95% 54% / 0.1)",
                      border: "1px solid hsl(38 95% 54% / 0.22)",
                    }}
                  >
                    <AlertTriangle size={9} />
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
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "hsl(152 68% 48%)",
                        background: "hsl(152 68% 42% / 0.1)",
                        border: "1px solid hsl(152 68% 42% / 0.22)",
                      }}
                    >
                      <CheckCircle2 size={9} />
                      Clean
                    </span>
                  )}
              </div>

              {/* Actions */}
              <div
                style={{ display: "flex", gap: "6px", flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/analyze?url=${encodeURIComponent(item.repo_url)}`
                    );
                  }}
                  style={{
                    padding: "5px 7px",
                    background: "hsl(220 12% 12%)",
                    border: "1px solid hsl(220 12% 16%)",
                    borderRadius: "6px",
                    color: "hsl(215 12% 45%)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.12s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "hsl(210 20% 78%)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "hsl(215 12% 45%)")
                  }
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  onClick={(e) => deleteItem(item.id, e)}
                  style={{
                    padding: "5px 7px",
                    background: "hsl(220 12% 12%)",
                    border: "1px solid hsl(220 12% 16%)",
                    borderRadius: "6px",
                    color: "hsl(215 12% 42%)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.12s, border-color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "hsl(0 70% 62%)";
                    e.currentTarget.style.borderColor =
                      "hsl(0 70% 56% / 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "hsl(215 12% 42%)";
                    e.currentTarget.style.borderColor =
                      "hsl(220 12% 16%)";
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}