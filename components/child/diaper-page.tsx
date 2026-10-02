"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { DiaperRangeSummary } from "@/components/child/page-summary";
import { DiaperLogForm } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { diaperHistoryParts } from "@/lib/child/summary";

export function DiaperPageContent() {
  const { t } = useLocale();
  const { data, mounted, removeDiaper } = useChildStorage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = data.diapers.find((entry) => entry.id === editingId) ?? null;

  if (!mounted) return null;

  return (
    <LogScreen intro={t("diaper.intro")}>
      <DiaperLogForm />
      <DiaperRangeSummary entries={data.diapers} />
      <ChildDayHistory
        entries={data.diapers.map((entry) => ({
          ...entry,
          ...diaperHistoryParts(entry, t),
        }))}
        emptyLabel={t("diaper.empty")}
        onDelete={removeDiaper}
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
