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

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Master switch — when false, the app behaves exactly as today (localStorage only). */
export function isSupabaseEnabled(): boolean {
  return (
    isSupabaseConfigured() &&
    readBool(process.env.NEXT_PUBLIC_SUPABASE_ENABLED)
  );
}

export type SupabaseSyncDomain =
  | "baby"
  | "kicks"
  | "water"
  | "vitamins"
  | "babyPlus"
  | "reminders"
  | "child";

function syncFlag(domain: SupabaseSyncDomain): string | undefined {
  switch (domain) {
    case "baby":
      return process.env.NEXT_PUBLIC_SUPABASE_SYNC_BABY;
    case "kicks":
      return process.env.NEXT_PUBLIC_SUPABASE_SYNC_KICKS;
    case "water":
      return process.env.NEXT_PUBLIC_SUPABASE_SYNC_WATER;
    case "vitamins":
      return process.env.NEXT_PUBLIC_SUPABASE_SYNC_VITAMINS;
    case "babyPlus":
      return process.env.NEXT_PUBLIC_SUPABASE_SYNC_BABY_PLUS;
    case "reminders":
      return process.env.NEXT_PUBLIC_SUPABASE_SYNC_REMINDERS;
    case "child":
      return process.env.NEXT_PUBLIC_SUPABASE_SYNC_CHILD;
  }
}

/**
 * Per-feature read/write to Supabase.
 * When the master switch is on, every domain syncs unless its flag is explicitly false.
 */
export function isSupabaseSyncEnabled(domain: SupabaseSyncDomain): boolean {
  if (!isSupabaseEnabled()) return false;
  const raw = readStatic(syncFlag(domain));
  if (raw === undefined) return true;
  return readBool(raw);
}
