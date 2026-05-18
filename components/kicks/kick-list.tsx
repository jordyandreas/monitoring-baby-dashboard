"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { KickDateStrip } from "@/components/kicks/kick-date-strip";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  formatKickTime,
  getKickDateStrip,
  getKicksForDate,
  getTodayDateStr,
} from "@/lib/kicks";

export function KickList() {
  const { data, mounted, removeKick } = useAppStorage();
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);
  const [kickToDelete, setKickToDelete] = useState<string | null>(null);

  const kicks = data?.kicks ?? [];
  const dateStrip = getKickDateStrip(kicks);
  const entries = getKicksForDate(kicks, selectedDate);
  const selectedLabel = format(parseISO(selectedDate), "EEEE, d MMMM yyyy");

  if (!mounted) return null;

  if (kicks.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
        No kicks logged yet. Tap the button above when you feel movement!
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <KickDateStrip
        days={dateStrip}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {selectedLabel}
          </p>
          <p className="shrink-0 text-sm font-semibold text-foreground">
            {entries.length} kick{entries.length === 1 ? "" : "s"}
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No kicks logged on this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((kick) => (
              <li
                key={kick.id}
                className="flex min-h-11 items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2 shadow-sm"
              >
                <span className="font-medium">{formatKickTime(kick.time)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setKickToDelete(kick.id)}
                  aria-label="Delete kick"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={kickToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setKickToDelete(null);
        }}
        description="Delete this kick log? This cannot be undone."
        onConfirm={() => {
          if (kickToDelete) removeKick(kickToDelete);
        }}
        confirmVariant="destructive"
      />
    </div>
  );
}
