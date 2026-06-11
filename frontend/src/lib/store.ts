import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, signOutUser } from "./supabase";

export interface GitmindUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: GitmindUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: GitmindUser | null, token: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token) => {
        set({ user, token, isAuthenticated: !!user, isLoading: false });
      },

      logout: async () => {
        await signOutUser();
        if (typeof window !== "undefined") {
          localStorage.removeItem("gitmind-auth");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            const u = data.session.user;
            set({
              user: {
                id: u.id,
                email: u.email ?? "",
                full_name:
                  u.user_metadata?.full_name ??
                  u.user_metadata?.name ??
                  null,
                avatar_url: u.user_metadata?.avatar_url ?? null,
              },
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "gitmind-auth",
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);