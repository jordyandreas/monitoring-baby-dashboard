"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { PumpRangeSummary, useSummaryLink } from "@/components/child/page-summary";
import { PumpLogForm } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemote } from "@/hooks/use-remote";
import { pumpHistoryParts } from "@/lib/child/summary";
import { pumpShareText } from "@/lib/child/whatsapp-share";
import { deletePump, listPumps } from "@/services/pump.service";

export function PumpPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("pump", listPumps, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = useSummaryLink();
  const pumps = data ?? [];
  const editing = pumps.find((entry) => entry.id === editingId) ?? null;

  const placeholder = remotePlaceholder(ready, error, data, reload, <LogPageSkeleton tiles={3} />);
  if (placeholder) return placeholder;

  return (
    <LogScreen>
      <PumpLogForm />
      <PumpRangeSummary entries={pumps} link={summary} />
      <ChildDayHistory
        selectedDate={summary.day}
        onSelectDate={summary.selectHistoryDate}
        entries={pumps.map((entry) => ({
          ...entry,
          ...pumpHistoryParts(entry, t),
          shareText: pumpShareText(entry, t),
        }))}
        emptyLabel={t("pump.empty")}
        onDelete={(id) => {
          void commitSave("pump", () => deletePump(id), "delete", undefined, "pump");
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
          <DialogTitle className="sr-only">{t("pump.edit")}</DialogTitle>
          {editing ? (
            <PumpLogForm key={editing.id} initial={editing} onSaved={() => setEditingId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </LogScreen>
  );
}
