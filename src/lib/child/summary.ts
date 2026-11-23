import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/types";
import { formatTimeLabel, getMinutesFromTimeString } from "@/utils/time";
import type {
  ChildStorage,
  DiaperEntry,
  FeedEntry,
  FoodEntry,
  FoodSlot,
  GrowthEntry,
  HealthEntry,
  PottyEntry,
  PumpEntry,
  SleepEntry,
} from "@/lib/child/types";

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Past this, an unfinished sleep is more likely a missed "woke up" log than a real sleep. */
export const FORGOTTEN_SLEEP_MINUTES = 14 * 60;

/** A wake further than this from the sleep before it is left unpaired: one of the moments was likely not logged. */
const MAX_SLEEP_PAIR_MINUTES = 24 * 60;

/**
 * Sleep length per wake, keyed by the wake's id. A wake pairs with the latest sleep before it,
 * as long as no other wake sits in between. Wakes without a matching sleep have no entry.
 */
export function sleepDurations(entries: SleepEntry[]): Map<string, number> {
  const sorted = [...entries].sort((a, b) => timedKey(a).localeCompare(timedKey(b)));
  const durations = new Map<string, number>();
  let pending: SleepEntry | null = null;
  for (const entry of sorted) {
    if (entry.kind === "sleep") {
      pending = entry;
      continue;
    }
    if (pending) {
      const minutes = Math.round((timedDate(entry).getTime() - timedDate(pending).getTime()) / 60000);
      if (minutes > 0 && minutes <= MAX_SLEEP_PAIR_MINUTES) durations.set(entry.id, minutes);
    }
    pending = null;
  }
  return durations;
}

/** Total sleep for the wakes in `entries`, using durations paired across the full list. */
export function sleepTotalMinutes(entries: SleepEntry[], durations: Map<string, number>): number {
  return entries.reduce((sum, entry) => sum + (durations.get(entry.id) ?? 0), 0);
}

/** Adds the minutes of `start`–`end` to `into`, split at each midnight and keyed by yyyy-MM-dd. */
function addMinutesByDay(into: Map<string, number>, start: Date, end: Date) {
  let cursor = start;
  while (cursor < end) {
    const nextMidnight = addDays(startOfDay(cursor), 1);
    const stop = nextMidnight < end ? nextMidnight : end;
    const key = format(cursor, "yyyy-MM-dd");
    const minutes = Math.round((stop.getTime() - cursor.getTime()) / 60000);
    into.set(key, (into.get(key) ?? 0) + minutes);
    cursor = stop;
  }
}

/** Completed sleep per calendar day. A sleep across midnight counts toward both days. */
export function sleepMinutesByDay(entries: SleepEntry[]): Map<string, number> {
  const sorted = [...entries].sort((a, b) => timedKey(a).localeCompare(timedKey(b)));
  const byDay = new Map<string, number>();
  let pending: SleepEntry | null = null;
  for (const entry of sorted) {
    if (entry.kind === "sleep") {
      pending = entry;
      continue;
    }
    if (pending) {
      const start = timedDate(pending);
      const end = timedDate(entry);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      if (minutes > 0 && minutes <= MAX_SLEEP_PAIR_MINUTES) addMinutesByDay(byDay, start, end);
    }
    pending = null;
  }
  return byDay;
}

export type SleepRowDurations = {
  /** Sleep id → minutes until midnight, only for sleeps whose wake falls on a later day. */
  untilMidnight: Map<string, number>;
  /** Wake id → minutes on the wake's own day (from midnight when the sleep began the day before). */
  onWakeDay: Map<string, number>;
  /** Wake ids whose sleep began on an earlier day. */
  crossedMidnight: Set<string>;
};

