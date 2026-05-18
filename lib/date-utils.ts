import { format, isValid, parseISO } from "date-fns";

/** Storage format used across the app (e.g. baby profile, kicks, Baby Plus). */
export const DATE_STORAGE_FORMAT = "yyyy-MM-dd";

export function parseDateString(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

export function toDateString(date: Date | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, DATE_STORAGE_FORMAT);
}

export function formatDateLabel(value: string): string {
  const date = parseDateString(value);
  if (!date) return "";
  return format(date, "MMMM d, yyyy");
}
