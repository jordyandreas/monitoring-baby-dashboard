import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccountUserId, isAccessTokenStale } from "@/lib/supabase/account-session";
import { createSupabaseDataClient } from "@/lib/supabase/data-client";
import type { Database } from "@/lib/supabase/database.types";
import { refreshAccountSession } from "@/lib/supabase/refresh-session";

type Client = SupabaseClient<Database>;

const QUERY_TIMEOUT_MS = 8_000;

export async function withAccount<T>(
  run: (supabase: Client, userId: string) => Promise<T>,
  allowRefresh = true,
): Promise<T> {
  if (!getAccountUserId()) throw new Error("Not signed in");
  if (allowRefresh && isAccessTokenStale()) {
    await refreshAccountSession();
  }

  const userId = getAccountUserId();
  const controller = new AbortController();
  const supabase = createSupabaseDataClient(controller.signal);
  if (!supabase || !userId) throw new Error(userId ? "Supabase is not configured" : "Not signed in");

  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
  try {
    return await run(supabase, userId);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `Supabase query timed out after ${QUERY_TIMEOUT_MS}ms. Check DevTools → Network for requests to your-project.supabase.co (auth/v1).`,
      );
    }
    if (allowRefresh && isJwtError(error)) {
      await refreshAccountSession();
      return withAccount(run, false);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function isJwtError(error: unknown) {
  return error instanceof Error && /jwt/i.test(error.message);
}

export async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}
