import { dispatchReminderToast, isAppInForeground } from "./foreground";
import type { DueReminder } from "./types";

export type NotificationPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  const result = await Notification.requestPermission();
  return result;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    await navigator.serviceWorker.register("/sw.js");
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

const notificationOptions = (reminder: DueReminder): NotificationOptions => ({
  body: reminder.body,
  tag: reminder.dedupeKey,
  data: { url: reminder.url },
});

async function showSystemNotification(reminder: DueReminder): Promise<boolean> {
  const options = notificationOptions(reminder);

  try {
    const registration = await ensureServiceWorker();
    if (registration?.active) {
      await registration.showNotification(reminder.title, options);
      return true;
    }
  } catch {
    // Fall through to page Notification API.
  }

  try {
    new Notification(reminder.title, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * While this tab is focused, browsers often queue or hide OS notifications
 * until you switch away. Show an in-app banner instead; use OS notifications
 * when the tab is in the background.
 */
export async function showReminderNotification(
  reminder: DueReminder,
): Promise<boolean> {
  if (getNotificationPermissionState() !== "granted") return false;

  if (isAppInForeground()) {
    dispatchReminderToast(reminder);
    return true;
  }

  return showSystemNotification(reminder);
}

export async function showTestNotification(
  title: string,
  body: string,
): Promise<boolean> {
  return showReminderNotification({
    dedupeKey: `test:${Date.now()}`,
    kind: "vitamins",
    title,
    body,
    url: "/",
  });
}
