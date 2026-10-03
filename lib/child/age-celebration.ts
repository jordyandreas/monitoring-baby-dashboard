import { addDays, addMonths, addYears, isSameDay, isValid, parseISO } from "date-fns";

export const AGE_CELEBRATION_DISMISS_KEY = "baby-age-celebration-dismissed";

export type AgeCelebrationKind = "week" | "month" | "hundred" | "year";

export type AgeCelebration = {
  id: string;
  kind: AgeCelebrationKind;
  amount: number;
};

const RANK: Record<AgeCelebrationKind, number> = {
  year: 4,
  hundred: 3,
  month: 2,
  week: 1,
};

/** Age party for this calendar day only. Derived from birth date. Nothing is stored. */
export function getAgeCelebration(birthDate: string, now = new Date()): AgeCelebration | null {
  const birth = parseISO(birthDate);
  if (!isValid(birth)) return null;

  const hits: AgeCelebration[] = [];

  for (const weeks of [1, 2]) {
    if (isSameDay(addDays(birth, weeks * 7), now)) {
      hits.push({ id: `w${weeks}`, kind: "week", amount: weeks });
    }
  }

  for (let months = 1; months <= 11; months++) {
    if (isSameDay(addMonths(birth, months), now)) {
      hits.push({ id: `m${months}`, kind: "month", amount: months });
    }
  }

  if (isSameDay(addDays(birth, 100), now)) {
    hits.push({ id: "d100", kind: "hundred", amount: 100 });
  }

  const turning = now.getFullYear() - birth.getFullYear();
  if (turning >= 1 && isSameDay(addYears(birth, turning), now)) {
    hits.push({ id: `y${turning}`, kind: "year", amount: turning });
  }

  hits.sort((a, b) => RANK[b.kind] - RANK[a.kind]);
  return hits[0] ?? null;
}

export function ageCelebrationDismissToken(celebration: AgeCelebration, today: string): string {
  return `${celebration.id}@${today}`;
}
