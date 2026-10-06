"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import {
  formatLiveClockParts,
  getTimeOfDayGreeting,
} from "@/lib/i18n/greeting";
import { cn } from "@/utils/cn";

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
  const clock = now ? formatLiveClockParts(now, locale) : null;

  return (
    <div
      className={cn("min-w-0 space-y-1", className)}
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
      <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {clock?.time ?? (
            <span className="invisible" aria-hidden>
              00:00
            </span>
          )}
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          {clock?.date ?? (
            <span className="invisible" aria-hidden>
              {locale === "id" ? "Senin, 1 Januari 2026" : "Monday, January 1, 2026"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
