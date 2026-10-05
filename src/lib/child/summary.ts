import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/types";
import { formatTimeLabel, getMinutesFromTimeString } from "@/utils/time";
import type {
  ChildStorage,
  DiaperEntry,
  FeedEntry,
  GrowthEntry,
  HealthEntry,
  MealEntry,
  PottyEntry,
  SleepEntry,
  SolidEntry,
} from "@/lib/child/types";

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function sleepMinutes(entry: SleepEntry): number {
  const start = getMinutesFromTimeString(entry.startTime);
  const end = getMinutesFromTimeString(entry.endTime);
  if (start === null || end === null) return 0;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function formatDuration(minutes: number, t: Translate): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return t("child.minutesShort", { minutes: rest });
  if (rest === 0) return t("child.hoursShort", { hours });
  return t("child.hoursMinutes", { hours, minutes: rest });
}

export type TodayTotals = {
  logCount: number;
  feedCount: number;
  ml: number;
  pee: number;
  poop: number;
  sleepMin: number;
};

export function rangeTotals(
  data: ChildStorage,
  inRange: (date: string) => boolean,
): TodayTotals {
  const feeds = data.feeds.filter((entry) => inRange(entry.date));
  const diapers = data.diapers.filter((entry) => inRange(entry.date));
  const sleeps = data.sleeps.filter((entry) => inRange(entry.date));
  return {
    logCount: feeds.length + diapers.length + sleeps.length,
    feedCount: feeds.length,
    ml: feeds.reduce((sum, entry) => sum + (entry.amountMl ?? 0), 0),
    pee: diapers.filter((entry) => entry.kind === "pee" || entry.kind === "both").length,
    poop: diapers.filter((entry) => entry.kind === "poop" || entry.kind === "both").length,
    sleepMin: sleeps.reduce((sum, entry) => sum + sleepMinutes(entry), 0),
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

export function sleepDaySummary(entries: SleepEntry[]) {
  const nap = entries
    .filter((entry) => entry.period === "day")
    .reduce((sum, entry) => sum + sleepMinutes(entry), 0);
  const night = entries
    .filter((entry) => entry.period === "night")
    .reduce((sum, entry) => sum + sleepMinutes(entry), 0);
  return { count: entries.length, total: nap + night, nap, night };
}

export function todayTotals(data: ChildStorage, today: string): TodayTotals {
  return rangeTotals(data, (date) => date === today);
}

export function monthTotals(data: ChildStorage, today: string): TodayTotals {
  const month = today.slice(0, 7);
  return rangeTotals(data, (date) => date.startsWith(month));
}

export type TimelineKind = "feed" | "diaper" | "sleep" | "solid" | "health" | "potty" | "meal";

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

export type HistoryTone = "amber" | "sky" | "lilac" | "violet";
export type HistoryIcon = "feed" | "diaper" | "sleep" | "kick" | "water";

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

export function diaperHistoryParts(
  entry: DiaperEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  const title =
    entry.kind === "pee" ? t("diaper.pee") : entry.kind === "poop" ? t("diaper.poop") : t("diaper.both");
  return {
    title,
    subtitle: [diaperColorLabel(entry.poopColor, t), diaperTextureLabel(entry.poopTexture, t)]
      .filter(Boolean)
      .join(", "),
    tone: "amber",
    icon: "diaper",
  };
}

export function sleepHistoryParts(
  entry: SleepEntry,
  t: Translate,
): { title: string; subtitle: string; tone: HistoryTone; icon: HistoryIcon } {
  return {
    title: entry.period === "night" ? t("sleep.night") : t("sleep.day"),
    subtitle: `${formatTimeLabel(entry.startTime)}–${formatTimeLabel(entry.endTime)} · ${formatDuration(sleepMinutes(entry), t)}`,
    tone: "sky",
    icon: "sleep",
  };
}

export function describeFeed(entry: FeedEntry, t: Translate): string {
  if (entry.kind === "breast") {
    return [
      t("feed.kindBreast"),
      feedSideLabel(entry.side, t),
      entry.durationMin ? t("child.minutesShort", { minutes: entry.durationMin }) : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  const kind = entry.kind === "formula" ? t("feed.kindFormula") : t("feed.kindBottleBreast");
  const amount = entry.amountMl ? `${entry.amountMl} ml` : "";
  return [kind, amount].filter(Boolean).join(" · ");
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
  const kind =
    entry.kind === "pee" ? t("diaper.pee") : entry.kind === "poop" ? t("diaper.poop") : t("diaper.both");
  const extra = [diaperColorLabel(entry.poopColor, t), diaperTextureLabel(entry.poopTexture, t)].filter(
    Boolean,
  );
  return extra.length ? `${kind} · ${extra.join(", ")}` : kind;
}

export function describeSolid(entry: SolidEntry, t: Translate): string {
  return entry.allergyNote ? `${entry.name} · ${t("solids.allergy")}: ${entry.allergyNote}` : entry.name;
}

export function describeHealth(entry: HealthEntry, t: Translate): string {
  const parts = [entry.name, entry.dose].filter(Boolean);
  if (entry.temperatureC !== undefined) {
    parts.push(t("health.tempValue", { value: entry.temperatureC }));
  }
  return parts.join(" · ");
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

export function describeMeal(entry: MealEntry, t: Translate): string {
  const slot =
    entry.slot === "breakfast"
      ? t("meals.breakfast")
      : entry.slot === "lunch"
        ? t("meals.lunch")
        : entry.slot === "dinner"
          ? t("meals.dinner")
          : t("meals.snack");
  return entry.note ? `${slot} · ${entry.note}` : slot;
}

export function describeSleep(entry: SleepEntry, t: Translate): string {
  const period = entry.period === "night" ? t("sleep.night") : t("sleep.day");
  return `${period} · ${entry.startTime}–${entry.endTime} · ${formatDuration(sleepMinutes(entry), t)}`;
}

export function todayTimeline(data: ChildStorage, today: string, t: Translate): TimelineItem[] {
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
        time: entry.startTime,
        title: t("child.tagSleep"),
        detail: describeSleep(entry, t),
      })),
    ...data.solids
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `solid-${entry.id}`,
        kind: "solid" as const,
        time: entry.time,
        title: t("child.tagSolid"),
        detail: describeSolid(entry, t),
      })),
    ...data.health
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `health-${entry.id}`,
        kind: "health" as const,
        time: entry.time,
        title: t("child.tagHealth"),
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
    ...data.meals
      .filter((entry) => entry.date === today)
      .map((entry) => ({
        id: `meal-${entry.id}`,
        kind: "meal" as const,
        time: entry.time,
        title: t("child.tagMeal"),
        detail: describeMeal(entry, t),
      })),
  ];
  return items.sort((a, b) => b.time.localeCompare(a.time) || b.id.localeCompare(a.id));
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
        ? { previous: prev, previousDate: previous.date, delta: Number((value - prev).toFixed(2)) }
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
