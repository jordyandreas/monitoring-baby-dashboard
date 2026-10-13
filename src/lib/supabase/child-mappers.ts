import type {
  ChildProfile,
  ChildStorage,
  DiaperEntry,
  EliminationTracking,
  FeedEntry,
  FoodEntry,
  FoodSlot,
  FoodTracking,
  GrowthEntry,
  HealthEntry,
  MilestoneEntry,
  PottyEntry,
  PumpEntry,
  SleepEntry,
  VaccineEntry,
} from "@/lib/child/types";
import { DEFAULT_CHILD_STORAGE, VACCINE_KEYS } from "@/lib/child/types";
import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];

function hhmm(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function clock(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function num(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function foodTracking(value: string | null | undefined): FoodTracking {
  if (value === "on" || value === "off" || value === "auto") return value;
  return "auto";
}

function eliminationTracking(value: string | null | undefined): EliminationTracking {
  if (value === "diaper" || value === "potty" || value === "auto") return value;
  return "auto";
}

function foodSlot(value: string | null | undefined): FoodSlot | undefined {
  if (value === "breakfast" || value === "lunch" || value === "snack" || value === "dinner") return value;
  return undefined;
}

export function childProfileToRow(
  userId: string,
  profile: ChildProfile,
): Tables["child_profiles"]["Insert"] {
  return {
    user_id: userId,
    name: profile.name,
    gender: profile.gender,
    birth_date: profile.birthDate,
    food_tracking: profile.foodTracking,
    elimination_tracking: profile.eliminationTracking,
  };
}

export function rowToChildProfile(row: Tables["child_profiles"]["Row"]): ChildProfile | null {
  if (!row.birth_date || !row.name.trim()) return null;
  const gender = row.gender === "boy" || row.gender === "girl" ? row.gender : "not-yet";
  return {
    name: row.name.trim(),
    gender,
    birthDate: row.birth_date,
    foodTracking: foodTracking(row.food_tracking),
    eliminationTracking: eliminationTracking(row.elimination_tracking),
  };
}

export function feedToRow(userId: string, entry: FeedEntry): Tables["feed_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    kind: entry.kind,
    side: entry.side ?? null,
    duration_min: entry.durationMin ?? null,
    amount_ml: entry.amountMl ?? null,
  };
}

export function rowToFeed(row: Tables["feed_logs"]["Row"]): FeedEntry {
  const kind =
    row.kind === "breast" || row.kind === "bottle-breast" || row.kind === "formula"
      ? row.kind
      : "bottle-breast";
  const side =
    row.side === "left" || row.side === "right" || row.side === "both" ? row.side : undefined;
  const entry: FeedEntry = {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    kind,
  };
  if (side) entry.side = side;
  if (row.duration_min != null) entry.durationMin = row.duration_min;
  if (row.amount_ml != null) entry.amountMl = row.amount_ml;
  return entry;
}

export function pumpToRow(userId: string, entry: PumpEntry): Tables["pump_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    amount_ml: entry.amountMl,
  };
}

export function rowToPump(row: Tables["pump_logs"]["Row"]): PumpEntry {
  return {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    amountMl: row.amount_ml,
  };
}

export function diaperToRow(userId: string, entry: DiaperEntry): Tables["diaper_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    kind: entry.kind,
    poop_color: entry.poopColor ?? null,
    poop_texture: entry.poopTexture ?? null,
    poop_amount: entry.poopAmount ?? null,
  };
}

export function rowToDiaper(row: Tables["diaper_logs"]["Row"]): DiaperEntry {
  const kind = row.kind === "pee" || row.kind === "poop" || row.kind === "both" ? row.kind : "pee";
  const entry: DiaperEntry = {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    kind,
  };
  if (row.poop_color === "yellow" || row.poop_color === "green" || row.poop_color === "black" || row.poop_color === "brown" || row.poop_color === "other") {
    entry.poopColor = row.poop_color;
  }
  if (row.poop_texture === "liquid" || row.poop_texture === "soft" || row.poop_texture === "solid") {
    entry.poopTexture = row.poop_texture;
  }
  if (row.poop_amount === "little" || row.poop_amount === "medium" || row.poop_amount === "much") {
    entry.poopAmount = row.poop_amount;
  }
  return entry;
}

export function sleepToRow(userId: string, entry: SleepEntry): Tables["sleep_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    start_time: clock(entry.startTime),
    end_time: clock(entry.endTime),
    period: entry.period,
  };
}

export function rowToSleep(row: Tables["sleep_logs"]["Row"]): SleepEntry {
  return {
    id: row.id,
    date: row.logged_date,
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    period: row.period === "night" ? "night" : "day",
  };
}

export function growthToRow(userId: string, entry: GrowthEntry): Tables["growth_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    measured_on: entry.date,
    weight_kg: entry.weightKg ?? null,
    length_cm: entry.lengthCm ?? null,
    head_cm: entry.headCm ?? null,
  };
}

