import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAccountRefreshToken,
  getAccountUserId,
  isAccessTokenStale,
  isAccessTokenUsable,
} from "@/lib/supabase/account-session";
import { clearAccountSession } from "@/lib/supabase/clear-session";
import { createSupabaseDataClient } from "@/lib/supabase/data-client";
import type { Database } from "@/lib/supabase/database.types";
import { isAuthTokenError } from "@/lib/supabase/jwt";
import { refreshAccountSession } from "@/lib/supabase/refresh-session";

type Client = SupabaseClient<Database>;

const QUERY_TIMEOUT_MS = 8_000;

export async function withAccount<T>(
  run: (supabase: Client, userId: string) => Promise<T>,
  allowRefresh = true,
): Promise<T> {
  if (!getAccountUserId()) throw new Error("Not signed in");

  if (allowRefresh && (isAccessTokenStale() || !isAccessTokenUsable())) {
    if (!getAccountRefreshToken()) {
      clearAccountSession("missing-refresh-token");
      throw new Error("Not signed in");
    }
    try {
      await refreshAccountSession();
    } catch (error) {
      if (!isAccessTokenUsable()) {
        throw error instanceof Error ? error : new Error("Not signed in");
      }
    }
  }

  if (!isAccessTokenUsable()) {
    clearAccountSession("unusable-access-token");
    throw new Error("Not signed in");
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
    if (allowRefresh && isAuthTokenError(error)) {
      try {
        await refreshAccountSession();
        return withAccount(run, false);
      } catch (refreshError) {
        if (!isAccessTokenUsable()) {
          clearAccountSession("jwt-refresh-failed");
          throw new Error("Not signed in");
        }
        throw refreshError;
      }
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function throwOnError<T extends { error: { message: string } | null }>(
  promise: PromiseLike<T>,
): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result;
}
