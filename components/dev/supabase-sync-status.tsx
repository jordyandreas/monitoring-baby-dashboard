"use client";

import { useSupabase } from "@/hooks/use-supabase";

/**
 * Dev-only banner for Supabase auth + Phase 1 migration status.
 * Surfaces errors that were previously invisible in the UI.
 */
export function SupabaseSyncStatus() {
  const { enabled, authStatus, authError, migration, user, retryAuth } = useSupabase();

  if (!enabled) return null;
  if (process.env.NODE_ENV === "production" && authStatus === "ready" && migration?.status === "success") {
    return null;
  }

  const migrationLine =
    migration == null
      ? "Migration: pending…"
      : migration.status === "skipped"
        ? `Migration: skipped (${migration.reason})`
        : migration.status === "error"
          ? `Migration: error — ${migration.message}`
          : `Migration: ${migration.status} (${"direction" in migration ? migration.direction : ""})`;

  const tone =
    authStatus === "error" || migration?.status === "error"
      ? "border-red-300 bg-red-50 text-red-900"
      : authStatus === "ready" && migration?.status === "success"
        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
        : "border-amber-300 bg-amber-50 text-amber-900";

  return (
    <div
      className={`mx-4 mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${tone}`}
      role="status"
    >
      <p className="font-semibold">Supabase (dev)</p>
      <p>Auth: {authStatus}{authError ? ` — ${authError}` : ""}</p>
      <p>{migrationLine}</p>
      {user ? <p className="truncate">User: {user.id}</p> : null}
      {authStatus === "loading" ? (
        <p className="mt-1 opacity-80">
          If this stays longer than ~15s, open DevTools → Network and look for
          blocked or pending requests to supabase.co.
        </p>
      ) : null}
      {authStatus === "error" ? (
        <button
          type="button"
          className="mt-1 underline"
          onClick={() => retryAuth()}
        >
          Retry auth
        </button>
      ) : null}
    </div>
  );
}
