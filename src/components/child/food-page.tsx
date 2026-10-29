"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { DayCountCard } from "@/components/child/day-count";
import { FoodLogForm } from "@/components/child/extra-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSummaryLink } from "@/hooks/use-summary-link";
import { useRemote } from "@/hooks/use-remote";
import { foodHistoryParts } from "@/lib/child/summary";
import { deleteFood, listFoods } from "@/services/food.service";

export function FoodPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("food", listFoods, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = useSummaryLink();
  const foods = data ?? [];
  const editing = foods.find((entry) => entry.id === editingId) ?? null;
  const dayCount = foods.filter((entry) => entry.date === summary.day).length;

  const placeholder = remotePlaceholder(ready, error, data, reload, <LogPageSkeleton tiles={2} />);
  if (placeholder) return placeholder;

  return (
    <LogScreen>
      <FoodLogForm />
      <DayCountCard items={[{ label: t("food.dayCount"), value: String(dayCount) }]} />
      <ChildDayHistory
        selectedDate={summary.day}
        onSelectDate={summary.selectHistoryDate}
        entries={foods.map((entry) => ({
          ...entry,
          ...foodHistoryParts(entry, t),
        }))}
        emptyLabel={t("food.empty")}
        emptyIcon="food"
        onDelete={(id) => {
          void commitSave("food", () => deleteFood(id), "delete", undefined, "food");
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
          <DialogTitle className="sr-only">{t("food.edit")}</DialogTitle>
          {editing ? <FoodLogForm key={editing.id} initial={editing} onSaved={() => setEditingId(null)} /> : null}
        </DialogContent>
      </Dialog>
    </LogScreen>
  );
}
