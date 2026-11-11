"use client";

import { useSupabase } from "@/components/providers/supabase-provider";
import { useRemote } from "@/hooks/use-remote";
import { DEFAULT_BOTTLE_ML } from "@/lib/child/bottle-presets";
import { getBottleMlPresets } from "@/services/settings.service";

/** Shared ml chips for ASI botol, sufor, and pump. Defaults until signed-in prefs load. */
export function useBottleMlPresets(): number[] {
  const { signedIn } = useSupabase();
  const remote = useRemote("bottle-presets", getBottleMlPresets, signedIn);
  return remote.data ?? [...DEFAULT_BOTTLE_ML];
}
