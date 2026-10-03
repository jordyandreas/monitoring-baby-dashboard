import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChildProfile, ChildStorage, MilestoneKey } from "@/lib/child/types";
import { updateChildStorage } from "@/lib/child/storage";
import type { Database } from "@/lib/supabase/database.types";
import {
  childProfileToRow,
  diaperToRow,
  feedToRow,
  growthToRow,
  healthToRow,
  mealToRow,
  milestoneToRow,
  pottyToRow,
  rowsToChildStorage,
  sleepToRow,
  solidToRow,
} from "@/lib/supabase/child-mappers";
import type {
  DiaperEntry,
  FeedEntry,
  GrowthEntry,
  HealthEntry,
  MealEntry,
  PottyEntry,
  SleepEntry,
  SolidEntry,
} from "@/lib/child/types";

type Client = SupabaseClient<Database>;

async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}

type LogList = "feeds" | "diapers" | "sleeps" | "growth" | "solids" | "health" | "potty" | "meals";
type WriteMode = "upsert" | "insert";
type RowWrite<T> = (
  entry: T,
  mode: WriteMode,
) => PromiseLike<{ error: { message: string } | null }>;

/** Upsert took the update path on a primary key that belongs to another account. */
function idTakenByAnotherAccount(message: string) {
  return /duplicate key|row-level security policy \(USING expression\)/i.test(message);
}

async function saveWithOwnId<T extends { id: string }>(entry: T, write: RowWrite<T>): Promise<T> {
  const first = await write(entry, "upsert");
  if (!first.error) return entry;
  if (!idTakenByAnotherAccount(first.error.message)) throw new Error(first.error.message);
  const next = { ...entry, id: crypto.randomUUID() };
  const second = await write(next, "insert");
  if (second.error) throw new Error(second.error.message);
  return next;
}

function rememberOwnId(list: LogList, from: string, to: string) {
  if (from === to) return;
  updateChildStorage((prev) => ({
    ...prev,
    [list]: prev[list].map((item) => (item.id === from ? { ...item, id: to } : item)),
  }));
}

async function keepLocalId<T extends { id: string }>(list: LogList, entry: T, write: RowWrite<T>) {
  const saved = await saveWithOwnId(entry, write);
  rememberOwnId(list, entry.id, saved.id);
}

export async function syncChildProfile(
  supabase: Client,
  userId: string,
  profile: ChildProfile | null,
): Promise<void> {
  if (profile) {
    await throwOnError(
      supabase.from("child_profiles").upsert(childProfileToRow(userId, profile)),
    );
    return;
  }
  await throwOnError(supabase.from("child_profiles").delete().eq("user_id", userId));
}

function writeFeed(supabase: Client, userId: string, entry: FeedEntry, mode: WriteMode) {
  const row = feedToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("feed_logs").insert(row)
    : supabase.from("feed_logs").upsert(row, { onConflict: "id" });
}

export async function syncFeedInsert(supabase: Client, userId: string, entry: FeedEntry) {
  await keepLocalId("feeds", entry, (item, mode) => writeFeed(supabase, userId, item, mode));
}

export async function syncFeedUpdate(supabase: Client, userId: string, entry: FeedEntry) {
  await keepLocalId("feeds", entry, (item, mode) => writeFeed(supabase, userId, item, mode));
}

export async function syncFeedDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("feed_logs").delete().eq("user_id", userId).eq("id", id));
}

function writeDiaper(supabase: Client, userId: string, entry: DiaperEntry, mode: WriteMode) {
  const row = diaperToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("diaper_logs").insert(row)
    : supabase.from("diaper_logs").upsert(row, { onConflict: "id" });
}

export async function syncDiaperInsert(supabase: Client, userId: string, entry: DiaperEntry) {
  await keepLocalId("diapers", entry, (item, mode) => writeDiaper(supabase, userId, item, mode));
}

export async function syncDiaperUpdate(supabase: Client, userId: string, entry: DiaperEntry) {
  await keepLocalId("diapers", entry, (item, mode) => writeDiaper(supabase, userId, item, mode));
}

export async function syncDiaperDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("diaper_logs").delete().eq("user_id", userId).eq("id", id));
}

function writeSleep(supabase: Client, userId: string, entry: SleepEntry, mode: WriteMode) {
  const row = sleepToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("sleep_logs").insert(row)
    : supabase.from("sleep_logs").upsert(row, { onConflict: "id" });
}

export async function syncSleepInsert(supabase: Client, userId: string, entry: SleepEntry) {
  await keepLocalId("sleeps", entry, (item, mode) => writeSleep(supabase, userId, item, mode));
}

export async function syncSleepUpdate(supabase: Client, userId: string, entry: SleepEntry) {
  await keepLocalId("sleeps", entry, (item, mode) => writeSleep(supabase, userId, item, mode));
}

