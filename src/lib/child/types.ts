import type { Gender } from "@/lib/pregnancy/types";

export type FeedKind = "breast" | "bottle-breast" | "formula";
export type FeedSide = "left" | "right" | "both";

export type FeedEntry = {
  id: string;
  date: string;
  time: string;
  kind: FeedKind;
  side?: FeedSide;
  durationMin?: number;
  amountMl?: number;
};

export type PumpEntry = {
  id: string;
  date: string;
  time: string;
  amountMl: number;
};

export type DiaperKind = "pee" | "poop" | "both";
export type PoopColor = "yellow" | "green" | "black" | "brown" | "other";
export type PoopTexture = "liquid" | "soft" | "solid";
export type PoopAmount = "little" | "medium" | "much";

export type DiaperEntry = {
  id: string;
  date: string;
  time: string;
  kind: DiaperKind;
  poopColor?: PoopColor;
  poopTexture?: PoopTexture;
  poopAmount?: PoopAmount;
};

export type SleepPeriod = "day" | "night";

export type SleepEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  period: SleepPeriod;
};

export type GrowthEntry = {
  id: string;
  date: string;
  weightKg?: number;
  lengthCm?: number;
  headCm?: number;
};

export type SolidEntry = {
  id: string;
  date: string;
  time: string;
  name: string;
  allergyNote?: string;
};

export type HealthEntry = {
  id: string;
  date: string;
  time: string;
  name: string;
  dose: string;
  temperatureC?: number;
};

export type PottyKind = "pee" | "poop" | "accident" | "diaper";

export type PottyEntry = {
  id: string;
  date: string;
  time: string;
  kind: PottyKind;
};

export type MealSlot = "breakfast" | "lunch" | "snack" | "dinner";

export type MealEntry = {
  id: string;
  date: string;
  time: string;
  slot: MealSlot;
  note: string;
};

export const MILESTONE_KEYS = [
  "smile",
  "roll",
  "sit",
  "crawl",
  "stand",
  "walk",
  "firstWord",
  "run",
] as const;

export type MilestoneKey = (typeof MILESTONE_KEYS)[number];

export type MilestoneEntry = {
  key: MilestoneKey;
  date: string;
};

export type ChildProfile = {
  name: string;
  gender: Gender;
  birthDate: string;
};

export interface ChildStorage {
  version: 1;
  profile: ChildProfile | null;
  feeds: FeedEntry[];
  pumps: PumpEntry[];
  diapers: DiaperEntry[];
  sleeps: SleepEntry[];
  growth: GrowthEntry[];
  solids: SolidEntry[];
  health: HealthEntry[];
  potty: PottyEntry[];
  meals: MealEntry[];
  milestones: MilestoneEntry[];
}

export const DEFAULT_CHILD_STORAGE: ChildStorage = {
  version: 1,
  profile: null,
  feeds: [],
  pumps: [],
  diapers: [],
  sleeps: [],
  growth: [],
  solids: [],
  health: [],
  potty: [],
  meals: [],
  milestones: [],
};
