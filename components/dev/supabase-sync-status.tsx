"use client";

import { useSyncExternalStore } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { getSyncNotice, subscribeSyncNotice } from "@/lib/supabase/live-sync";

/** Compact notice only when auth or sync actually fails. Quiet on the happy path. */
export function SupabaseSyncStatus() {
  const { enabled, authStatus, authError, migration, retryAuth } = useSupabase();
  const syncNotice = useSyncExternalStore(subscribeSyncNotice, getSyncNotice, () => null);

  if (!enabled) return null;

  const message =
    syncNotice ??
    (authStatus === "error" ? authError ?? "Sign-in did not finish" : null) ??
    (migration?.status === "error" ? migration.message : null);

  if (!message) return null;

  return (
    <div
      className="mx-4 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
      role="status"
    >
      <p>{message}</p>
      {authStatus === "error" ? (
        <button type="button" className="mt-1 underline" onClick={() => retryAuth()}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
