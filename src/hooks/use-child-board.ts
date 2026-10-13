"use client";

import { useMemo } from "react";
import { useRemote } from "@/hooks/use-remote";
import { DEFAULT_CHILD_STORAGE, type ChildStorage } from "@/lib/child/types";
import { getChildProfile } from "@/services/child.service";
import { listDiapers } from "@/services/diapers.service";
import { listFeeds } from "@/services/feed.service";
import { listFoods } from "@/services/food.service";
import { listGrowth } from "@/services/growth.service";
import { listHealth } from "@/services/health.service";
import { listMilestones } from "@/services/milestones.service";
import { listPotty } from "@/services/potty.service";
import { listPumps } from "@/services/pump.service";
import { listSleeps } from "@/services/sleep.service";
import { listVaccines } from "@/services/vaccines.service";

const PRIMARY_FEATURES = ["child", "profile", "feed", "pump", "diaper", "sleep"] as const;
const EXTRA_FEATURES = ["growth", "food", "health", "potty", "milestone", "vaccine"] as const;

type PrimaryBoard = Pick<ChildStorage, "profile" | "feeds" | "pumps" | "diapers" | "sleeps">;
type ExtraBoard = Pick<ChildStorage, "growth" | "foods" | "health" | "potty" | "milestones" | "vaccines">;

async function loadPrimaryBoard(): Promise<PrimaryBoard> {
  const [profile, feeds, pumps, diapers, sleeps] = await Promise.all([
    getChildProfile(),
    listFeeds(),
    listPumps(),
    listDiapers(),
    listSleeps(),
  ]);
  return { profile, feeds, pumps, diapers, sleeps };
}

async function loadExtraBoard(): Promise<ExtraBoard> {
  const [growth, foods, health, potty, milestones, vaccines] = await Promise.all([
    listGrowth(),
    listFoods(),
    listHealth(),
    listPotty(),
    listMilestones(),
    listVaccines(),
  ]);
  return { growth, foods, health, potty, milestones, vaccines };
}

export function useChildBoard(enabled: boolean) {
  const primary = useRemote(PRIMARY_FEATURES, loadPrimaryBoard, enabled);
  const extras = useRemote(
    EXTRA_FEATURES,
    loadExtraBoard,
    enabled && primary.ready && primary.data != null && !primary.error,
  );

  const data = useMemo(() => {
    if (!primary.data) return null;
    return {
      ...DEFAULT_CHILD_STORAGE,
      ...primary.data,
      ...(extras.data ?? {}),
    };
  }, [primary.data, extras.data]);

  return {
    data,
    ready: primary.ready,
    error: primary.error,
    reload: primary.reload,
    extrasReady: extras.data != null,
    extrasError: extras.error,
    reloadExtras: extras.reload,
  };
}
