"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { Droplets } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingCard } from "@/components/layout/loading-card";
import { useLocale } from "@/components/providers/locale-provider";
import { useAppStorage } from "@/hooks/use-app-storage";
import type { Locale } from "@/lib/i18n/types";
import {
  countDaysMetGoal,
  formatVolume,
  formatVolumeCompact,
  getWaterInRange,
  getWaterPerDay,
  WATER_MIN_ML,
} from "@/lib/water";
import { cn } from "@/lib/utils";

type RangeDays = 7 | 30;

function dateFnsLocale(locale: Locale) {
  return locale === "id" ? idLocale : enUS;
}

const barColorByStatus = {
  empty: "bg-muted-foreground/20",
  low: "bg-amber-500",
  good: "bg-emerald-500",
  above: "bg-sky-500",
} as const;

export function WaterSummary({ compact = false }: { compact?: boolean }) {
  const { data, mounted } = useAppStorage();
  const { locale, t } = useLocale();
  const [range, setRange] = useState<RangeDays>(7);

  if (!mounted) return <LoadingCard />;

  const entries = data?.water.entries ?? [];
  const chartDays = compact ? 7 : range;
  const perDay = getWaterPerDay(entries, chartDays, new Date(), locale);
  const maxMl = Math.max(...perDay.map((d) => d.totalMl), WATER_MIN_ML);
  const inRange = getWaterInRange(entries, range);
  const totalMlInRange = inRange.reduce((sum, e) => sum + e.amountMl, 0);
  const daysMetGoal = countDaysMetGoal(perDay);
  const hasChartData = perDay.some((d) => d.totalMl > 0);
  const dfLocale = dateFnsLocale(locale);

  const chartFrom = perDay[0]
    ? format(parseISO(perDay[0].date), "d MMM", { locale: dfLocale })
    : "";
  const chartTo = perDay[perDay.length - 1]
    ? format(parseISO(perDay[perDay.length - 1].date), "d MMM yyyy", {
        locale: dfLocale,
      })
    : "";

  return (
    <Card
      className={cn(
        "rounded-2xl border-border/60 shadow-sm",
        compact ? "bg-gradient-to-br from-mint/20 to-card" : "bg-card",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Droplets className="size-5 text-lilac-deep" />
          {t("water.summaryTitle")}
        </CardTitle>
        {!compact && (
          <CardDescription>{t("water.summarySubtitle")}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
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
                {t("water.rangeDays", { count: days })}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("water.rangeHint")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-lilac/35 px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {formatVolume(totalMlInRange, locale)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("water.totalInRange", { count: range })}
            </p>
          </div>
          <div className="rounded-xl bg-lilac/20 px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {daysMetGoal}
              <span className="text-lg font-medium text-muted-foreground">
                /{chartDays}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("water.daysMetGoal")}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("water.dailyActivity")}
            </p>
            {chartFrom && chartTo && (
              <p className="text-xs text-muted-foreground">
                {t("water.chartDateRange", { from: chartFrom, to: chartTo })}
              </p>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("water.dailyActivityHintLead")}{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-500">
              {t("water.dailyActivityHintGreen")}
            </span>
            {t("water.dailyActivityHintBelow")}{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-500">
              {t("water.dailyActivityHintAmber")}
            </span>
            {t("water.dailyActivityHintOver")}{" "}
            <span className="font-semibold text-sky-600 dark:text-sky-500">
              {t("water.dailyActivityHintBlue")}
            </span>
            .
          </p>
          <div
            className="rounded-xl border border-border/50 bg-muted/20 px-2 pb-2 pt-3"
            role="img"
            aria-label={t("water.dailyActivity")}
          >
            {!hasChartData && (
              <p className="mb-2 px-1 text-center text-xs text-muted-foreground">
                {t("water.chartEmptyPeriod")}
              </p>
            )}
            <div
              className={cn(
                "flex items-end justify-between gap-0.5",
                chartDays > 7 ? "h-24 gap-px" : "h-28 gap-1",
              )}
            >
              {perDay.map((day) => {
                const barHeight =
                  day.totalMl > 0
                    ? Math.max(Math.round((day.totalMl / maxMl) * 72), 12)
                    : 4;

                return (
                  <div
                    key={day.date}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className={cn(
                        "relative flex w-full flex-col items-center justify-end",
                        chartDays > 7 ? "max-w-4" : "max-w-8",
                      )}
                      style={{ height: 80 }}
                      title={`${day.fullLabel}: ${formatVolume(day.totalMl, locale)}`}
                      aria-label={t("water.barAriaLabel", {
                        amount: formatVolume(day.totalMl, locale),
                        date: day.fullLabel,
                      })}
                    >
                      {day.totalMl > 0 && (
                        <span
                          className={cn(
                            "mb-0.5 font-semibold tabular-nums text-lilac-deep",
                            chartDays > 7 ? "text-[8px]" : "text-[10px]",
                          )}
                        >
                          {formatVolumeCompact(day.totalMl)}
                        </span>
                      )}
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-colors",
                          barColorByStatus[day.status],
                          day.totalMl > 0 ? "opacity-100" : "opacity-30",
                        )}
                        style={{ height: barHeight }}
                      />
                    </div>
                    <span
                      className={cn(
                        "max-w-full truncate text-center font-medium text-muted-foreground",
                        chartDays > 7 ? "text-[8px]" : "text-[10px]",
                        day.isToday && "font-semibold text-lilac-deep",
                      )}
                    >
                      {day.isToday ? t("common.today") : day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              {t("water.chartGoalLine", {
                min: formatVolume(WATER_MIN_ML, locale),
              })}
            </p>
          </div>
        </div>

        {entries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("water.logToSeePatterns")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
