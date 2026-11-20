import { normalizeBottleMlPresets } from "@/lib/child/bottle-presets";

const KEY_PREFIX = "nurtory-bottle-ml-presets:";

const listeners = new Set<() => void>();

function cacheKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export function subscribeBottleMlCache(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Raw stored string so `useSyncExternalStore` gets a stable snapshot. */
export function readBottleMlCacheRaw(userId: string | null | undefined): string | null {
  if (!userId) return null;
  try {
    return localStorage.getItem(cacheKey(userId));
  } catch {
    return null;
  }
}

export function parseBottleMlCache(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    return normalizeBottleMlPresets(value.filter((item): item is number => typeof item === "number"));
  } catch {
    return null;
  }
}

export function writeBottleMlCache(userId: string, presets: readonly number[]) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(normalizeBottleMlPresets(presets)));
  } catch {
    // Forms fall back to a remote load when storage is blocked.
  }
  listeners.forEach((listener) => listener());
}
