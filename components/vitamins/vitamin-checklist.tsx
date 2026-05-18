"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  countCompleted,
  getNamedVitamins,
} from "@/lib/vitamins";
import type { VitaminDayRecord, VitaminItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VitaminChecklistProps {
  title: string;
  subtitle: string;
  record: VitaminDayRecord;
  items: VitaminItem[];
  onToggle: (vitaminId: string, checked: boolean) => void;
  muted?: boolean;
}

export function VitaminChecklist({
  title,
  subtitle,
  record,
  items,
  onToggle,
  muted = false,
}: VitaminChecklistProps) {
  const named = getNamedVitamins(items);
  const done = countCompleted(items, record.completed);
  const total = named.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  if (total === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm",
        muted && "opacity-90",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-lilac-foreground">
          {done}/{total}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <ul className="space-y-2">
        {named.map((vitamin) => {
          const checked = !!record.completed[vitamin.id];
          return (
            <li
              key={vitamin.id}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                checked && "border-lilac-deep/30 bg-lilac/25",
              )}
            >
              <Checkbox
                id={`${record.date}-${vitamin.id}`}
                checked={checked}
                onCheckedChange={(value) =>
                  onToggle(vitamin.id, value === true)
                }
              />
              <label
                htmlFor={`${record.date}-${vitamin.id}`}
                className="flex-1 cursor-pointer text-sm font-medium"
              >
                {vitamin.name}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
