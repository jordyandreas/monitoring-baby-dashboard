import { babyProfileToRow, rowToBabyProfile } from "@/lib/supabase/mappers";
import type { BabyProfile } from "@/lib/pregnancy/types";
import { throwOnError, withAccount } from "@/services/account";

export async function getBaby(): Promise<BabyProfile | null> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("baby_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToBabyProfile(data) : null;
  });
}

export async function saveBaby(baby: BabyProfile | null): Promise<void> {
  return withAccount(async (supabase, userId) => {
    if (baby) {
      await throwOnError(supabase.from("baby_profiles").upsert(babyProfileToRow(userId, baby)));
      return;
    }
    await throwOnError(supabase.from("baby_profiles").delete().eq("user_id", userId));
  });
}
