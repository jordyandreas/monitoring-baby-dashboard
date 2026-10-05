export type PushKind = "feed" | "vitamins" | "babyPlus" | "kicks" | "hydration";

export type PushLocale = "en" | "id";

export interface PushReminderPreferences {
  feed: { enabled: boolean; intervalHours: number };
  vitamins: { enabled: boolean; time: string };
  babyPlus: { enabled: boolean };
  kicks: { enabled: boolean; time: string };
  hydration: {
    enabled: boolean;
    intervalHours: number;
    startTime: string;
    endTime: string;
  };
}

export const DEFAULT_PUSH_PREFERENCES: PushReminderPreferences = {
  feed: { enabled: false, intervalHours: 3 },
  vitamins: { enabled: false, time: "08:00" },
  babyPlus: { enabled: false },
  kicks: { enabled: false, time: "20:00" },
  hydration: {
    enabled: false,
    intervalHours: 2,
    startTime: "08:00",
    endTime: "22:00",
  },
};

export const PUSH_KINDS: PushKind[] = [
  "feed",
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
      body: "Sudah {hours} jam sejak minum terakhir.",
      url: "/feed",
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
      body: "It has been {hours} hours since the last feeding.",
      url: "/feed",
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

function clampHours(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(6, Math.max(1, Math.round(value)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function hours(value: unknown, fallback: number): number {
  return typeof value === "number" ? clampHours(value) : fallback;
}

function time(value: unknown, fallback: string): string {
  return typeof value === "string" && minutesOf(value) !== null ? value : fallback;
}

export function parsePushPreferences(value: unknown): PushReminderPreferences {
  const raw = asRecord(value);
  const base = DEFAULT_PUSH_PREFERENCES;
  const feed = asRecord(raw?.feed);
  const vitamins = asRecord(raw?.vitamins);
  const babyPlus = asRecord(raw?.babyPlus);
  const kicks = asRecord(raw?.kicks);
  const hydration = asRecord(raw?.hydration);
  return {
    feed: {
      enabled: bool(feed?.enabled, base.feed.enabled),
      intervalHours: hours(feed?.intervalHours, base.feed.intervalHours),
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
      intervalHours: hours(hydration?.intervalHours, base.hydration.intervalHours),
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
  hoursValue?: number,
): ScheduleDraft {
  const copy = COPY[locale][kind];
  return {
    kind,
    enabled: false,
    scheduleType,
    nextRunAt: null,
    payload: {
      title: copy.title,
      body: copy.body.replace("{hours}", String(hoursValue ?? "")),
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
  hoursValue?: number,
): ScheduleDraft {
  const copy = COPY[locale][kind];
  return {
    kind,
    enabled: true,
    scheduleType,
    nextRunAt: next.nextRunAt.toISOString(),
    payload: {
      title: copy.title,
      body: copy.body.replace("{hours}", String(hoursValue ?? "")),
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
  const { enabled, intervalHours } = source.preferences.feed;
  const hoursValue = clampHours(intervalHours);
  if (!enabled || !source.latestFeed) {
    return idle("feed", "interval", source.locale, sentKey, hoursValue);
  }
  const last = localStampToUtc(
    source.latestFeed.date,
    source.latestFeed.time,
    source.timeZone,
  );
  if (!last) return idle("feed", "interval", source.locale, sentKey, hoursValue);

  const step = hoursValue * 60 * 60 * 1000;
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
    hoursValue,
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
  const hoursValue = clampHours(prefs.intervalHours);
  if (!prefs.enabled) return idle("hydration", "interval", source.locale, sentKey);
  const start = minutesOf(prefs.startTime);
  const end = minutesOf(prefs.endTime);
  if (start === null || end === null || end <= start) {
    return idle("hydration", "interval", source.locale, sentKey);
  }
  const interval = hoursValue * 60;
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

  for (let guard = 0; guard < 16; guard += 1) {
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
    vitaminSchedule(source),
    babyPlusSchedule(source),
    kickSchedule(source),
    hydrationSchedule(source),
  ];
}
