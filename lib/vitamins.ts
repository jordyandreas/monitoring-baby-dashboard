import { format, parseISO, startOfDay, subDays } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/types";
import type { VitaminDayRecord, VitaminItem, VitaminState } from "./types";

export function getTodayDateStr(reference: Date = new Date()): string {
  return format(startOfDay(reference), "yyyy-MM-dd");
}

export function getYesterdayDateStr(reference: Date = new Date()): string {
  return format(subDays(startOfDay(reference), 1), "yyyy-MM-dd");
}

export function formatVitaminDate(dateStr: string, locale: Locale = "en"): string {
  return format(parseISO(dateStr), "EEEE, d MMM", {
    locale: locale === "id" ? idLocale : enUS,
  });
}

export function createEmptyVitaminState(reference: Date = new Date()): VitaminState {
  const todayStr = getTodayDateStr(reference);
  return {
    items: [],
    today: { date: todayStr, completed: {} },
    yesterday: null,
  };
}

/** Keep only calendar today + yesterday; roll stored "today" into yesterday on new day. */
export function rolloverVitaminState(
  state: VitaminState,
  reference: Date = new Date(),
): VitaminState {
  const todayStr = getTodayDateStr(reference);
  const yesterdayStr = getYesterdayDateStr(reference);

  if (!state.today.date) {
    return {
      ...state,
      today: { date: todayStr, completed: {} },
      yesterday:
        state.yesterday?.date === yesterdayStr ? state.yesterday : null,
    };
  }

  if (state.today.date === todayStr) {
    if (state.yesterday && state.yesterday.date !== yesterdayStr) {
      return { ...state, yesterday: null };
    }
    return state;
  }

  const newYesterday: VitaminDayRecord | null =
    state.today.date === yesterdayStr
      ? {
          date: state.today.date,
          completed: { ...state.today.completed },
        }
      : null;

  return {
    ...state,
    yesterday: newYesterday,
    today: { date: todayStr, completed: {} },
  };
}

export function getNamedVitamins(items: VitaminItem[]): VitaminItem[] {
  return items.filter((item) => item.name.trim().length > 0);
}

export function countCompleted(
  items: VitaminItem[],
  completed: Record<string, boolean>,
): number {
  return getNamedVitamins(items).filter((item) => completed[item.id]).length;
}

/** Drop completion entries for vitamins no longer in the saved list. */
export function pruneVitaminCompletions(
  items: VitaminItem[],
  completed: Record<string, boolean>,
): Record<string, boolean> {
  const namedIds = new Set(getNamedVitamins(items).map((item) => item.id));
  const next: Record<string, boolean> = {};

  for (const [id, value] of Object.entries(completed)) {
    if (namedIds.has(id) && value) {
      next[id] = true;
    }
  }

  return next;
}

export function syncVitaminItems(
  state: VitaminState,
  items: VitaminItem[],
): VitaminState {
  return {
    ...state,
    items,
    today: {
      ...state.today,
      completed: pruneVitaminCompletions(items, state.today.completed),
    },
    yesterday: state.yesterday
      ? {
          ...state.yesterday,
          completed: pruneVitaminCompletions(items, state.yesterday.completed),
        }
      : null,
  };
}
