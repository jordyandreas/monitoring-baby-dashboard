"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { REMINDER_TOAST_EVENT } from "@/lib/reminders/foreground";
import type { DueReminder } from "@/lib/reminders/types";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_MS = 5_000;

export function ReminderToast() {
  const router = useRouter();
  const { t } = useLocale();
  const [reminder, setReminder] = useState<DueReminder | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<DueReminder>).detail;
      if (detail) setReminder(detail);
    };

    window.addEventListener(REMINDER_TOAST_EVENT, onToast);
    return () => window.removeEventListener(REMINDER_TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!reminder) return;
    const timer = window.setTimeout(() => setReminder(null), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [reminder]);

  if (!reminder) return null;

  const open = () => {
    const url = reminder.url;
    setReminder(null);
    router.push(url);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        "md:inset-x-auto md:bottom-auto md:left-auto md:top-22 md:right-8 md:mx-0 md:max-w-sm",
        "md:slide-in-from-top-2 md:slide-in-from-right-2 lg:right-10",
      )}
    >
      <div className="flex gap-3 rounded-xl border border-lilac/40 bg-card p-4 shadow-lg ring-1 ring-foreground/10">
        <Bell className="mt-0.5 size-5 shrink-0 text-lilac-deep" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{reminder.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{reminder.body}</p>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0 text-lilac-deep"
            onClick={open}
          >
            {t("reminders.toastOpen")}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Dismiss"
          onClick={() => setReminder(null)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
