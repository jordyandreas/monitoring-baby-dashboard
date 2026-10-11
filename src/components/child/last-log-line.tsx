import { Children, type ReactNode } from "react";
import type { LastLogStatus } from "@/lib/child/summary";
import { cn } from "@/utils/cn";

export function SideBySide({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  if (items.length === 1) return <>{items}</>;
  return <div className="grid grid-cols-2 items-stretch gap-2">{items}</div>;
}

function LastLogCard({ item, pair }: { item: LastLogStatus; pair: boolean }) {
  return (
    <div className="h-full min-w-0 rounded-2xl bg-lilac/60 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-lilac-foreground/70">{item.label}</p>
        {item.ago && !pair ? (
          <p className="hidden text-xs font-medium text-lilac-foreground sm:block">{item.ago}</p>
        ) : null}
      </div>
      <p className="mt-0.5 text-lg font-semibold leading-tight text-lilac-foreground">{item.time}</p>
      {item.ago ? (
        <p className={cn("mt-1 text-xs font-medium text-lilac-foreground", !pair && "sm:hidden")}>{item.ago}</p>
      ) : null}
      {item.details.length > 0 ? (
        <p className="mt-1 text-sm text-lilac-foreground/80">{item.details.join(" · ")}</p>
      ) : null}
    </div>
  );
}

export function LastLogLine({ items }: { items: LastLogStatus[] }) {
  if (items.length === 0) return null;
  const pair = items.length > 1;
  return (
    <div className={cn("h-full w-full", pair && "grid grid-cols-2 items-stretch gap-2")}>
      {items.map((item) => (
        <LastLogCard key={`${item.label}-${item.time}`} item={item} pair={pair} />
      ))}
    </div>
  );
}
