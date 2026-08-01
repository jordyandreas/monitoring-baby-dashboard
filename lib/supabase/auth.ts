import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/supabase/with-timeout";

export type AuthStatus = "disabled" | "loading" | "ready" | "error";

const AUTH_TIMEOUT_MS = 15_000;

/**
 * Ensures a Supabase session exists. For MVP, uses anonymous auth (no login UI).
 * Enable "Anonymous sign-ins" in Supabase Dashboard → Authentication → Providers.
 */
export async function ensureSupabaseSession(): Promise<{
  session: Session | null;
  error: string | null;
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { session: null, error: "Supabase client not configured" };
  }

  try {
    const { data: sessionData, error: sessionError } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_TIMEOUT_MS,
      "getSession",
    );

    if (sessionError) {
      return { session: null, error: sessionError.message };
    }
    if (sessionData.session) {
      return { session: sessionData.session, error: null };
    }

    const { data: signInData, error: signInError } = await withTimeout(
      supabase.auth.signInAnonymously(),
      AUTH_TIMEOUT_MS,
      "signInAnonymously",
    );

    if (signInError) {
      return { session: null, error: signInError.message };
    }

    if (signInData.session) {
      return { session: signInData.session, error: null };
    }

    const { data: afterSignIn, error: afterError } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_TIMEOUT_MS,
      "getSession (after sign-in)",
    );

    if (afterError) {
      return { session: null, error: afterError.message };
    }
    if (afterSignIn.session) {
      return { session: afterSignIn.session, error: null };
    }

    return {
      session: null,
      error: signInData.user
        ? "Signed in but no session — try clearing site data for localhost"
        : "Anonymous sign-in returned no user",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth failed";
    return { session: null, error: message };
  }
}