/** Durations per history row, so each day's rows only add up to that day's sleep. */
export function sleepRowDurations(entries: SleepEntry[]): SleepRowDurations {
  const sorted = [...entries].sort((a, b) => timedKey(a).localeCompare(timedKey(b)));
  const result: SleepRowDurations = { untilMidnight: new Map(), onWakeDay: new Map(), crossedMidnight: new Set() };
  let pending: SleepEntry | null = null;
  for (const entry of sorted) {
    if (entry.kind === "sleep") {
      pending = entry;
      continue;
    }
    if (pending) {
      const start = timedDate(pending);
      const end = timedDate(entry);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      if (minutes > 0 && minutes <= MAX_SLEEP_PAIR_MINUTES) {
        const wakeDayStart = startOfDay(end);
        if (start < wakeDayStart) {
          const firstMidnight = addDays(startOfDay(start), 1);
          result.untilMidnight.set(pending.id, Math.round((firstMidnight.getTime() - start.getTime()) / 60000));
          result.onWakeDay.set(entry.id, Math.round((end.getTime() - wakeDayStart.getTime()) / 60000));
          result.crossedMidnight.add(entry.id);
        } else {
          result.onWakeDay.set(entry.id, Math.round(minutes));
        }
      }
    }
    pending = null;
  }
  return result;
}

/** Completed sleeps clipped to the `from`–`to` days (inclusive), in minutes. */
export function sleepSessionsInRange(entries: SleepEntry[], from: string, to: string): number[] {
  const rangeStart = startOfDay(parseISO(from));
  const rangeEnd = addDays(startOfDay(parseISO(to)), 1);
  const sorted = [...entries].sort((a, b) => timedKey(a).localeCompare(timedKey(b)));
  const sessions: number[] = [];
  let pending: SleepEntry | null = null;
  for (const entry of sorted) {
    if (entry.kind === "sleep") {
      pending = entry;
      continue;
    }
    if (pending) {
      const start = timedDate(pending);
      const end = timedDate(entry);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      if (minutes > 0 && minutes <= MAX_SLEEP_PAIR_MINUTES) {
        const clippedStart = start > rangeStart ? start : rangeStart;
        const clippedEnd = end < rangeEnd ? end : rangeEnd;
        const clipped = Math.round((clippedEnd.getTime() - clippedStart.getTime()) / 60000);
        if (clipped > 0) sessions.push(clipped);
      }
    }
    pending = null;
  }
  return sessions;
}

/** Awake time from each wake to the next sleep, clipped to the `from`–`to` days (inclusive), in minutes. */
export function awakeMinutesInRange(entries: SleepEntry[], from: string, to: string): number {
  const rangeStart = startOfDay(parseISO(from));
  const rangeEnd = addDays(startOfDay(parseISO(to)), 1);
  const sorted = [...entries].sort((a, b) => timedKey(a).localeCompare(timedKey(b)));
  let total = 0;
  let pending: SleepEntry | null = null;
  for (const entry of sorted) {
    if (entry.kind === "wake") {
      pending = entry;
      continue;
    }
    if (pending) {
      const start = timedDate(pending);
      const end = timedDate(entry);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      if (minutes > 0 && minutes <= MAX_SLEEP_PAIR_MINUTES) {
        const clippedStart = start > rangeStart ? start : rangeStart;
        const clippedEnd = end < rangeEnd ? end : rangeEnd;
        const clipped = Math.round((clippedEnd.getTime() - clippedStart.getTime()) / 60000);
        if (clipped > 0) total += clipped;
      }
    }
    pending = null;
  }
  return total;
}

/** The current awake stretch's minutes on `date` so far; 0 once it looks like a forgotten sleep log. */
export function ongoingAwakeMinutesOn(entries: SleepEntry[], date: string, now = new Date()): number {
  const latest = latestTimed(entries);
  if (latest?.kind !== "wake") return 0;
  if (sleepElapsedMinutes(latest, now) >= FORGOTTEN_SLEEP_MINUTES) return 0;
  const byDay = new Map<string, number>();
  addMinutesByDay(byDay, timedDate(latest), now);
  return byDay.get(date) ?? 0;
}

export function sleepMinutesInRange(byDay: Map<string, number>, inRange: (date: string) => boolean): number {
  let total = 0;
  for (const [date, minutes] of byDay) if (inRange(date)) total += minutes;
  return total;
}

/** The running sleep's minutes on `date` so far; 0 once it looks like a forgotten wake. */
export function ongoingSleepMinutesOn(entries: SleepEntry[], date: string, now = new Date()): number {
  const active = activeSleep(entries);
  if (!active || sleepElapsedMinutes(active, now) >= FORGOTTEN_SLEEP_MINUTES) return 0;
  const byDay = new Map<string, number>();
  addMinutesByDay(byDay, timedDate(active), now);
  return byDay.get(date) ?? 0;
}

