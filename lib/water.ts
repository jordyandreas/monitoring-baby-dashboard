import {
  addDays,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/types";
import type { WaterEntry } from "./types";

/** Pregnancy guideline: 2.1–3 L per day. */
export const WATER_MIN_ML = 2100;
export const WATER_TARGET_ML = 3000;
export const DEFAULT_GLASS_ML = 250;
export const GLASS_SIZE_PRESETS = [250, 300, 500, 1000] as const;
export const MAX_GLASS_SIZE_ML = 1000;
export const GLASSES_MIN = 8;
export const GLASSES_MAX = 12;

export type WaterDayStatus = "empty" | "low" | "good" | "above";

function dateFnsLocale(locale: Locale) {
  return locale === "id" ? idLocale : enUS;
}

export function getTodayDateStr(reference: Date = new Date()): string {
  return format(startOfDay(reference), "yyyy-MM-dd");
}

export function formatWaterDate(dateStr: string, locale: Locale = "en"): string {
  return format(parseISO(dateStr), "EEEE, d MMM", {
    locale: dateFnsLocale(locale),
  });
}

export function getDayTotalMl(entries: Pick<WaterEntry, "amountMl">[]): number {
  return entries.reduce((sum, entry) => sum + entry.amountMl, 0);
}

export function mlToGlasses(ml: number, glassSizeMl: number): number {
  if (glassSizeMl <= 0) return 0;
  return Math.round((ml / glassSizeMl) * 10) / 10;
}

export function getDayStatus(totalMl: number): WaterDayStatus {
  if (totalMl <= 0) return "empty";
  if (totalMl < WATER_MIN_ML) return "low";
  if (totalMl <= WATER_TARGET_ML) return "good";
  return "above";
}

export function getProgressPercent(totalMl: number): number {
  return Math.min(100, Math.round((totalMl / WATER_MIN_ML) * 100));
}

/** Format volume for display (e.g. "1.5 L" or "500 ml"). */
export function formatVolume(ml: number, locale: Locale = "en"): string {
  if (ml >= 1000) {
    const liters = Math.round((ml / 1000) * 10) / 10;
    return `${liters} L`;
  }
  return `${ml} ml`;
}

/** Compact label for date-strip badges. */
export function formatVolumeCompact(ml: number): string {
  if (ml >= 1000) {
    return `${Math.round((ml / 1000) * 10) / 10}L`;
  }
  if (ml <= 0) return "";
  return `${ml}`;
}

export function normalizeGlassSize(glassSizeMl?: number): number {
  if (typeof glassSizeMl !== "number" || !Number.isFinite(glassSizeMl)) {
    return DEFAULT_GLASS_ML;
  }
  const rounded = Math.round(glassSizeMl);
  if (rounded < 100) return 100;
  if (rounded > MAX_GLASS_SIZE_ML) return MAX_GLASS_SIZE_ML;
  return rounded;
}

export function getWaterInRange(
  entries: WaterEntry[],
  days: number,
  reference: Date = new Date(),
): WaterEntry[] {
  const end = startOfDay(reference);
  const start = subDays(end, days - 1);

  return entries.filter((entry) => {
    const date = startOfDay(parseISO(entry.date));
    return isWithinInterval(date, { start, end });
  });
}

export interface WaterPerDayItem {
  date: string;
  dayLabel: string;
  fullLabel: string;
  isToday: boolean;
  totalMl: number;
  status: WaterDayStatus;
}

export function getWaterPerDay(
  entries: WaterEntry[],
  days: number,
  reference: Date = new Date(),
  locale: Locale = "en",
): WaterPerDayItem[] {
  const result: WaterPerDayItem[] = [];
  const today = startOfDay(reference);
  const dfLocale = dateFnsLocale(locale);
  const compactAxis = days > 7;

  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, "yyyy-MM-dd");
    const dayEntries = entries.filter((e) => e.date === dateStr);
    const totalMl = getDayTotalMl(dayEntries);
    result.push({
      date: dateStr,
      dayLabel: compactAxis
        ? format(day, "d/M", { locale: dfLocale })
        : format(day, "d", { locale: dfLocale }),
      fullLabel: format(day, "EEE, d MMM yyyy", { locale: dfLocale }),
      isToday: isSameDay(day, today),
      totalMl,
      status: getDayStatus(totalMl),
    });
  }

  return result;
}

export function countDaysMetGoal(
  perDay: WaterPerDayItem[],
): number {
  return perDay.filter(
    (d) => d.status === "good" || d.status === "above",
  ).length;
}

export interface WaterDateStripItem {
  date: string;
  label: string;
  isToday: boolean;
  totalMl: number;
}

export function getWaterDateStrip(
  entries: WaterEntry[],
  daysBefore = 7,
  daysAfter = 7,
  reference: Date = new Date(),
  locale: Locale = "en",
): WaterDateStripItem[] {
  const today = startOfDay(reference);

  return Array.from({ length: daysBefore + daysAfter + 1 }, (_, i) => {
    const day = addDays(today, i - daysBefore);
    const date = format(day, "yyyy-MM-dd");
    const dayEntries = entries.filter((e) => e.date === date);
    return {
      date,
      label: format(day, "EEE, d MMM yyyy", { locale: dateFnsLocale(locale) }),
      isToday: isSameDay(day, today),
      totalMl: getDayTotalMl(dayEntries),
    };
  });
}

export function getWaterForDate(
  entries: WaterEntry[],
  date: string,
): WaterEntry[] {
  return entries
    .filter((e) => e.date === date)
    .sort((a, b) => b.time.localeCompare(a.time));
}
