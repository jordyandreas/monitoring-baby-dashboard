"use client";

import { useSyncExternalStore } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import {
  getChildRemotePhase,
  getChildRemotePhaseServerSnapshot,
  subscribeChildRemotePhase,
} from "@/lib/supabase/account-data";

/** True while this account's Supabase rows are still on the way. */
export function useRemoteDataPending() {
  const phase = useSyncExternalStore(
    subscribeChildRemotePhase,
    getChildRemotePhase,
    getChildRemotePhaseServerSnapshot,
  );
  const { enabled, signedIn, authStatus } = useSupabase();
  if (!enabled || !isSupabaseEnabled()) return false;
  if (authStatus === "loading") return true;
  if (!signedIn) return false;
  return phase !== "ready";
}
