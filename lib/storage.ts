import { DEFAULT_STORAGE, STORAGE_KEY, type AppStorage, type Gender } from "./types";

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
    kicks: parsed.kicks ?? [],
  };
}

export function readStorage(): AppStorage {
  if (typeof window === "undefined") return DEFAULT_STORAGE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORAGE;

    const parsed = JSON.parse(raw) as Partial<AppStorage>;
    return normalizeStorage(parsed);
  } catch {
    return DEFAULT_STORAGE;
  }
}

export function writeStorage(data: AppStorage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
