import type { Gender } from "@/lib/types";
import {
  CHILD_STORAGE_KEY,
  DEFAULT_CHILD_STORAGE,
  MILESTONE_KEYS,
  type ChildProfile,
  type ChildStorage,
  type DiaperEntry,
  type DiaperKind,
  type FeedEntry,
  type FeedKind,
  type FeedSide,
  type GrowthEntry,
  type HealthEntry,
  type MealEntry,
  type MealSlot,
  type MilestoneEntry,
  type MilestoneKey,
  type PoopColor,
  type PoopTexture,
  type PottyEntry,
  type PottyKind,
  type SleepEntry,
  type SleepPeriod,
  type SolidEntry,
} from "@/lib/child/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function dateOf(value: unknown): string | null {
  return typeof value === "string" && DATE.test(value) ? value : null;
}

function timeOf(value: unknown): string | null {
  return typeof value === "string" && TIME.test(value) ? value : null;
}

function idOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function positive(value: unknown, max: number): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > max) return undefined;
  return Math.round(n * 100) / 100;
}

function genderOf(value: unknown): Gender {
  if (value === "boy" || value === "girl" || value === "not-yet") return value;
  return "not-yet";
}

function normalizeProfile(value: unknown): ChildProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ChildProfile>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const birthDate = dateOf(raw.birthDate);
  if (!name || !birthDate) return null;
  return { name, gender: genderOf(raw.gender), birthDate };
}

function normalizeFeed(value: unknown): FeedEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<FeedEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  const time = timeOf(raw.time);
  const kinds = ["breast", "bottle-breast", "formula"] as const;
  if (!id || !date || !time || !isOneOf(raw.kind, kinds)) return null;
  const sides = ["left", "right", "both"] as const;
  const entry: FeedEntry = { id, date, time, kind: raw.kind as FeedKind };
  if (isOneOf(raw.side, sides)) entry.side = raw.side as FeedSide;
  const durationMin = positive(raw.durationMin, 240);
  if (durationMin !== undefined) entry.durationMin = Math.round(durationMin);
  const amountMl = positive(raw.amountMl, 2000);
  if (amountMl !== undefined) entry.amountMl = Math.round(amountMl);
  return entry;
}

function normalizeDiaper(value: unknown): DiaperEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<DiaperEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  const time = timeOf(raw.time);
  const kinds = ["pee", "poop", "both"] as const;
  if (!id || !date || !time || !isOneOf(raw.kind, kinds)) return null;
  const colors = ["yellow", "green", "black", "brown", "other"] as const;
  const textures = ["liquid", "soft", "solid"] as const;
  const entry: DiaperEntry = { id, date, time, kind: raw.kind as DiaperKind };
  if (raw.kind !== "pee") {
    if (isOneOf(raw.poopColor, colors)) entry.poopColor = raw.poopColor as PoopColor;
    if (isOneOf(raw.poopTexture, textures)) entry.poopTexture = raw.poopTexture as PoopTexture;
  }
  return entry;
}

function normalizeSleep(value: unknown): SleepEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SleepEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  const startTime = timeOf(raw.startTime);
  const endTime = timeOf(raw.endTime);
  const periods = ["day", "night"] as const;
  if (!id || !date || !startTime || !endTime || !isOneOf(raw.period, periods)) return null;
  return { id, date, startTime, endTime, period: raw.period as SleepPeriod };
}

function normalizeGrowth(value: unknown): GrowthEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<GrowthEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  if (!id || !date) return null;
  const weightKg = positive(raw.weightKg, 80);
  const lengthCm = positive(raw.lengthCm, 250);
  const headCm = positive(raw.headCm, 80);
  if (weightKg === undefined && lengthCm === undefined && headCm === undefined) return null;
  return {
    id,
    date,
    ...(weightKg !== undefined ? { weightKg } : {}),
    ...(lengthCm !== undefined ? { lengthCm } : {}),
    ...(headCm !== undefined ? { headCm } : {}),
  };
}

function normalizeSolid(value: unknown): SolidEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SolidEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  const time = timeOf(raw.time);
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!id || !date || !time || !name) return null;
  const allergyNote = typeof raw.allergyNote === "string" ? raw.allergyNote.trim() : "";
  return { id, date, time, name, ...(allergyNote ? { allergyNote } : {}) };
}

