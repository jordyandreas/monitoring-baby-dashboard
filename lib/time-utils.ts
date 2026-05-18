import { format } from "date-fns";

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

export function formatTimeLabel(value: string): string {
  return formatTimeAmPm(value);
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

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, "0"),
);