/** The latest moment, when it is a sleep: the baby is presumably still asleep. */
export function activeSleep(entries: SleepEntry[]): SleepEntry | null {
  const latest = latestTimed(entries);
  return latest?.kind === "sleep" ? latest : null;
}

export function sleepElapsedMinutes(entry: SleepEntry, now = new Date()): number {
  return Math.max(0, Math.round((now.getTime() - timedDate(entry).getTime()) / 60000));
}

export function formatDuration(minutes: number, t: Translate): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return t("child.minutesShort", { minutes: rest });
  if (rest === 0) return t("child.hoursShort", { hours });
  return t("child.hoursMinutes", { hours, minutes: rest });
}
type Timed = { date: string; time: string };

function timedKey(entry: Timed): string {
  return `${entry.date}T${entry.time}`;
}

function timedDate(entry: Timed): Date {
  const minutes = getMinutesFromTimeString(entry.time) ?? 0;
  const day = parseISO(entry.date);
  day.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return day;
}

export function latestTimed<T extends Timed>(entries: T[]): T | null {
  let best: T | null = null;
  for (const entry of entries) {
    if (!best || timedKey(entry) > timedKey(best)) best = entry;
  }
  return best;
}

export type LastWhenParts = {
  time: string;
  ago?: string;
};

/** Clock time and, for today, how long ago. Older logs keep the day phrase in `time`. */
export function lastWhenParts(
  date: string,
  time: string,
  t: Translate,
  locale: Locale,
  now = new Date(),
): LastWhenParts {
  const logged = timedDate({ date, time });
  const clock = formatTimeLabel(time, locale);
  const days = differenceInCalendarDays(startOfDay(now), startOfDay(logged));
  if (days === 0) {
    const elapsed = Math.max(0, Math.round((now.getTime() - logged.getTime()) / 60000));
    return { time: clock, ago: t("child.ago", { duration: formatDuration(elapsed, t) }) };
  }
  if (days === 1) return { time: t("child.lastYesterday", { time: clock }) };
  if (days > 1) return { time: t("child.lastDaysAgo", { count: days, time: clock }) };
  return { time: `${format(logged, "d MMM")} ${clock}` };
}

export type LastLogStatus = {
  label: string;
  time: string;
  ago?: string;
  details: string[];
};

function statusFrom(label: string, when: LastWhenParts, details: string[]): LastLogStatus {
  return { label, time: when.time, ago: when.ago, details: details.filter(Boolean) };
}

export function feedLastStatus(entries: FeedEntry[], t: Translate, locale: Locale, now = new Date()): LastLogStatus | null {
  const latest = latestTimed(entries);
  if (!latest) return null;
  return statusFrom(t("child.lastLine"), lastWhenParts(latest.date, latest.time, t, locale, now), feedDetailParts(latest, t));
}

export function pumpLastStatus(entries: PumpEntry[], t: Translate, locale: Locale, now = new Date()): LastLogStatus | null {
  const latest = latestTimed(entries);
  if (!latest) return null;
  return statusFrom(t("child.lastLine"), lastWhenParts(latest.date, latest.time, t, locale, now), [
    t("child.summaryMl", { ml: latest.amountMl }),
  ]);
}

/** Only while the baby is asleep. */
export function sleepActiveStatus(entries: SleepEntry[], t: Translate, locale: Locale, now = new Date()): LastLogStatus | null {
  const active = activeSleep(entries);
  if (!active) return null;
  return statusFrom(
    t("sleep.asleepNow"),
    {
      time: formatTimeLabel(active.time, locale),
      ago: t("sleep.forDuration", { duration: formatDuration(sleepElapsedMinutes(active, now), t) }),
    },
    [],
  );
}

