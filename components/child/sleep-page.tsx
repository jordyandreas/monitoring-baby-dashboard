"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { SleepRangeSummary } from "@/components/child/page-summary";
import { SleepLogForm } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton } from "@/components/layout/data-skeletons";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { sleepHistoryParts } from "@/lib/child/summary";

export function SleepPageContent() {
  const { t } = useLocale();
  const { data, mounted, removeSleep } = useChildStorage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = data.sleeps.find((entry) => entry.id === editingId) ?? null;

  const pending = useRemoteDataPending();

  if (!mounted || pending) return <LogPageSkeleton tiles={4} />;

  return (
    <LogScreen>
      <SleepLogForm />
      <SleepRangeSummary entries={data.sleeps} />
      <ChildDayHistory
        entries={data.sleeps.map((entry) => ({
          ...entry,
          time: entry.startTime,
          ...sleepHistoryParts(entry, t),
        }))}
        emptyLabel={t("sleep.empty")}
        onDelete={removeSleep}
        onEdit={setEditingId}
      />
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("sleep.edit")}</DialogTitle>
          {editing ? (
            <SleepLogForm key={editing.id} initial={editing} onSaved={() => setEditingId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </LogScreen>
  );
}
