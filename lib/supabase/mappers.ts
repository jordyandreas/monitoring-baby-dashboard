import { DEFAULT_REMINDERS, type RemindersState } from "@/lib/reminders/types";
import type {
  AppStorage,
  BabyPlusState,
  BabyProfile,
  Gender,
  KickEntry,
  VitaminState,
  WaterEntry,
  WaterState,
} from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type BabyProfileRow = Database["public"]["Tables"]["baby_profiles"]["Row"];
type BabyPlusRow = Database["public"]["Tables"]["baby_plus_programs"]["Row"];
type KickRow = Database["public"]["Tables"]["kick_logs"]["Row"];
type WaterRow = Database["public"]["Tables"]["water_logs"]["Row"];
type VitaminItemRow = Database["public"]["Tables"]["vitamin_items"]["Row"];
type VitaminDayRow = Database["public"]["Tables"]["vitamin_day_logs"]["Row"];

function asGender(value: string): Gender {
  if (value === "boy" || value === "girl" || value === "not-yet") return value;
  return "not-yet";
}

function emptyTimeToNull(time: string): string | null {
  return time.trim() ? time : null;
}

function nullTimeToEmpty(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}

export function babyProfileToRow(
  userId: string,
  baby: BabyProfile,
): Database["public"]["Tables"]["baby_profiles"]["Insert"] {
  return {
    user_id: userId,
    name: baby.name,
    gender: baby.gender,
    lmp_date: baby.lmpDate || null,
    due_date: baby.dueDate || null,
  };
}

export function rowToBabyProfile(row: BabyProfileRow): BabyProfile {
  return {
    name: row.name,
    gender: asGender(row.gender),
    lmpDate: row.lmp_date ?? undefined,
    dueDate: row.due_date ?? "",
  };
}

export function babyPlusToRow(
  userId: string,
  state: BabyPlusState,
): Database["public"]["Tables"]["baby_plus_programs"]["Insert"] {
  return {
    user_id: userId,
    start_date: state.startDate || null,
    daily_time: emptyTimeToNull(state.dailyTime),
    completions: state.completions,
  };
}

export function rowToBabyPlus(row: BabyPlusRow): BabyPlusState {
  const completions =
    row.completions && typeof row.completions === "object" && !Array.isArray(row.completions)
      ? (row.completions as Record<string, boolean>)
      : {};
  return {
    startDate: row.start_date ?? "",
    dailyTime: nullTimeToEmpty(row.daily_time),
    completions,
  };
}

export function kickToRow(
  userId: string,
  kick: KickEntry,
): Database["public"]["Tables"]["kick_logs"]["Insert"] {
  return {
    id: kick.id,
    user_id: userId,
    logged_date: kick.date,
    logged_time: kick.time,
  };
}

export function rowToKick(row: KickRow): KickEntry {
  return {
    id: row.id,
    date: row.logged_date,
    time: nullTimeToEmpty(row.logged_time),
  };
}

export function waterToRow(
  userId: string,
  entry: WaterEntry,
): Database["public"]["Tables"]["water_logs"]["Insert"] {
  return {
    id: entry.id,
    user_id: userId,
    logged_date: entry.date,
    logged_time: entry.time,
    amount_ml: entry.amountMl,
  };
}

export function rowToWater(row: WaterRow): WaterEntry {
  return {
    id: row.id,
    date: row.logged_date,
    time: nullTimeToEmpty(row.logged_time),
    amountMl: row.amount_ml,
  };
}

export function vitaminItemsToRows(
  userId: string,
  items: VitaminState["items"],
): Database["public"]["Tables"]["vitamin_items"]["Insert"][] {
  return items.map((item, index) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    sort_order: index,
  }));
}

export function rowsToVitaminItems(rows: VitaminItemRow[]): VitaminState["items"] {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({ id: row.id, name: row.name }));
}

export function vitaminDayToRow(
  userId: string,
  record: { date: string; completed: Record<string, boolean> },
): Database["public"]["Tables"]["vitamin_day_logs"]["Insert"] | null {
  if (!record.date) return null;
  return {
    user_id: userId,
    log_date: record.date,
    completions: record.completed,
  };
}

export function rowsToVitaminState(
  items: VitaminItemRow[],
  dayLogs: VitaminDayRow[],
  fallback: VitaminState,
): VitaminState {
  const sortedDays = [...dayLogs].sort((a, b) => b.log_date.localeCompare(a.log_date));
  const today = sortedDays[0];
  const yesterday = sortedDays[1];

  const toRecord = (row?: VitaminDayRow) => {
    const completed =
      row?.completions &&
      typeof row.completions === "object" &&
      !Array.isArray(row.completions)
        ? (row.completions as Record<string, boolean>)
        : {};
    return {
      date: row?.log_date ?? "",
      completed,
    };
  };

  return {
    items: rowsToVitaminItems(items),
    today: today ? toRecord(today) : fallback.today,
    yesterday: yesterday ? toRecord(yesterday) : null,
  };
}

export function remindersToJson(reminders: RemindersState): RemindersState {
  return reminders;
}

export function jsonToReminders(value: unknown): RemindersState {
  if (!value || typeof value !== "object") return DEFAULT_REMINDERS;
  const raw = value as Partial<RemindersState>;
  return {
    vitamins: { ...DEFAULT_REMINDERS.vitamins, ...raw.vitamins },
    babyPlus: { ...DEFAULT_REMINDERS.babyPlus, ...raw.babyPlus },
    kicks: { ...DEFAULT_REMINDERS.kicks, ...raw.kicks },
    hydration: { ...DEFAULT_REMINDERS.hydration, ...raw.hydration },
  };
}

export interface RemoteAppSlice {
  baby: BabyProfile | null;
  babyPlus: BabyPlusState;
  kicks: KickEntry[];
  vitamins: VitaminState;
  water: WaterState;
  reminders: RemindersState;
  locale: string;
}

export function mergeRemoteIntoAppStorage(
  local: AppStorage,
  remote: Partial<RemoteAppSlice>,
): AppStorage {
  return {
    ...local,
    baby: remote.baby !== undefined ? remote.baby : local.baby,
    babyPlus: remote.babyPlus ?? local.babyPlus,
    kicks: remote.kicks ?? local.kicks,
    vitamins: remote.vitamins ?? local.vitamins,
    water: remote.water ?? local.water,
    reminders: remote.reminders ?? local.reminders,
  };
}
