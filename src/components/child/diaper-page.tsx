"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { LastLogLine } from "@/components/child/last-log-line";
import { DiaperRangeSummary, useSummaryLink } from "@/components/child/page-summary";
import { DiaperLogForm } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemote } from "@/hooks/use-remote";
import { diaperHistoryParts, diaperLastStatuses } from "@/lib/child/summary";
import { diaperShareText } from "@/lib/child/whatsapp-share";
import { deleteDiaper, listDiapers } from "@/services/diapers.service";

export function DiaperPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("diaper", listDiapers, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = useSummaryLink();
  const diapers = data ?? [];
  const editing = diapers.find((entry) => entry.id === editingId) ?? null;

  const placeholder = remotePlaceholder(
    ready,
    error,
    data,
    reload,
    <LogPageSkeleton tiles={3} withLast withLastPair />,
  );
  if (placeholder) return placeholder;

  const last = diaperLastStatuses(diapers, t);
  const lastItems = last ? [last.change, last.poop].filter((item) => item !== null) : [];

  return (
    <LogScreen>
      <LastLogLine items={lastItems} />
      <DiaperLogForm />
      <DiaperRangeSummary entries={diapers} link={summary} />
      <ChildDayHistory
        selectedDate={summary.day}
        onSelectDate={summary.selectHistoryDate}
        entries={diapers.map((entry) => ({
          ...entry,
          ...diaperHistoryParts(entry, t),
          shareText: diaperShareText(entry, t),
        }))}
        emptyLabel={t("diaper.empty")}
        onDelete={(id) => {
          void commitSave("diaper", () => deleteDiaper(id), "delete", undefined, "diaper");
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
          <DialogTitle className="sr-only">{t("diaper.edit")}</DialogTitle>
          {editing ? (
            <DiaperLogForm key={editing.id} initial={editing} onSaved={() => setEditingId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </LogScreen>
  );
}
