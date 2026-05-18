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

export interface VitaminItem {
  id: string;
  name: string;
}

export interface VitaminDayRecord {
  date: string;
  completed: Record<string, boolean>;
}

export interface VitaminState {
  items: VitaminItem[];
  today: VitaminDayRecord;
  yesterday: VitaminDayRecord | null;
}

export interface AppStorage {
  version: 1;
  baby: BabyProfile | null;
  babyPlus: BabyPlusState;
  kicks: KickEntry[];
  vitamins: VitaminState;
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
  vitamins: {
    items: [],
    today: { date: "", completed: {} },
    yesterday: null,
  },
};