function normalizeHealth(value: unknown): HealthEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<HealthEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  const time = timeOf(raw.time);
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const dose = typeof raw.dose === "string" ? raw.dose.trim() : "";
  const temperatureC = positive(raw.temperatureC, 45);
  if (!id || !date || !time || (!name && temperatureC === undefined)) return null;
  return {
    id,
    date,
    time,
    name,
    dose,
    ...(temperatureC !== undefined ? { temperatureC } : {}),
  };
}

function normalizePotty(value: unknown): PottyEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<PottyEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  const time = timeOf(raw.time);
  const kinds = ["pee", "poop", "accident", "diaper"] as const;
  if (!id || !date || !time || !isOneOf(raw.kind, kinds)) return null;
  return { id, date, time, kind: raw.kind as PottyKind };
}

function normalizeMeal(value: unknown): MealEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<MealEntry>;
  const id = idOf(raw.id);
  const date = dateOf(raw.date);
  const time = timeOf(raw.time);
  const slots = ["breakfast", "lunch", "snack", "dinner"] as const;
  if (!id || !date || !time || !isOneOf(raw.slot, slots)) return null;
  const note = typeof raw.note === "string" ? raw.note.trim() : "";
  return { id, date, time, slot: raw.slot as MealSlot, note };
}

function normalizeMilestone(value: unknown): MilestoneEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<MilestoneEntry>;
  const date = dateOf(raw.date);
  if (!date || !isOneOf(raw.key, MILESTONE_KEYS)) return null;
  return { key: raw.key as MilestoneKey, date };
}

function list<T>(value: unknown, map: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map).filter((item): item is T => item !== null);
}

export function normalizeChildStorage(parsed: Partial<ChildStorage> | null | undefined): ChildStorage {
  return {
    version: 1,
    profile: normalizeProfile(parsed?.profile),
    feeds: list(parsed?.feeds, normalizeFeed),
    diapers: list(parsed?.diapers, normalizeDiaper),
    sleeps: list(parsed?.sleeps, normalizeSleep),
    growth: list(parsed?.growth, normalizeGrowth),
    solids: list(parsed?.solids, normalizeSolid),
    health: list(parsed?.health, normalizeHealth),
    potty: list(parsed?.potty, normalizePotty),
    meals: list(parsed?.meals, normalizeMeal),
    milestones: list(parsed?.milestones, normalizeMilestone),
  };
}

export function childStorageHasData(data: ChildStorage): boolean {
  return Boolean(
    data.profile ||
      data.feeds.length ||
      data.diapers.length ||
      data.sleeps.length ||
      data.growth.length ||
      data.solids.length ||
      data.health.length ||
      data.potty.length ||
      data.meals.length ||
      data.milestones.length,
  );
}

export function readChildStorage(): ChildStorage {
  if (typeof window === "undefined") return DEFAULT_CHILD_STORAGE;
  try {
    const raw = localStorage.getItem(CHILD_STORAGE_KEY);
    if (!raw) return DEFAULT_CHILD_STORAGE;
    return normalizeChildStorage(JSON.parse(raw) as Partial<ChildStorage>);
  } catch {
    return DEFAULT_CHILD_STORAGE;
  }
}

function writeChildStorage(data: ChildStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHILD_STORAGE_KEY, JSON.stringify(data));
}

let cached: ChildStorage | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeChildStorage(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined" && !hydrated) {
    queueMicrotask(() => {
      if (hydrated) return;
      cached = readChildStorage();
      hydrated = true;
      notify();
    });
  }
  return () => listeners.delete(listener);
}

export function getChildStorageSnapshot(): ChildStorage {
  return cached ?? DEFAULT_CHILD_STORAGE;
}

export function getChildStorageServerSnapshot(): ChildStorage {
  return DEFAULT_CHILD_STORAGE;
}

export function isChildStorageHydrated(): boolean {
  return hydrated;
}

export function updateChildStorage(updater: (prev: ChildStorage) => ChildStorage): void {
  const base = cached ?? readChildStorage();
  const next = normalizeChildStorage(updater(base));
  cached = next;
  hydrated = true;
  writeChildStorage(next);
  notify();
}

/** Replace the local cache from a remote pull. Does not schedule another upload. */
export function replaceChildStorage(data: ChildStorage): void {
  const next = normalizeChildStorage(data);
  cached = next;
  hydrated = true;
  writeChildStorage(next);
  notify();
}

/** Drop child logs on this device and show the empty defaults. */
export function resetChildStorage(): void {
  const next = structuredClone(DEFAULT_CHILD_STORAGE);
  cached = next;
  hydrated = true;
  writeChildStorage(next);
  notify();
}
