import { healthToRow, rowToHealth } from "@/lib/supabase/child-mappers";
import type { HealthEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listHealth(): Promise<HealthEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("health_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToHealth);
  });
}

export async function saveHealth(entry: HealthEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("health_logs").upsert(healthToRow(userId, entry)));
  });
}

export async function deleteHealth(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("health_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
