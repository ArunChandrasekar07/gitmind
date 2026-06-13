"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Save, Loader2, CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, setUser, token } = useAuthStore();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  // Always fetch fresh from DB, never rely on Zustand cache
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setName(data.full_name);
      setLoading(false);
    };
    fetchProfile();
  }, [user?.id]);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (authError) throw authError;

      // Update profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ full_name: name, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (dbError) throw dbError;

      // Update Zustand
      if (token) setUser({ ...user, full_name: name }, token);

      setSaved(true);
      toast.success("Profile updated");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "hsl(220 12% 11%)",
    border: "1px solid hsl(220 12% 16%)",
    borderRadius: "8px",
    color: "hsl(210 20% 94%)",
    fontSize: "13px",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box" as const,
  };
  if (loading) return null;
  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
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
          Profile
        </h1>
        <p style={{ fontSize: "13px", color: "hsl(215 12% 48%)" }}>
          Manage your account information
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: "hsl(220 14% 9%)",
          border: "1px solid hsl(220 12% 13%)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Avatar section */}
        <div
          style={{
            padding: "24px 24px 20px",
            borderBottom: "1px solid hsl(220 10% 11%)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "hsl(38 92% 54% / 0.12)",
              border: "2px solid hsl(38 92% 54% / 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
              color: "hsl(38 92% 62%)",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "hsl(210 20% 92%)",
                letterSpacing: "-0.02em",
                marginBottom: "3px",
              }}
            >
              {name || user?.email?.split("@")[0] || "User"}
            </div>
            <div style={{ fontSize: "12px", color: "hsl(215 12% 48%)" }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "22px 24px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Name */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "hsl(215 12% 58%)",
                  marginBottom: "7px",
                }}
              >
                <User size={12} />
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "hsl(38 92% 54% / 0.55)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px hsl(38 92% 54% / 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(220 12% 16%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "hsl(215 12% 58%)",
                  marginBottom: "7px",
                }}
              >
                <Mail size={12} />
                Email address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{
                  ...inputStyle,
                  opacity: 0.5,
                  cursor: "not-allowed",
                }}
              />
              <p
                style={{
                  fontSize: "11px",
                  color: "hsl(215 12% 38%)",
                  marginTop: "5px",
                }}
              >
                Email address cannot be changed
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 16px",
                background: saved
                  ? "hsl(152 68% 42%)"
                  : "hsl(38 92% 54%)",
                border: "none",
                borderRadius: "8px",
                color: "hsl(220 16% 6%)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.7 : 1,
                fontFamily: "Inter, sans-serif",
                transition: "background 0.2s",
                width: "fit-content",
              }}
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={13}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={13} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={13} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}