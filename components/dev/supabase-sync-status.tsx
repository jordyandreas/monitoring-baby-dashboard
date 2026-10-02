"use client";

import { useState, useSyncExternalStore } from "react";
import { CircleAlert, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/hooks/use-supabase";
import { getSyncNotice, subscribeSyncNotice } from "@/lib/supabase/live-sync";

/** Sync and auth failures only. Sits in the corner and stays until dismissed. */
export function SupabaseSyncStatus() {
  const { t } = useLocale();
  const { enabled, authStatus, authError, migration, retryAuth } = useSupabase();
  const syncNotice = useSyncExternalStore(subscribeSyncNotice, getSyncNotice, () => null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (!enabled) return null;

  const message =
    syncNotice ??
    (authStatus === "error" ? authError ?? "Sign-in did not finish" : null) ??
    (migration?.status === "error" ? migration.message : null);

  if (!message || message === dismissed) return null;

  return (
    <div
      className="fixed right-4 bottom-[max(5.75rem,calc(4.75rem+env(safe-area-inset-bottom)))] z-[70] md:bottom-4"
      role="alert"
    >
      <div className="pointer-events-auto flex w-[min(20rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-destructive/35 bg-card px-3 py-3 text-card-foreground shadow-lg">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
          aria-hidden
        >
          <CircleAlert className="size-4" />
        </span>
        <p className="min-w-0 flex-1 pt-1.5 text-sm font-semibold break-words">{message}</p>
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("toast.close")}
          onClick={() => setDismissed(message)}
        >
          <X className="size-4" />
        </button>
      </div>
      {authStatus === "error" ? (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-destructive underline"
          onClick={() => retryAuth()}
        >
          {t("toast.retry")}
        </button>
      ) : null}
    </div>
  );
}
