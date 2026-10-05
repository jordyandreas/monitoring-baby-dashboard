import { rowToWater, waterToRow } from "@/lib/supabase/mappers";
import { DEFAULT_STORAGE, type WaterEntry, type WaterState } from "@/lib/pregnancy/types";
import { throwOnError, withAccount } from "@/services/account";
import { syncPushSchedules } from "@/services/push-reminders.service";

export async function getWater(): Promise<WaterState> {
  return withAccount(async (supabase, userId) => {
    const [entriesRes, settingsRes] = await Promise.all([
      supabase
        .from("water_logs")
        .select("*")
        .eq("user_id", userId)
        .order("logged_date", { ascending: false })
        .order("logged_time", { ascending: false }),
      supabase.from("user_settings").select("glass_size_ml").eq("user_id", userId).maybeSingle(),
    ]);
    if (entriesRes.error) throw new Error(entriesRes.error.message);
    if (settingsRes.error) throw new Error(settingsRes.error.message);
    return {
      glassSizeMl: settingsRes.data?.glass_size_ml ?? DEFAULT_STORAGE.water.glassSizeMl,
      entries: (entriesRes.data ?? []).map(rowToWater),
    };
  });
}

export async function insertWater(entry: WaterEntry): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("water_logs").insert(waterToRow(userId, entry)));
  });
  await syncPushSchedules();
}

export async function deleteWater(id: string): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("water_logs").delete().eq("user_id", userId).eq("id", id),
    );
  });
  await syncPushSchedules();
}

export async function saveGlassSize(glassSizeMl: number): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("user_settings").upsert({ user_id: userId, glass_size_ml: glassSizeMl }),
    );
  });
}
