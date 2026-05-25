import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/types";
import { isBeforeDailySessionTime, parseTimeString } from "./time-utils";

export const TOTAL_SOUNDS = 16;
export const DAYS_PER_SOUND = 9;
export const TOTAL_DAYS = TOTAL_SOUNDS * DAYS_PER_SOUND;

export function completionKey(soundIndex: number, dayIndex: number): string {
  return `${soundIndex}-${dayIndex}`;
}

export function parseStartDate(startDate: string): Date | null {
  if (!startDate) return null;
  return startOfDay(parseISO(startDate));
}

export function getBlockDates(startDate: Date, soundIndex: number): Date[] {
  const blockStart = addDays(startDate, soundIndex * DAYS_PER_SOUND);
  return Array.from({ length: DAYS_PER_SOUND }, (_, i) =>
    addDays(blockStart, i),
  );
}

export function getProgramEnd(startDate: Date): Date {
  return addDays(startDate, TOTAL_DAYS - 1);
}

export function getProgramDayIndex(startDate: Date, date: Date): number {
  return differenceInCalendarDays(startOfDay(date), startDate);
}

export type ProgramPosition =
  | { status: "before" }
  | { status: "after" }
  | {
      status: "active";
      soundIndex: number;
      dayIndex: number;
      programDayIndex: number;
    };

export function getProgramPosition(
  startDate: Date,
  date: Date = new Date(),
): ProgramPosition {
  const today = startOfDay(date);
  const programDayIndex = getProgramDayIndex(startDate, today);

  if (programDayIndex < 0) return { status: "before" };
  if (programDayIndex >= TOTAL_DAYS) return { status: "after" };

  const soundIndex = Math.floor(programDayIndex / DAYS_PER_SOUND);
  const dayIndex = programDayIndex % DAYS_PER_SOUND;

  return { status: "active", soundIndex, dayIndex, programDayIndex };
}

export function countCompletions(completions: Record<string, boolean>): number {
  return Object.values(completions).filter(Boolean).length;
}

export function isDateInFuture(date: Date, reference: Date = new Date()): boolean {
  return isAfter(startOfDay(date), startOfDay(reference));
}

export function isToday(date: Date, reference: Date = new Date()): boolean {
  return isSameDay(date, reference);
}

export function formatDisplayDate(date: Date, locale: Locale = "en"): string {
  return format(date, "EEE, d MMM", {
    locale: locale === "id" ? idLocale : enUS,
  });
}

export function isBeforeProgram(date: Date, startDate: Date): boolean {
  return isBefore(startOfDay(date), startDate);
}

export function isAfterProgram(date: Date, startDate: Date): boolean {
  return isAfter(startOfDay(date), getProgramEnd(startDate));
}

export type TodayListeningPhase = "waiting" | "ready" | "done";

export type TodayListeningStatus =
  | { kind: "before-program" }
  | { kind: "after-program" }
  | {
      kind: "active";
      soundIndex: number;
      dayIndex: number;
      phase: TodayListeningPhase;
    };

export function getTodayListeningStatus(
  startDate: Date,
  dailyTime: string,
  completions: Record<string, boolean>,
  now: Date = new Date(),
): TodayListeningStatus {
  const position = getProgramPosition(startDate, now);

  if (position.status === "before") return { kind: "before-program" };
  if (position.status === "after") return { kind: "after-program" };

  const key = completionKey(position.soundIndex, position.dayIndex);
  if (completions[key]) {
    return {
      kind: "active",
      soundIndex: position.soundIndex,
      dayIndex: position.dayIndex,
      phase: "done",
    };
  }

  const hasDailyTime = !!parseTimeString(dailyTime);
  const phase: TodayListeningPhase =
    hasDailyTime && isBeforeDailySessionTime(now, dailyTime) ? "waiting" : "ready";

  return {
    kind: "active",
    soundIndex: position.soundIndex,
    dayIndex: position.dayIndex,
    phase,
  };
}
