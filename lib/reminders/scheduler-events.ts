export const REMINDER_CHECK_EVENT = "baby-monitor-reminder-check";

export function requestReminderCheck(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REMINDER_CHECK_EVENT));
  }
}
