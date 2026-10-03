import type { SupabaseClient } from "@supabase/supabase-js";
import { REMINDER_FIRED_KEY } from "@/lib/reminders/fired-storage";
import type { Database } from "@/lib/supabase/database.types";
import {
  jsonToReminders,
  rowToBabyPlus,
  rowToBabyProfile,
  rowToKick,
  rowToWater,
  rowsToVitaminState,
  type RemoteAppSlice,
} from "@/lib/supabase/mappers";
import { DEFAULT_STORAGE } from "@/lib/types";

type Client = SupabaseClient<Database>;

export async function fetchRemoteAppSlice(
  supabase: Client,
  userId: string,
): Promise<RemoteAppSlice> {
  const [
    profileRes,
    babyRes,
    babyPlusRes,
    vitaminItemsRes,
    vitaminDaysRes,
    kicksRes,
    waterRes,
    settingsRes,
    prefsRes,
    firedRes,
  ] = await Promise.all([
    supabase.from("profiles").select("locale").eq("id", userId).maybeSingle(),
    supabase.from("baby_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("baby_plus_programs").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("vitamin_items").select("*").eq("user_id", userId),
    supabase.from("vitamin_day_logs").select("*").eq("user_id", userId),
    supabase
      .from("kick_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .order("logged_time", { ascending: false }),
    supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .order("logged_time", { ascending: false }),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("reminder_fired_events").select("dedupe_key").eq("user_id", userId),
  ]);

  const errors = [
    profileRes.error,
    babyRes.error,
    babyPlusRes.error,
    vitaminItemsRes.error,
    vitaminDaysRes.error,
    kicksRes.error,
    waterRes.error,
    settingsRes.error,
    prefsRes.error,
    firedRes.error,
  ].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e?.message).join("; "));
  }

  const baby = babyRes.data ? rowToBabyProfile(babyRes.data) : null;
  const babyPlus = babyPlusRes.data
    ? rowToBabyPlus(babyPlusRes.data)
    : DEFAULT_STORAGE.babyPlus;
  const kicks = (kicksRes.data ?? []).map(rowToKick);
  const waterEntries = (waterRes.data ?? []).map(rowToWater);
  const vitamins = rowsToVitaminState(
    vitaminItemsRes.data ?? [],
    vitaminDaysRes.data ?? [],
    DEFAULT_STORAGE.vitamins,
  );
  const reminders = jsonToReminders(prefsRes.data?.preferences);
  const glassSizeMl = settingsRes.data?.glass_size_ml ?? DEFAULT_STORAGE.water.glassSizeMl;

  if (firedRes.data?.length) {
    const fired: Record<string, boolean> = {};
    for (const row of firedRes.data) {
      fired[row.dedupe_key] = true;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(REMINDER_FIRED_KEY, JSON.stringify(fired));
    }
  }

  return {
    locale: profileRes.data?.locale ?? "en",
    baby,
    babyPlus,
    kicks,
    vitamins,
    water: { glassSizeMl, entries: waterEntries },
    reminders,
  };
}
