import { addDays, addYears, subMonths } from "date-fns";
import { parseDateString, toDateString } from "@/lib/date-utils";

/** Naegele's rule: LMP + 7 days − 3 months + 1 year (ACOG / standard obstetric estimate). */
export function calculateDueDateFromLmp(lmpDate: string): string {
  const lmp = parseDateString(lmpDate);
  if (!lmp) return "";
  const due = addYears(subMonths(addDays(lmp, 7), 3), 1);
  return toDateString(due);
}
