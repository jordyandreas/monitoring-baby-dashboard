import { rowToSolid, solidToRow } from "@/lib/supabase/child-mappers";
import type { SolidEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listSolids(): Promise<SolidEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("solid_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToSolid);
  });
}

export async function saveSolid(entry: SolidEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("solid_logs").upsert(solidToRow(userId, entry)));
  });
}

export async function deleteSolid(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("solid_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
