"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { DEFAULT_BOTTLE_ML } from "@/lib/child/bottle-presets";
import {
  parseBottleMlCache,
  readBottleMlCacheRaw,
  subscribeBottleMlCache,
} from "@/lib/child/bottle-presets-cache";
import { getBottleMlPresets } from "@/services/settings.service";

const refreshedUsers = new Set<string>();

/**
 * Shared ml chips for ASI botol, sufor, and pump. Reads the per-account localStorage copy first,
 * then refreshes it from Supabase once per app load so edits from other devices still arrive.
 */
export function useBottleMlPresets(): number[] {
  const { signedIn, user } = useSupabase();
  const userId = signedIn ? user?.id : undefined;
  const raw = useSyncExternalStore(
    subscribeBottleMlCache,
    () => readBottleMlCacheRaw(userId),
    () => null,
  );
  const cached = useMemo(() => parseBottleMlCache(raw), [raw]);

  useEffect(() => {
    if (!userId || refreshedUsers.has(userId)) return;
    refreshedUsers.add(userId);
    getBottleMlPresets().catch(() => {
      refreshedUsers.delete(userId);
    });
  }, [userId]);

  return cached ?? [...DEFAULT_BOTTLE_ML];
}
