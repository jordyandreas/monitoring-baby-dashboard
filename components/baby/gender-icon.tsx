import { HelpCircle, Mars, Venus } from "lucide-react";
import type { Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GenderIcon({
  gender,
  className,
}: {
  gender: Gender;
  className?: string;
}) {
  const iconClassName = cn("shrink-0", className);

  switch (gender) {
    case "boy":
      return <Mars className={iconClassName} aria-hidden />;
    case "girl":
      return <Venus className={iconClassName} aria-hidden />;
    default:
      return <HelpCircle className={iconClassName} aria-hidden />;
  }
}
