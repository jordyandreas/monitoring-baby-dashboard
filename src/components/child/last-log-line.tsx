import type { LastLogStatus } from "@/lib/child/summary";

export function LastLogLine({ items }: { items: LastLogStatus[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.label}-${item.time}`} className="rounded-2xl bg-lilac/60 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs text-lilac-foreground/70">{item.label}</p>
            {item.ago ? <p className="text-xs font-medium text-lilac-foreground">{item.ago}</p> : null}
          </div>
          <p className="mt-0.5 text-lg font-semibold leading-tight text-lilac-foreground">{item.time}</p>
          {item.details.length > 0 ? (
            <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-lilac-foreground/80">
              {item.details.map((part) => (
                <span key={part}>{part}</span>
              ))}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
