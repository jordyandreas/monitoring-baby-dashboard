import { readStorage, updateAppStorage } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mergeRemoteIntoAppStorage } from "@/lib/supabase/mappers";
import {
  fetchRemoteAppSlice,
  getSyncMetadata,
  hasDeviceMigrationFlag,
  markMigrated,
  setDeviceMigrationFlag,
  upsertAppStorageToRemote,
} from "@/lib/supabase/repositories/app-data";

export type MigrationResult =
  | { status: "skipped"; reason: string }
  | { status: "success"; direction: "upload" | "download" | "none" }
  | { status: "error"; message: string };

/**
 * One-time (per device) sync between localStorage and Supabase.
 *
 * Strategy:
 * - If remote has migrated_at and local flag is set → no-op
 * - If remote empty and local has data → upload local → remote
 * - If remote has data and local is default-ish → download remote → local
 * - If both have data and device never migrated → upload local (local wins for MVP)
 */
export async function runLocalStorageMigration(userId: string): Promise<MigrationResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { status: "skipped", reason: "Supabase not configured" };
  }

  if (hasDeviceMigrationFlag()) {
    return { status: "success", direction: "none" };
  }

  try {
    const local = readStorage();

    let meta: Awaited<ReturnType<typeof getSyncMetadata>> = null;
    let remoteSlice: Awaited<ReturnType<typeof fetchRemoteAppSlice>> | null = null;
    try {
      meta = await getSyncMetadata(supabase, userId);
      remoteSlice = await fetchRemoteAppSlice(supabase, userId);
    } catch (fetchErr) {
      const hint =
        fetchErr instanceof Error ? fetchErr.message : "Could not read remote data";
      // Still allow upload when local has data (e.g. partial schema / missing tables).
      if (!local.baby && !local.kicks.length && !local.water.entries.length) {
        return {
          status: "error",
          message: `${hint}. Apply the full SQL migration in supabase/migrations/.`,
        };
      }
      console.warn("[supabase] Remote read failed, uploading local data anyway:", hint);
    }

    const remote = remoteSlice ?? {
      locale: "en",
      baby: null,
      babyPlus: local.babyPlus,
      kicks: [],
      vitamins: local.vitamins,
      water: local.water,
      reminders: local.reminders,
    };

    const localHasData =
      local.baby !== null ||
      local.kicks.length > 0 ||
      local.water.entries.length > 0 ||
      local.vitamins.items.some((v) => v.name.trim()) ||
      Boolean(local.babyPlus.startDate);

    const remoteHasData =
      remote.baby !== null ||
      remote.kicks.length > 0 ||
      remote.water.entries.length > 0 ||
      remote.vitamins.items.length > 0 ||
      Boolean(remote.babyPlus.startDate);

    if (meta?.migrated_at && !localHasData && remoteHasData) {
      updateAppStorage((prev) => mergeRemoteIntoAppStorage(prev, remote));
      setDeviceMigrationFlag();
      await markMigrated(supabase, userId);
      return { status: "success", direction: "download" };
    }

    if (localHasData) {
      await upsertAppStorageToRemote(supabase, userId, local);
      await markMigrated(supabase, userId);
      setDeviceMigrationFlag();
      return { status: "success", direction: "upload" };
    }

    if (remoteHasData) {
      updateAppStorage((prev) => mergeRemoteIntoAppStorage(prev, remote));
      setDeviceMigrationFlag();
      await markMigrated(supabase, userId);
      return { status: "success", direction: "download" };
    }

    setDeviceMigrationFlag();
    await markMigrated(supabase, userId);
    return { status: "success", direction: "none" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return { status: "error", message };
  }
}
