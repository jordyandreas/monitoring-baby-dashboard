import { format } from "date-fns";
import type { MessageKey } from "@/lib/i18n";
import { localeToIntl, type Locale } from "@/lib/i18n/types";
import { formatTimeLabel, TIME_STORAGE_FORMAT } from "@/utils/time";

export type TimeOfDayGreeting = {
  message: string;
  emoji: string;
};

type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

export function getTimeOfDayGreeting(
  date: Date,
  t: TranslateFn,
): TimeOfDayGreeting {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return { message: t("greeting.goodMorning"), emoji: "☀️" };
  }
  if (hour >= 12 && hour < 17) {
    return { message: t("greeting.goodAfternoon"), emoji: "🌤️" };
  }
  if (hour >= 17 && hour < 21) {
    return { message: t("greeting.goodEvening"), emoji: "🌙" };
  }
  return { message: t("greeting.goodNight"), emoji: "✨" };
}

export function formatLiveClockParts(date: Date, locale: Locale): { time: string; date: string } {
  const intl = localeToIntl(locale);
  const zone = new Intl.DateTimeFormat(intl, { timeZoneName: "short" })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const clock = formatTimeLabel(format(date, TIME_STORAGE_FORMAT), locale);
  const time = zone ? `${clock} ${zone}` : clock;
  const fullDate = new Intl.DateTimeFormat(intl, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return { time, date: fullDate };
}

export function formatLiveClockLine(date: Date, locale: Locale): string {
  const { time, date: fullDate } = formatLiveClockParts(date, locale);
  return `${time} • ${fullDate}`;
}
