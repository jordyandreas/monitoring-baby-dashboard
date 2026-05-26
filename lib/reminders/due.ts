import {
  getTodayListeningStatus,
  parseStartDate,
} from "@/lib/baby-plus";
import { getKicksForDate } from "@/lib/kicks";
import {
  getMinutesFromDate,
  getMinutesFromTimeString,
  isBeforeDailySessionTime,
} from "@/lib/time-utils";
import type { AppStorage } from "@/lib/types";
import {
  countCompleted,
  getNamedVitamins,
  getTodayDateStr,
  rolloverVitaminState,
} from "@/lib/vitamins";
import type { DueReminder } from "./types";

type Translate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

function isAtOrPastTime(now: Date, time: string): boolean {
  const target = getMinutesFromTimeString(time);
  if (target === null) return false;
  return getMinutesFromDate(now) >= target;
}

function isWithinTimeWindow(now: Date, start: string, end: string): boolean {
  const startMin = getMinutesFromTimeString(start);
  const endMin = getMinutesFromTimeString(end);
  if (startMin === null || endMin === null) return false;
  const nowMin = getMinutesFromDate(now);
  return nowMin >= startMin && nowMin <= endMin;
}

function hydrationSlotIndex(
  now: Date,
  start: string,
  intervalHours: number,
): number | null {
  const startMin = getMinutesFromTimeString(start);
  if (startMin === null || intervalHours < 1) return null;

  const nowMin = getMinutesFromDate(now);
  const intervalMin = intervalHours * 60;
  if (nowMin < startMin) return null;

  return Math.floor((nowMin - startMin) / intervalMin);
}

function hydrationSlotStartMinutes(
  start: string,
  intervalHours: number,
  slotIndex: number,
): number {
  const startMin = getMinutesFromTimeString(start) ?? 0;
  return startMin + slotIndex * intervalHours * 60;
}

export function getDueReminders(
  data: AppStorage,
  fired: Set<string>,
  t: Translate,
  now: Date = new Date(),
): DueReminder[] {
  const reminders = data.reminders;
  const today = getTodayDateStr(now);
  const due: DueReminder[] = [];

  if (reminders.vitamins.enabled) {
    const vitamins = rolloverVitaminState(data.vitamins, now);
    const named = getNamedVitamins(vitamins.items);
    const total = named.length;
    const done = countCompleted(vitamins.items, vitamins.today.completed);

    if (
      total > 0 &&
      done < total &&
      isAtOrPastTime(now, reminders.vitamins.time)
    ) {
      const dedupeKey = `vitamins:${today}`;
      if (!fired.has(dedupeKey)) {
        due.push({
          dedupeKey,
          kind: "vitamins",
          title: t("reminders.vitaminsTitle"),
          body: t("reminders.vitaminsBody", { count: total - done }),
          url: "/vitamins",
        });
      }
    }
  }

  if (reminders.babyPlus.enabled) {
    const { startDate, dailyTime, completions } = data.babyPlus;
    const parsedStart = parseStartDate(startDate);

    if (parsedStart && dailyTime && getMinutesFromTimeString(dailyTime) !== null) {
      const status = getTodayListeningStatus(
        parsedStart,
        dailyTime,
        completions,
        now,
      );

      if (
        status.kind === "active" &&
        status.phase !== "done" &&
        !isBeforeDailySessionTime(now, dailyTime)
      ) {
        const dedupeKey = `babyPlus:${today}`;
        if (!fired.has(dedupeKey)) {
          due.push({
            dedupeKey,
            kind: "babyPlus",
            title: t("reminders.babyPlusTitle"),
            body: t("reminders.babyPlusBody", {
              sound: status.soundIndex + 1,
              day: status.dayIndex + 1,
            }),
            url: "/baby-plus",
          });
        }
      }
    }
  }

  if (reminders.kicks.enabled) {
    const todayKicks = getKicksForDate(data.kicks, today);
    if (
      todayKicks.length === 0 &&
      isAtOrPastTime(now, reminders.kicks.time)
    ) {
      const dedupeKey = `kicks:${today}`;
      if (!fired.has(dedupeKey)) {
        due.push({
          dedupeKey,
          kind: "kicks",
          title: t("reminders.kicksTitle"),
          body: t("reminders.kicksBody"),
          url: "/kicks",
        });
      }
    }
  }

  if (reminders.hydration.enabled) {
    const { intervalHours, startTime, endTime } = reminders.hydration;
    if (
      isWithinTimeWindow(now, startTime, endTime) &&
      intervalHours >= 1
    ) {
      const slot = hydrationSlotIndex(now, startTime, intervalHours);
      if (slot !== null) {
        const slotStart = hydrationSlotStartMinutes(
          startTime,
          intervalHours,
          slot,
        );
        if (getMinutesFromDate(now) >= slotStart) {
          const dedupeKey = `hydration:${today}:${slot}`;
          if (!fired.has(dedupeKey)) {
            due.push({
              dedupeKey,
              kind: "hydration",
              title: t("reminders.hydrationTitle"),
              body: t("reminders.hydrationBody"),
              url: "/",
            });
          }
        }
      }
    }
  }

  return due;
}
