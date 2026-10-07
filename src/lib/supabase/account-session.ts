import type { Session } from "@supabase/supabase-js";

/** Refresh a minute early so a query does not leave with a token that expires in flight. */
const REFRESH_MARGIN_MS = 60_000;

let userId: string | null = null;
let accessToken: string | null = null;
let refreshToken: string | null = null;
let expiresAt: number | null = null;

/** Remember the signed-in account so data queries do not call getSession(). */
export function setAccountSession(session: Session | null) {
  userId = session?.user?.id ?? null;
  accessToken = session?.access_token ?? null;
  refreshToken = session?.refresh_token ?? null;
  expiresAt = session?.expires_at ?? null;
}

export function getAccountUserId() {
  return userId;
}

export function getAccountAccessToken() {
  return accessToken;
}

export function getAccountRefreshToken() {
  return refreshToken;
}

/** True when the access token is missing its expiry or is inside the refresh window. */
export function isAccessTokenStale() {
  if (!accessToken || !refreshToken || expiresAt == null) return false;
  return expiresAt * 1000 - Date.now() < REFRESH_MARGIN_MS;
}
