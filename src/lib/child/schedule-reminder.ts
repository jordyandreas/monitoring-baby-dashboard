import { parseISO } from "date-fns";
import { latestTimed } from "@/lib/child/summary";
import { getMinutesFromTimeString, toTimeString } from "@/utils/time";

export const SCHEDULE_KINDS = ["feed", "pump"] as const;

export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

export type ScheduleReminder = {
  kind: ScheduleKind;
  enabled: boolean;
  intervalMinutes: number;
};

export type NextScheduleState = "empty" | "upcoming" | "due" | "overdue";

export type NextSchedule = {
  state: NextScheduleState;
  at: Date | null;
  /** Signed minutes until `at`. Negative when overdue. Null when nothing is logged. */
  minutesUntil: number | null;
};

const MAX_INTERVAL = 24 * 60;

type Timed = { date: string; time: string };

export function reminderFor(rows: ScheduleReminder[], kind: ScheduleKind): ScheduleReminder {
  return rows.find((row) => row.kind === kind) ?? { kind, enabled: false, intervalMinutes: 120 };
}

export function splitInterval(totalMinutes: number): { hours: string; minutes: string } {
  const safe = Math.max(0, Math.round(totalMinutes));
  return { hours: String(Math.floor(safe / 60)), minutes: String(safe % 60) };
}

/** Hours and minutes as separate fields. Null when the pair is not a gap of 1–1440 minutes. */
export function parseInterval(hours: string, minutes: string): number | null {
  const hourText = hours.trim();
  const minuteText = minutes.trim();
  if (!/^\d{1,2}$/.test(hourText) || !/^\d{1,2}$/.test(minuteText)) return null;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (minute > 59 || hour > 24) return null;
  const total = hour * 60 + minute;
  if (total <= 0 || total > MAX_INTERVAL) return null;
  return total;
}

function loggedAt(entry: Timed): Date | null {
  const minutes = getMinutesFromTimeString(entry.time);
  if (minutes === null) return null;
  const day = parseISO(entry.date);
  if (Number.isNaN(day.getTime())) return null;
  day.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return day;
}

export function nextSchedule(entries: Timed[], intervalMinutes: number, now = new Date()): NextSchedule {
  const latest = latestTimed(entries);
  const logged = latest ? loggedAt(latest) : null;
  if (!logged) return { state: "empty", at: null, minutesUntil: null };
  const at = new Date(logged.getTime() + intervalMinutes * 60_000);
  const minutesUntil = Math.round((at.getTime() - now.getTime()) / 60_000);
  const state: NextScheduleState = minutesUntil > 0 ? "upcoming" : minutesUntil === 0 ? "due" : "overdue";
  return { state, at, minutesUntil };
}

export function dueClock(at: Date): string {
  return toTimeString(String(at.getHours()), String(at.getMinutes()));
}
