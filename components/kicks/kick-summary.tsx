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
                "min-h-9 flex-1 rounded-full text-sm font-semibold transition-colors",
                range === days
                  ? "bg-lilac/60 text-lilac-foreground"
                  : "bg-muted text-muted-foreground",
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
          <div className="flex h-24 items-end justify-between gap-1">
            {perDay.map((day) => (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t-md bg-lilac-deep/70 transition-all"
                  style={{
                    height: `${Math.max((day.count / maxCount) * 100, day.count > 0 ? 8 : 2)}%`,
                  }}
                  title={`${day.count} kicks`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {day.label.split(" ")[1]}
                </span>
              </div>
            ))}
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
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-sky"
                      style={{
                        width: `${(slot.count / (topHours[0]?.count ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">
                    {slot.count}
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
