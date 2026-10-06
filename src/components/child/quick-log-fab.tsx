"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Milk, Moon } from "lucide-react";
import { DiaperLogForm, FeedLogForm, PumpLogForm, SleepLogForm } from "@/components/child/quick-log-forms";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import { PumpIcon } from "@/components/icons/pump-icon";
import { ExpandableFab, type ExpandableFabAction } from "@/components/ui/expandable-fab";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/utils/cn";

type LogKind = "feed" | "pump" | "diaper" | "sleep";

const destinations: Record<LogKind, string> = {
  feed: "/feed",
  pump: "/pump",
  diaper: "/diapers",
  sleep: "/sleep",
};

function isLogKind(value: string): value is LogKind {
  return value === "feed" || value === "pump" || value === "diaper" || value === "sleep";
}

export function QuickLogFab() {
  const { t } = useLocale();
  const { mode, hydrated } = useAppMode();
  const { enabled, signedIn, authStatus, requestLogin } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [kind, setKind] = useState<LogKind | null>(null);

  if (!hydrated || mode !== "child") return null;

  const actions: ExpandableFabAction[] = [
    { id: "feed", label: t("nav.feed"), icon: Milk },
    { id: "pump", label: t("nav.pump"), icon: PumpIcon },
    { id: "diaper", label: t("nav.diaper"), icon: DiaperIcon },
    { id: "sleep", label: t("nav.sleep"), icon: Moon },
  ];

  function closeAndGo() {
    const next = kind;
    setKind(null);
    if (next) router.push(destinations[next]);
  }

  const title =
    kind === "diaper"
      ? t("diaper.add")
      : kind === "sleep"
        ? t("sleep.add")
        : kind === "pump"
          ? t("pump.add")
          : t("feed.add");

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:inset-x-auto md:right-6 md:bottom-6",
          kind !== null ? "z-40" : "z-[70]",
        )}
      >
        <div className="mx-auto flex w-full max-w-lg justify-end pr-[calc(10%-1.75rem)] md:mx-0 md:w-auto md:max-w-none md:pr-0">
          <ExpandableFab
            key={pathname}
            className="pointer-events-auto"
            actions={actions}
            label={t("fab.open")}
            closeLabel={t("fab.close")}
            locked={enabled && authStatus !== "loading" && !signedIn}
            onLocked={() => requestLogin()}
            onSelect={(id) => {
              if (isLogKind(id)) setKind(id);
            }}
          />
        </div>
      </div>
      <Dialog
        open={kind !== null}
        onOpenChange={(open) => {
          if (!open) setKind(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {kind === "feed" ? <FeedLogForm embedded onSaved={closeAndGo} /> : null}
          {kind === "pump" ? <PumpLogForm embedded onSaved={closeAndGo} /> : null}
          {kind === "diaper" ? <DiaperLogForm embedded onSaved={closeAndGo} /> : null}
          {kind === "sleep" ? <SleepLogForm embedded onSaved={closeAndGo} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
