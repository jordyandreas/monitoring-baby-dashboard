"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { DayCountCard } from "@/components/child/day-count";
import { MedicineLogForm, TemperatureLogForm } from "@/components/child/extra-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSummaryLink } from "@/hooks/use-summary-link";
import { useRemote } from "@/hooks/use-remote";
import { healthHistoryParts } from "@/lib/child/summary";
import type { HealthEntry, HealthKind } from "@/lib/child/types";
import { deleteHealth, listHealth } from "@/services/health.service";
import { cn } from "@/utils/cn";

export function HealthPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("health", listHealth, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<HealthKind>("temperature");
  const summary = useSummaryLink();
  const entries = data ?? [];
  const editing = entries.find((entry) => entry.id === editingId) ?? null;
  const temperatures = entries.filter((entry) => entry.kind === "temperature");
  const medicines = entries.filter((entry) => entry.kind === "medicine");
  const dayTemperatures = temperatures.filter((entry) => entry.date === summary.day);
  const dayMedicines = medicines.filter((entry) => entry.date === summary.day);
  const latest = [...temperatures].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))[0];

  const placeholder = remotePlaceholder(ready, error, data, reload, <LogPageSkeleton tiles={2} />);
  if (placeholder) return placeholder;

  return (
    <LogScreen>
      <div role="tablist" aria-label={t("pages.health.title")} className="grid grid-cols-2 gap-1 rounded-full bg-white/75 p-1 ring-1 ring-lilac/30">
        <HealthTab selected={tab === "temperature"} onSelect={() => setTab("temperature")}>
          {t("health.temperatureTab")}
        </HealthTab>
        <HealthTab selected={tab === "medicine"} onSelect={() => setTab("medicine")}>
          {t("health.medicineTab")}
        </HealthTab>
      </div>
      {tab === "temperature" ? (
        <section className="space-y-4">
          <TemperatureLogForm />
          <DayCountCard
            items={[
              {
                label: t("health.lastTemperature"),
                value:
                  latest?.temperatureC !== undefined
                    ? t("health.tempValue", { value: latest.temperatureC })
                    : t("health.temperatureEmpty"),
              },
              { label: t("health.temperatureCount"), value: String(dayTemperatures.length) },
            ]}
          />
          <ChildDayHistory
            selectedDate={summary.day}
            onSelectDate={summary.selectHistoryDate}
            entries={temperatures.map((entry) => ({
              ...entry,
              ...healthHistoryParts(entry, t),
            }))}
            emptyLabel={t("health.temperatureEmpty")}
            emptyIcon="temperature"
            onDelete={(id) => {
              void commitSave("health", () => deleteHealth(id), "delete", undefined, "temperature");
            }}
            onEdit={setEditingId}
          />
        </section>
      ) : (
        <section className="space-y-4">
          <MedicineLogForm />
          <DayCountCard items={[{ label: t("health.medicineCount"), value: String(dayMedicines.length) }]} />
          <ChildDayHistory
            selectedDate={summary.day}
            onSelectDate={summary.selectHistoryDate}
            entries={medicines.map((entry) => ({
              ...entry,
              ...healthHistoryParts(entry, t),
            }))}
            emptyLabel={t("health.medicineEmpty")}
            emptyIcon="medicine"
            onDelete={(id) => {
              void commitSave("health", () => deleteHealth(id), "delete", undefined, "medicine");
            }}
            onEdit={setEditingId}
          />
        </section>
      )}
      <HealthEditDialog editing={editing} onClose={() => setEditingId(null)} />
    </LogScreen>
  );
}

function HealthTab({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "rounded-full px-3 py-2 text-sm font-semibold",
        selected ? "bg-lilac-deep text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/80",
      )}
    >
      {children}
    </button>
  );
}

function HealthEditDialog({ editing, onClose }: { editing: HealthEntry | null; onClose: () => void }) {
  const { t } = useLocale();
  const title = editing?.kind === "medicine" ? t("health.medicineEdit") : t("health.temperatureEdit");
  return (
    <Dialog
      open={editing !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {editing?.kind === "temperature" ? (
          <TemperatureLogForm key={editing.id} initial={editing} onSaved={onClose} />
        ) : null}
        {editing?.kind === "medicine" ? (
          <MedicineLogForm key={editing.id} initial={editing} onSaved={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
