"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";
import { Wordmark } from "@/components/layout/Logo";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handle = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          await new Promise((r) => setTimeout(r, 1500));
          const { data: retry } = await supabase.auth.getSession();
          if (!retry.session) {
            router.push("/login");
            return;
          }
          const u = retry.session.user;
          setUser(
            {
              id: u.id,
              email: u.email ?? "",
              full_name:
                u.user_metadata?.full_name ??
                u.user_metadata?.name ??
                null,
              avatar_url: u.user_metadata?.avatar_url ?? null,
            },
            retry.session.access_token
          );
          router.push("/analyze");
          return;
        }

        const u = data.session.user;
        setUser(
          {
            id: u.id,
            email: u.email ?? "",
            full_name:
              u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
            avatar_url: u.user_metadata?.avatar_url ?? null,
          },
          data.session.access_token
        );
        router.push("/analyze");
      } catch {
        router.push("/login");
      }
    };
    handle();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "hsl(222 20% 7%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
      }}
    >
      <Wordmark size={32} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "hsl(215 12% 52%)",
          fontSize: "13px",
        }}
      >
        <Loader2
          size={16}
          style={{
            color: "hsl(188 94% 52%)",
            animation: "spin 1s linear infinite",
          }}
        />
        Completing sign in...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}