import {
  DEFAULT_PUSH_PREFERENCES,
  type PushReminderPreferences,
} from "@/lib/push-reminders/schedule";
import { getAccountAccessToken } from "@/lib/supabase/account-session";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { throwOnError, withAccount } from "@/services/account";

/**
 * Browser push reminders are paused. Keep this false so saves never sync
 * `scheduled_notifications` or pull pregnancy tables in the background.
 * Flip to true (and restore syncPushSchedules) when the feature is used again.
 */
export const PUSH_REMINDERS_ENABLED = false;

export async function getPushReminders(): Promise<PushReminderPreferences> {
  if (!PUSH_REMINDERS_ENABLED) return DEFAULT_PUSH_PREFERENCES;
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("push_reminder_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { parsePushPreferences } = await import("@/lib/push-reminders/schedule");
    return parsePushPreferences(data?.preferences);
  });
}

/** No-op while push reminders are disabled. */
export async function syncPushSchedules(): Promise<void> {
  return;
}

export async function savePushReminders(
  preferences: PushReminderPreferences,
): Promise<void> {
  if (!PUSH_REMINDERS_ENABLED) return;
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("push_reminder_preferences").upsert({
        user_id: userId,
        preferences: preferences as unknown as Json,
      }),
    );
  });
  await syncPushSchedules();
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  if (!PUSH_REMINDERS_ENABLED) return;
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        { onConflict: "endpoint" },
      ),
    );
  });
}

export async function sendTestPush(title: string, body: string): Promise<void> {
  if (!PUSH_REMINDERS_ENABLED) throw new Error("Push reminders are disabled");
  const supabase = getSupabaseBrowserClient();
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!supabase || !url || !anon) throw new Error("Supabase is not configured");
  const token = getAccountAccessToken();
  if (!token) throw new Error("Not signed in");
  const response = await fetch(`${url}/functions/v1/send-due-reminders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ test: true, title, body }),
  });
  if (!response.ok) {
    const message = (await response.text()).trim();
    throw new Error(message || "Push failed");
  }
}
