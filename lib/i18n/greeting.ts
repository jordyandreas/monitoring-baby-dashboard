import type { MessageKey } from "@/lib/i18n";
import { localeToIntl, type Locale } from "@/lib/i18n/types";

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

export function formatLiveClockLine(date: Date, locale: Locale): string {
  const intl = localeToIntl(locale);
  const time = new Intl.DateTimeFormat(intl, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const day = new Intl.DateTimeFormat(intl, {
    weekday: "long",
  }).format(date);

  return `${time} • ${day}`;
}
