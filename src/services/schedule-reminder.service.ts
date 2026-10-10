import type { ScheduleKind, ScheduleReminder } from "@/lib/child/schedule-reminder";
import { throwOnError, withAccount } from "@/services/account";

const MAX_INTERVAL = 24 * 60;

function isKind(value: string): value is ScheduleKind {
  return value === "feed" || value === "pump";
}

export async function listScheduleReminders(): Promise<ScheduleReminder[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("schedule_reminders").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((row) => {
      if (!isKind(row.kind)) return [];
      return [{ kind: row.kind, enabled: row.enabled, intervalMinutes: row.interval_minutes }];
    });
  });
}

export async function saveScheduleReminders(reminders: ScheduleReminder[]): Promise<void> {
  const rows = reminders.filter((item) => isKind(item.kind));
  if (rows.some((item) => item.intervalMinutes <= 0 || item.intervalMinutes > MAX_INTERVAL)) {
    throw new Error("Invalid interval");
  }
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("schedule_reminders").upsert(
        rows.map((item) => ({
          user_id: userId,
          kind: item.kind,
          enabled: item.enabled,
          interval_minutes: item.intervalMinutes,
        })),
        { onConflict: "user_id,kind" },
      ),
    );
  });
}
