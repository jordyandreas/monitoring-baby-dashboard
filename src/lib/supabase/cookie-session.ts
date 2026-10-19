import { combineChunks, stringFromBase64URL } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import { accessTokenHasSub } from "@/lib/supabase/jwt";
import { getSupabaseUrl } from "@/lib/supabase/env";

const BASE64_PREFIX = "base64-";

type CookieReader = {
  getAll(): { name: string; value: string }[];
};

/**
 * Read the browser auth cookie without calling Supabase Auth.
 * Proxy must not call getUser()/getSession() — those hit /auth/v1/user and can
 * race refresh_token across concurrent Next.js navigations/prefetches.
 */
export async function readCookieSession(cookies: CookieReader): Promise<Session | null> {
  const url = getSupabaseUrl();
  if (!url) return null;
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const all = cookies.getAll();
  const raw = await combineChunks(key, (name) => all.find((cookie) => cookie.name === name)?.value);
  if (!raw) return null;

  const json = decodeCookieValue(raw);
  if (!json) return null;

  try {
    const session = JSON.parse(json) as Session;
    if (!session?.access_token || !accessTokenHasSub(session.access_token)) return null;
    if (!session.user?.email || session.user.is_anonymous === true) return null;
    return session;
  } catch {
    return null;
  }
}

function decodeCookieValue(value: string): string | null {
  if (!value.startsWith(BASE64_PREFIX)) return value;
  try {
    const decoded = stringFromBase64URL(value.slice(BASE64_PREFIX.length));
    JSON.parse(decoded);
    return decoded;
  } catch {
    return null;
  }
}
