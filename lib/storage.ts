import { rolloverVitaminState } from "./vitamins";
import {
  DEFAULT_STORAGE,
  STORAGE_KEY,
  type AppStorage,
  type Gender,
  type VitaminState,
} from "./types";

function normalizeGender(gender: string): Gender {
  if (gender === "boy" || gender === "girl") return gender;
  if (gender === "not-yet" || gender === "other") return "not-yet";
  return "not-yet";
}

function normalizeStorage(parsed: Partial<AppStorage>): AppStorage {
  return {
    ...DEFAULT_STORAGE,
    ...parsed,
    version: 1,
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

    if ((parsed.kicks?.length ?? 0) !== normalized.kicks.length) {
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
