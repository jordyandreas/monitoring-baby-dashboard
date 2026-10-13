import { rowToVaccine, vaccineToRow } from "@/lib/supabase/child-mappers";
import type { VaccineEntry, VaccineKey } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listVaccines(): Promise<VaccineEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("vaccine_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((row) => {
      const entry = rowToVaccine(row);
      return entry ? [entry] : [];
    });
  });
}

export async function saveVaccine(key: VaccineKey, date: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("vaccine_logs").upsert(vaccineToRow(userId, { key, date }), {
        onConflict: "user_id,vaccine_key",
      }),
    );
  });
}

export async function deleteVaccine(key: VaccineKey): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("vaccine_logs").delete().eq("user_id", userId).eq("vaccine_key", key),
    );
  });
}
