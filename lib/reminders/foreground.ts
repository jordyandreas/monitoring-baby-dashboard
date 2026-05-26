import type { DueReminder } from "./types";

export const REMINDER_TOAST_EVENT = "baby-monitor-reminder-toast";

export function isAppInForeground(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "visible";
}

export function dispatchReminderToast(reminder: DueReminder): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<DueReminder>(REMINDER_TOAST_EVENT, { detail: reminder }),
  );
}
