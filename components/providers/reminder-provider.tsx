"use client";

import { useReminderScheduler } from "@/hooks/use-reminder-scheduler";

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  useReminderScheduler();
  return children;
}
