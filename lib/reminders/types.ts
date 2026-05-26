export type ReminderKind = "vitamins" | "babyPlus" | "hydration" | "kicks";

export interface RemindersState {
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

export const DEFAULT_REMINDERS: RemindersState = {
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

export interface DueReminder {
  dedupeKey: string;
  kind: ReminderKind;
  title: string;
  body: string;
  url: string;
}
