"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { LastLogLine } from "@/components/child/last-log-line";
import { SleepRangeSummary, useSummaryLink } from "@/components/child/page-summary";
import { SleepLogForm, SleepTracker } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton, remotePlaceholder, SleepFormSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemote } from "@/hooks/use-remote";
import { sleepHistoryParts, sleepLastStatuses, sleepRowDurations } from "@/lib/child/summary";
import { sleepShareText } from "@/lib/child/whatsapp-share";
import { deleteSleep, listSleeps } from "@/services/sleep.service";

export function SleepPageContent() {
  const { t, locale } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("sleep", listSleeps, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = useSummaryLink();
  const sleeps = data ?? [];
  const editing = sleeps.find((entry) => entry.id === editingId) ?? null;

  const placeholder = remotePlaceholder(
    ready,
    error,
    data,
    reload,
    <LogPageSkeleton tiles={4} withLast withLastPair form={<SleepFormSkeleton />} />,
  );
  if (placeholder) return placeholder;

  const rowDurations = sleepRowDurations(sleeps);

  return (
    <LogScreen>
      <LastLogLine items={sleepLastStatuses(sleeps, t, locale)} />
      <SleepTracker entries={sleeps} withStatus={false} />
      <SleepRangeSummary entries={sleeps} link={summary} />
      <ChildDayHistory
        selectedDate={summary.day}
        onSelectDate={summary.selectHistoryDate}
        entries={sleeps.map((entry) => ({
          ...entry,
          ...sleepHistoryParts(entry, t, rowDurations),
          shareText: sleepShareText(entry, sleeps, t),
        }))}
        emptyLabel={t("sleep.empty")}
        emptyIcon="sleep"
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
            <SleepLogForm key={editing.id} initial={editing} entries={sleeps} onSaved={() => setEditingId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </LogScreen>
  );
}
