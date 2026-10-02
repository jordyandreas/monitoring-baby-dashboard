import type { SupabaseClient } from "@supabase/supabase-js";
import type { RemindersState } from "@/lib/reminders/types";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  babyPlusToRow,
  babyProfileToRow,
  kickToRow,
  remindersToJson,
  vitaminDayToRow,
  vitaminItemsToRows,
  waterToRow,
} from "@/lib/supabase/mappers";
import type { BabyPlusState, BabyProfile, KickEntry, VitaminState, WaterEntry } from "@/lib/types";

type Client = SupabaseClient<Database>;

async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}

export async function syncBabyProfile(
  supabase: Client,
  userId: string,
  baby: BabyProfile | null,
): Promise<void> {
  if (baby) {
    await throwOnError(
      supabase.from("baby_profiles").upsert(babyProfileToRow(userId, baby)),
    );
    return;
  }
  await throwOnError(supabase.from("baby_profiles").delete().eq("user_id", userId));
}

export async function syncBabyPlus(
  supabase: Client,
  userId: string,
  state: BabyPlusState,
): Promise<void> {
  await throwOnError(
    supabase.from("baby_plus_programs").upsert(babyPlusToRow(userId, state)),
  );
}

export async function syncKickInsert(
  supabase: Client,
  userId: string,
  kick: KickEntry,
): Promise<void> {
  await throwOnError(supabase.from("kick_logs").insert(kickToRow(userId, kick)));
}

export async function syncKickDelete(
  supabase: Client,
  userId: string,
  id: string,
): Promise<void> {
  await throwOnError(
    supabase.from("kick_logs").delete().eq("user_id", userId).eq("id", id),
  );
}

export async function syncWaterInsert(
  supabase: Client,
  userId: string,
  entry: WaterEntry,
): Promise<void> {
  await throwOnError(supabase.from("water_logs").insert(waterToRow(userId, entry)));
}

export async function syncWaterDelete(
  supabase: Client,
  userId: string,
  id: string,
): Promise<void> {
  await throwOnError(
    supabase.from("water_logs").delete().eq("user_id", userId).eq("id", id),
  );
}

export async function syncGlassSize(
  supabase: Client,
  userId: string,
  glassSizeMl: number,
): Promise<void> {
  await throwOnError(
    supabase.from("user_settings").upsert({
      user_id: userId,
      glass_size_ml: glassSizeMl,
    }),
  );
}

export async function syncReminders(
  supabase: Client,
  userId: string,
  reminders: RemindersState,
): Promise<void> {
  await throwOnError(
    supabase.from("notification_preferences").upsert({
      user_id: userId,
      preferences: remindersToJson(reminders) as unknown as Json,
    }),
  );
}

/** Replace vitamin items and the today/yesterday logs. Lists stay small. */
export async function syncVitamins(
  supabase: Client,
  userId: string,
  vitamins: VitaminState,
): Promise<void> {
  await throwOnError(supabase.from("vitamin_items").delete().eq("user_id", userId));
  const vitaminItems = vitaminItemsToRows(userId, vitamins.items);
  if (vitaminItems.length > 0) {
    await throwOnError(supabase.from("vitamin_items").insert(vitaminItems));
  }

  await throwOnError(supabase.from("vitamin_day_logs").delete().eq("user_id", userId));
  const dayRows = [vitamins.today, vitamins.yesterday]
    .map((record) => (record ? vitaminDayToRow(userId, record) : null))
    .filter((row): row is NonNullable<typeof row> => row !== null);
  if (dayRows.length > 0) {
    await throwOnError(supabase.from("vitamin_day_logs").upsert(dayRows));
  }
}
