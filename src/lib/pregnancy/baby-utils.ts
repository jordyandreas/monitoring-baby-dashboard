import { HelpCircle, Mars, Venus, type LucideIcon } from "lucide-react";
import type { Gender } from "./types";

export {
  formatDueDate,
  genderLabel,
  getBabyGreeting,
  getDueDateCountdown,
  getPregnancyProgress,
  type PregnancyProgress,
} from "@/lib/i18n/baby";

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
