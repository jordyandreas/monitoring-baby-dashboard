"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { useLocale } from "@/components/providers/locale-provider";
import { formatDuration } from "@/lib/child/summary";
import {
  dueClock,
  nextSchedule,
  reminderFor,
  type NextSchedule,
  type ScheduleKind,
  type ScheduleReminder,
} from "@/lib/child/schedule-reminder";
import { cn } from "@/utils/cn";
import { formatTimeLabel } from "@/utils/time";

type Translate = (key: string, params?: Record<string, string | number>) => string;

type Timed = { date: string; time: string };

function dueLabel(at: Date, t: Translate, now: Date): string {
  const clock = formatTimeLabel(dueClock(at));
  const days = differenceInCalendarDays(startOfDay(at), startOfDay(now));
  if (days === 0) return clock;
  if (days === 1) return t("schedule.tomorrow", { time: clock });
  if (days > 1) return t("schedule.inDays", { count: days, time: clock });
  if (days === -1) return t("child.lastYesterday", { time: clock });
  return t("child.lastDaysAgo", { count: -days, time: clock });
}

function relativeLabel(next: NextSchedule, t: Translate): string | null {
  if (next.minutesUntil === null) return null;
  if (next.minutesUntil === 0) return t("schedule.now");
  if (next.minutesUntil > 0) return t("schedule.in", { duration: formatDuration(next.minutesUntil, t) });
  return t("schedule.late", { duration: formatDuration(-next.minutesUntil, t) });
}

function ScheduleCard({
  kind,
  reminder,
  entries,
  showKind,
  column,
  now,
}: {
  kind: ScheduleKind;
  reminder: ScheduleReminder;
  entries: Timed[];
  showKind: boolean;
  column: boolean;
  now: Date;
}) {
  const { t } = useLocale();
  const next = nextSchedule(entries, reminder.intervalMinutes, now);
  const overdue = next.state === "overdue";
  const label = showKind
    ? kind === "feed"
      ? t("schedule.nextFeed")
      : t("schedule.nextPump")
    : t("schedule.next");
  const relative = relativeLabel(next, t);
  const time = next.at ? dueLabel(next.at, t, now) : t("schedule.empty");

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3",
        column && "h-full",
        overdue ? "bg-[#f6eadc] text-[#5c4636]" : "bg-lilac/60 text-lilac-foreground",
      )}
    >
      {column ? (
        <>
          <p className={cn("text-xs", overdue ? "text-[#5c4636]/70" : "text-lilac-foreground/70")}>{label}</p>
          <p className="mt-0.5 text-lg font-semibold leading-tight">{time}</p>
          {relative ? <p className="mt-1 text-xs font-medium">{relative}</p> : null}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className={cn("text-xs", overdue ? "text-[#5c4636]/70" : "text-lilac-foreground/70")}>{label}</p>
            {relative ? <p className="text-xs font-medium">{relative}</p> : null}
          </div>
          <p className="mt-0.5 text-lg font-semibold leading-tight">{time}</p>
        </>
      )}
    </div>
  );
}

export function NextScheduleStrip({
  reminders,
  feeds,
  pumps,
  kinds,
  showKind = false,
  column = false,
}: {
  reminders: ScheduleReminder[];
  feeds: Timed[];
  pumps: Timed[];
  kinds: ScheduleKind[];
  showKind?: boolean;
  column?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const cards = kinds.flatMap((kind) => {
    const reminder = reminderFor(reminders, kind);
    if (!reminder.enabled) return [];
    return [{ kind, reminder, entries: kind === "feed" ? feeds : pumps }];
  });

  if (cards.length === 0) return null;

  return (
    <div className={cn("grid gap-2", column && "h-full", cards.length > 1 && "grid-cols-2")}>
      {cards.map((card) => (
        <ScheduleCard key={card.kind} showKind={showKind} column={column} now={now} {...card} />
      ))}
    </div>
  );
}
