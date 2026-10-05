import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export async function withAccount<T>(
  run: (supabase: Client, userId: string) => Promise<T>,
): Promise<T> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const userId = data.session?.user?.id;
  if (!userId) throw new Error("Not signed in");
  return run(supabase, userId);
}

export async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}
