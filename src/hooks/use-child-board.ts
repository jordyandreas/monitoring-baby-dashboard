"use client";

import { useRemote } from "@/hooks/use-remote";
import { DEFAULT_CHILD_STORAGE, type ChildStorage } from "@/lib/child/types";
import { getChildProfile } from "@/services/child.service";
import { listDiapers } from "@/services/diapers.service";
import { listFeeds } from "@/services/feed.service";
import { listGrowth } from "@/services/growth.service";
import { listHealth } from "@/services/health.service";
import { listMeals } from "@/services/meals.service";
import { listMilestones } from "@/services/milestones.service";
import { listPotty } from "@/services/potty.service";
import { listSleeps } from "@/services/sleep.service";
import { listSolids } from "@/services/solids.service";

const HOME_FEATURES = [
  "child",
  "profile",
  "feed",
  "diaper",
  "sleep",
  "growth",
  "solid",
  "health",
  "potty",
  "meal",
  "milestone",
] as const;

export async function loadChildBoard(): Promise<ChildStorage> {
  const [profile, feeds, diapers, sleeps, growth, solids, health, potty, meals, milestones] =
    await Promise.all([
      getChildProfile(),
      listFeeds(),
      listDiapers(),
      listSleeps(),
      listGrowth(),
      listSolids(),
      listHealth(),
      listPotty(),
      listMeals(),
      listMilestones(),
    ]);
  return {
    ...DEFAULT_CHILD_STORAGE,
    profile,
    feeds,
    diapers,
    sleeps,
    growth,
    solids,
    health,
    potty,
    meals,
    milestones,
  };
}

export function useChildBoard(enabled: boolean) {
  return useRemote(HOME_FEATURES, loadChildBoard, enabled);
}
