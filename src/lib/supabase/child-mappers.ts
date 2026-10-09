import type {
  ChildProfile,
  ChildStorage,
  DiaperEntry,
  FeedEntry,
  GrowthEntry,
  HealthEntry,
  MealEntry,
  MilestoneEntry,
  PottyEntry,
  PumpEntry,
  SleepEntry,
  SolidEntry,
} from "@/lib/child/types";
import { DEFAULT_CHILD_STORAGE } from "@/lib/child/types";
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

export function childProfileToRow(
  userId: string,
  profile: ChildProfile,
): Tables["child_profiles"]["Insert"] {
  return {
    user_id: userId,
    name: profile.name,
    gender: profile.gender,
    birth_date: profile.birthDate,
  };
}

export function rowToChildProfile(row: Tables["child_profiles"]["Row"]): ChildProfile | null {
  if (!row.birth_date || !row.name.trim()) return null;
  const gender = row.gender === "boy" || row.gender === "girl" ? row.gender : "not-yet";
  return { name: row.name.trim(), gender, birthDate: row.birth_date };
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
  if (row.poop_amount === "little" || row.poop_amount === "much") {
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

export function solidToRow(userId: string, entry: SolidEntry): Tables["solid_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    name: entry.name,
    allergy_note: entry.allergyNote ?? null,
  };
}

export function rowToSolid(row: Tables["solid_logs"]["Row"]): SolidEntry {
  return {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    name: row.name,
    ...(row.allergy_note ? { allergyNote: row.allergy_note } : {}),
  };
}

export function healthToRow(userId: string, entry: HealthEntry): Tables["health_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    name: entry.name,
    dose: entry.dose,
    temperature_c: entry.temperatureC ?? null,
  };
}

export function rowToHealth(row: Tables["health_logs"]["Row"]): HealthEntry {
  const temperatureC = num(row.temperature_c);
  return {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    name: row.name,
    dose: row.dose,
    ...(temperatureC !== undefined ? { temperatureC } : {}),
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

export function mealToRow(userId: string, entry: MealEntry): Tables["meal_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: clock(entry.time),
    slot: entry.slot,
    note: entry.note,
  };
}

export function rowToMeal(row: Tables["meal_logs"]["Row"]): MealEntry {
  const slot =
    row.slot === "breakfast" || row.slot === "lunch" || row.slot === "snack" || row.slot === "dinner"
      ? row.slot
      : "snack";
  return {
    id: row.id,
    date: row.logged_date,
    time: hhmm(row.logged_time),
    slot,
    note: row.note,
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

export function rowsToChildStorage(input: {
  profile: Tables["child_profiles"]["Row"] | null;
  feeds: Tables["feed_logs"]["Row"][];
  pumps: Tables["pump_logs"]["Row"][];
  diapers: Tables["diaper_logs"]["Row"][];
  sleeps: Tables["sleep_logs"]["Row"][];
  growth: Tables["growth_logs"]["Row"][];
  solids: Tables["solid_logs"]["Row"][];
  health: Tables["health_logs"]["Row"][];
  potty: Tables["potty_logs"]["Row"][];
  meals: Tables["meal_logs"]["Row"][];
  milestones: Tables["milestone_logs"]["Row"][];
}): ChildStorage {
  return {
    ...DEFAULT_CHILD_STORAGE,
    profile: input.profile ? rowToChildProfile(input.profile) : null,
    feeds: input.feeds.map(rowToFeed),
    pumps: input.pumps.map(rowToPump),
    diapers: input.diapers.map(rowToDiaper),
    sleeps: input.sleeps.map(rowToSleep),
    growth: input.growth.map(rowToGrowth),
    solids: input.solids.map(rowToSolid),
    health: input.health.map(rowToHealth),
    potty: input.potty.map(rowToPotty),
    meals: input.meals.map(rowToMeal),
    milestones: input.milestones.map(rowToMilestone).filter((item): item is MilestoneEntry => item !== null),
  };
}
