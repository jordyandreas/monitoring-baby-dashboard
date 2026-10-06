import { pumpToRow, rowToPump } from "@/lib/supabase/child-mappers";
import type { PumpEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";
import { syncPushSchedules } from "@/services/push-reminders.service";

export async function listPumps(): Promise<PumpEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("pump_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToPump);
  });
}

export async function savePump(entry: PumpEntry): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("pump_logs").upsert(pumpToRow(userId, entry)));
  });
  await syncPushSchedules();
}

export async function deletePump(id: string): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("pump_logs").delete().eq("user_id", userId).eq("id", id));
  });
  await syncPushSchedules();
}
