function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  if (typeof atob === "function") return atob(padded);
  const buffer = (globalThis as { Buffer?: { from(data: string, enc: string): { toString(enc: string): string } } })
    .Buffer;
  if (!buffer) throw new Error("No base64 decoder");
  return buffer.from(padded, "base64").toString("utf8");
}

/** Decode a JWT payload without verifying the signature. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** User access tokens always carry a non-empty `sub` claim. */
export function accessTokenHasSub(token: string | null | undefined): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return typeof payload?.sub === "string" && payload.sub.length > 0;
}

/** True for Auth/PostgREST errors that mean the access token cannot be used. */
export function isAuthTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /jwt|bad[_ ]?jwt|invalid claim|missing sub|pgrst301|not authenticated|unauthorized|session.*expired|invalid.*token/i.test(
    message,
  );
}