/** Latest time the baby fell asleep, and the latest time the baby woke up. */
export function sleepLastStatuses(entries: SleepEntry[], t: Translate, locale: Locale, now = new Date()): LastLogStatus[] {
  const lastSleep = latestTimed(entries.filter((entry) => entry.kind === "sleep"));
  const lastWake = latestTimed(entries.filter((entry) => entry.kind === "wake"));
  const active = activeSleep(entries);
  const wakeMinutes = lastWake ? sleepDurations(entries).get(lastWake.id) : undefined;
  const items: LastLogStatus[] = [];
  if (lastSleep) {
    items.push(
      statusFrom(t("sleep.lastSleep"), lastWhenParts(lastSleep.date, lastSleep.time, t, locale, now), [
        active
          ? t("sleep.ongoingFor", { duration: formatDuration(sleepElapsedMinutes(active, now), t) })
          : "",
      ]),
    );
  }
  if (lastWake) {
    items.push(
      statusFrom(t("sleep.lastWake"), lastWhenParts(lastWake.date, lastWake.time, t, locale, now), [
        wakeMinutes ? t("sleep.durationPreview", { duration: formatDuration(wakeMinutes, t) }) : "",
      ]),
    );
  }
  return items;
}

export function diaperLastStatuses(
  entries: DiaperEntry[],
  t: Translate,
  locale: Locale,
  now = new Date(),
): { change: LastLogStatus; poop: LastLogStatus | null } | null {
  const latest = latestTimed(entries);
  if (!latest) return null;
  const change = statusFrom(t("child.lastLine"), lastWhenParts(latest.date, latest.time, t, locale, now), [
    diaperKindLabel(latest.kind, t),
  ]);
  if (latest.kind !== "pee") return { change, poop: null };
  const latestPoop = latestTimed(entries.filter((entry) => entry.kind === "poop" || entry.kind === "both"));
  if (!latestPoop) return { change, poop: null };
  return {
    change,
    poop: statusFrom(t("child.lastPoop"), lastWhenParts(latestPoop.date, latestPoop.time, t, locale, now), []),
  };
}

export type SessionInterval = {
  average: number;
  shortest: number;
  longest: number;
};

/** Gaps between consecutive logs in the given list, including overnight gaps. */
export function sessionIntervals(entries: Timed[]): SessionInterval | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => timedKey(a).localeCompare(timedKey(b)));
  const gaps: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const diff = Math.round((timedDate(sorted[index]).getTime() - timedDate(sorted[index - 1]).getTime()) / 60000);
    if (diff >= 0) gaps.push(diff);
  }
  if (gaps.length === 0) return null;
  const total = gaps.reduce((sum, gap) => sum + gap, 0);
  return {
    average: Math.round(total / gaps.length),
    shortest: Math.min(...gaps),
    longest: Math.max(...gaps),
  };
}

export type TodayTotals = {
  logCount: number;
  feedCount: number;
  ml: number;
  pumpCount: number;
  pumpMl: number;
  pee: number;
  poop: number;
  sleepMin: number;
};

export function rangeTotals(
  data: ChildStorage,
  inRange: (date: string) => boolean,
): TodayTotals {
  const feeds = data.feeds.filter((entry) => inRange(entry.date));
  const pumps = data.pumps.filter((entry) => inRange(entry.date));
  const diapers = data.diapers.filter((entry) => inRange(entry.date));
  const sleeps = data.sleeps.filter((entry) => inRange(entry.date));
  return {
    logCount: feeds.length + pumps.length + diapers.length + sleeps.length,
    feedCount: feeds.length,
    ml: feeds.reduce((sum, entry) => sum + (entry.amountMl ?? 0), 0),
    pumpCount: pumps.length,
    pumpMl: pumps.reduce((sum, entry) => sum + entry.amountMl, 0),
    pee: diapers.filter((entry) => entry.kind === "pee" || entry.kind === "both").length,
    poop: diapers.filter((entry) => entry.kind === "poop" || entry.kind === "both").length,
    sleepMin: sleepMinutesInRange(sleepMinutesByDay(data.sleeps), inRange),
  };
}

export function pumpDaySummary(entries: PumpEntry[]) {
  const ml = entries.reduce((sum, entry) => sum + entry.amountMl, 0);
  return {
    count: entries.length,
    ml,
    avgMl: entries.length > 0 ? Math.round(ml / entries.length) : null,
  };
}

export function feedDaySummary(entries: FeedEntry[]) {
  const bottles = entries.filter((entry) => entry.amountMl !== undefined);
  const ml = bottles.reduce((sum, entry) => sum + (entry.amountMl ?? 0), 0);
  const nursingMin = entries.reduce(
    (sum, entry) => sum + (entry.kind === "breast" ? (entry.durationMin ?? 0) : 0),
    0,
  );
  return {
    count: entries.length,
    ml,
    avgMl: bottles.length > 0 ? Math.round(ml / bottles.length) : null,
    nursingMin,
  };
}

