"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  formatVolume,
  getDayTotalMl,
  getTodayDateStr,
  getWaterDateStrip,
  getWaterForDate,
} from "@/lib/water";
import { WaterDateStrip } from "./water-date-strip";
import { WaterDaySummary } from "./water-day-summary";

export function WaterList() {
  const { data, mounted, removeWater } = useAppStorage();
  const { locale, t } = useLocale();
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const entries = data?.water.entries ?? [];
  const glassSizeMl = data?.water.glassSizeMl ?? 250;
  const dateStrip = getWaterDateStrip(entries, 7, 7, new Date(), locale);
  const dayEntries = getWaterForDate(entries, selectedDate);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const selectedLabel = format(parseISO(selectedDate), "EEEE, d MMMM yyyy", {
    locale: dfLocale,
  });
  const dayTotalMl = getDayTotalMl(dayEntries);

  if (!mounted) return null;

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
        {t("water.emptyList")}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <WaterDateStrip
        days={dateStrip}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {selectedLabel}
          </p>
          <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
            {formatVolume(dayTotalMl, locale)}
          </p>
        </div>

        <WaterDaySummary
          record={{ entries: dayEntries }}
          glassSizeMl={glassSizeMl}
          muted={selectedDate !== getTodayDateStr()}
        />

        {dayEntries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("water.emptyDay")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
            {dayEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">
                    {formatVolume(entry.amountMl, locale)}
                  </p>
                  <p className="text-sm text-muted-foreground">{entry.time}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={t("water.deleteEntry")}
                  onClick={() => setEntryToDelete(entry.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={entryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setEntryToDelete(null);
        }}
        title={t("common.confirmTitle")}
        description={t("water.deleteConfirm")}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.ok")}
        onConfirm={() => {
          if (entryToDelete) removeWater(entryToDelete);
        }}
        confirmVariant="destructive"
      />
    </div>
  );
}
