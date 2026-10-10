import { Children, type ReactNode } from "react";
import type { LastLogStatus } from "@/lib/child/summary";

export function SideBySide({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  if (items.length === 1) return <>{items}</>;
  return <div className="grid grid-cols-2 items-stretch gap-2">{items}</div>;
}

export function LastLogLine({ items }: { items: LastLogStatus[] }) {
  if (items.length === 0) return null;
  return (
    <div className="h-full space-y-2">
      {items.map((item) => (
        <div key={`${item.label}-${item.time}`} className="h-full rounded-2xl bg-lilac/60 px-4 py-3 text-lilac-foreground">
          <p className="text-xs text-lilac-foreground/70">{item.label}</p>
          <p className="mt-0.5 text-lg font-semibold leading-tight">{item.time}</p>
          {item.ago ? <p className="mt-1 text-xs font-medium">{item.ago}</p> : null}
          {item.details.length > 0 ? (
            <p className="mt-1 text-sm text-lilac-foreground/80">{item.details.join(" · ")}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
