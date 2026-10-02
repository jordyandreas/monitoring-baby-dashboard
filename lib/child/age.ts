import { differenceInCalendarDays, differenceInMonths, isValid, parseISO } from "date-fns";

export function childAgeWeeks(birthDate: string, now = new Date()): number | null {
  const birth = parseISO(birthDate);
  if (!isValid(birth)) return null;
  const days = differenceInCalendarDays(now, birth);
  if (days < 0) return null;
  return Math.floor(days / 7);
}

export type ChildStage = "newborn" | "infant" | "toddler";

export function getChildStage(birthDate: string, now = new Date()): ChildStage | null {
  const birth = parseISO(birthDate);
  if (!isValid(birth)) return null;
  const months = differenceInMonths(now, birth);
  if (months < 3) return "newborn";
  if (months < 12) return "infant";
  return "toddler";
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function formatChildAge(birthDate: string, t: Translate, now = new Date()): string {
  const birth = parseISO(birthDate);
  if (!isValid(birth)) return "";
  const days = differenceInCalendarDays(now, birth);
  if (days < 0) return t("child.ageUpcoming");
  if (days < 31) return t("child.ageDays", { days });
  const months = Math.max(0, differenceInMonths(now, birth));
  if (months < 24) return t("child.ageMonths", { months });
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (remainder === 0) return t("child.ageYears", { years });
  return t("child.ageYearsMonths", { years, months: remainder });
}
