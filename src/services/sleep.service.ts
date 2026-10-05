import { rowToSleep, sleepToRow } from "@/lib/supabase/child-mappers";
import type { SleepEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listSleeps(): Promise<SleepEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("sleep_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToSleep);
  });
}

export async function saveSleep(entry: SleepEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("sleep_logs").upsert(sleepToRow(userId, entry)));
  });
}

export async function deleteSleep(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("sleep_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