export function diaperDaySummary(entries: DiaperEntry[]) {
  return {
    count: entries.length,
    pee: entries.filter((entry) => entry.kind === "pee" || entry.kind === "both").length,
    poop: entries.filter((entry) => entry.kind === "poop" || entry.kind === "both").length,
  };
}

export type RangeDay = {
  date: string;
  dayLabel: string;
  fullLabel: string;
  isToday: boolean;
};

/** Oldest day first, ending today. Labels match the kick and water charts. */
export function recentDates(days: number, locale: Locale, reference = new Date()): RangeDay[] {
  const today = startOfDay(reference);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const compact = days > 7;
  return Array.from({ length: days }, (_, index) => {
    const day = subDays(today, days - 1 - index);
    return {
      date: format(day, "yyyy-MM-dd"),
      dayLabel: compact
        ? format(day, "d/M", { locale: dfLocale })
        : format(day, "d", { locale: dfLocale }),
      fullLabel: format(day, "EEE, d MMM yyyy", { locale: dfLocale }),
      isToday: isSameDay(day, today),
    };
  });
}

/** Inclusive calendar days from `from` to `to` (yyyy-MM-dd), oldest first. */
export function datesBetween(from: string, to: string, locale: Locale, reference = new Date()): RangeDay[] {
  const start = startOfDay(parseISO(from));
  const end = startOfDay(parseISO(to));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const [lo, hi] = start <= end ? [start, end] : [end, start];
  const today = startOfDay(reference);
  const days = eachDayOfInterval({ start: lo, end: hi });
  const compact = days.length > 7;
  const dfLocale = locale === "id" ? idLocale : enUS;
  return days.map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    dayLabel: compact
      ? format(day, "d/M", { locale: dfLocale })
      : format(day, "d", { locale: dfLocale }),
    fullLabel: format(day, "EEE, d MMM yyyy", { locale: dfLocale }),
    isToday: isSameDay(day, today),
  }));
}

/** Session minutes, e.g. from `sleepSessionsInRange`. */
export function sleepDaySummary(minutes: number[]) {
  const total = minutes.reduce((sum, value) => sum + value, 0);
  const count = minutes.length;
  return {
    count,
    total,
    longest: Math.max(0, ...minutes),
    average: count > 0 ? Math.round(total / count) : 0,
  };
}

export function todayTotals(data: ChildStorage, today: string): TodayTotals {
  return rangeTotals(data, (date) => date === today);
}

export function monthTotals(data: ChildStorage, today: string): TodayTotals {
  const month = today.slice(0, 7);
  return rangeTotals(data, (date) => date.startsWith(month));
}

export type TimelineKind =
  | "feed"
  | "pump"
  | "diaper"
  | "sleep"
  | "food"
  | "temperature"
  | "medicine"
  | "potty";

export type TimelineItem = {
  id: string;
  kind: TimelineKind;
  time: string;
  title: string;
  detail: string;
};

function feedSideLabel(side: FeedEntry["side"], t: Translate): string {
  switch (side) {
    case "left":
      return t("feed.left");
    case "right":
      return t("feed.right");
    case "both":
      return t("feed.both");
    default:
      return "";
  }
}

export type HistoryTone = "amber" | "sky" | "lilac" | "violet" | "emerald" | "rose" | "orange";
export type HistoryIcon =
  | "feed"
  | "pump"
  | "diaper"
  | "sleep"
  | "kick"
  | "water"
  | "food"
  | "temperature"
  | "medicine"
  | "potty";

export function feedHistoryParts(
  entry: FeedEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  if (entry.kind === "breast") {
    return {
      title: t("feed.kindBreast"),
      subtitle: [feedSideLabel(entry.side, t), entry.durationMin ? t("child.minutesShort", { minutes: entry.durationMin }) : ""]
        .filter(Boolean)
        .join(" · "),
      tone: "lilac",
      icon: "feed",
    };
  }
  return {
    title: entry.kind === "formula" ? t("feed.kindFormula") : t("feed.kindBottleBreast"),
    subtitle: entry.amountMl ? `${entry.amountMl} ml` : "",
    tone: "lilac",
    icon: "feed",
  };
}

