"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { Baby, Pencil, Ruler, Trash2, Weight } from "lucide-react";
import { DateField, LogForm, NumberField, SubmitButton } from "@/components/child/form-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { measurementAgeDays } from "@/lib/child/who-growth";
import type { GrowthDay } from "@/lib/child/summary";
import type { GrowthEntry } from "@/lib/child/types";
import { cn } from "@/utils/cn";

function formatMeasure(value: number, digits: number): string {
  return String(Number(value.toFixed(digits)));
}

function MetricCell({
  value,
  digits,
  unit,
  icon: Icon,
  iconClass,
}: {
  value?: number;
  digits: number;
  unit: string;
  icon: typeof Weight;
  iconClass: string;
}) {
  if (value === undefined) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={cn("inline-flex size-6 items-center justify-center rounded-full", iconClass)}>
        <Icon className="size-3.5" />
      </span>
      <span className="font-semibold tabular-nums">
        {formatMeasure(value, digits)} {unit}
      </span>
    </span>
  );
}

function DeltaText({
  current,
  previous,
  digits,
  unit,
}: {
  current?: number;
  previous?: number;
  digits: number;
  unit: string;
}) {
  if (current === undefined || previous === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  const rounded = Number((current - previous).toFixed(digits));
  const prefix = rounded > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "font-semibold whitespace-nowrap tabular-nums",
        rounded > 0 && "text-emerald-600",
        rounded < 0 && "text-destructive",
        rounded === 0 && "text-muted-foreground",
      )}
    >
      {prefix}
      {rounded} {unit}
    </span>
  );
}

function ageLabel(
  t: (key: "growth.ageDay" | "growth.ageDays", values?: { days: number }) => string,
  birthDate: string | null,
  date: string,
): string {
  const ageDays = birthDate ? measurementAgeDays(birthDate, date) : null;
  if (ageDays == null) return "—";
  if (ageDays === 1) return t("growth.ageDay");
  return t("growth.ageDays", { days: ageDays });
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function GrowthEditForm({
  day,
  onSave,
}: {
  day: GrowthDay;
  onSave: (sourceIds: string[], entry: Omit<GrowthEntry, "id">) => void;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(day.date);
  const [weight, setWeight] = useState(day.weightKg !== undefined ? String(day.weightKg) : "");
  const [length, setLength] = useState(day.lengthCm !== undefined ? String(day.lengthCm) : "");
  const [head, setHead] = useState(day.headCm !== undefined ? String(day.headCm) : "");
  const weightKg = optionalNumber(weight);
  const lengthCm = optionalNumber(length);
  const headCm = optionalNumber(head);
  const canSave = Boolean(date && (weightKg || lengthCm || headCm));

  return (
    <LogForm
      title={t("growth.edit")}
      embedded
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        onSave(day.sourceIds, {
          date,
          ...(weightKg !== undefined ? { weightKg } : {}),
          ...(lengthCm !== undefined ? { lengthCm } : {}),
          ...(headCm !== undefined ? { headCm } : {}),
        });
      }}
    >
      <DateField date={date} onDate={setDate} />
      <NumberField
        id={`growth-edit-${day.id}-weight`}
        label={t("growth.weight")}
        value={weight}
        onChange={setWeight}
        step="0.01"
        unit="kg"
      />
      <NumberField
        id={`growth-edit-${day.id}-length`}
        label={t("growth.length")}
        value={length}
        onChange={setLength}
        step="0.1"
        unit="cm"
      />
      <NumberField
        id={`growth-edit-${day.id}-head`}
        label={t("growth.head")}
        value={head}
        onChange={setHead}
        step="0.1"
        unit="cm"
      />
      <SubmitButton label={t("common.save")} disabled={!canSave} />
    </LogForm>
  );
}

