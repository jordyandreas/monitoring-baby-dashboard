import { getTodayDateStr } from "@/lib/vitamins";

export const REMINDER_FIRED_KEY = "baby-monitor-reminders-fired-v1";

function pruneForToday(
  keys: Record<string, boolean>,
  today: string,
): Record<string, boolean> {
  const suffix = `:${today}`;
  const next: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(keys)) {
    if (value && key.endsWith(suffix)) {
      next[key] = true;
    }
  }
  return next;
}

export function readFiredKeys(reference: Date = new Date()): Set<string> {
  if (typeof window === "undefined") return new Set();

  const today = getTodayDateStr(reference);
  try {
    const raw = localStorage.getItem(REMINDER_FIRED_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const pruned = pruneForToday(parsed, today);
    if (Object.keys(pruned).length !== Object.keys(parsed).length) {
      localStorage.setItem(REMINDER_FIRED_KEY, JSON.stringify(pruned));
    }
    return new Set(Object.keys(pruned));
  } catch {
    return new Set();
  }
}

export function clearReminderFiredKeys(
  keys: string[],
  reference: Date = new Date(),
): void {
  if (typeof window === "undefined" || keys.length === 0) return;

  const today = getTodayDateStr(reference);
  const fired: Record<string, boolean> = {};
  for (const key of readFiredKeys(reference)) {
    fired[key] = true;
  }
  for (const key of keys) {
    delete fired[key];
  }
  const pruned = pruneForToday(fired, today);
  localStorage.setItem(REMINDER_FIRED_KEY, JSON.stringify(pruned));
}

export function markReminderFired(dedupeKey: string, reference: Date = new Date()): void {
  if (typeof window === "undefined") return;

  const today = getTodayDateStr(reference);
  const fired: Record<string, boolean> = {};
  for (const key of readFiredKeys(reference)) {
    fired[key] = true;
  }
  fired[dedupeKey] = true;
  const pruned = pruneForToday(fired, today);
  localStorage.setItem(REMINDER_FIRED_KEY, JSON.stringify(pruned));
}
