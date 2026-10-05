import { diaperToRow, rowToDiaper } from "@/lib/supabase/child-mappers";
import type { DiaperEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listDiapers(): Promise<DiaperEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("diaper_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToDiaper);
  });
}

export async function saveDiaper(entry: DiaperEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("diaper_logs").upsert(diaperToRow(userId, entry)));
  });
}

export async function deleteDiaper(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("diaper_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