export function GrowthHistoryTable({
  days,
  birthDate,
  onDelete,
  onReplace,
}: {
  days: GrowthDay[];
  birthDate: string | null;
  onDelete: (id: string) => void;
  onReplace: (sourceIds: string[], entry: Omit<GrowthEntry, "id">) => void;
}) {
  const { t, locale } = useLocale();
  const [pending, setPending] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = days.find((day) => day.id === editingId) ?? null;
  const dfLocale = locale === "id" ? idLocale : enUS;

  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t("child.history")}</CardTitle>
        <CardDescription>{t("growth.historyHint")}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {days.length === 0 ? (
          <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("growth.empty")}
          </p>
        ) : (
          <>
            <ul className="space-y-3 md:hidden">
              {days.map((day, index) => {
                const previous = days[index + 1];
                const metrics: {
                  key: string;
                  label: string;
                  value?: number;
                  previous?: number;
                  digits: number;
                  unit: string;
                }[] = [
                  {
                    key: "weight",
                    label: t("child.measureWeight"),
                    value: day.weightKg,
                    previous: previous?.weightKg,
                    digits: 2,
                    unit: "kg",
                  },
                  {
                    key: "height",
                    label: t("child.measureHeight"),
                    value: day.lengthCm,
                    previous: previous?.lengthCm,
                    digits: 1,
                    unit: "cm",
                  },
                  {
                    key: "head",
                    label: t("child.measureHead"),
                    value: day.headCm,
                    previous: previous?.headCm,
                    digits: 1,
                    unit: "cm",
                  },
                ];
                return (
                  <li key={day.id} className="rounded-2xl bg-muted/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {format(parseISO(day.date), "d MMM yyyy", { locale: dfLocale })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ageLabel(t, birthDate, day.date)}
                        </p>
                      </div>
                      <div className="flex shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("child.edit")}
                          onClick={() => setEditingId(day.id)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("child.remove")}
                          onClick={() => setPending(day.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {metrics.map((metric) => (
                        <div key={metric.key} className="min-w-0">
                          <p className="truncate text-[11px] text-muted-foreground">{metric.label}</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {metric.value === undefined
                              ? "—"
                              : `${formatMeasure(metric.value, metric.digits)} ${metric.unit}`}
                          </p>
                          {metric.value !== undefined && metric.previous !== undefined ? (
                            <p className="text-xs">
                              <DeltaText
                                current={metric.value}
                                previous={metric.previous}
                                digits={metric.digits}
                                unit={metric.unit}
                              />
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="hidden md:block">
          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-medium">{t("child.date")}</th>
                  <th className="px-2 py-2 font-medium">{t("growth.age")}</th>
                  <th className="px-2 py-2 font-medium">{t("child.measureWeight")}</th>
                  <th className="px-2 py-2 font-medium">{t("child.measureHeight")}</th>
                  <th className="px-2 py-2 font-medium">{t("growth.headColumn")}</th>
                  <th className="px-2 py-2 font-medium">{t("growth.change")}</th>
                  <th className="px-2 py-2 font-medium">
                    <span className="sr-only">{t("child.remove")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, index) => {
                  const previous = days[index + 1];
                  const ageText = ageLabel(t, birthDate, day.date);
                  return (
                    <tr key={day.id} className="border-b border-border/40 last:border-0">
                      <td className="px-2 py-3 font-semibold whitespace-nowrap">
                        {format(parseISO(day.date), "d MMM yyyy", { locale: dfLocale })}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{ageText}</td>
                      <td className="px-2 py-3">
                        <MetricCell
                          value={day.weightKg}
                          digits={2}
                          unit="kg"
                          icon={Weight}
                          iconClass="bg-lilac text-lilac-foreground"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <MetricCell
                          value={day.lengthCm}
                          digits={1}
                          unit="cm"
                          icon={Ruler}
                          iconClass="bg-baby-sky text-sky-foreground"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <MetricCell
                          value={day.headCm}
                          digits={1}
                          unit="cm"
                          icon={Baby}
                          iconClass="bg-amber-100 text-amber-700"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                          <DeltaText
                            current={day.weightKg}
                            previous={previous?.weightKg}
                            digits={2}
                            unit="kg"
                          />
                          <DeltaText
                            current={day.lengthCm}
                            previous={previous?.lengthCm}
                            digits={1}
                            unit="cm"
                          />
                          <DeltaText
                            current={day.headCm}
                            previous={previous?.headCm}
                            digits={1}
                            unit="cm"
                          />
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("child.edit")}
                            onClick={() => setEditingId(day.id)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("child.remove")}
                            onClick={() => setPending(day.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            </div>
          </>
        )}
      </CardContent>
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("growth.edit")}</DialogTitle>
          {editing ? (
            <GrowthEditForm
              key={editing.id}
              day={editing}
              onSave={(sourceIds, entry) => {
                onReplace(sourceIds, entry);
                setEditingId(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={t("child.deleteTitle")}
        description={t("child.deleteBody")}
        confirmLabel={t("child.remove")}
        cancelLabel={t("common.cancel")}
        confirmVariant="destructive"
        onConfirm={() => {
          if (pending) onDelete(pending);
          setPending(null);
        }}
      />
    </Card>
  );
}
