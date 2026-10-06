export type PushKind = "feed" | "pump" | "vitamins" | "babyPlus" | "kicks" | "hydration";

export type PushLocale = "en" | "id";

export interface PushReminderPreferences {
  feed: { enabled: boolean; intervalMinutes: number };
  pump: { enabled: boolean; intervalMinutes: number };
  vitamins: { enabled: boolean; time: string };
  babyPlus: { enabled: boolean };
  kicks: { enabled: boolean; time: string };
  hydration: {
    enabled: boolean;
    intervalMinutes: number;
    startTime: string;
    endTime: string;
  };
}

export const INTERVAL_PRESET_MINUTES = [60, 120, 180, 240, 300, 360] as const;
export const MIN_INTERVAL_MINUTES = 1;
export const MAX_INTERVAL_MINUTES = 7 * 24 * 60;

export const DEFAULT_PUSH_PREFERENCES: PushReminderPreferences = {
  feed: { enabled: false, intervalMinutes: 180 },
  pump: { enabled: false, intervalMinutes: 180 },
  vitamins: { enabled: false, time: "08:00" },
  babyPlus: { enabled: false },
  kicks: { enabled: false, time: "20:00" },
  hydration: {
    enabled: false,
    intervalMinutes: 120,
    startTime: "08:00",
    endTime: "22:00",
  },
};

export const PUSH_KINDS: PushKind[] = [
  "feed",
  "pump",
  "vitamins",
  "babyPlus",
  "kicks",
  "hydration",
];

export interface ScheduleSource {
  now: Date;
  timeZone: string;
  locale: PushLocale;
  preferences: PushReminderPreferences;
  sentKeys: Partial<Record<PushKind, string | null>>;
  latestFeed: { date: string; time: string } | null;
  latestPump: { date: string; time: string } | null;
  vitaminNamedCount: number;
  vitaminDoneCount: number;
  vitaminLogDate: string;
  kickDates: string[];
  waterLogs: { date: string; time: string }[];
  babyPlus: {
    startDate: string;
    dailyTime: string;
    completions: Record<string, boolean>;
  } | null;
}

export interface SchedulePayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  pendingKey: string | null;
  sentKey: string | null;
  due: boolean;
}

export interface ScheduleDraft {
  kind: PushKind;
  enabled: boolean;
  scheduleType: "daily" | "interval";
  nextRunAt: string | null;
  payload: SchedulePayload;
}

const PROGRAM_DAYS = 16 * 9;

const COPY: Record<
  PushLocale,
  Record<PushKind, { title: string; body: string; url: string }>
> = {
  id: {
    feed: {
      title: "Waktunya minum susu",
      body: "Sudah {interval} sejak minum terakhir.",
      url: "/feed",
    },
    pump: {
      title: "Waktunya pompa",
      body: "Sudah {interval} sejak pompa terakhir.",
      url: "/pump",
    },
    vitamins: {
      title: "Pengingat vitamin",
      body: "Masih ada vitamin yang belum dicentang hari ini.",
      url: "/vitamins",
    },
    babyPlus: {
      title: "Baby Plus",
      body: "Waktunya sesi dengar hari ini.",
      url: "/baby-plus",
    },
    kicks: {
      title: "Pengingat tendangan",
      body: "Catat tendangan hari ini jika kamu merasakannya.",
      url: "/kicks",
    },
    hydration: {
      title: "Pengingat minum air",
      body: "Waktunya minum air.",
      url: "/water",
    },
  },
  en: {
    feed: {
      title: "Time for milk",
      body: "It has been {interval} since the last feeding.",
      url: "/feed",
    },
    pump: {
      title: "Time to pump",
      body: "It has been {interval} since the last pump.",
      url: "/pump",
    },
    vitamins: {
      title: "Vitamin reminder",
      body: "Some of today's vitamins are still unchecked.",
      url: "/vitamins",
    },
    babyPlus: {
      title: "Baby Plus",
      body: "Time for today's listening session.",
      url: "/baby-plus",
    },
    kicks: {
      title: "Kick reminder",
      body: "Log today's kicks if you have felt movement.",
      url: "/kicks",
    },
    hydration: {
      title: "Water reminder",
      body: "Time for a glass of water.",
      url: "/water",
    },
  },
};

