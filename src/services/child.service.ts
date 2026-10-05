import {
  childProfileToRow,
  rowToChildProfile,
} from "@/lib/supabase/child-mappers";
import type { ChildProfile } from "@/lib/child/types";
import { throwOnError, withAccount } from "@/services/account";

export async function getChildProfile(): Promise<ChildProfile | null> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("child_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToChildProfile(data) : null;
  });
}

export async function saveChildProfile(profile: ChildProfile): Promise<void> {
  return withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("child_profiles").upsert(childProfileToRow(userId, profile)),
    );
  });
}
