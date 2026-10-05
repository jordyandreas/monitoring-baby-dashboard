import { babyPlusToRow, rowToBabyPlus } from "@/lib/supabase/mappers";
import { DEFAULT_STORAGE, type BabyPlusState } from "@/lib/pregnancy/types";
import { throwOnError, withAccount } from "@/services/account";
import { syncPushSchedules } from "@/services/push-reminders.service";

export async function getBabyPlus(): Promise<BabyPlusState> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("baby_plus_programs")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToBabyPlus(data) : DEFAULT_STORAGE.babyPlus;
  });
}

export async function saveBabyPlus(state: BabyPlusState): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("baby_plus_programs").upsert(babyPlusToRow(userId, state)),
    );
  });
  await syncPushSchedules();
}
