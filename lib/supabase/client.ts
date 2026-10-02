import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Skip navigator.locks. A stuck lock makes getSession() wait forever
 * without sending any request.
 */
async function noOpAuthLock<T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>,
): Promise<T> {
  return fn();
}

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Browser Supabase client.
 * Uses @supabase/supabase-js (localStorage session) — no middleware required.
 * @supabase/ssr is reserved for server.ts when you add Route Handlers / SSR.
 */
export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: noOpAuthLock,
      // Constructor init takes the auth lock and can deadlock before any request.
      skipAutoInitialize: true,
    },
  });
}

/** Singleton browser client (client components only). */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }
  return browserClient;
}

/** Call after changing env keys during dev (forces a fresh client). */
export function resetSupabaseBrowserClient() {
  browserClient = null;
}
