"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { useAppStorage } from "@/hooks/use-app-storage";
import { getDueReminders } from "@/lib/reminders/due";
import {
  markReminderFired,
  readFiredKeys,
} from "@/lib/reminders/fired-storage";
import {
  ensureServiceWorker,
  getNotificationPermissionState,
  showReminderNotification,
} from "@/lib/reminders/notify";
import { REMINDER_CHECK_EVENT } from "@/lib/reminders/scheduler-events";

/** Poll often enough that a 1–2 minute test feels responsive. */
const CHECK_INTERVAL_MS = 15_000;

export function useReminderScheduler() {
  const { data, mounted } = useAppStorage();
  const { t } = useLocale();
  const checkingRef = useRef(false);

  const runCheck = useCallback(async () => {
    if (checkingRef.current) return;
    if (!mounted) return;
    if (getNotificationPermissionState() !== "granted") return;

    checkingRef.current = true;
    try {
      await ensureServiceWorker();

      const now = new Date();
      const fired = readFiredKeys(now);
      const due = getDueReminders(data, fired, t, now);

      for (const reminder of due) {
        const shown = await showReminderNotification(reminder);
        if (shown) {
          markReminderFired(reminder.dedupeKey, now);
        }
      }
    } finally {
      checkingRef.current = false;
    }
  }, [data, mounted, t]);

  useEffect(() => {
    if (!mounted) return;

    void runCheck();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void runCheck();
      }
    };

    const onRequestCheck = () => {
      void runCheck();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(REMINDER_CHECK_EVENT, onRequestCheck);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void runCheck();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(REMINDER_CHECK_EVENT, onRequestCheck);
      window.clearInterval(interval);
    };
  }, [mounted, runCheck]);
}
