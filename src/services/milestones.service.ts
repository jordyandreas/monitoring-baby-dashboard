import { milestoneToRow, rowToMilestone } from "@/lib/supabase/child-mappers";
import type { MilestoneEntry, MilestoneKey } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listMilestones(): Promise<MilestoneEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("milestone_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((row) => {
      const entry = rowToMilestone(row);
      return entry ? [entry] : [];
    });
  });
}

export async function saveMilestone(key: MilestoneKey, date: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("milestone_logs").upsert(milestoneToRow(userId, { key, date }), {
        onConflict: "user_id,milestone_key",
      }),
    );
  });
}

export async function deleteMilestone(key: MilestoneKey): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("milestone_logs").delete().eq("user_id", userId).eq("milestone_key", key),
    );
  });
}
