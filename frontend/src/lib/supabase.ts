import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Call once on app boot — ensures client has session before any DB call
export async function initSupabaseSession(): Promise<void> {
  await supabase.auth.getSession();
}

export async function signInWithGoogle(from?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback${from ? `?from=${encodeURIComponent(from)}` : ""}`,
    },
  });
}

export async function signInWithGitHub(from?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback${from ? `?from=${encodeURIComponent(from)}` : ""}`,
    },
  });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}