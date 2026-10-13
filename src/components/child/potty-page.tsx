"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { DayCountCard } from "@/components/child/day-count";
import { PottyLogForm } from "@/components/child/extra-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { FeatureLink } from "@/components/layout/feature-link";
import { LogPageSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSummaryLink } from "@/hooks/use-summary-link";
import { useRemote } from "@/hooks/use-remote";
import { pottyHistoryParts } from "@/lib/child/summary";
import { deletePotty, listPotty } from "@/services/potty.service";

export function PottyPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("potty", listPotty, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = useSummaryLink();
  const entries = data ?? [];
  const editing = entries.find((entry) => entry.id === editingId) ?? null;
  const day = entries.filter((entry) => entry.date === summary.day);

  const placeholder = remotePlaceholder(ready, error, data, reload, <LogPageSkeleton tiles={3} />);
  if (placeholder) return placeholder;

  return (
    <LogScreen>
      <PottyLogForm />
      <DayCountCard
        items={[
          { label: t("potty.pee"), value: String(day.filter((entry) => entry.kind === "pee").length) },
          { label: t("potty.poop"), value: String(day.filter((entry) => entry.kind === "poop").length) },
          { label: t("potty.accident"), value: String(day.filter((entry) => entry.kind === "accident").length) },
        ]}
      />
      <ChildDayHistory
        selectedDate={summary.day}
        onSelectDate={summary.selectHistoryDate}
        entries={entries.map((entry) => ({
          ...entry,
          ...pottyHistoryParts(entry, t),
        }))}
        emptyLabel={t("potty.empty")}
        onDelete={(id) => {
          void commitSave("potty", () => deletePotty(id), "delete", undefined, "potty");
        }}
        onEdit={setEditingId}
      />
      <FeatureLink href="/diapers" className="inline-flex text-sm font-semibold text-lilac-deep">
        {t("child.diaperHistory")}
      </FeatureLink>
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("potty.edit")}</DialogTitle>
          {editing ? <PottyLogForm key={editing.id} initial={editing} onSaved={() => setEditingId(null)} /> : null}
        </DialogContent>
      </Dialog>
    </LogScreen>
  );
}
