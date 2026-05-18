"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingCard } from "@/components/layout/loading-card";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  getKicksInRange,
  getKicksPerDay,
  getTopHours,
} from "@/lib/kicks";
import { cn } from "@/lib/utils";

type RangeDays = 7 | 30;

export function KickSummary({ compact = false }: { compact?: boolean }) {
  const { data, mounted } = useAppStorage();
  const [range, setRange] = useState<RangeDays>(7);

  if (!mounted) return <LoadingCard />;

  const kicks = data?.kicks ?? [];
  const chartDays = compact ? 7 : 14;
  const perDay = getKicksPerDay(kicks, chartDays);
  const maxCount = Math.max(...perDay.map((d) => d.count), 1);
  const totalInRange = getKicksInRange(kicks, range).length;
  const topHours = getTopHours(kicks, range);

  return (
    <Card
      className={cn(
        "rounded-2xl border-border/60 shadow-sm",
        compact
          ? "bg-gradient-to-br from-mint/20 to-card"
          : "bg-card",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="size-5 text-lilac-deep" />
          Kick summary
        </CardTitle>
        {!compact && (
          <CardDescription>
            Track patterns to learn when your baby moves most
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2">
          {([7, 30] as RangeDays[]).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              className={cn(
                "min-h-9 flex-1 rounded-full text-sm font-semibold transition-all",
                range === days
                  ? "bg-lilac-deep text-primary-foreground shadow-md"
                  : "border border-border/80 bg-card text-muted-foreground hover:bg-muted/60",
              )}
            >
              {days} days
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-lilac/35 px-4 py-3 text-center">
          <p className="text-3xl font-bold text-foreground">{totalInRange}</p>
          <p className="text-sm text-muted-foreground">
            kicks in the last {range} days
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Daily activity (last {chartDays} days)
          </p>
          <div className="rounded-xl border border-border/50 bg-muted/20 px-2 pb-2 pt-3">
            <div className="flex h-28 items-end justify-between gap-1.5">
              {perDay.map((day) => {
                const barHeight =
                  day.count > 0
                    ? Math.max(Math.round((day.count / maxCount) * 88), 10)
                    : 4;

                return (
                  <div
                    key={day.date}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="group relative flex w-full max-w-7 flex-col justify-end"
                      style={{ height: 88 }}
                    >
                      {day.count > 0 && (
                        <div
                          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-lilac-deep px-2 py-1 text-[10px] font-semibold text-primary-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                          role="tooltip"
                        >
                          {day.count} kick{day.count === 1 ? "" : "s"}
                        </div>
                      )}
                      <div
                        className={cn(
                          "w-full bg-lilac-deep transition-colors group-hover:bg-[#6b5bd4]",
                          day.count > 0 ? "opacity-100" : "opacity-20",
                        )}
                        style={{ height: barHeight }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {day.label.split(" ")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {topHours.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Most active times
            </p>
            <ul className="space-y-2">
              {topHours.map((slot) => (
                <li
                  key={slot.hour}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-20 shrink-0 font-medium">{slot.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-lilac/30">
                    <div
                      className="h-full rounded-full bg-lilac-deep"
                      style={{
                        width: `${(slot.count / (topHours[0]?.count ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-right text-muted-foreground tabular-nums">
                    {slot.count} kick{slot.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {kicks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Log kicks to see your patterns here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
