export type Gender = "boy" | "girl" | "not-yet";

export interface BabyProfile {
  name: string;
  gender: Gender;
  dueDate: string;
}

export interface KickEntry {
  id: string;
  date: string;
  time: string;
}

export interface BabyPlusState {
  startDate: string;
  completions: Record<string, boolean>;
}

export interface AppStorage {
  version: 1;
  baby: BabyProfile | null;
  babyPlus: BabyPlusState;
  kicks: KickEntry[];
}

export const STORAGE_KEY = "baby-monitor-v1";

export const DEFAULT_STORAGE: AppStorage = {
  version: 1,
  baby: null,
  babyPlus: {
    startDate: "",
    completions: {},
  },
  kicks: [],
};
