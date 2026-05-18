import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Gender } from "./types";

export function getDueDateCountdown(dueDate: string): string {
  const due = parseISO(dueDate);
  const today = new Date();
  const days = differenceInCalendarDays(due, today);

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} until due date`;
  if (days === 0) return "Due date is today!";
  const past = Math.abs(days);
  return `${past} day${past === 1 ? "" : "s"} past due date`;
}

export function formatDueDate(dueDate: string): string {
  return format(parseISO(dueDate), "MMMM d, yyyy");
}

export function genderLabel(gender: Gender): string {
  switch (gender) {
    case "boy":
      return "Boy";
    case "girl":
      return "Girl";
    default:
      return "Not yet";
  }
}

export function genderBadgeClass(gender: Gender): string {
  switch (gender) {
    case "boy":
      return "bg-sky/40 text-sky-foreground border-sky/60";
    case "girl":
      return "bg-lilac/50 text-lilac-foreground border-lilac/70";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
