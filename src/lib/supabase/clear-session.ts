import {
  DEFAULT_COOKIE_OPTIONS,
  isChunkLike,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { setAccountSession } from "@/lib/supabase/account-session";
import { getSupabaseUrl } from "@/lib/supabase/env";

export const SESSION_CLEARED_EVENT = "nurtory:session-cleared";

/** Drop the in-memory session and auth cookies so a bad JWT cannot be reused. */
export function clearAccountSession(reason = "session-cleared") {
  setAccountSession(null);
  clearSessionCookies();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_CLEARED_EVENT, { detail: reason }));
  }
}

function clearSessionCookies() {
  if (typeof document === "undefined") return;
  const url = getSupabaseUrl();
  if (!url) return;
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  for (const cookie of parseCookieHeader(document.cookie)) {
    if (!isChunkLike(cookie.name, key)) continue;
    document.cookie = serializeCookieHeader(cookie.name, "", {
      ...DEFAULT_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }
}
