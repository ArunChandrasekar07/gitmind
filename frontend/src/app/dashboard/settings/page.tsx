"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, Trash2, LogOut, Bell, Moon,
  Sun, Monitor, CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearAnalysisHistory } from "@/lib/db";

function SectionHeader({
  icon: Icon,
  title,
  desc,
  color,
  bg,
  border,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 20px",
        borderBottom: "1px solid hsl(220 10% 11%)",
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
          flexShrink: 0,
        }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "hsl(210 20% 88%)",
            marginBottom: "1px",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "12px", color: "hsl(215 12% 46%)" }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  action,
}: {
  label: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        gap: "16px",
        borderBottom: "1px solid hsl(222 14% 12%)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "hsl(210 20% 86%)",
            marginBottom: "2px",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "12px", color: "hsl(215 12% 46%)" }}>
          {description}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user} = useAuthStore();
  const { logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const { getUserSettings } = await import("@/lib/db");
      const s = await getUserSettings(user.id);
      setNotifications(s.notifications);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleToggleNotifications = async (val: boolean) => {
    setNotifications(val);
    const { setNotificationsEnabled } = await import("@/lib/store");
    setNotificationsEnabled(val);
    if (!user?.id) return;
    const { saveUserSettings } = await import("@/lib/db");
    await saveUserSettings(user.id, { notifications: val });
  };

  const clearHistory = async () => {
    if (!user?.id) return;
    await clearAnalysisHistory(user.id);
    toast.success("Analysis history cleared");
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
    toast.success("Signed out successfully");
  };

  const dangerBtnStyle = {
    padding: "7px 13px",
    background: "hsl(220 12% 11%)",
    border: "1px solid hsl(0 70% 56% / 0.22)",
    borderRadius: "7px",
    color: "hsl(0 70% 62%)",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    flexShrink: 0,
    transition: "background 0.15s",
  };

  const secondaryBtnStyle = {
    padding: "7px 13px",
    background: "hsl(220 12% 12%)",
    border: "1px solid hsl(220 12% 18%)",
    borderRadius: "7px",
    color: "hsl(215 12% 62%)",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    flexShrink: 0,
    transition: "background 0.15s",
  };
  if (loading) return null;
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px" }}
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
          Settings
        </h1>
        <p style={{ fontSize: "13px", color: "hsl(215 12% 48%)" }}>
          Manage your account preferences
        </p>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          style={{
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(220 12% 13%)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionHeader
            icon={Bell}
            title="Notifications"
            desc="Control your notification preferences"
            color="hsl(258 80% 70%)"
            bg="hsl(258 80% 65% / 0.08)"
            border="hsl(258 80% 65% / 0.2)"
          />
          <SettingRow
            label="Analysis complete"
            description="Receive a notification when repository analysis finishes"
            action={
              <button
                onClick={() => handleToggleNotifications(!notifications)}
                style={{
                  width: "38px",
                  height: "22px",
                  borderRadius: "11px",
                  background: notifications
                    ? "hsl(38 92% 54%)"
                    : "hsl(220 12% 18%)",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: notifications ? "19px" : "3px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px hsl(0 0% 0% / 0.3)",
                  }}
                />
              </button>
            }
          />
        </motion.div>

        {/* Data & Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(220 12% 13%)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionHeader
            icon={Shield}
            title="Data & Privacy"
            desc="Manage your local data and privacy settings"
            color="hsl(199 89% 58%)"
            bg="hsl(199 89% 48% / 0.08)"
            border="hsl(199 89% 48% / 0.2)"
          />
          <SettingRow
            label="Clear analysis history"
            description="Remove all saved repository analyses and bookmarks from your browser"
            action={
              <button
                onClick={clearHistory}
                style={secondaryBtnStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "hsl(220 12% 15%)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "hsl(220 12% 12%)")
                }
              >
                Clear data
              </button>
            }
          />
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          style={{
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(220 12% 13%)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionHeader
            icon={LogOut}
            title="Account"
            desc="Manage your account and session"
            color="hsl(38 95% 58%)"
            bg="hsl(38 95% 54% / 0.08)"
            border="hsl(38 95% 54% / 0.2)"
          />
          <SettingRow
            label="Sign out"
            description="Sign out of your GitMind account on this device"
            action={
              <button
                onClick={handleSignOut}
                style={secondaryBtnStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "hsl(220 12% 15%)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "hsl(220 12% 12%)")
                }
              >
                Sign out
              </button>
            }
          />
        </motion.div>

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          style={{
            background: "hsl(220 14% 9%)",
            border: "1px solid hsl(0 70% 56% / 0.15)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <SectionHeader
            icon={Trash2}
            title="Danger Zone"
            desc="Irreversible and destructive actions"
            color="hsl(0 70% 64%)"
            bg="hsl(0 70% 56% / 0.08)"
            border="hsl(0 70% 56% / 0.2)"
          />
          <div style={{ borderBottom: "none" }}>
            <SettingRow
              label="Delete account data"
              description="Clear all local data and sign out of your account permanently"
              action={
                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        "This will clear all local data and sign you out. Continue?"
                      )
                    )
                      return;
                    localStorage.clear();
                    await logout();
                    router.push("/");
                  }}
                  style={{
                    ...dangerBtnStyle,
                    borderBottom: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "hsl(0 70% 56% / 0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "hsl(220 12% 11%)")
                  }
                >
                  Delete & sign out
                </button>
              }
            />
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            textAlign: "center",
            padding: "8px 0 16px",
          }}
        >
          <p style={{ fontSize: "11px", color: "hsl(215 12% 35%)" }}>
            GitMind · Built by Arun C · VIT Vellore
            <br />
            Powered by Gemini AI · Groq · GitHub API
          </p>
        </motion.div>
      </div>
    </div>
  );
}