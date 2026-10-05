import { rowsToVitaminState, vitaminDayToRow, vitaminItemsToRows } from "@/lib/supabase/mappers";
import { DEFAULT_STORAGE, type VitaminState } from "@/lib/pregnancy/types";
import { throwOnError, withAccount } from "@/services/account";
import { syncPushSchedules } from "@/services/push-reminders.service";

export async function getVitamins(): Promise<VitaminState> {
  return withAccount(async (supabase, userId) => {
    const [itemsRes, daysRes] = await Promise.all([
      supabase.from("vitamin_items").select("*").eq("user_id", userId),
      supabase.from("vitamin_day_logs").select("*").eq("user_id", userId),
    ]);
    if (itemsRes.error) throw new Error(itemsRes.error.message);
    if (daysRes.error) throw new Error(daysRes.error.message);
    return rowsToVitaminState(itemsRes.data ?? [], daysRes.data ?? [], DEFAULT_STORAGE.vitamins);
  });
}

export async function saveVitamins(vitamins: VitaminState): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("vitamin_items").delete().eq("user_id", userId));
    const items = vitaminItemsToRows(userId, vitamins.items);
    if (items.length > 0) {
      await throwOnError(supabase.from("vitamin_items").insert(items));
    }
    await throwOnError(supabase.from("vitamin_day_logs").delete().eq("user_id", userId));
    const days = [vitamins.today, vitamins.yesterday]
      .map((record) => (record ? vitaminDayToRow(userId, record) : null))
      .filter((row): row is NonNullable<typeof row> => row !== null);
    if (days.length > 0) {
      await throwOnError(supabase.from("vitamin_day_logs").upsert(days));
    }
  });
  await syncPushSchedules();
}
