"use client";

import { useEffect, useState } from "react";
import {
  formatLiveClockLine,
  getTimeOfDayGreeting,
} from "@/lib/greeting-utils";
import { cn } from "@/lib/utils";

type LiveGreetingClockProps = {
  className?: string;
};

export function LiveGreetingClock({ className }: LiveGreetingClockProps) {
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

  const greeting = now ? getTimeOfDayGreeting(now) : null;
  const clockLine = now ? formatLiveClockLine(now) : null;

  return (
    <div
      className={cn("space-y-0.5 ml-4", className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
        {greeting ? (
          <>
            {greeting.message} {greeting.emoji}
          </>
        ) : (
          <span className="invisible" aria-hidden>
            Good Morning ☀️
          </span>
        )}
      </p>
      <p className="text-sm font-medium text-muted-foreground">
        {clockLine ?? (
          <span className="invisible" aria-hidden>
            00:00 AM • Monday
          </span>
        )}
      </p>
    </div>
  );
}