export async function syncSleepDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("sleep_logs").delete().eq("user_id", userId).eq("id", id));
}

function writeGrowth(supabase: Client, userId: string, entry: GrowthEntry, mode: WriteMode) {
  const row = growthToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("growth_logs").insert(row)
    : supabase.from("growth_logs").upsert(row, { onConflict: "id" });
}

export async function syncGrowthInsert(supabase: Client, userId: string, entry: GrowthEntry) {
  await keepLocalId("growth", entry, (item, mode) => writeGrowth(supabase, userId, item, mode));
}

export async function syncGrowthDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("growth_logs").delete().eq("user_id", userId).eq("id", id));
}

function writeSolid(supabase: Client, userId: string, entry: SolidEntry, mode: WriteMode) {
  const row = solidToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("solid_logs").insert(row)
    : supabase.from("solid_logs").upsert(row, { onConflict: "id" });
}

export async function syncSolidInsert(supabase: Client, userId: string, entry: SolidEntry) {
  await keepLocalId("solids", entry, (item, mode) => writeSolid(supabase, userId, item, mode));
}

export async function syncSolidDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("solid_logs").delete().eq("user_id", userId).eq("id", id));
}

function writeHealth(supabase: Client, userId: string, entry: HealthEntry, mode: WriteMode) {
  const row = healthToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("health_logs").insert(row)
    : supabase.from("health_logs").upsert(row, { onConflict: "id" });
}

export async function syncHealthInsert(supabase: Client, userId: string, entry: HealthEntry) {
  await keepLocalId("health", entry, (item, mode) => writeHealth(supabase, userId, item, mode));
}

export async function syncHealthDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("health_logs").delete().eq("user_id", userId).eq("id", id));
}

function writePotty(supabase: Client, userId: string, entry: PottyEntry, mode: WriteMode) {
  const row = pottyToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("potty_logs").insert(row)
    : supabase.from("potty_logs").upsert(row, { onConflict: "id" });
}

export async function syncPottyInsert(supabase: Client, userId: string, entry: PottyEntry) {
  await keepLocalId("potty", entry, (item, mode) => writePotty(supabase, userId, item, mode));
}

export async function syncPottyDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("potty_logs").delete().eq("user_id", userId).eq("id", id));
}

function writeMeal(supabase: Client, userId: string, entry: MealEntry, mode: WriteMode) {
  const row = mealToRow(userId, entry);
  return mode === "insert"
    ? supabase.from("meal_logs").insert(row)
    : supabase.from("meal_logs").upsert(row, { onConflict: "id" });
}

export async function syncMealInsert(supabase: Client, userId: string, entry: MealEntry) {
  await keepLocalId("meals", entry, (item, mode) => writeMeal(supabase, userId, item, mode));
}

export async function syncMealDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("meal_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncMilestone(
  supabase: Client,
  userId: string,
  key: MilestoneKey,
  date: string | null,
): Promise<void> {
  if (!date) {
    await throwOnError(
      supabase.from("milestone_logs").delete().eq("user_id", userId).eq("milestone_key", key),
    );
    return;
  }
  await throwOnError(
    supabase.from("milestone_logs").upsert(milestoneToRow(userId, { key, date }), {
      onConflict: "user_id,milestone_key",
    }),
  );
}

export async function fetchRemoteChild(supabase: Client, userId: string): Promise<ChildStorage> {
  const [profile, feeds, diapers, sleeps, growth, solids, health, potty, meals, milestones] =
    await Promise.all([
      supabase.from("child_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("feed_logs").select("*").eq("user_id", userId),
      supabase.from("diaper_logs").select("*").eq("user_id", userId),
      supabase.from("sleep_logs").select("*").eq("user_id", userId),
      supabase.from("growth_logs").select("*").eq("user_id", userId),
      supabase.from("solid_logs").select("*").eq("user_id", userId),
      supabase.from("health_logs").select("*").eq("user_id", userId),
      supabase.from("potty_logs").select("*").eq("user_id", userId),
      supabase.from("meal_logs").select("*").eq("user_id", userId),
      supabase.from("milestone_logs").select("*").eq("user_id", userId),
    ]);

  const errors = [
    profile.error,
    feeds.error,
    diapers.error,
    sleeps.error,
    growth.error,
    solids.error,
    health.error,
    potty.error,
    meals.error,
    milestones.error,
  ].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join("; "));
  }

  return rowsToChildStorage({
    profile: profile.data,
    feeds: feeds.data ?? [],
    diapers: diapers.data ?? [],
    sleeps: sleeps.data ?? [],
    growth: growth.data ?? [],
    solids: solids.data ?? [],
    health: health.data ?? [],
    potty: potty.data ?? [],
    meals: meals.data ?? [],
    milestones: milestones.data ?? [],
  });
}
