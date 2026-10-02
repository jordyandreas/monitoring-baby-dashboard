import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, resetSupabaseBrowserClient } from "@/lib/supabase/client";
import { isEmailAccount } from "@/lib/supabase/email-auth";
import { withTimeout } from "@/lib/supabase/with-timeout";

export type AuthStatus = "disabled" | "loading" | "ready" | "error";

const GET_SESSION_TIMEOUT_MS = 2_000;

type SessionResult = {
  session: Session | null;
  error: string | null;
};

let inflight: Promise<SessionResult> | null = null;

/** Restore an email session. Logged out is a normal state, not an error. */
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
    if (!existing) return { session: null, error: null };
    if (isEmailAccount(existing.user)) return { session: existing, error: null };

    const { error } = await supabase.auth.signOut();
    if (error) return { session: null, error: error.message };
    return { session: null, error: null };
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