export function rowToGrowth(row: Tables["growth_logs"]["Row"]): GrowthEntry {
  const entry: GrowthEntry = { id: row.id, date: row.measured_on };
  const weightKg = num(row.weight_kg);
  const lengthCm = num(row.length_cm);
  const headCm = num(row.head_cm);
  if (weightKg !== undefined) entry.weightKg = weightKg;
  if (lengthCm !== undefined) entry.lengthCm = lengthCm;
  if (headCm !== undefined) entry.headCm = headCm;
  return entry;
}

export function foodToRow(userId: string, entry: FoodEntry): Tables["food_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    name: entry.name,
    slot: entry.slot ?? null,
    allergy_note: entry.allergyNote ?? null,
  };
}

export function rowToFood(row: Tables["food_logs"]["Row"]): FoodEntry {
  const slot = foodSlot(row.slot);
  return {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    name: row.name,
    ...(slot ? { slot } : {}),
    ...(row.allergy_note ? { allergyNote: row.allergy_note } : {}),
  };
}

export function healthToRow(userId: string, entry: HealthEntry): Tables["health_logs"]["Insert"] {
  const temperature = entry.kind === "temperature";
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    kind: entry.kind,
    name: temperature ? "" : entry.name,
    dose: temperature ? "" : entry.dose,
    temperature_c: temperature ? (entry.temperatureC ?? null) : null,
  };
}

export function rowToHealth(row: Tables["health_logs"]["Row"]): HealthEntry {
  const temperatureC = num(row.temperature_c);
  const kind = row.kind === "temperature" || (row.kind !== "medicine" && temperatureC !== undefined && !row.name.trim())
    ? "temperature"
    : "medicine";
  return {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    kind,
    name: kind === "medicine" ? row.name : "",
    dose: kind === "medicine" ? row.dose : "",
    ...(kind === "temperature" && temperatureC !== undefined ? { temperatureC } : {}),
  };
}

export function pottyToRow(userId: string, entry: PottyEntry): Tables["potty_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    kind: entry.kind,
  };
}

export function rowToPotty(row: Tables["potty_logs"]["Row"]): PottyEntry {
  const kind =
    row.kind === "pee" || row.kind === "poop" || row.kind === "accident" || row.kind === "diaper"
      ? row.kind
      : "pee";
  return {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    kind,
  };
}

export function milestoneToRow(
  userId: string,
  entry: MilestoneEntry,
): Tables["milestone_logs"]["Insert"] {
  return {
    user_id: userId,
    milestone_key: entry.key,
    achieved_on: entry.date,
  };
}

export function rowToMilestone(row: Tables["milestone_logs"]["Row"]): MilestoneEntry | null {
  const keys = ["smile", "roll", "sit", "crawl", "stand", "walk", "firstWord", "run"] as const;
  const key = keys.find((item) => item === row.milestone_key);
  if (!key) return null;
  return { key, date: row.achieved_on };
}

export function vaccineToRow(
  userId: string,
  entry: VaccineEntry,
): Tables["vaccine_logs"]["Insert"] {
  return {
    user_id: userId,
    vaccine_key: entry.key,
    given_on: entry.date,
  };
}

export function rowToVaccine(row: Tables["vaccine_logs"]["Row"]): VaccineEntry | null {
  const key = VACCINE_KEYS.find((item) => item === row.vaccine_key);
  if (!key) return null;
  return { key, date: row.given_on };
}

export function rowsToChildStorage(input: {
  profile: Tables["child_profiles"]["Row"] | null;
  feeds: Tables["feed_logs"]["Row"][];
  pumps: Tables["pump_logs"]["Row"][];
  diapers: Tables["diaper_logs"]["Row"][];
  sleeps: Tables["sleep_logs"]["Row"][];
  growth: Tables["growth_logs"]["Row"][];
  foods: Tables["food_logs"]["Row"][];
  health: Tables["health_logs"]["Row"][];
  potty: Tables["potty_logs"]["Row"][];
  milestones: Tables["milestone_logs"]["Row"][];
  vaccines: Tables["vaccine_logs"]["Row"][];
}): ChildStorage {
  return {
    ...DEFAULT_CHILD_STORAGE,
    profile: input.profile ? rowToChildProfile(input.profile) : null,
    feeds: input.feeds.map(rowToFeed),
    pumps: input.pumps.map(rowToPump),
    diapers: input.diapers.map(rowToDiaper),
    sleeps: input.sleeps.map(rowToSleep),
    growth: input.growth.map(rowToGrowth),
    foods: input.foods.map(rowToFood),
    health: input.health.map(rowToHealth),
    potty: input.potty.map(rowToPotty),
    milestones: input.milestones.map(rowToMilestone).filter((item): item is MilestoneEntry => item !== null),
    vaccines: input.vaccines.map(rowToVaccine).filter((item): item is VaccineEntry => item !== null),
  };
}