function diaperKindLabel(kind: DiaperEntry["kind"], t: Translate): string {
  if (kind === "pee") return t("diaper.pee");
  if (kind === "poop") return t("diaper.poop");
  return `${t("diaper.pee")} & ${t("diaper.poop")}`;
}

export function diaperHistoryParts(
  entry: DiaperEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  const title = diaperKindLabel(entry.kind, t);
  return {
    title,
    subtitle: [
      diaperColorLabel(entry.poopColor, t),
      diaperTextureLabel(entry.poopTexture, t),
      diaperAmountLabel(entry.poopAmount, t),
    ]
      .filter(Boolean)
      .join(", "),
    tone: "amber",
    icon: "diaper",
  };
}

export function sleepHistoryParts(
  entry: SleepEntry,
  t: Translate,
  rows: SleepRowDurations,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  let subtitle = "";
  if (entry.kind === "sleep") {
    const minutes = rows.untilMidnight.get(entry.id);
    if (minutes) subtitle = t("sleep.durationUntilMidnight", { duration: formatDuration(minutes, t) });
  } else {
    const minutes = rows.onWakeDay.get(entry.id);
    if (minutes) {
      subtitle = t(rows.crossedMidnight.has(entry.id) ? "sleep.durationSinceMidnight" : "sleep.durationPreview", {
        duration: formatDuration(minutes, t),
      });
    }
  }
  return {
    title: entry.kind === "sleep" ? t("sleep.momentSleep") : t("sleep.momentWake"),
    subtitle,
    tone: "sky",
    icon: "sleep",
  };
}

function sleepDetailParts(entry: SleepEntry, t: Translate, durations: Map<string, number>): string[] {
  if (entry.kind === "sleep") return [t("sleep.momentSleep")];
  const minutes = durations.get(entry.id);
  return [
    t("sleep.momentWake"),
    minutes ? t("sleep.durationPreview", { duration: formatDuration(minutes, t) }) : "",
  ].filter(Boolean);
}

export function pumpHistoryParts(
  entry: PumpEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  return {
    title: t("child.tagPump"),
    subtitle: t("child.summaryMl", { ml: entry.amountMl }),
    tone: "violet",
    icon: "pump",
  };
}

export function describePump(entry: PumpEntry, t: Translate): string {
  return t("child.summaryMl", { ml: entry.amountMl });
}

export function feedDetailParts(entry: FeedEntry, t: Translate): string[] {
  if (entry.kind === "breast") {
    return [
      t("feed.kindBreast"),
      feedSideLabel(entry.side, t),
      entry.durationMin ? t("child.minutesShort", { minutes: entry.durationMin }) : "",
    ].filter(Boolean);
  }
  const kind = entry.kind === "formula" ? t("feed.kindFormula") : t("feed.kindBottleBreast");
  const amount = entry.amountMl ? `${entry.amountMl} ml` : "";
  return [kind, amount].filter(Boolean);
}

export function describeFeed(entry: FeedEntry, t: Translate): string {
  return feedDetailParts(entry, t).join(" · ");
}

function diaperColorLabel(color: DiaperEntry["poopColor"], t: Translate): string {
  switch (color) {
    case "yellow":
      return t("diaper.yellow");
    case "green":
      return t("diaper.green");
    case "black":
      return t("diaper.black");
    case "brown":
      return t("diaper.brown");
    case "other":
      return t("diaper.other");
    default:
      return "";
  }
}

function diaperAmountLabel(amount: DiaperEntry["poopAmount"], t: Translate): string {
  if (amount === "little") return t("diaper.little");
  if (amount === "medium") return t("diaper.medium");
  if (amount === "much") return t("diaper.much");
  return "";
}

function diaperTextureLabel(texture: DiaperEntry["poopTexture"], t: Translate): string {
  switch (texture) {
    case "liquid":
      return t("diaper.liquid");
    case "soft":
      return t("diaper.soft");
    case "solid":
      return t("diaper.solid");
    default:
      return "";
  }
}

export function describeDiaper(entry: DiaperEntry, t: Translate): string {
  const kind = diaperKindLabel(entry.kind, t);
  const extra = [
    diaperColorLabel(entry.poopColor, t),
    diaperTextureLabel(entry.poopTexture, t),
    diaperAmountLabel(entry.poopAmount, t),
  ].filter(Boolean);
  return extra.length ? `${kind} · ${extra.join(", ")}` : kind;
}

