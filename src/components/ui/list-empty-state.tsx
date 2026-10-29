import type { ComponentType, ReactNode } from "react";
import { cn } from "@/utils/cn";

export function ListEmptyState({
  icon: Icon,
  label,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/60 px-4 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-background/80 text-muted-foreground ring-1 ring-border/50">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <div className="max-w-xs text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
