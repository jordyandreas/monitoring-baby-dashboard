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

/**
 * Shared ml chips for ASI botol, sufor, and pump. Reads the per-account localStorage copy kept
 * in sync by the settings dialog; only hits Supabase when this device has no copy yet.
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
    if (!userId || cached) return;
    getBottleMlPresets().catch(() => {
      // Defaults stay on screen; the next open retries.
    });
  }, [userId, cached]);

  return cached ?? [...DEFAULT_BOTTLE_ML];
}
