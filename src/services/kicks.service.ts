import { kickToRow, rowToKick } from "@/lib/supabase/mappers";
import type { KickEntry } from "@/lib/pregnancy/types";
import { throwOnError, withAccount } from "@/services/account";
import { syncPushSchedules } from "@/services/push-reminders.service";

export async function listKicks(): Promise<KickEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("kick_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .order("logged_time", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToKick);
  });
}

export async function insertKick(entry: KickEntry): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("kick_logs").insert(kickToRow(userId, entry)));
  });
  await syncPushSchedules();
}

export async function deleteKick(id: string): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("kick_logs").delete().eq("user_id", userId).eq("id", id),
    );
  });
  await syncPushSchedules();
}
