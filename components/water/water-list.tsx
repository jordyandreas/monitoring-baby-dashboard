"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { DateDayStrip } from "@/components/history/date-day-strip";
import { HistoryDayList } from "@/components/history/history-day-list";
import { useLocale } from "@/components/providers/locale-provider";
import { useAppStorage } from "@/hooks/use-app-storage";
import { formatTimeLabel } from "@/lib/time-utils";
import {
  formatVolume,
  getDayTotalMl,
  getTodayDateStr,
  getWaterForDate,
} from "@/lib/water";
import { WaterDaySummary } from "./water-day-summary";

export function WaterList() {
  const { data, mounted, removeWater } = useAppStorage();
  const { locale, t } = useLocale();
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);

  const entries = data?.water.entries ?? [];
  const glassSizeMl = data?.water.glassSizeMl ?? 250;
  const dayEntries = getWaterForDate(entries, selectedDate);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const selectedLabel = format(parseISO(selectedDate), "EEEE, d MMMM yyyy", {
    locale: dfLocale,
  });
  const dayTotalMl = getDayTotalMl(dayEntries);

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <DateDayStrip
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        markedDates={entries.map((entry) => entry.date)}
      />
      {entries.length === 0 ? (
        <HistoryDayList
          items={[]}
          emptyLabel={t("water.emptyList")}
          deleteLabel={t("water.deleteEntry")}
          confirmTitle={t("common.confirmTitle")}
          confirmBody={t("water.deleteConfirm")}
          onDelete={removeWater}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">{selectedLabel}</p>
            <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
              {formatVolume(dayTotalMl, locale)}
            </p>
          </div>
          <WaterDaySummary
            record={{ entries: dayEntries }}
            glassSizeMl={glassSizeMl}
            muted={selectedDate !== getTodayDateStr()}
          />
          <HistoryDayList
            items={dayEntries.map((entry) => ({
              id: entry.id,
              time: formatTimeLabel(entry.time),
              title: formatVolume(entry.amountMl, locale),
              tone: "sky",
              icon: "water",
            }))}
            emptyLabel={t("water.emptyDay")}
            deleteLabel={t("water.deleteEntry")}
            confirmTitle={t("common.confirmTitle")}
            confirmBody={t("water.deleteConfirm")}
            onDelete={removeWater}
          />
        </>
      )}
    </div>
  );
}
