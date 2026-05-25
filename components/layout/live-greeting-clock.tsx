"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import {
  formatLiveClockLine,
  getTimeOfDayGreeting,
} from "@/lib/i18n/greeting";
import { cn } from "@/lib/utils";

type LiveGreetingClockProps = {
  className?: string;
};

export function LiveGreetingClock({ className }: LiveGreetingClockProps) {
  const { locale, t } = useLocale();
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

  const greeting = now ? getTimeOfDayGreeting(now, t) : null;
  const clockLine = now ? formatLiveClockLine(now, locale) : null;

  return (
    <div
      className={cn("ml-4 space-y-0.5", className)}
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
            {t("greeting.goodMorning")} ☀️
          </span>
        )}
      </p>
      <p className="text-sm font-medium text-muted-foreground">
        {clockLine ?? (
          <span className="invisible" aria-hidden>
            00:00 • Monday
          </span>
        )}
      </p>
    </div>
  );
}
