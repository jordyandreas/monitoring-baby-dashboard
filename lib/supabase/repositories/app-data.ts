import type { SupabaseClient } from "@supabase/supabase-js";
import { REMINDER_FIRED_KEY } from "@/lib/reminders/fired-storage";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  babyPlusToRow,
  babyProfileToRow,
  jsonToReminders,
  kickToRow,
  remindersToJson,
  rowToBabyPlus,
  rowToBabyProfile,
  rowToKick,
  rowToWater,
  rowsToVitaminState,
  type RemoteAppSlice,
  vitaminDayToRow,
  vitaminItemsToRows,
  waterToRow,
} from "@/lib/supabase/mappers";
import type { AppStorage } from "@/lib/types";
import { DEFAULT_STORAGE } from "@/lib/types";
import { DEVICE_MIGRATION_FLAG_KEY } from "@/lib/supabase/sync-constants";

type Client = SupabaseClient<Database>;

async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}

export async function fetchRemoteAppSlice(
  supabase: Client,
  userId: string,
): Promise<RemoteAppSlice> {
  const [
    profileRes,
    babyRes,
    babyPlusRes,
    vitaminItemsRes,
    vitaminDaysRes,
    kicksRes,
    waterRes,
    settingsRes,
    prefsRes,
    firedRes,
  ] = await Promise.all([
    supabase.from("profiles").select("locale").eq("id", userId).maybeSingle(),
    supabase.from("baby_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("baby_plus_programs").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("vitamin_items").select("*").eq("user_id", userId),
    supabase.from("vitamin_day_logs").select("*").eq("user_id", userId),
    supabase
      .from("kick_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .order("logged_time", { ascending: false }),
    supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .order("logged_time", { ascending: false }),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("reminder_fired_events").select("dedupe_key").eq("user_id", userId),
  ]);

  const errors = [
    profileRes.error,
    babyRes.error,
    babyPlusRes.error,
    vitaminItemsRes.error,
    vitaminDaysRes.error,
    kicksRes.error,
    waterRes.error,
    settingsRes.error,
    prefsRes.error,
    firedRes.error,
  ].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e?.message).join("; "));
  }

  const baby = babyRes.data ? rowToBabyProfile(babyRes.data) : null;
  const babyPlus = babyPlusRes.data
    ? rowToBabyPlus(babyPlusRes.data)
    : DEFAULT_STORAGE.babyPlus;
  const kicks = (kicksRes.data ?? []).map(rowToKick);
  const waterEntries = (waterRes.data ?? []).map(rowToWater);
  const vitamins = rowsToVitaminState(
    vitaminItemsRes.data ?? [],
    vitaminDaysRes.data ?? [],
    DEFAULT_STORAGE.vitamins,
  );
  const reminders = jsonToReminders(prefsRes.data?.preferences);
  const glassSizeMl = settingsRes.data?.glass_size_ml ?? DEFAULT_STORAGE.water.glassSizeMl;

  if (firedRes.data?.length) {
    const fired: Record<string, boolean> = {};
    for (const row of firedRes.data) {
      fired[row.dedupe_key] = true;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(REMINDER_FIRED_KEY, JSON.stringify(fired));
    }
  }

  return {
    locale: profileRes.data?.locale ?? "en",
    baby,
    babyPlus,
    kicks,
    vitamins,
    water: { glassSizeMl, entries: waterEntries },
    reminders,
  };
}

export async function upsertAppStorageToRemote(
  supabase: Client,
  userId: string,
  data: AppStorage,
): Promise<void> {
  if (data.baby) {
    await throwOnError(
      supabase.from("baby_profiles").upsert(babyProfileToRow(userId, data.baby)),
    );
  } else {
    await throwOnError(supabase.from("baby_profiles").delete().eq("user_id", userId));
  }

  await throwOnError(
    supabase.from("baby_plus_programs").upsert(babyPlusToRow(userId, data.babyPlus)),
  );

  await throwOnError(
    supabase.from("user_settings").upsert({
      user_id: userId,
      glass_size_ml: data.water.glassSizeMl,
    }),
  );

  await throwOnError(
    supabase.from("notification_preferences").upsert({
      user_id: userId,
      preferences: remindersToJson(data.reminders) as unknown as Json,
    }),
  );

  // Vitamins: replace items + day logs (simple MVP strategy)
  await throwOnError(supabase.from("vitamin_items").delete().eq("user_id", userId));
  const vitaminItems = vitaminItemsToRows(userId, data.vitamins.items);
  if (vitaminItems.length > 0) {
    await throwOnError(supabase.from("vitamin_items").insert(vitaminItems));
  }

  await throwOnError(supabase.from("vitamin_day_logs").delete().eq("user_id", userId));
  const dayRows = [data.vitamins.today, data.vitamins.yesterday]
    .map((record) => (record ? vitaminDayToRow(userId, record) : null))
    .filter((row): row is NonNullable<typeof row> => row !== null);
  if (dayRows.length > 0) {
    await throwOnError(supabase.from("vitamin_day_logs").upsert(dayRows));
  }

  // Kicks & water: full replace on migration (incremental sync comes in phase 2)
  await throwOnError(supabase.from("kick_logs").delete().eq("user_id", userId));
  if (data.kicks.length > 0) {
    await throwOnError(
      supabase.from("kick_logs").insert(data.kicks.map((k) => kickToRow(userId, k))),
    );
  }

  await throwOnError(supabase.from("water_logs").delete().eq("user_id", userId));
  if (data.water.entries.length > 0) {
    await throwOnError(
      supabase
        .from("water_logs")
        .insert(data.water.entries.map((e) => waterToRow(userId, e))),
    );
  }
}

export async function getSyncMetadata(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("sync_metadata")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function markMigrated(supabase: Client, userId: string) {
  const { error } = await supabase.from("sync_metadata").upsert({
    user_id: userId,
    local_storage_version: 1,
    migrated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** Device flag — prevents re-uploading localStorage on every page load. */
export function hasDeviceMigrationFlag(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEVICE_MIGRATION_FLAG_KEY) === "1";
}

export function setDeviceMigrationFlag(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_MIGRATION_FLAG_KEY, "1");
}
