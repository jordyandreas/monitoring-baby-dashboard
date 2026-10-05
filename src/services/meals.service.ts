import { mealToRow, rowToMeal } from "@/lib/supabase/child-mappers";
import type { MealEntry } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function listMeals(): Promise<MealEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase.from("meal_logs").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToMeal);
  });
}

export async function saveMeal(entry: MealEntry): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("meal_logs").upsert(mealToRow(userId, entry)));
  });
}

export async function deleteMeal(id: string): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("meal_logs").delete().eq("user_id", userId).eq("id", id));
  });
}
