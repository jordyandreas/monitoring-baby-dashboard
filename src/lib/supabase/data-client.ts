import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAccountAccessToken } from "@/lib/supabase/account-session";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

function mergeSignals(primary: AbortSignal, extra: AbortSignal | null | undefined) {
  if (!extra) return primary;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (primary.aborted || extra.aborted) {
    controller.abort();
    return controller.signal;
  }
  primary.addEventListener("abort", abort);
  extra.addEventListener("abort", abort);
  return controller.signal;
}

/**
 * Data client that sends the access token already in memory.
 * It does not call getSession(), so a stuck token refresh cannot block queries.
 */
export function createSupabaseDataClient(signal: AbortSignal): SupabaseClient<Database> | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey || !isSupabaseConfigured()) return null;
  return createClient<Database>(url, anonKey, {
    accessToken: async () => getAccountAccessToken(),
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: mergeSignals(signal, init?.signal) }),
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
