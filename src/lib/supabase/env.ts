function readStatic(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readBool(value: string | undefined, defaultValue = false): boolean {
  const raw = readStatic(value);
  if (raw === undefined) return defaultValue;
  return raw === "1" || raw.toLowerCase() === "true";
}

// Static process.env.NEXT_PUBLIC_* access so Next can inline these into the browser.
// Dynamic process.env[name] stays empty on the client, so auth never starts.
export function getSupabaseUrl(): string | undefined {
  return readStatic(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string | undefined {
  return readStatic(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getVapidPublicKey(): string | undefined {
  return readStatic(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** When false, feature routes stay open and nothing is written to Supabase. */
export function isSupabaseEnabled(): boolean {
  return (
    isSupabaseConfigured() &&
    readBool(process.env.NEXT_PUBLIC_SUPABASE_ENABLED)
  );
}
