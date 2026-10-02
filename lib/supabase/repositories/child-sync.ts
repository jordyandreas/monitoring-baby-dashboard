import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChildProfile, ChildStorage, MilestoneKey } from "@/lib/child/types";
import { childStorageHasData } from "@/lib/child/storage";
import type { Database } from "@/lib/supabase/database.types";
import {
  childProfileToRow,
  diaperToRow,
  feedToRow,
  growthToRow,
  healthToRow,
  mealToRow,
  milestoneToRow,
  pottyToRow,
  rowsToChildStorage,
  sleepToRow,
  solidToRow,
} from "@/lib/supabase/child-mappers";
import type {
  DiaperEntry,
  FeedEntry,
  GrowthEntry,
  HealthEntry,
  MealEntry,
  PottyEntry,
  SleepEntry,
  SolidEntry,
} from "@/lib/child/types";

type Client = SupabaseClient<Database>;

async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}

export async function syncChildProfile(
  supabase: Client,
  userId: string,
  profile: ChildProfile | null,
): Promise<void> {
  if (profile) {
    await throwOnError(
      supabase.from("child_profiles").upsert(childProfileToRow(userId, profile)),
    );
    return;
  }
  await throwOnError(supabase.from("child_profiles").delete().eq("user_id", userId));
}

export async function syncFeedInsert(supabase: Client, userId: string, entry: FeedEntry) {
  await throwOnError(supabase.from("feed_logs").upsert(feedToRow(userId, entry), { onConflict: "id" }));
}

export async function syncFeedUpdate(supabase: Client, userId: string, entry: FeedEntry) {
  await throwOnError(supabase.from("feed_logs").upsert(feedToRow(userId, entry), { onConflict: "id" }));
}

export async function syncFeedDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("feed_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncDiaperInsert(supabase: Client, userId: string, entry: DiaperEntry) {
  await throwOnError(supabase.from("diaper_logs").upsert(diaperToRow(userId, entry), { onConflict: "id" }));
}

export async function syncDiaperUpdate(supabase: Client, userId: string, entry: DiaperEntry) {
  await throwOnError(supabase.from("diaper_logs").upsert(diaperToRow(userId, entry), { onConflict: "id" }));
}

export async function syncDiaperDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("diaper_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncSleepInsert(supabase: Client, userId: string, entry: SleepEntry) {
  await throwOnError(supabase.from("sleep_logs").upsert(sleepToRow(userId, entry), { onConflict: "id" }));
}

export async function syncSleepUpdate(supabase: Client, userId: string, entry: SleepEntry) {
  await throwOnError(supabase.from("sleep_logs").upsert(sleepToRow(userId, entry), { onConflict: "id" }));
}

export async function syncSleepDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("sleep_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncGrowthInsert(supabase: Client, userId: string, entry: GrowthEntry) {
  await throwOnError(supabase.from("growth_logs").upsert(growthToRow(userId, entry), { onConflict: "id" }));
}

export async function syncGrowthDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("growth_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncSolidInsert(supabase: Client, userId: string, entry: SolidEntry) {
  await throwOnError(supabase.from("solid_logs").upsert(solidToRow(userId, entry), { onConflict: "id" }));
}

export async function syncSolidDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("solid_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncHealthInsert(supabase: Client, userId: string, entry: HealthEntry) {
  await throwOnError(supabase.from("health_logs").upsert(healthToRow(userId, entry), { onConflict: "id" }));
}

export async function syncHealthDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("health_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncPottyInsert(supabase: Client, userId: string, entry: PottyEntry) {
  await throwOnError(supabase.from("potty_logs").upsert(pottyToRow(userId, entry), { onConflict: "id" }));
}

export async function syncPottyDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("potty_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncMealInsert(supabase: Client, userId: string, entry: MealEntry) {
  await throwOnError(supabase.from("meal_logs").upsert(mealToRow(userId, entry), { onConflict: "id" }));
}

export async function syncMealDelete(supabase: Client, userId: string, id: string) {
  await throwOnError(supabase.from("meal_logs").delete().eq("user_id", userId).eq("id", id));
}

