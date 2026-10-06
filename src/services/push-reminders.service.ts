import { countCompleted, getNamedVitamins } from "@/lib/pregnancy/vitamins";
import {
  computeSchedules,
  parsePushPreferences,
  zonedDateString,
  type PushKind,
  type PushLocale,
  type PushReminderPreferences,
} from "@/lib/push-reminders/schedule";
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY } from "@/lib/i18n/types";
import { getAccountAccessToken } from "@/lib/supabase/account-session";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Json } from "@/lib/supabase/database.types";
import { rowToBabyPlus, rowsToVitaminState } from "@/lib/supabase/mappers";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_STORAGE } from "@/lib/pregnancy/types";
import { throwOnError, withAccount } from "@/services/account";

function browserLocale(): PushLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored ?? "") ? stored as PushLocale : DEFAULT_LOCALE;
}

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  } catch {
    return "Asia/Jakarta";
  }
}

function sentKeyFrom(payload: Json): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const value = (payload as { sentKey?: unknown }).sentKey;
  return typeof value === "string" ? value : null;
}

export async function getPushReminders(): Promise<PushReminderPreferences> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("push_reminder_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return parsePushPreferences(data?.preferences);
  });
}

export async function syncPushSchedules(): Promise<void> {
  await withAccount(async (supabase, userId) => {
    const timeZone = browserTimeZone();
    const locale = browserLocale();
    const today = zonedDateString(new Date(), timeZone);

    const [prefsRes, feedRes, pumpRes, vitaminItemsRes, vitaminDaysRes, kickRes, waterRes, babyRes, scheduleRes] =
      await Promise.all([
        supabase
          .from("push_reminder_preferences")
          .select("preferences")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("feed_logs")
          .select("logged_date, logged_time")
          .eq("user_id", userId)
          .order("logged_date", { ascending: false })
          .order("logged_time", { ascending: false })
          .limit(1),
        supabase
          .from("pump_logs")
          .select("logged_date, logged_time")
          .eq("user_id", userId)
          .order("logged_date", { ascending: false })
          .order("logged_time", { ascending: false })
          .limit(1),
        supabase.from("vitamin_items").select("*").eq("user_id", userId),
        supabase.from("vitamin_day_logs").select("*").eq("user_id", userId),
        supabase
          .from("kick_logs")
          .select("logged_date")
          .eq("user_id", userId)
          .eq("logged_date", today),
        supabase
          .from("water_logs")
          .select("logged_date, logged_time")
          .eq("user_id", userId)
          .order("logged_date", { ascending: false })
          .limit(40),
        supabase.from("baby_plus_programs").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("scheduled_notifications").select("kind, payload").eq("user_id", userId),
      ]);

    for (const result of [
      prefsRes,
      feedRes,
      pumpRes,
      vitaminItemsRes,
      vitaminDaysRes,
      kickRes,
      waterRes,
      babyRes,
      scheduleRes,
    ]) {
      if (result.error) throw new Error(result.error.message);
    }

    await throwOnError(
      supabase.from("profiles").update({ timezone: timeZone, locale }).eq("id", userId),
    );

    const vitamins = rowsToVitaminState(
      vitaminItemsRes.data ?? [],
      vitaminDaysRes.data ?? [],
      DEFAULT_STORAGE.vitamins,
    );
    const named = getNamedVitamins(vitamins.items);
    const todayLog = [vitamins.today, vitamins.yesterday].find((record) => record?.date === today);
    const sentKeys: Partial<Record<PushKind, string | null>> = {};
    for (const row of scheduleRes.data ?? []) {
      if (isPushKind(row.kind)) sentKeys[row.kind] = sentKeyFrom(row.payload);
    }
    const latest = feedRes.data?.[0];
    const latestPump = pumpRes.data?.[0];
    const baby = babyRes.data ? rowToBabyPlus(babyRes.data) : null;
    const drafts = computeSchedules({
      now: new Date(),
      timeZone,
      locale,
      preferences: parsePushPreferences(prefsRes.data?.preferences),
      sentKeys,
      latestFeed: latest
        ? { date: latest.logged_date, time: latest.logged_time }
        : null,
      latestPump: latestPump
        ? { date: latestPump.logged_date, time: latestPump.logged_time }
        : null,
      vitaminNamedCount: named.length,
      vitaminDoneCount: todayLog ? countCompleted(named, todayLog.completed) : 0,
      vitaminLogDate: todayLog?.date ?? "",
      kickDates: (kickRes.data ?? []).map((row) => row.logged_date),
      waterLogs: (waterRes.data ?? []).map((row) => ({
        date: row.logged_date,
        time: row.logged_time,
      })),
      babyPlus: baby,
    });

    for (const draft of drafts) {
      await throwOnError(
        supabase.from("scheduled_notifications").upsert(
          {
            user_id: userId,
            kind: draft.kind,
            enabled: draft.enabled,
            schedule_type: draft.scheduleType,
            next_run_at: draft.nextRunAt,
            payload: draft.payload as unknown as Json,
          },
          { onConflict: "user_id,kind" },
        ),
      );
    }
  });
}

function isPushKind(value: string): value is PushKind {
  return (
    value === "feed" ||
    value === "pump" ||
    value === "vitamins" ||
    value === "babyPlus" ||
    value === "kicks" ||
    value === "hydration"
  );
}

export async function savePushReminders(
  preferences: PushReminderPreferences,
): Promise<void> {
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
