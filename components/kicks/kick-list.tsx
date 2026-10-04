"use client";

import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { DateDayStrip } from "@/components/history/date-day-strip";
import { HistoryDayList } from "@/components/history/history-day-list";
import { HistoryListSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { useAppStorage } from "@/hooks/use-app-storage";
import { kickCountLabel } from "@/lib/i18n/kicks";
import { formatKickTime, getKicksForDate } from "@/lib/kicks";

export function KickList({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const { data, mounted, removeKick } = useAppStorage();
  const { locale, t } = useLocale();
  const pending = useRemoteDataPending();

  const kicks = data?.kicks ?? [];
  const entries = getKicksForDate(kicks, selectedDate);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const selectedLabel = format(parseISO(selectedDate), "EEEE, d MMMM yyyy", {
    locale: dfLocale,
  });

  if (!mounted || pending) return <HistoryListSkeleton />;

  return (
    <div className="space-y-3">
      <DateDayStrip
        selectedDate={selectedDate}
        onSelect={onSelectDate}
        markedDates={kicks.map((kick) => kick.date)}
      />
      {kicks.length === 0 ? (
        <HistoryDayList
          items={[]}
          emptyLabel={t("kicks.emptyList")}
          deleteLabel={t("kicks.deleteKick")}
          confirmTitle={t("common.confirmTitle")}
          confirmBody={t("kicks.deleteConfirm")}
          onDelete={removeKick}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">{selectedLabel}</p>
            <p className="shrink-0 text-sm font-semibold text-foreground">
              {kickCountLabel(entries.length, t)}
            </p>
          </div>
          <HistoryDayList
            items={entries.map((kick) => ({
              id: kick.id,
              time: formatKickTime(kick.time),
              title: t("common.kick").replace(/^./, (letter) => letter.toUpperCase()),
              tone: "lilac",
              icon: "kick",
            }))}
            emptyLabel={t("kicks.emptyDay")}
            deleteLabel={t("kicks.deleteKick")}
            confirmTitle={t("common.confirmTitle")}
            confirmBody={t("kicks.deleteConfirm")}
            onDelete={removeKick}
          />
        </>
      )}
    </div>
  );
}
