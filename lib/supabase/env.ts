function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readBool(name: string, defaultValue = false): boolean {
  const raw = readEnv(name);
  if (raw === undefined) return defaultValue;
  return raw === "1" || raw.toLowerCase() === "true";
}

export function getSupabaseUrl(): string | undefined {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string | undefined {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Master switch — when false, the app behaves exactly as today (localStorage only). */
export function isSupabaseEnabled(): boolean {
  return isSupabaseConfigured() && readBool("NEXT_PUBLIC_SUPABASE_ENABLED");
}

export type SupabaseSyncDomain =
  | "baby"
  | "kicks"
  | "water"
  | "vitamins"
  | "babyPlus"
  | "reminders";

const SYNC_ENV: Record<SupabaseSyncDomain, string> = {
  baby: "NEXT_PUBLIC_SUPABASE_SYNC_BABY",
  kicks: "NEXT_PUBLIC_SUPABASE_SYNC_KICKS",
  water: "NEXT_PUBLIC_SUPABASE_SYNC_WATER",
  vitamins: "NEXT_PUBLIC_SUPABASE_SYNC_VITAMINS",
  babyPlus: "NEXT_PUBLIC_SUPABASE_SYNC_BABY_PLUS",
  reminders: "NEXT_PUBLIC_SUPABASE_SYNC_REMINDERS",
};

/** Per-feature read/write to Supabase (gradual rollout). */
export function isSupabaseSyncEnabled(domain: SupabaseSyncDomain): boolean {
  return isSupabaseEnabled() && readBool(SYNC_ENV[domain]);
}