export function clampIntervalMinutes(value: number): number {
  if (!Number.isFinite(value)) return 60;
  return Math.min(MAX_INTERVAL_MINUTES, Math.max(MIN_INTERVAL_MINUTES, Math.round(value)));
}

function legacyHoursToMinutes(value: number): number {
  if (!Number.isFinite(value)) return 60;
  const hours = Math.min(6, Math.max(1, Math.round(value)));
  return hours * 60;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function intervalMinutes(
  record: Record<string, unknown> | null,
  fallback: number,
): number {
  if (typeof record?.intervalMinutes === "number") {
    return clampIntervalMinutes(record.intervalMinutes);
  }
  if (typeof record?.intervalHours === "number") {
    return legacyHoursToMinutes(record.intervalHours);
  }
  return fallback;
}

function formatInterval(locale: PushLocale, minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    if (locale === "id") return hours === 1 ? "1 jam" : `${hours} jam`;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (locale === "id") return minutes === 1 ? "1 menit" : `${minutes} menit`;
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function time(value: unknown, fallback: string): string {
  return typeof value === "string" && minutesOf(value) !== null ? value : fallback;
}

export function parsePushPreferences(value: unknown): PushReminderPreferences {
  const raw = asRecord(value);
  const base = DEFAULT_PUSH_PREFERENCES;
  const feed = asRecord(raw?.feed);
  const pump = asRecord(raw?.pump);
  const vitamins = asRecord(raw?.vitamins);
  const babyPlus = asRecord(raw?.babyPlus);
  const kicks = asRecord(raw?.kicks);
  const hydration = asRecord(raw?.hydration);
  return {
    feed: {
      enabled: bool(feed?.enabled, base.feed.enabled),
      intervalMinutes: intervalMinutes(feed, base.feed.intervalMinutes),
    },
    pump: {
      enabled: bool(pump?.enabled, base.pump.enabled),
      intervalMinutes: intervalMinutes(pump, base.pump.intervalMinutes),
    },
    vitamins: {
      enabled: bool(vitamins?.enabled, base.vitamins.enabled),
      time: time(vitamins?.time, base.vitamins.time),
    },
    babyPlus: {
      enabled: bool(babyPlus?.enabled, base.babyPlus.enabled),
    },
    kicks: {
      enabled: bool(kicks?.enabled, base.kicks.enabled),
      time: time(kicks?.time, base.kicks.time),
    },
    hydration: {
      enabled: bool(hydration?.enabled, base.hydration.enabled),
      intervalMinutes: intervalMinutes(hydration, base.hydration.intervalMinutes),
      startTime: time(hydration?.startTime, base.hydration.startTime),
      endTime: time(hydration?.endTime, base.hydration.endTime),
    },
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(date: Date, timeZone: string): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = zonedParts(new Date(utc), timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    utc -= asUtc - Date.UTC(year, month - 1, day, hour, minute, 0);
  }
  return new Date(utc);
}

export function zonedDateString(date: Date, timeZone: string): string {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function localDate(date: Date, timeZone: string): string {
  return zonedDateString(date, timeZone);
}

function localMinutes(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function minutesOf(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function atLocal(date: string, time: string, timeZone: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  const clock = minutesOf(time);
  if (!year || !month || !day || clock === null) return null;
  return zonedTimeToUtc(year, month, day, Math.floor(clock / 60), clock % 60, timeZone);
}

function localStampToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date | null {
  return atLocal(date, time, timeZone);
}

function idle(
  kind: PushKind,
  scheduleType: "daily" | "interval",
  locale: PushLocale,
  sentKey: string | null,
  intervalMinutes?: number,
): ScheduleDraft {
  const copy = COPY[locale][kind];
  return {
    kind,
    enabled: false,
    scheduleType,
    nextRunAt: null,
    payload: {
      title: copy.title,
      body:
        intervalMinutes === undefined
          ? copy.body
          : copy.body.replace("{interval}", formatInterval(locale, intervalMinutes)),
      url: copy.url,
      tag: kind,
      pendingKey: null,
      sentKey,
      due: false,
    },
  };
}

function draftOf(
  kind: PushKind,
  scheduleType: "daily" | "interval",
  locale: PushLocale,
  sentKey: string | null,
  next: { pendingKey: string; nextRunAt: Date; due: boolean },
  intervalMinutes?: number,
): ScheduleDraft {
  const copy = COPY[locale][kind];
  return {
    kind,
    enabled: true,
    scheduleType,
    nextRunAt: next.nextRunAt.toISOString(),
    payload: {
      title: copy.title,
      body:
        intervalMinutes === undefined
          ? copy.body
          : copy.body.replace("{interval}", formatInterval(locale, intervalMinutes)),
      url: copy.url,
      tag: next.pendingKey,
      pendingKey: next.pendingKey,
      sentKey,
      due: next.due,
    },
  };
}

function feedSchedule(source: ScheduleSource): ScheduleDraft {
  const sentKey = source.sentKeys.feed ?? null;
  const { enabled, intervalMinutes } = source.preferences.feed;
  const minutes = clampIntervalMinutes(intervalMinutes);
  if (!enabled || !source.latestFeed) {
    return idle("feed", "interval", source.locale, sentKey, minutes);
  }
  const last = localStampToUtc(
    source.latestFeed.date,
    source.latestFeed.time,
    source.timeZone,
  );
  if (!last) return idle("feed", "interval", source.locale, sentKey, minutes);

  const step = minutes * 60 * 1000;
  let slot = new Date(last.getTime() + step);
  for (let guard = 0; guard < 48 && `feed:${slot.toISOString()}` === sentKey; guard += 1) {
    slot = new Date(slot.getTime() + step);
  }
  const pendingKey = `feed:${slot.toISOString()}`;
  const due = slot.getTime() <= source.now.getTime() && pendingKey !== sentKey;
  return draftOf(
    "feed",
    "interval",
    source.locale,
    sentKey,
    {
      pendingKey,
      nextRunAt: due ? source.now : slot,
      due,
    },
    minutes,
  );
}

function pumpSchedule(source: ScheduleSource): ScheduleDraft {
  const sentKey = source.sentKeys.pump ?? null;
  const { enabled, intervalMinutes } = source.preferences.pump;
  const minutes = clampIntervalMinutes(intervalMinutes);
  if (!enabled || !source.latestPump) {
    return idle("pump", "interval", source.locale, sentKey, minutes);
  }
  const last = localStampToUtc(
    source.latestPump.date,
    source.latestPump.time,
    source.timeZone,
  );
  if (!last) return idle("pump", "interval", source.locale, sentKey, minutes);

  const step = minutes * 60 * 1000;
  let slot = new Date(last.getTime() + step);
  for (let guard = 0; guard < 48 && `pump:${slot.toISOString()}` === sentKey; guard += 1) {
    slot = new Date(slot.getTime() + step);
  }
  const pendingKey = `pump:${slot.toISOString()}`;
  const due = slot.getTime() <= source.now.getTime() && pendingKey !== sentKey;
  return draftOf(
    "pump",
    "interval",
    source.locale,
    sentKey,
    {
      pendingKey,
      nextRunAt: due ? source.now : slot,
      due,
    },
    minutes,
  );
}

function dailySchedule(
  source: ScheduleSource,
  kind: "vitamins" | "babyPlus" | "kicks",
  time: string,
  skipToday: boolean,
): ScheduleDraft {
  const sentKey = source.sentKeys[kind] ?? null;
  const today = localDate(source.now, source.timeZone);
  const at = atLocal(today, time, source.timeZone);
  if (!at) return idle(kind, "daily", source.locale, sentKey);

  const tomorrow = addDays(today, 1);
  const tomorrowAt = atLocal(tomorrow, time, source.timeZone);
  if (!tomorrowAt) return idle(kind, "daily", source.locale, sentKey);

  if (skipToday || (source.now.getTime() >= at.getTime() && sentKey === `${kind}:${today}`)) {
    return draftOf(kind, "daily", source.locale, sentKey, {
      pendingKey: `${kind}:${tomorrow}`,
      nextRunAt: tomorrowAt,
      due: false,
    });
  }

  if (source.now.getTime() < at.getTime()) {
    return draftOf(kind, "daily", source.locale, sentKey, {
      pendingKey: `${kind}:${today}`,
      nextRunAt: at,
      due: false,
    });
  }

  return draftOf(kind, "daily", source.locale, sentKey, {
    pendingKey: `${kind}:${today}`,
    nextRunAt: source.now,
    due: true,
  });
}

function vitaminSchedule(source: ScheduleSource): ScheduleDraft {
  if (!source.preferences.vitamins.enabled || source.vitaminNamedCount < 1) {
    return idle("vitamins", "daily", source.locale, source.sentKeys.vitamins ?? null);
  }
  const today = localDate(source.now, source.timeZone);
  const done =
    source.vitaminLogDate === today &&
    source.vitaminDoneCount >= source.vitaminNamedCount;
  return dailySchedule(source, "vitamins", source.preferences.vitamins.time, done);
}

function kickSchedule(source: ScheduleSource): ScheduleDraft {
  if (!source.preferences.kicks.enabled) {
    return idle("kicks", "daily", source.locale, source.sentKeys.kicks ?? null);
  }
  const today = localDate(source.now, source.timeZone);
  return dailySchedule(
    source,
    "kicks",
    source.preferences.kicks.time,
    source.kickDates.includes(today),
  );
}

function babyPlusSchedule(source: ScheduleSource): ScheduleDraft {
  const sentKey = source.sentKeys.babyPlus ?? null;
  const program = source.babyPlus;
  if (!source.preferences.babyPlus.enabled || !program?.startDate || !program.dailyTime) {
    return idle("babyPlus", "daily", source.locale, sentKey);
  }
  const today = localDate(source.now, source.timeZone);
  const dayIndex = calendarDaysBetween(program.startDate, today);
  if (dayIndex < 0 || dayIndex >= PROGRAM_DAYS) {
    return idle("babyPlus", "daily", source.locale, sentKey);
  }
  const sound = Math.floor(dayIndex / 9);
  const day = dayIndex % 9;
  const done = program.completions[`${sound}-${day}`] === true;
  return dailySchedule(source, "babyPlus", program.dailyTime, done);
}

function calendarDaysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return -1;
  return Math.round((end - start) / 86_400_000);
}

function hydrationSchedule(source: ScheduleSource): ScheduleDraft {
  const sentKey = source.sentKeys.hydration ?? null;
  const prefs = source.preferences.hydration;
  const minutes = clampIntervalMinutes(prefs.intervalMinutes);
  if (!prefs.enabled) return idle("hydration", "interval", source.locale, sentKey);
  const start = minutesOf(prefs.startTime);
  const end = minutesOf(prefs.endTime);
  if (start === null || end === null || end <= start) {
    return idle("hydration", "interval", source.locale, sentKey);
  }
  const interval = minutes;
  const today = localDate(source.now, source.timeZone);
  const nowMinutes = localMinutes(source.now, source.timeZone);

  const place = (date: string, slotIndex: number, slotStart: number, due: boolean) => {
    const when = atLocal(date, minutesToTime(slotStart), source.timeZone);
    if (!when) return idle("hydration", "interval", source.locale, sentKey);
    return draftOf("hydration", "interval", source.locale, sentKey, {
      pendingKey: `hydration:${date}:${slotIndex}`,
      nextRunAt: due ? source.now : when,
      due,
    });
  };

  if (nowMinutes < start) return place(today, 0, start, false);

  let date = today;
  let slotIndex = Math.floor((nowMinutes - start) / interval);
  let slotStart = start + slotIndex * interval;
  if (slotStart > end) {
    const tomorrow = addDays(today, 1);
    return place(tomorrow, 0, start, false);
  }

  const maxSlots = Math.ceil((end - start) / interval) + 2;
  for (let guard = 0; guard < maxSlots; guard += 1) {
    const key = `hydration:${date}:${slotIndex}`;
    const logged = source.waterLogs.some((entry) => {
      if (entry.date !== date) return false;
      const loggedAt = minutesOf(entry.time);
      return loggedAt !== null && loggedAt >= slotStart && loggedAt < slotStart + interval && loggedAt <= end;
    });
    if (!logged && key !== sentKey) {
      const when = atLocal(date, minutesToTime(slotStart), source.timeZone);
      const due = when !== null && when.getTime() <= source.now.getTime();
      return place(date, slotIndex, slotStart, due);
    }
    slotIndex += 1;
    slotStart += interval;
    if (slotStart > end) {
      date = addDays(date, 1);
      slotIndex = 0;
      slotStart = start;
      return place(date, 0, start, false);
    }
  }

  return idle("hydration", "interval", source.locale, sentKey);
}

export function computeSchedules(source: ScheduleSource): ScheduleDraft[] {
  return [
    feedSchedule(source),
    pumpSchedule(source),
    vitaminSchedule(source),
    babyPlusSchedule(source),
    kickSchedule(source),
    hydrationSchedule(source),
  ];
}
