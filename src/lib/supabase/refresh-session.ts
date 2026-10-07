import type { Session, User } from "@supabase/supabase-js";
import {
  createChunks,
  DEFAULT_COOKIE_OPTIONS,
  isChunkLike,
  parseCookieHeader,
  serializeCookieHeader,
  stringToBase64URL,
} from "@supabase/ssr";
import {
  getAccountRefreshToken,
  setAccountSession,
} from "@/lib/supabase/account-session";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const REFRESH_TIMEOUT_MS = 3_000;
const BASE64_PREFIX = "base64-";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: User;
  error_description?: string;
  msg?: string;
  error?: string;
};

let inflight: Promise<void> | null = null;

/** Refresh the session once. Parallel callers share the same attempt. */
export function refreshAccountSession(): Promise<void> {
  if (!inflight) {
    inflight = runRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function runRefresh() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const refreshToken = getAccountRefreshToken();
  if (!url || !anonKey) throw new Error("Supabase is not configured");
  if (!refreshToken) throw new Error("Not signed in");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const body = (await response.json()) as TokenResponse;
    if (!response.ok || !body.access_token || !body.refresh_token || !body.user) {
      throw new Error(body.error_description || body.msg || body.error || "Session refresh failed");
    }
    const session = toSession(body);
    setAccountSession(session);
    persistSessionCookie(session);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Session refresh timed out");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function toSession(body: TokenResponse): Session {
  const expiresIn = body.expires_in ?? 3600;
  const expiresAt = body.expires_at ?? Math.floor(Date.now() / 1000) + expiresIn;
  return {
    access_token: body.access_token ?? "",
    refresh_token: body.refresh_token ?? "",
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: "bearer",
    user: body.user as User,
  };
}

/** Write the new session the same way @supabase/ssr stores it, without getSession(). */
function persistSessionCookie(session: Session) {
  if (typeof document === "undefined") return;
  const url = getSupabaseUrl();
  if (!url) return;
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  const encoded = BASE64_PREFIX + stringToBase64URL(JSON.stringify(session));
  const existing = parseCookieHeader(document.cookie).map((cookie) => cookie.name);
  const chunks = createChunks(key, encoded);
  const nextNames = new Set(chunks.map((chunk) => chunk.name));

  for (const name of existing) {
    if (!isChunkLike(name, key) || nextNames.has(name)) continue;
    document.cookie = serializeCookieHeader(name, "", { ...DEFAULT_COOKIE_OPTIONS, maxAge: 0 });
  }
  for (const chunk of chunks) {
    document.cookie = serializeCookieHeader(chunk.name, chunk.value, DEFAULT_COOKIE_OPTIONS);
  }
}
