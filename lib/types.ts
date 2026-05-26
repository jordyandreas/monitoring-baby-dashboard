export type Gender = "boy" | "girl" | "not-yet";

export interface BabyProfile {
  name: string;
  gender: Gender;
  /** Last menstrual period (LMP) / HPHT, stored as yyyy-MM-dd when set. */
  lmpDate?: string;
  dueDate: string;
}

export interface KickEntry {
  id: string;
  date: string;
  time: string;
}

export interface BabyPlusState {
  startDate: string;
  /** Daily listening time in 24h `HH:mm` (browser local timezone). */
  dailyTime: string;
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

export interface WaterEntry {
  id: string;
  date: string;
  time: string;
  amountMl: number;
}

export interface WaterState {
  /** Quick-add glass size in ml (default 250). */
  glassSizeMl: number;
  entries: WaterEntry[];
}

import type { RemindersState } from "./reminders/types";
import { DEFAULT_REMINDERS } from "./reminders/types";

export interface AppStorage {
  version: 1;
  baby: BabyProfile | null;
  babyPlus: BabyPlusState;
  kicks: KickEntry[];
  vitamins: VitaminState;
  water: WaterState;
  reminders: RemindersState;
}

export { DEFAULT_REMINDERS };

export const STORAGE_KEY = "baby-monitor-v1";

export const DEFAULT_STORAGE: AppStorage = {
  version: 1,
  baby: null,
  babyPlus: {
    startDate: "",
    dailyTime: "",
    completions: {},
  },
  kicks: [],
  vitamins: {
    items: [],
    today: { date: "", completed: {} },
    yesterday: null,
  },
  water: {
    glassSizeMl: 250,
    entries: [],
  },
  reminders: DEFAULT_REMINDERS,
};
