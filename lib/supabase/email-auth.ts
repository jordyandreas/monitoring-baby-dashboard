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

/** Attach email and password to the current guest, or create an account. */
export async function signUpWithEmail(email: string, password: string): Promise<EmailAuthResult> {
  const { supabase, message } = clientOrError();
  if (!supabase) return { ok: false, message: message ?? "Supabase is not configured" };

  const { data: current } = await supabase.auth.getSession();
  if (current.session?.user.is_anonymous) {
    const { data, error } = await supabase.auth.updateUser({ email, password });
    if (error) return { ok: false, message: error.message };
    const next = (await supabase.auth.getSession()).data.session ?? current.session;
    const confirmed = data.user.email === email && Boolean(data.user.email_confirmed_at);
    return { ok: true, session: next, pendingConfirmation: !confirmed };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: error.message };
  if (!data.session) {
    if (current.session) {
      return { ok: true, session: current.session, pendingConfirmation: true };
    }
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

/** Leave the email account and continue on this device as a guest. */
export async function signOutToGuest(): Promise<EmailAuthResult> {
  const { supabase, message } = clientOrError();
  if (!supabase) return { ok: false, message: message ?? "Supabase is not configured" };

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) return { ok: false, message: signOutError.message };

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    return { ok: false, message: error?.message ?? "Could not continue as a guest" };
  }
  return { ok: true, session: data.session, pendingConfirmation: false };
}
