import { foodToRow, rowToFood } from "@/lib/supabase/child-mappers";
import type { FoodEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listFoods(): Promise<FoodEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("food_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToFood);
  });
}

export async function saveFood(entry: FoodEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("food_logs").upsert(foodToRow(userId, entry)));
  });
}

export async function deleteFood(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("food_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
