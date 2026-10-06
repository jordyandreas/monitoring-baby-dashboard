"use client";

import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { DateDayStrip } from "@/components/history/date-day-strip";
import { HistoryDayList } from "@/components/history/history-day-list";
import { HistoryListSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import { formatTimeLabel } from "@/utils/time";
import { deleteWater, getWater } from "@/services/water.service";
import {
  formatVolume,
  getDayTotalMl,
  getTodayDateStr,
  getWaterForDate,
} from "@/lib/pregnancy/water";
import { WaterDaySummary } from "./water-day-summary";

export function WaterList({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("water", getWater, signedIn);
  const { locale, t } = useLocale();

  const entries = data?.entries ?? [];
  const glassSizeMl = data?.glassSizeMl ?? 250;
  const dayEntries = getWaterForDate(entries, selectedDate);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const selectedLabel = format(parseISO(selectedDate), "EEEE, d MMMM yyyy", {
    locale: dfLocale,
  });
  const dayTotalMl = getDayTotalMl(dayEntries);

  const placeholder = remotePlaceholder(ready, error, data, reload, <HistoryListSkeleton />);
  if (placeholder) return placeholder;

  return (
    <div className="space-y-3">
      <DateDayStrip
        selectedDate={selectedDate}
        onSelect={onSelectDate}
        markedDates={entries.map((entry) => entry.date)}
      />
      {entries.length === 0 ? (
        <HistoryDayList
          items={[]}
          emptyLabel={t("water.emptyList")}
          deleteLabel={t("water.deleteEntry")}
          confirmTitle={t("common.confirmTitle")}
          confirmBody={t("water.deleteConfirm")}
          onDelete={(id) => {
            void commitSave("water", () => deleteWater(id), "delete", undefined, "water");
          }}
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
            onDelete={(id) => {
            void commitSave("water", () => deleteWater(id), "delete", undefined, "water");
          }}
          />
        </>
      )}
    </div>
  );
}
