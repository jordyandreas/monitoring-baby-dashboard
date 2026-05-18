"use client";

import { useEffect, useState } from "react";
import {
  getTodayListeningStatus,
  type TodayListeningStatus,
} from "@/lib/baby-plus";
import { formatTimeAmPm } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

type TodayListeningStatusProps = {
  startDate: Date;
  dailyTime: string;
  completions: Record<string, boolean>;
  className?: string;
};

export function TodayListeningStatus({
  startDate,
  dailyTime,
  completions,
  className,
}: TodayListeningStatusProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1000);
    const initial = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(initial);
    };
  }, []);

  const status: TodayListeningStatus | null = now
    ? getTodayListeningStatus(startDate, dailyTime, completions, now)
    : null;

  return (
    <p
      className={cn(
        "rounded-xl px-3 py-2 text-sm",
        !status && "invisible",
        status?.kind === "before-program" && "bg-muted",
        status?.kind === "after-program" &&
          "bg-mint/40 font-medium text-mint-foreground",
        status?.kind === "active" &&
          status.phase === "waiting" &&
          "bg-muted font-medium text-muted-foreground",
        status?.kind === "active" &&
          status.phase === "ready" &&
          "bg-lilac/40 font-medium text-lilac-foreground",
        status?.kind === "active" &&
          status.phase === "done" &&
          "bg-mint/30 font-medium text-mint-foreground",
        className,
      )}
      aria-live="polite"
    >
      {status ? renderMessage(status, dailyTime) : " "}
    </p>
  );
}

function renderMessage(
  status: TodayListeningStatus,
  dailyTime: string,
): string {
  if (status.kind === "before-program") {
    return "Program starts soon — get ready!";
  }

  if (status.kind === "after-program") {
    return "Program complete — great job!";
  }

  const sound = status.soundIndex + 1;
  const day = status.dayIndex + 1;

  if (status.phase === "done") {
    return `Done for today ✓ · Sound ${sound}, Day ${day}`;
  }

  if (status.phase === "waiting" && dailyTime) {
    return `Starts at ${formatTimeAmPm(dailyTime)} · Sound ${sound}, Day ${day}`;
  }

  if (status.phase === "ready" && dailyTime) {
    return `Time to listen · Sound ${sound}, Day ${day}`;
  }

  return `Today: Sound ${sound}, Day ${day}`;
}
