"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStorage } from "@/hooks/use-app-storage";
import { formatKickTime, groupKicksByDate } from "@/lib/kicks";

export function KickList() {
  const { data, mounted, removeKick } = useAppStorage();

  if (!mounted) return null;

  const kicks = data?.kicks ?? [];
  const groups = groupKicksByDate(kicks);

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
        No kicks logged yet. Tap the button above when you feel movement!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.date}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            {group.label}
          </h3>
          <ul className="space-y-2">
            {group.entries.map((kick) => (
              <li
                key={kick.id}
                className="flex min-h-11 items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2 shadow-sm"
              >
                <span className="font-medium">{formatKickTime(kick.time)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeKick(kick.id)}
                  aria-label="Delete kick"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
