import { cn } from "@/lib/utils";

export const headerIconButtonClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card text-foreground shadow-sm transition-colors hover:bg-muted/40";

export function headerIconButtonClassName(className?: string) {
  return cn(headerIconButtonClass, className);
}