export function foodSlotLabel(slot: FoodSlot, t: Translate): string {
  if (slot === "breakfast") return t("food.breakfast");
  if (slot === "lunch") return t("food.lunch");
  if (slot === "dinner") return t("food.dinner");
  return t("food.snack");
}

export function describeFood(entry: FoodEntry, t: Translate): string {
  const slot = entry.slot ? foodSlotLabel(entry.slot, t) : "";
  const allergy = entry.allergyNote ? `${t("food.allergy")}: ${entry.allergyNote}` : "";
  return [slot, entry.name, allergy].filter(Boolean).join(" · ");
}

export function describeHealth(entry: HealthEntry, t: Translate): string {
  if (entry.kind === "temperature" && entry.temperatureC !== undefined) {
    return t("health.tempValue", { value: entry.temperatureC });
  }
  return [entry.name, entry.dose].filter(Boolean).join(" · ");
}

export function foodHistoryParts(
  entry: FoodEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  const slot = entry.slot ? foodSlotLabel(entry.slot, t) : "";
  const allergy = entry.allergyNote ? `${t("food.allergy")}: ${entry.allergyNote}` : "";
  return {
    title: entry.name || slot,
    subtitle: [entry.name ? slot : "", allergy].filter(Boolean).join(" · "),
    tone: "emerald",
    icon: "food",
  };
}

export function healthHistoryParts(
  entry: HealthEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  if (entry.kind === "temperature") {
    return {
      title: entry.temperatureC !== undefined ? t("health.tempValue", { value: entry.temperatureC }) : t("child.tagTemperature"),
      subtitle: "",
      tone: "rose",
      icon: "temperature",
    };
  }
  return {
    title: entry.name,
    subtitle: entry.dose,
    tone: "violet",
    icon: "medicine",
  };
}

export function pottyHistoryParts(
  entry: PottyEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  return {
    title: describePotty(entry, t),
    subtitle: "",
    tone: "sky",
    icon: "potty",
  };
}

export function describePotty(entry: PottyEntry, t: Translate): string {
  switch (entry.kind) {
    case "poop":
      return t("potty.poop");
    case "accident":
      return t("potty.accident");
    case "diaper":
      return t("potty.diaper");
    default:
      return t("potty.pee");
  }
}

export function describeSleep(entry: SleepEntry, t: Translate, durations: Map<string, number>): string {
  return sleepDetailParts(entry, t, durations).join(" · ");
}

export function todayTimeline(data: ChildStorage, today: string, t: Translate): TimelineItem[] {
  const durations = sleepDurations(data.sleeps);
  const items: TimelineItem[] = [
    ...data.feeds
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `feed-${entry.id}`,
        kind: "feed" as const,
        time: entry.time,
        title: t("child.tagFeed"),
        detail: describeFeed(entry, t),
      })),
    ...data.pumps
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `pump-${entry.id}`,
        kind: "pump" as const,
        time: entry.time,
        title: t("child.tagPump"),
        detail: describePump(entry, t),
      })),
    ...data.diapers
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `diaper-${entry.id}`,
        kind: "diaper" as const,
        time: entry.time,
        title: t("child.tagDiaper"),
        detail: describeDiaper(entry, t),
      })),
    ...data.sleeps
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `sleep-${entry.id}`,
        kind: "sleep" as const,
        time: entry.time,
        title: t("child.tagSleep"),
        detail: describeSleep(entry, t, durations),
      })),
    ...data.foods
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `food-${entry.id}`,
        kind: "food" as const,
        time: entry.time,
        title: t("child.tagFood"),
        detail: describeFood(entry, t),
      })),
    ...data.health
      .filter((entry) => entry.date === today && entry.kind === "temperature")
      .map((entry) => ({
        id: `temperature-${entry.id}`,
        kind: "temperature" as const,
        time: entry.time,
        title: t("child.tagTemperature"),
        detail: describeHealth(entry, t),
      })),
    ...data.health
      .filter((entry) => entry.date === today && entry.kind === "medicine")
      .map((entry) => ({
        id: `medicine-${entry.id}`,
        kind: "medicine" as const,
        time: entry.time,
        title: t("child.tagMedicine"),
        detail: describeHealth(entry, t),
      })),
    ...data.potty
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `potty-${entry.id}`,
        kind: "potty" as const,
        time: entry.time,
        title: t("child.tagPotty"),
        detail: describePotty(entry, t),
      })),
  ];
  return items.sort((a, b) => b.time.localeCompare(a.time) || b.id.localeCompare(a.id));
}

