import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccountUserId } from "@/lib/supabase/account-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { withTimeout } from "@/lib/supabase/with-timeout";

type Client = SupabaseClient<Database>;

const QUERY_TIMEOUT_MS = 8_000;

export async function withAccount<T>(
  run: (supabase: Client, userId: string) => Promise<T>,
): Promise<T> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const userId = getAccountUserId();
  if (!userId) throw new Error("Not signed in");
  return withTimeout(run(supabase, userId), QUERY_TIMEOUT_MS, "Supabase query");
}

export async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}
