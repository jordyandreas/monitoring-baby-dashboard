"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { DateDayStrip } from "@/components/history/date-day-strip";
import { HistoryDayList } from "@/components/history/history-day-list";
import { useLocale } from "@/components/providers/locale-provider";
import type { HistoryIcon, HistoryTone } from "@/lib/child/summary";
import { formatTimeLabel } from "@/lib/time-utils";
import { getTodayDateStr } from "@/lib/vitamins";

type DayEntry = {
  id: string;
  date: string;
  time: string;
  title: string;
  subtitle?: string;
  tone: HistoryTone;
  icon: HistoryIcon;
};

export function ChildDayHistory<T extends DayEntry>({
  entries,
  emptyLabel,
  onDelete,
  onEdit,
}: {
  entries: T[];
  emptyLabel: string;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const { t, locale } = useLocale();
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const selectedLabel = format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: dfLocale });
  const dayEntries = entries
    .filter((entry) => entry.date === selectedDate)
    .sort((a, b) => b.time.localeCompare(a.time));

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t("child.history")}</h2>
      <DateDayStrip
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        markedDates={entries.map((entry) => entry.date)}
      />
      {entries.length === 0 ? (
        <HistoryDayList
          items={[]}
          emptyLabel={emptyLabel}
          deleteLabel={t("child.remove")}
          editLabel={t("child.edit")}
          confirmTitle={t("child.deleteTitle")}
          confirmBody={t("child.deleteBody")}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">{selectedLabel}</p>
            <p className="shrink-0 text-sm font-semibold">
              {dayEntries.length === 1
                ? t("child.logCountOne")
                : t("child.logCount", { count: dayEntries.length })}
            </p>
          </div>
          <HistoryDayList
            items={dayEntries.map((entry) => ({
              id: entry.id,
              time: formatTimeLabel(entry.time),
              title: entry.title,
              subtitle: entry.subtitle,
              tone: entry.tone,
              icon: entry.icon,
            }))}
            emptyLabel={t("child.emptyDay")}
            deleteLabel={t("child.remove")}
            editLabel={t("child.edit")}
            confirmTitle={t("child.deleteTitle")}
            confirmBody={t("child.deleteBody")}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </>
      )}
    </section>
  );
}
