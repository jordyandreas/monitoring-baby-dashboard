import { feedToRow, rowToFeed } from "@/lib/supabase/child-mappers";
import type { FeedEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";
import { syncPushSchedules } from "@/services/push-reminders.service";

export async function listFeeds(): Promise<FeedEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("feed_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToFeed);
  });
}

export async function saveFeed(entry: FeedEntry): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("feed_logs").upsert(feedToRow(userId, entry)));
  });
  await syncPushSchedules();
}

export async function deleteFeed(id: string): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("feed_logs").delete().eq("user_id", userId).eq("id", id));
  });
  await syncPushSchedules();
}
