import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function isEmailAccount(user: User | null | undefined): boolean {
  return Boolean(user?.email) && user?.is_anonymous !== true;
}

export type EmailAuthResult =
  | { ok: true; session: Session; pendingConfirmation: boolean }
  | { ok: false; message: string };

function clientOrError() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { supabase: null, message: "Supabase is not configured" };
  return { supabase, message: null };
}

export async function signUpWithEmail(email: string, password: string): Promise<EmailAuthResult> {
  const { supabase, message } = clientOrError();
  if (!supabase) return { ok: false, message: message ?? "Supabase is not configured" };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: error.message };
  if (!data.session) {
    return { ok: false, message: "Check your email to confirm the account." };
  }
  return { ok: true, session: data.session, pendingConfirmation: false };
}

export async function signInWithEmail(email: string, password: string): Promise<EmailAuthResult> {
  const { supabase, message } = clientOrError();
  if (!supabase) return { ok: false, message: message ?? "Supabase is not configured" };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { ok: false, message: error?.message ?? "Could not log in" };
  }
  return { ok: true, session: data.session, pendingConfirmation: false };
}

export async function signOut(): Promise<{ ok: true } | { ok: false; message: string }> {
  const { supabase, message } = clientOrError();
  if (!supabase) return { ok: false, message: message ?? "Supabase is not configured" };

  // local: this browser only. Default "global" revokes every device for the account.
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
