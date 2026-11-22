import { format } from "date-fns";
import type { Locale } from "@/lib/i18n/types";

/** Storage format for kick times and similar fields. */
export const TIME_STORAGE_FORMAT = "HH:mm";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTimeString(
  value: string,
): { hour: string; minute: string } | undefined {
  const match = value.match(TIME_PATTERN);
  if (!match) return undefined;
  return { hour: match[1], minute: match[2] };
}

export function toTimeString(hour: string, minute: string): string {
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function formatTimeAmPm(value: string): string {
  const parsed = parseTimeString(value);
  if (!parsed) return "";
  const h = parseInt(parsed.hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${parsed.minute} ${ampm}`;
}

export function usesAmPm(locale: Locale): boolean {
  return locale === "en";
}

/** Time column in history rows: fits "12:30 PM" with AM/PM, otherwise just "16:23". */
export function historyTimeWidth(locale: Locale): string {
  return usesAmPm(locale) ? "w-16" : "w-11";
}

export function formatTimeLabel(value: string, locale: Locale): string {
  if (usesAmPm(locale)) return formatTimeAmPm(value);
  return parseTimeString(value) ? value : "";
}

export function to12Hour(hour: string): { hour12: string; period: "AM" | "PM" } {
  const h = parseInt(hour, 10);
  return { hour12: String(h % 12 || 12), period: h >= 12 ? "PM" : "AM" };
}

export function from12Hour(hour12: string, period: "AM" | "PM"): string {
  const h = parseInt(hour12, 10) % 12;
  return String(period === "PM" ? h + 12 : h).padStart(2, "0");
}

export function getMinutesFromTimeString(value: string): number | null {
  const parsed = parseTimeString(value);
  if (!parsed) return null;
  return parseInt(parsed.hour, 10) * 60 + parseInt(parsed.minute, 10);
}

export function getMinutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** True when `now` is still before today's configured daily session time. */
export function isBeforeDailySessionTime(now: Date, dailyTime: string): boolean {
  const target = getMinutesFromTimeString(dailyTime);
  if (target === null) return false;
  return getMinutesFromDate(now) < target;
}

export function getCurrentTimeString(): string {
  return format(new Date(), TIME_STORAGE_FORMAT);
}

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);

export const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1),
);

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, "0"),
);
