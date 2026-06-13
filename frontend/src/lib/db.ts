import { supabase } from "./supabase";
import { BatchAnalysisResponse } from "./api";

// ─────────────────────────────────────────────────────
// ANALYSIS HISTORY
// ─────────────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  repo_url: string;
  repo_name: string;
  repo_owner: string;
  language: string;
  stars: number;
  forks: number;
  total_commits: number;
  risk_safe: number;
  risk_warn: number;
  risk_danger: number;
  health_score: number | null;
  summary: string | null;
  analyzed_at: string;
}
const { data: { session } } = await supabase.auth.getSession();
console.log("AUTH CHECK:", session?.user?.id, "|", session?.access_token?.slice(0,30));
// Ensure session is live before any DB operation
await supabase.auth.getSession();
export async function saveAnalysisToHistory(
  userId: string,
  result: BatchAnalysisResponse,
  riskCounts: { safe: number; warn: number; danger: number },
  healthScore: number | null
): Promise<void> {
  const { error } = await supabase
    .from("analysis_history")
    .upsert(
      {
        user_id: userId,
        repo_url: result.repo.html_url,
        repo_name: result.repo.full_name,
        repo_owner: result.repo.owner,
        language: result.repo.language || null,
        stars: result.repo.stars,
        forks: result.repo.forks,
        total_commits: result.total,
        risk_safe: riskCounts.safe,
        risk_warn: riskCounts.warn,
        risk_danger: riskCounts.danger,
        health_score: healthScore,
        summary: result.summary || null,
        analyzed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,repo_url",
        ignoreDuplicates: false,
      }
    );

  if (error) console.error("Failed to save analysis history:", error);
}

export async function getAnalysisHistory(
  userId: string,
  limit = 50
): Promise<HistoryItem[]> {
  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("user_id", userId)
    .order("analyzed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get history:", error);
    return [];
  }

  return data || [];
}

export async function deleteHistoryItem(
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("analysis_history")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) console.error("Failed to delete history item:", error);
}

export async function clearAnalysisHistory(userId: string): Promise<void> {
  const { error } = await supabase
    .from("analysis_history")
    .delete()
    .eq("user_id", userId);

  if (error) console.error("Failed to clear history:", error);
}

// ─────────────────────────────────────────────────────
// SAVED REPOSITORIES
// ─────────────────────────────────────────────────────

export interface SavedRepo {
  id: string;
  repo_url: string;
  repo_name: string;
  description: string | null;
  language: string | null;
  stars: number;
  saved_at: string;
}

export async function saveRepository(
  userId: string,
  repo: {
    url: string;
    name: string;
    description?: string | null;
    language?: string | null;
    stars?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("saved_repositories")
    .upsert(
      {
        user_id: userId,
        repo_url: repo.url,
        repo_name: repo.name,
        description: repo.description || null,
        language: repo.language || null,
        stars: repo.stars || 0,
        saved_at: new Date().toISOString(),
      },
      { onConflict: "user_id,repo_url" }
    );

  if (error) console.error("Failed to save repository:", error);
}

export async function getSavedRepositories(
  userId: string
): Promise<SavedRepo[]> {
  const { data, error } = await supabase
    .from("saved_repositories")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("Failed to get saved repos:", error);
    return [];
  }

  return data || [];
}

export async function deleteSavedRepository(
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("saved_repositories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) console.error("Failed to delete saved repo:", error);
}

// ─────────────────────────────────────────────────────
// ANALYSIS SESSIONS (analyze page persistence)
// ─────────────────────────────────────────────────────
export async function createAnalysisSession(
  userId: string | null,
  repoUrl: string,
  limit: number
): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
 console.log("SESSION IN createAnalysisSession:", session?.user?.id, "| userId param:", userId);

  const { data, error } = await supabase
    .from("analysis_sessions")
    .insert({
      user_id: userId,
      repo_url: repoUrl,
      limit_count: limit,
      status: "loading",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save analysis history:", JSON.stringify(error, null, 2));
    console.error("Error details:", error.message, error.code, error.details, error.hint);
  }

  return data?.id || null;
}

  export interface AnalysisSession {
  id: string;
  user_id: string | null;
  repo_url: string;
  repo_name: string | null;
  limit_count: number;
  status: "idle" | "loading" | "complete" | "error";
  result_json: BatchAnalysisResponse | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}


export async function updateAnalysisSession(
  sessionId: string,
  updates: {
    status?: "idle" | "loading" | "complete" | "error";
    result_json?: BatchAnalysisResponse | null;
    error_message?: string | null;
    completed_at?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("analysis_sessions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) console.error("Failed to update session:", error);
}

export async function getLatestAnalysisSession(
  userId: string
): Promise<AnalysisSession | null> {
  const { data, error } = await supabase
    .from("analysis_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["loading", "complete"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  // Don't restore sessions older than 2 hours
  const updatedAt = new Date(data.updated_at).getTime();
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  if (updatedAt < twoHoursAgo) return null;

  return data as AnalysisSession;
}

// ─────────────────────────────────────────────────────
// USER SETTINGS
// ─────────────────────────────────────────────────────

export interface UserSettings {
  default_limit: number;
  notifications: boolean;
}

export async function getUserSettings(
  userId: string
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { default_limit: 10, notifications: true };
  }

  return {
    default_limit: data.default_limit,
    notifications: data.notifications,
  };
}

export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) console.error("Failed to save settings:", error);
}