export async function syncMilestone(
  supabase: Client,
  userId: string,
  key: MilestoneKey,
  date: string | null,
): Promise<void> {
  if (!date) {
    await throwOnError(
      supabase.from("milestone_logs").delete().eq("user_id", userId).eq("milestone_key", key),
    );
    return;
  }
  await throwOnError(
    supabase.from("milestone_logs").upsert(milestoneToRow(userId, { key, date }), {
      onConflict: "user_id,milestone_key",
    }),
  );
}

export async function fetchRemoteChild(supabase: Client, userId: string): Promise<ChildStorage> {
  const [profile, feeds, diapers, sleeps, growth, solids, health, potty, meals, milestones] =
    await Promise.all([
      supabase.from("child_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("feed_logs").select("*").eq("user_id", userId),
      supabase.from("diaper_logs").select("*").eq("user_id", userId),
      supabase.from("sleep_logs").select("*").eq("user_id", userId),
      supabase.from("growth_logs").select("*").eq("user_id", userId),
      supabase.from("solid_logs").select("*").eq("user_id", userId),
      supabase.from("health_logs").select("*").eq("user_id", userId),
      supabase.from("potty_logs").select("*").eq("user_id", userId),
      supabase.from("meal_logs").select("*").eq("user_id", userId),
      supabase.from("milestone_logs").select("*").eq("user_id", userId),
    ]);

  const errors = [
    profile.error,
    feeds.error,
    diapers.error,
    sleeps.error,
    growth.error,
    solids.error,
    health.error,
    potty.error,
    meals.error,
    milestones.error,
  ].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join("; "));
  }

  return rowsToChildStorage({
    profile: profile.data,
    feeds: feeds.data ?? [],
    diapers: diapers.data ?? [],
    sleeps: sleeps.data ?? [],
    growth: growth.data ?? [],
    solids: solids.data ?? [],
    health: health.data ?? [],
    potty: potty.data ?? [],
    meals: meals.data ?? [],
    milestones: milestones.data ?? [],
  });
}

export async function replaceRemoteChild(
  supabase: Client,
  userId: string,
  data: ChildStorage,
): Promise<void> {
  await syncChildProfile(supabase, userId, data.profile);

  await throwOnError(supabase.from("feed_logs").delete().eq("user_id", userId));
  if (data.feeds.length) {
    await throwOnError(
      supabase.from("feed_logs").upsert(
        data.feeds.map((entry) => feedToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("diaper_logs").delete().eq("user_id", userId));
  if (data.diapers.length) {
    await throwOnError(
      supabase.from("diaper_logs").upsert(
        data.diapers.map((entry) => diaperToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("sleep_logs").delete().eq("user_id", userId));
  if (data.sleeps.length) {
    await throwOnError(
      supabase.from("sleep_logs").upsert(
        data.sleeps.map((entry) => sleepToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("growth_logs").delete().eq("user_id", userId));
  if (data.growth.length) {
    await throwOnError(
      supabase.from("growth_logs").upsert(
        data.growth.map((entry) => growthToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("solid_logs").delete().eq("user_id", userId));
  if (data.solids.length) {
    await throwOnError(
      supabase.from("solid_logs").upsert(
        data.solids.map((entry) => solidToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("health_logs").delete().eq("user_id", userId));
  if (data.health.length) {
    await throwOnError(
      supabase.from("health_logs").upsert(
        data.health.map((entry) => healthToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("potty_logs").delete().eq("user_id", userId));
  if (data.potty.length) {
    await throwOnError(
      supabase.from("potty_logs").upsert(
        data.potty.map((entry) => pottyToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("meal_logs").delete().eq("user_id", userId));
  if (data.meals.length) {
    await throwOnError(
      supabase.from("meal_logs").upsert(
        data.meals.map((entry) => mealToRow(userId, entry)),
        { onConflict: "id" },
      ),
    );
  }
  await throwOnError(supabase.from("milestone_logs").delete().eq("user_id", userId));
  if (data.milestones.length) {
    await throwOnError(
      supabase.from("milestone_logs").upsert(
        data.milestones.map((entry) => milestoneToRow(userId, entry)),
        { onConflict: "user_id,milestone_key" },
      ),
    );
  }
}

export { childStorageHasData };
