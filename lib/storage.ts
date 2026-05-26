import { rolloverVitaminState } from "./vitamins";
import { normalizeGlassSize } from "./water";
import { DEFAULT_REMINDERS } from "./reminders/types";
import {
  DEFAULT_STORAGE,
  STORAGE_KEY,
  type AppStorage,
  type Gender,
  type VitaminState,
  type WaterEntry,
  type WaterState,
} from "./types";
import type { RemindersState } from "./reminders/types";

function normalizeGender(gender: string): Gender {
  if (gender === "boy" || gender === "girl") return gender;
  if (gender === "not-yet" || gender === "other") return "not-yet";
  return "not-yet";
}

function normalizeReminders(reminders?: Partial<RemindersState>): RemindersState {
  return {
    vitamins: {
      ...DEFAULT_REMINDERS.vitamins,
      ...reminders?.vitamins,
    },
    babyPlus: {
      ...DEFAULT_REMINDERS.babyPlus,
      ...reminders?.babyPlus,
    },
    kicks: {
      ...DEFAULT_REMINDERS.kicks,
      ...reminders?.kicks,
    },
    hydration: {
      ...DEFAULT_REMINDERS.hydration,
      ...reminders?.hydration,
    },
  };
}

function normalizeStorage(parsed: Partial<AppStorage>): AppStorage {
  return {
    ...DEFAULT_STORAGE,
    ...parsed,
    version: 1,
    reminders: normalizeReminders(parsed.reminders),
    baby: parsed.baby
      ? {
          ...parsed.baby,
          gender: normalizeGender(parsed.baby.gender as string),
        }
      : null,
    babyPlus: {
      ...DEFAULT_STORAGE.babyPlus,
      ...parsed.babyPlus,
    },
    kicks: (parsed.kicks ?? []).filter((kick) => !kick.id.startsWith("sample-")),
    vitamins: normalizeVitamins(parsed.vitamins),
    water: normalizeWater(parsed.water),
  };
}

function normalizeWaterEntry(
  entry: Partial<WaterEntry>,
  fallbackDate?: string,
): WaterEntry | null {
  if (!entry?.id || typeof entry.amountMl !== "number") return null;
  const amountMl = Math.round(entry.amountMl);
  if (amountMl <= 0 || amountMl > 2000) return null;
  const date =
    typeof entry.date === "string" && entry.date
      ? entry.date
      : fallbackDate ?? "";
  if (!date) return null;
  return {
    id: entry.id,
    date,
    time: typeof entry.time === "string" ? entry.time : "",
    amountMl,
  };
}

/** Migrate legacy today/yesterday buckets into a flat entry list. */
function migrateLegacyWaterEntries(water: Record<string, unknown>): WaterEntry[] {
  const entries: WaterEntry[] = [];
  const today = water.today as
    | { date?: string; entries?: Partial<WaterEntry>[] }
    | undefined;
  const yesterday = water.yesterday as
    | { date?: string; entries?: Partial<WaterEntry>[] }
    | undefined;

  for (const day of [yesterday, today]) {
    if (!day?.date) continue;
    for (const raw of day.entries ?? []) {
      const normalized = normalizeWaterEntry(raw, day.date);
      if (normalized) entries.push(normalized);
    }
  }

  return entries;
}

function normalizeWater(water?: unknown): WaterState {
  const raw = water as (Partial<WaterState> & Record<string, unknown>) | undefined;
  let entries: WaterEntry[] = [];

  if (Array.isArray(raw?.entries)) {
    entries = raw.entries
      .map((e) => normalizeWaterEntry(e))
      .filter((e): e is WaterEntry => e !== null);
  } else if (raw && ("today" in raw || "yesterday" in raw)) {
    entries = migrateLegacyWaterEntries(raw);
  }

  return {
    glassSizeMl: normalizeGlassSize(raw?.glassSizeMl),
    entries,
  };
}

function normalizeVitamins(vitamins?: Partial<VitaminState>): VitaminState {
  const base = {
    ...DEFAULT_STORAGE.vitamins,
    ...vitamins,
    items: vitamins?.items ?? [],
    today: {
      ...DEFAULT_STORAGE.vitamins.today,
      ...vitamins?.today,
      completed: vitamins?.today?.completed ?? {},
    },
    yesterday: vitamins?.yesterday ?? null,
  };
  return rolloverVitaminState(base);
}

export function readStorage(): AppStorage {
  if (typeof window === "undefined") return DEFAULT_STORAGE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORAGE;

    const parsed = JSON.parse(raw) as Partial<AppStorage>;
    const normalized = normalizeStorage(parsed);

    const hadSampleKicks =
      (parsed.kicks?.length ?? 0) !== normalized.kicks.length;
    const hadLegacyWater =
      parsed.water != null &&
      typeof parsed.water === "object" &&
      "today" in parsed.water;

    if (hadSampleKicks || hadLegacyWater) {
      writeStorage(normalized);
    }

    return normalized;
  } catch {
    return DEFAULT_STORAGE;
  }
}

export function writeStorage(data: AppStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let cached: AppStorage | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function notifyAppStorageListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeAppStorage(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window !== "undefined" && !hydrated) {
    queueMicrotask(() => {
      if (hydrated) return;
      cached = readStorage();
      hydrated = true;
      notifyAppStorageListeners();
    });
  }

  return () => listeners.delete(listener);
}

export function getAppStorageSnapshot(): AppStorage {
  return cached ?? DEFAULT_STORAGE;
}

export function getAppStorageServerSnapshot(): AppStorage {
  return DEFAULT_STORAGE;
}

export function isAppStorageHydrated(): boolean {
  return hydrated;
}

export function updateAppStorage(
  updater: (prev: AppStorage) => AppStorage,
): void {
  const base = cached ?? readStorage();
  const next = updater(base);
  cached = next;
  hydrated = true;
  writeStorage(next);
  notifyAppStorageListeners();
}
