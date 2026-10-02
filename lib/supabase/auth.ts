import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, resetSupabaseBrowserClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/supabase/with-timeout";

export type AuthStatus = "disabled" | "loading" | "ready" | "error";

const GET_SESSION_TIMEOUT_MS = 2_000;
const AUTH_TIMEOUT_MS = 15_000;

type SessionResult = {
  session: Session | null;
  error: string | null;
};

let inflight: Promise<SessionResult> | null = null;

/**
 * Ensures a Supabase session exists. For MVP, uses anonymous auth (no login UI).
 * Enable "Anonymous sign-ins" in Supabase Dashboard → Authentication → Providers.
 *
 * One shared attempt so React Strict Mode does not sign in twice.
 */
export function ensureSupabaseSession(): Promise<SessionResult> {
  if (!inflight) {
    inflight = runEnsureSupabaseSession().then((result) => {
      if (result.error) inflight = null;
      return result;
    });
  }
  return inflight;
}

/** Allow a manual retry after a failed attempt. */
export function resetEnsureSupabaseSession(): void {
  inflight = null;
}

async function runEnsureSupabaseSession(): Promise<SessionResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { session: null, error: "Supabase client not configured" };
  }

  try {
    const existing = await readSessionQuickly(supabase);
    if (existing) {
      return { session: existing, error: null };
    }

    const { data: signInData, error: signInError } = await withTimeout(
      supabase.auth.signInAnonymously(),
      AUTH_TIMEOUT_MS,
      "signInAnonymously",
    );

    if (signInError) {
      return { session: null, error: signInError.message };
    }
    if (signInData.session?.user) {
      return { session: signInData.session, error: null };
    }

    return {
      session: null,
      error: "Anonymous sign-in returned no session",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth failed";
    return { session: null, error: message };
  }
}

/** Read a stored session without waiting on the auth lock. */
async function readSessionQuickly(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
): Promise<Session | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      GET_SESSION_TIMEOUT_MS,
      "getSession",
    );
    if (error || !data.session?.user) return null;
    return data.session;
  } catch {
    resetSupabaseBrowserClient();
    return null;
  }
}
