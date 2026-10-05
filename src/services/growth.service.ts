import { growthToRow, rowToGrowth } from "@/lib/supabase/child-mappers";
import { mergeGrowthDay } from "@/lib/child/summary";
import type { GrowthEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

async function writeGrowth(entry: GrowthEntry, droppedIds: string[]) {
  await saveGrowth(entry);
  for (const id of droppedIds) await deleteGrowth(id);
}

export async function saveMergedGrowth(
  existing: GrowthEntry[],
  incoming: Omit<GrowthEntry, "id">,
): Promise<void> {
  const { entry, removedIds } = mergeGrowthDay(existing, incoming, crypto.randomUUID());
  await writeGrowth(entry, removedIds);
}

export async function replaceGrowthDay(
  existing: GrowthEntry[],
  sourceIds: string[],
  incoming: Omit<GrowthEntry, "id">,
): Promise<void> {
  const rest = existing.filter((item) => !sourceIds.includes(item.id));
  const { entry, removedIds } = mergeGrowthDay(rest, incoming, crypto.randomUUID());
  const dropped = [...new Set([...sourceIds, ...removedIds])].filter((id) => id !== entry.id);
  await writeGrowth(entry, dropped);
}

export async function listGrowth(): Promise<GrowthEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("growth_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToGrowth);
  });
}

export async function saveGrowth(entry: GrowthEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("growth_logs").upsert(growthToRow(userId, entry)));
  });
}

export async function deleteGrowth(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("growth_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
