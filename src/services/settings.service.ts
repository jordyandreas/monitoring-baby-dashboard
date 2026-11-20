import {
  bottleMlPresetsEqual,
  DEFAULT_BOTTLE_ML,
  normalizeBottleMlPresets,
} from "@/lib/child/bottle-presets";
import { writeBottleMlCache } from "@/lib/child/bottle-presets-cache";
import { throwOnError, withAccount } from "@/services/account";

export async function getBottleMlPresets(): Promise<number[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("user_settings")
      .select("bottle_ml_presets")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const presets = normalizeBottleMlPresets(data?.bottle_ml_presets);
    writeBottleMlCache(userId, presets);
    return presets;
  });
}

export async function saveBottleMlPresets(presets: number[]): Promise<void> {
  const normalized = normalizeBottleMlPresets(presets);
  const toStore = bottleMlPresetsEqual(normalized, DEFAULT_BOTTLE_ML) ? null : normalized;
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("user_settings").upsert({
        user_id: userId,
        bottle_ml_presets: toStore,
      }),
    );
    writeBottleMlCache(userId, normalized);
  });
}
