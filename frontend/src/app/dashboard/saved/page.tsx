"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bookmark, Plus, ExternalLink, Trash2,
  GitBranch, Search,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { getSavedRepositories, deleteSavedRepository } from "@/lib/db";

interface SavedRepo {
  id: string;
  repo_url: string;
  repo_name: string;
  description: string;
  language: string;
  stars: number;
  saved_at: string;
}

export default function SavedPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [saved, setSaved] = useState<SavedRepo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (user?.id) {
        const data = await getSavedRepositories(user.id);
        setSaved(
          data.map((s) => ({
            id: s.id,
            repo_url: s.repo_url,
            repo_name: s.repo_name,
            description: s.description || "",
            language: s.language || "",
            stars: s.stars,
            saved_at: s.saved_at,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const filtered = saved.filter((s) =>
    s.repo_name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteItem = async (id: string) => {
    if (!user?.id) return;
    await deleteSavedRepository(user.id, id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
  };
  if (loading) return null;
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "22px" }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "hsl(210 20% 94%)",
            marginBottom: "3px",
          }}
        >
          Saved Repositories
        </h1>
        <p style={{ fontSize: "13px", color: "hsl(215 12% 48%)" }}>
          {saved.length} saved repositor{saved.length !== 1 ? "ies" : "y"}
        </p>
      </motion.div>

      {/* Search */}
      {saved.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          style={{ marginBottom: "14px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "hsl(220 12% 11%)",
              border: "1px solid hsl(220 12% 15%)",
              borderRadius: "7px",
              padding: "8px 12px",
              maxWidth: "360px",
            }}
          >
            <Search
              size={13}
              style={{ color: "hsl(215 12% 42%)", flexShrink: 0 }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved repos..."
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
        </motion.div>
      )}

      {/* Content */}
      {saved.length === 0 ? (
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
            <Bookmark size={22} style={{ color: "hsl(215 12% 42%)" }} />
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
            No saved repositories
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "hsl(215 12% 48%)",
              marginBottom: "18px",
              maxWidth: "280px",
              margin: "0 auto 18px",
              lineHeight: 1.6,
            }}
          >
            Analyze a repository and save it here for quick access.
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
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.06 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: "hsl(220 14% 9%)",
                border: "1px solid hsl(220 12% 13%)",
                borderRadius: "10px",
                padding: "16px",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "hsl(222 14% 22%)";
                (e.currentTarget as HTMLElement).style.background =
                  "hsl(222 18% 11%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "hsl(220 12% 13%)";
                (e.currentTarget as HTMLElement).style.background =
                  "hsl(220 14% 9%)";
              }}
              onClick={() =>
                router.push(
                  `/analyze?url=${encodeURIComponent(item.repo_url)}`
                )
              }
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "hsl(220 12% 13%)",
                    border: "1px solid hsl(222 14% 19%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GitBranch
                    size={15}
                    style={{ color: "hsl(215 12% 48%)" }}
                  />
                </div>
                <div
                  style={{ display: "flex", gap: "5px" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      router.push(
                        `/analyze?url=${encodeURIComponent(item.repo_url)}`
                      )
                    }
                    style={{
                      padding: "4px 6px",
                      background: "none",
                      border: "1px solid hsl(220 12% 16%)",
                      borderRadius: "5px",
                      color: "hsl(215 12% 42%)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "hsl(210 20% 78%)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "hsl(215 12% 42%)")
                    }
                  >
                    <ExternalLink size={11} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{
                      padding: "4px 6px",
                      background: "none",
                      border: "1px solid hsl(220 12% 16%)",
                      borderRadius: "5px",
                      color: "hsl(215 12% 40%)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "hsl(0 70% 60%)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "hsl(215 12% 40%)")
                    }
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "hsl(210 20% 90%)",
                  marginBottom: "4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.01em",
                }}
              >
                {item.repo_name}
              </div>

              {item.description && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "hsl(215 12% 48%)",
                    marginBottom: "10px",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}
                >
                  {item.description}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  color: "hsl(215 12% 40%)",
                }}
              >
                {item.language && <span>{item.language}</span>}
                <span>·</span>
                <span>Saved {formatRelativeTime(item.saved_at)}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}