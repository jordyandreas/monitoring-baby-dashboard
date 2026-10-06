import type { Session } from "@supabase/supabase-js";

let userId: string | null = null;
let accessToken: string | null = null;

/** Remember the signed-in account so data queries do not call getSession(). */
export function setAccountSession(session: Session | null) {
  userId = session?.user?.id ?? null;
  accessToken = session?.access_token ?? null;
}

export function getAccountUserId() {
  return userId;
}

export function getAccountAccessToken() {
  return accessToken;
}
