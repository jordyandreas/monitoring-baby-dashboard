import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
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

const AUTH_FETCH_TIMEOUT_MS = 8_000;

/**
 * Abort auth HTTP calls that never finish. A hung refresh holds GoTrue's
 * in-process lock and blocks every later auth call on this client.
 */
function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);
  const abort = () => controller.abort();
  init?.signal?.addEventListener("abort", abort);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", abort);
  });
}

/** Browser Supabase client. Session lives in cookies so proxy can see it. */
export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient<Database>(url, anonKey, {
    global: { fetch: authFetch },
    auth: {
      persistSession: true,
      // Refresh is owned by refreshAccountSession. The library timer would
      // rotate the same refresh token and leave data queries waiting on it.
      autoRefreshToken: false,
      detectSessionInUrl: false,
      lock: noOpAuthLock,
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
