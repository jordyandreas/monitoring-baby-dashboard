import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { MessageKey } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import type { Gender } from "@/lib/types";

type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

const TOTAL_PREGNANCY_DAYS = 280;

function dateFnsLocale(locale: Locale) {
  return locale === "id" ? idLocale : enUS;
}

function dayUnit(count: number, t: TranslateFn): string {
  return count === 1 ? t("common.daySingular") : t("common.days");
}

export function genderLabel(gender: Gender, t: TranslateFn): string {
  switch (gender) {
    case "boy":
      return t("baby.boy");
    case "girl":
      return t("baby.girl");
    default:
      return t("baby.notYet");
  }
}

export function getDueDateCountdown(dueDate: string, t: TranslateFn): string {
  const due = parseISO(dueDate);
  const today = new Date();
  const days = differenceInCalendarDays(due, today);

  if (days > 0) {
    return t("baby.daysUntilDue", {
      count: days,
      unit: dayUnit(days, t),
    });
  }
  if (days === 0) return t("baby.dueToday");
  const past = Math.abs(days);
  return t("baby.daysPastDue", {
    count: past,
    unit: dayUnit(past, t),
  });
}

export function formatDueDate(dueDate: string, locale: Locale): string {
  return format(parseISO(dueDate), "d MMMM yyyy", {
    locale: dateFnsLocale(locale),
  });
}

export type Trimester = 1 | 2 | 3;

export interface PregnancyProgress {
  weeks: number;
  days: number;
  label: string;
  weekDisplay: string;
  trimester: Trimester | null;
  trimesterLabel: string | null;
  isPastDue: boolean;
}

function getTrimesterFromWeeks(weeks: number): Trimester | null {
  if (weeks < 1) return null;
  if (weeks <= 12) return 1;
  if (weeks <= 26) return 2;
  return 3;
}

function formatTrimesterLabel(trimester: Trimester, t: TranslateFn): string {
  switch (trimester) {
    case 1:
      return t("baby.trimester1");
    case 2:
      return t("baby.trimester2");
    case 3:
      return t("baby.trimester3");
  }
}

function trimesterFields(weeks: number, t: TranslateFn) {
  const trimester = getTrimesterFromWeeks(weeks);
  return {
    trimester,
    trimesterLabel: trimester ? formatTrimesterLabel(trimester, t) : null,
  };
}

export function getPregnancyProgress(
  dueDate: string,
  t: TranslateFn,
  locale: Locale,
): PregnancyProgress {
  const due = startOfDay(parseISO(dueDate));
  const today = startOfDay(new Date());
  const daysUntilDue = differenceInCalendarDays(due, today);
  const gestationalDays = TOTAL_PREGNANCY_DAYS - daysUntilDue;

  if (gestationalDays < 0) {
    const over = Math.abs(gestationalDays);
    const totalDays = TOTAL_PREGNANCY_DAYS + over;
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const label =
      days > 0
        ? t("baby.pastDueWeeks", {
            weeks,
            days,
            dayUnit: dayUnit(days, t),
          })
        : t("baby.pastDueWeeksOnly", { weeks });
    return {
      weeks,
      days,
      label,
      weekDisplay: `${t("baby.week")} ${weeks}`,
      ...trimesterFields(weeks, t),
      isPastDue: true,
    };
  }

  if (gestationalDays > TOTAL_PREGNANCY_DAYS) {
    return {
      weeks: 0,
      days: 0,
      label: t("baby.dueFarAway"),
      weekDisplay: "—",
      trimester: null,
      trimesterLabel: null,
      isPastDue: false,
    };
  }

  const weeks = Math.floor(gestationalDays / 7);
  const days = gestationalDays % 7;

  const label =
    days > 0
      ? t("baby.weeksPregnant", {
          weeks,
          days,
          dayUnit: dayUnit(days, t),
        })
      : weeks === 1
        ? t("baby.weekPregnant", { weeks })
        : t("baby.weeksPregnantShort", { weeks });

  const weekDisplay =
    days > 0 ? `${t("baby.week")} ${weeks}+${days}` : `${t("baby.week")} ${weeks}`;

  return {
    weeks,
    days,
    label,
    weekDisplay,
    ...trimesterFields(weeks, t),
    isPastDue: false,
  };
}

export function getBabyGreeting(
  name: string,
  gender: Gender,
  t: TranslateFn,
): string {
  const trimmed = name.trim();
  if (!trimmed) return t("baby.greetingDefault");

  switch (gender) {
    case "boy":
      return t("baby.greetingBoy", { name: trimmed });
    case "girl":
      return t("baby.greetingGirl", { name: trimmed });
    default:
      return t("baby.greetingUnknown", { name: trimmed });
  }
}
