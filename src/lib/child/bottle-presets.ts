/** Shared ml chip shortcuts for ASI botol, sufor, and pump. */
export const DEFAULT_BOTTLE_ML = [30, 45, 50, 60, 70, 90, 120, 180, 240] as const;

export const BOTTLE_ML_MIN = 1;
export const BOTTLE_ML_MAX = 2000;
export const BOTTLE_ML_PRESETS_MAX = 20;

export type BottleMlPreset = number;

function isValidMl(value: number): boolean {
  return Number.isInteger(value) && value >= BOTTLE_ML_MIN && value <= BOTTLE_ML_MAX;
}

/** Unique, sorted, in-range presets; falls back to defaults if empty/invalid. */
export function normalizeBottleMlPresets(value?: readonly number[] | null): number[] {
  if (!value || value.length === 0) return [...DEFAULT_BOTTLE_ML];
  const unique = new Set<number>();
  for (const item of value) {
    if (typeof item !== "number" || !Number.isFinite(item)) continue;
    const rounded = Math.round(item);
    if (!isValidMl(rounded)) continue;
    unique.add(rounded);
  }
  if (unique.size === 0) return [...DEFAULT_BOTTLE_ML];
  return [...unique].sort((a, b) => a - b).slice(0, BOTTLE_ML_PRESETS_MAX);
}

export function bottleMlPresetsEqual(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export type ParseBottleMlResult =
  | { ok: true; ml: number }
  | { ok: false; reason: "invalid" | "duplicate" | "max" };

/** Parse a free-form add input against the current draft list. */
export function parseBottleMlToAdd(
  raw: string,
  current: readonly number[],
): ParseBottleMlResult {
  if (current.length >= BOTTLE_ML_PRESETS_MAX) return { ok: false, reason: "max" };
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "invalid" };
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return { ok: false, reason: "invalid" };
  if (!isValidMl(n)) return { ok: false, reason: "invalid" };
  if (current.includes(n)) return { ok: false, reason: "duplicate" };
  return { ok: true, ml: n };
}
