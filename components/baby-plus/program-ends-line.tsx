"use client";

import { format } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { useLocale } from "@/components/providers/locale-provider";
import { getProgramEnd } from "@/lib/baby-plus";
import { formatTimeAmPm, parseTimeString } from "@/lib/time-utils";

type ProgramEndsLineProps = {
  startDate: Date;
  dailyTime: string;
  dateFormat?: string;
};

export function ProgramEndsLine({
  startDate,
  dailyTime,
  dateFormat = "EEEE, d MMMM yyyy",
}: ProgramEndsLineProps) {
  const { locale, t } = useLocale();
  const dfLocale = locale === "id" ? idLocale : enUS;
  const ends = format(getProgramEnd(startDate), dateFormat, { locale: dfLocale });
  const timeLabel =
    dailyTime && parseTimeString(dailyTime) ? formatTimeAmPm(dailyTime) : null;

  return (
    <p className="text-xs text-muted-foreground">
      {timeLabel ? (
        <>
          {t("babyPlus.everyDayEnds", { time: timeLabel, date: ends })}
        </>
      ) : (
        <>{t("babyPlus.ends", { date: ends })}</>
      )}
    </p>
  );
}
