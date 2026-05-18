import {
  addDays,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { formatTimeAmPm } from "./time-utils";
import type { KickEntry } from "./types";

export function formatKickTime(time: string): string {
  return formatTimeAmPm(time);
}

export function getKicksInRange(
  kicks: KickEntry[],
  days: number,
  reference: Date = new Date(),
): KickEntry[] {
  const end = startOfDay(reference);
  const start = subDays(end, days - 1);

  return kicks.filter((kick) => {
    const date = startOfDay(parseISO(kick.date));
    return isWithinInterval(date, { start, end });
  });
}

export function getKicksPerDay(
  kicks: KickEntry[],
  days: number,
  reference: Date = new Date(),
): { date: string; label: string; count: number }[] {
  const result: { date: string; label: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(startOfDay(reference), i);
    const dateStr = format(day, "yyyy-MM-dd");
    const count = kicks.filter((k) => k.date === dateStr).length;
    result.push({
      date: dateStr,
      label: format(day, "MMM d"),
      count,
    });
  }

  return result;
}

export function getHourlyDistribution(
  kicks: KickEntry[],
  days: number,
  reference: Date = new Date(),
): { hour: number; count: number }[] {
  const filtered = getKicksInRange(kicks, days, reference);
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }));

  for (const kick of filtered) {
    const hour = parseInt(kick.time.split(":")[0], 10);
    if (hour >= 0 && hour < 24) {
      buckets[hour].count += 1;
    }
  }

  return buckets;
}

export function getTopHours(
  kicks: KickEntry[],
  days: number,
  topN = 3,
  reference: Date = new Date(),
): { hour: number; count: number; label: string }[] {
  const distribution = getHourlyDistribution(kicks, days, reference);

  return distribution
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((b) => ({
      ...b,
      label: formatHourLabel(b.hour),
    }));
}

export function formatHourLabel(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${ampm}`;
}

export function getTodayDateStr(reference: Date = new Date()): string {
  return format(startOfDay(reference), "yyyy-MM-dd");
}

export interface KickDateStripItem {
  date: string;
  label: string;
  isToday: boolean;
  kickCount: number;
}

/** Dates before/after today for the horizontal strip (today centered). */
export function getKickDateStrip(
  kicks: KickEntry[],
  daysBefore = 7,
  daysAfter = 7,
  reference: Date = new Date(),
): KickDateStripItem[] {
  const today = startOfDay(reference);

  return Array.from({ length: daysBefore + daysAfter + 1 }, (_, i) => {
    const day = addDays(today, i - daysBefore);
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      label: format(day, "EEE, d MMM yyyy"),
      isToday: isSameDay(day, today),
      kickCount: kicks.filter((k) => k.date === date).length,
    };
  });
}

export function getKicksForDate(
  kicks: KickEntry[],
  date: string,
): KickEntry[] {
  return kicks
    .filter((k) => k.date === date)
    .sort((a, b) => b.time.localeCompare(a.time));
}

export function groupKicksByDate(
  kicks: KickEntry[],
): { date: string; label: string; entries: KickEntry[] }[] {
  const sorted = [...kicks].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.time.localeCompare(a.time);
  });

  const groups = new Map<string, KickEntry[]>();

  for (const kick of sorted) {
    const existing = groups.get(kick.date) ?? [];
    existing.push(kick);
    groups.set(kick.date, existing);
  }

  return Array.from(groups.entries()).map(([date, entries]) => ({
    date,
    label: format(parseISO(date), "EEEE, MMM d"),
    entries,
  }));
}
