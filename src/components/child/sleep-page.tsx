"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { SleepRangeSummary, useSummaryLink } from "@/components/child/page-summary";
import { SleepLogForm } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemote } from "@/hooks/use-remote";
import { sleepHistoryParts } from "@/lib/child/summary";
import { deleteSleep, listSleeps } from "@/services/sleep.service";

export function SleepPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("sleep", listSleeps, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = useSummaryLink();
  const sleeps = data ?? [];
  const editing = sleeps.find((entry) => entry.id === editingId) ?? null;

  if (!ready) return <LogPageSkeleton tiles={4} />;

  return (
    <LogScreen>
      <SleepLogForm />
      <SleepRangeSummary entries={sleeps} link={summary} />
      <ChildDayHistory
        selectedDate={summary.day}
        onSelectDate={summary.selectHistoryDate}
        entries={sleeps.map((entry) => ({
          ...entry,
          time: entry.startTime,
          ...sleepHistoryParts(entry, t),
        }))}
        emptyLabel={t("sleep.empty")}
        onDelete={(id) => {
          void commitSave("sleep", () => deleteSleep(id), "delete", undefined, "sleep");
        }}
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