export function logDates(data: ChildStorage): string[] {
  return [
    ...data.feeds.map((entry) => entry.date),
    ...data.pumps.map((entry) => entry.date),
    ...data.diapers.map((entry) => entry.date),
    ...data.sleeps.map((entry) => entry.date),
    ...data.foods.map((entry) => entry.date),
    ...data.health.map((entry) => entry.date),
    ...data.potty.map((entry) => entry.date),
  ];
}

export function latestGrowth(
  entries: GrowthEntry[],
  key: "weightKg" | "lengthCm" | "headCm",
): { value: number; date: string } | null {
  let best: GrowthEntry | undefined;
  for (const entry of entries) {
    if (entry[key] === undefined) continue;
    if (!best || entry.date > best.date) best = entry;
  }
  const value = best?.[key];
  if (!best || value === undefined) return null;
  return { value, date: best.date };
}

export type GrowthDay = GrowthEntry & { sourceIds: string[] };

/** One row per date. A later entry on that day fills only the fields it includes. */
export function growthByDay(entries: GrowthEntry[]): GrowthDay[] {
  const groups = new Map<string, GrowthEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.date);
    if (group) group.push(entry);
    else groups.set(entry.date, [entry]);
  }

  return [...groups.entries()]
    .map(([date, group]) => {
      const merged: GrowthDay = { id: group[0].id, date, sourceIds: group.map((entry) => entry.id) };
      for (let index = group.length - 1; index >= 0; index -= 1) {
        const entry = group[index];
        if (entry.weightKg !== undefined) merged.weightKg = entry.weightKg;
        if (entry.lengthCm !== undefined) merged.lengthCm = entry.lengthCm;
        if (entry.headCm !== undefined) merged.headCm = entry.headCm;
      }
      return merged;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type GrowthDelta = {
  value: number;
  date: string;
  previous?: number;
  previousDate?: string;
  delta?: number;
};

export function growthComparison(entries: GrowthEntry[]) {
  const days = growthByDay(entries);
  function field(key: "weightKg" | "lengthCm" | "headCm"): GrowthDelta | null {
    const found = days.filter((day) => day[key] !== undefined);
    const latest = found[0];
    const previous = found[1];
    const value = latest?.[key];
    if (!latest || value === undefined) return null;
    const prev = previous?.[key];
    return {
      value,
      date: latest.date,
      ...(prev !== undefined && previous
        ? {
            previous: prev,
            previousDate: previous.date,
            delta: key === "weightKg" ? (value - prev) : Number((value - prev).toFixed(2)),
          }
        : {}),
    };
  }
  return {
    weight: field("weightKg"),
    height: field("lengthCm"),
    head: field("headCm"),
  };
}

export function mergeGrowthDay(
  entries: GrowthEntry[],
  incoming: Omit<GrowthEntry, "id">,
  newId: string,
): { entry: GrowthEntry; removedIds: string[] } {
  const sameDay = growthByDay(entries.filter((entry) => entry.date === incoming.date))[0];
  const entry: GrowthEntry = {
    id: sameDay?.id ?? newId,
    date: incoming.date,
    ...(sameDay?.weightKg !== undefined ? { weightKg: sameDay.weightKg } : {}),
    ...(sameDay?.lengthCm !== undefined ? { lengthCm: sameDay.lengthCm } : {}),
    ...(sameDay?.headCm !== undefined ? { headCm: sameDay.headCm } : {}),
  };
  if (incoming.weightKg !== undefined) entry.weightKg = incoming.weightKg;
  if (incoming.lengthCm !== undefined) entry.lengthCm = incoming.lengthCm;
  if (incoming.headCm !== undefined) entry.headCm = incoming.headCm;
  return {
    entry,
    removedIds: (sameDay?.sourceIds ?? []).filter((id) => id !== entry.id),
  };
}
