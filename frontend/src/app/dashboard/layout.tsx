"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  Bookmark,
  Settings,
  User,
  LogOut,
  GitBranch,
  Menu,
  X,
  Plus,
  ChevronDown,
  Brain,
} from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";
import { TopLoader } from "@/components/layout/TopLoader";
import { useAuthStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/history", label: "History", icon: Clock, exact: false },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark, exact: false },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          padding: "7px 10px",
          borderRadius: "7px",
          fontSize: "13px",
          fontWeight: active ? 500 : 400,
          color: active ? "hsl(210 20% 94%)" : "hsl(215 12% 50%)",
          background: active ? "hsl(222 16% 15%)" : "transparent",
          transition: "all 0.12s",
          cursor: "pointer",
          textDecoration: "none",
          borderLeft: active
            ? "2px solid hsl(38 92% 54%)"
            : "2px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background =
              "hsl(220 12% 12%)";
            (e.currentTarget as HTMLElement).style.color =
              "hsl(210 20% 82%)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color =
              "hsl(215 12% 50%)";
          }
        }}
      >
        <Icon size={15} style={{ flexShrink: 0 }} />
        {label}
      </div>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token, logout, checkAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Wait for Zustand to rehydrate
      await new Promise(r => setTimeout(r, 80));
      const store = useAuthStore.getState();
      if (!store.token && !store.isAuthenticated) {
        router.push("/login");
        return;
      }
      await checkAuth();
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        if (data?.full_name) setProfileName(data.full_name);
      }
      setAuthChecked(true);
    };
    init();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const initials = (profileName || user?.full_name)
    ? (profileName || user?.full_name)!
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "hsl(220 16% 6%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          color: "hsl(215 12% 48%)",
          fontSize: "13px",
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid hsl(38 92% 54% / 0.2)",
            borderTopColor: "hsl(38 92% 54%)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        Loading...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: "52px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid hsl(220 10% 11%)",
          flexShrink: 0,
        }}
      >
        <Wordmark size={24} />
      </div>

      {/* New Analysis */}
      <div style={{ padding: "12px 12px 8px" }}>
        <button
          onClick={() => {
            router.push("/analyze");
            onNav?.();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "8px 12px",
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
          <Plus size={14} />
          New Analysis
        </button>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "4px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflowY: "auto",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "hsl(215 12% 35%)",
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            padding: "8px 10px 4px",
          }}
        >
          Navigation
        </p>
        {NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item.href, item.exact)}
            onClick={onNav}
          />
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "10px",
          borderTop: "1px solid hsl(220 10% 11%)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            width: "100%",
            padding: "8px 10px",
            background: "none",
            border: "1px solid transparent",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "hsl(220 12% 12%)";
            e.currentTarget.style.borderColor = "hsl(220 12% 16%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "hsl(38 92% 54% / 0.15)",
              border: "1px solid hsl(38 92% 54% / 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
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

          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "hsl(210 20% 88%)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profileName || user?.full_name || user?.email?.split("@")[0] || "User"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "hsl(215 12% 45%)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email}
            </div>
          </div>

          <ChevronDown
            size={13}
            style={{
              color: "hsl(215 12% 40%)",
              flexShrink: 0,
              transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {/* User dropdown */}
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                bottom: "calc(100% - 4px)",
                left: "10px",
                right: "10px",
                background: "hsl(220 12% 12%)",
                border: "1px solid hsl(222 14% 19%)",
                borderRadius: "9px",
                overflow: "hidden",
                boxShadow: "0 8px 24px hsl(0 0% 0% / 0.5)",
              }}
            >
              <Link href="/dashboard/profile">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 12px",
                    fontSize: "13px",
                    color: "hsl(210 20% 82%)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "hsl(220 12% 15%)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <User size={13} style={{ color: "hsl(215 12% 48%)" }} />
                  Profile
                </div>
              </Link>
              <Link href="/dashboard/settings">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 12px",
                    fontSize: "13px",
                    color: "hsl(210 20% 82%)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "hsl(220 12% 15%)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <Settings size={13} style={{ color: "hsl(215 12% 48%)" }} />
                  Settings
                </div>
              </Link>
              <div
                style={{
                  height: "1px",
                  background: "hsl(220 12% 15%)",
                  margin: "3px 0",
                }}
              />
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 12px",
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontSize: "13px",
                  color: "hsl(0 70% 64%)",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "hsl(0 70% 56% / 0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <LogOut size={13} />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      <TopLoader />
      <div
        style={{
          minHeight: "100vh",
          background: "hsl(220 16% 6%)",
          display: "flex",
        }}
      >
        {/* Desktop sidebar */}
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            borderRight: "1px solid hsl(222 14% 12%)",
            background: "hsl(222 20% 8%)",
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
          className="desktop-sidebar"
        >
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "hsl(220 16% 6% / 0.7)",
                  zIndex: 40,
                  backdropFilter: "blur(4px)",
                }}
              />
              <motion.aside
                initial={{ x: -220 }}
                animate={{ x: 0 }}
                exit={{ x: -220 }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                style={{
                  position: "fixed",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "220px",
                  background: "hsl(222 20% 8%)",
                  borderRight: "1px solid hsl(220 10% 11%)",
                  zIndex: 50,
                }}
              >
                <SidebarContent onNav={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Mobile top bar */}
          <div
            className="mobile-topbar"
            style={{
              display: "none",
              height: "52px",
              alignItems: "center",
              padding: "0 16px",
              gap: "12px",
              borderBottom: "1px solid hsl(220 10% 11%)",
              background: "hsl(222 20% 8%)",
              position: "sticky",
              top: 0,
              zIndex: 30,
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "hsl(215 12% 52%)",
                cursor: "pointer",
                display: "flex",
                padding: 0,
              }}
            >
              <Menu size={18} />
            </button>
            <Wordmark size={22} />
          </div>

          {/* Page content */}
          <main
            style={{
              flex: 1,
              padding: "28px 28px",
              maxWidth: "100%",
              overflowX: "hidden",
            }}
          >
            {children}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </>
  );
}