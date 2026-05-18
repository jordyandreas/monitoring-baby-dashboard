import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { HelpCircle, Mars, Venus, type LucideIcon } from "lucide-react";
import type { Gender } from "./types";

const TOTAL_PREGNANCY_DAYS = 280; // 40 weeks from LMP to due date

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

export function getGenderIcon(gender: Gender): LucideIcon {
  switch (gender) {
    case "boy":
      return Mars;
    case "girl":
      return Venus;
    default:
      return HelpCircle;
  }
}

export interface PregnancyProgress {
  weeks: number;
  days: number;
  label: string;
  weekDisplay: string;
  isPastDue: boolean;
}

export function getPregnancyProgress(dueDate: string): PregnancyProgress {
  const due = startOfDay(parseISO(dueDate));
  const today = startOfDay(new Date());
  const daysUntilDue = differenceInCalendarDays(due, today);
  const gestationalDays = TOTAL_PREGNANCY_DAYS - daysUntilDue;

  if (gestationalDays < 0) {
    const over = Math.abs(gestationalDays);
    const totalDays = TOTAL_PREGNANCY_DAYS + over;
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    return {
      weeks,
      days,
      label:
        days > 0
          ? `${weeks} weeks, ${days} day${days === 1 ? "" : "s"} (past due)`
          : `${weeks} weeks (past due)`,
      weekDisplay: `Week ${weeks}`,
      isPastDue: true,
    };
  }

  if (gestationalDays > TOTAL_PREGNANCY_DAYS) {
    return {
      weeks: 0,
      days: 0,
      label: "Due date is more than 40 weeks away",
      weekDisplay: "—",
      isPastDue: false,
    };
  }

  const weeks = Math.floor(gestationalDays / 7);
  const days = gestationalDays % 7;

  const label =
    days > 0
      ? `${weeks} weeks, ${days} day${days === 1 ? "" : "s"} pregnant`
      : `${weeks} week${weeks === 1 ? "" : "s"} pregnant`;

  return {
    weeks,
    days,
    label,
    weekDisplay: days > 0 ? `Week ${weeks}+${days}` : `Week ${weeks}`,
    isPastDue: false,
  };
}

export function getBabyGreeting(name: string, gender: Gender): string {
  const trimmed = name.trim();
  if (!trimmed) return "We can't wait to meet your little one.";

  switch (gender) {
    case "boy":
      return `Hi Baby ${trimmed}. We can't wait to meet you, little one.`;
    case "girl":
      return `Hi Baby ${trimmed}. We can't wait to meet you, sweetheart.`;
    default:
      return `Hi Baby ${trimmed}. We can't wait to see you.`;
  }
}
