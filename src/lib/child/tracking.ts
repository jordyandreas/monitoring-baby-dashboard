import { differenceInMonths, isValid, parseISO } from "date-fns";
import type { ChildProfile, EliminationMode } from "@/lib/child/types";

export const FOOD_VISIBLE_MONTHS = 6;
export const POTTY_VISIBLE_MONTHS = 18;

export function childAgeMonths(birthDate: string, now = new Date()): number | null {
  const birth = parseISO(birthDate);
  if (!isValid(birth)) return null;
  const months = differenceInMonths(now, birth);
  if (months < 0) return null;
  return months;
}

export function foodVisible(profile: ChildProfile | null, now = new Date()): boolean {
  if (!profile) return false;
  if (profile.foodTracking === "on") return true;
  if (profile.foodTracking === "off") return false;
  const months = childAgeMonths(profile.birthDate, now);
  return months !== null && months >= FOOD_VISIBLE_MONTHS;
}

export function eliminationMode(profile: ChildProfile | null, now = new Date()): EliminationMode {
  if (!profile) return "diaper";
  if (profile.eliminationTracking === "potty") return "potty";
  if (profile.eliminationTracking === "diaper") return "diaper";
  const months = childAgeMonths(profile.birthDate, now);
  return months !== null && months >= POTTY_VISIBLE_MONTHS ? "potty" : "diaper";
}
