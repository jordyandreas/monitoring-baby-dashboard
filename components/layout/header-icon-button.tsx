import { cn } from "@/lib/utils";

export const headerIconButtonClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/50 text-foreground shadow-sm ring-1 ring-white/70 transition-colors hover:bg-white/80";

export function headerIconButtonClassName(className?: string) {
  return cn(headerIconButtonClass, className);
}
