import { pottyToRow, rowToPotty } from "@/lib/supabase/child-mappers";
import type { PottyEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listPotty(): Promise<PottyEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("potty_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToPotty);
  });
}

export async function savePotty(entry: PottyEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("potty_logs").upsert(pottyToRow(userId, entry)));
  });
}

export async function deletePotty(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("potty_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
