"use client";

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
import { SummaryChartSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { useAppStorage } from "@/hooks/use-app-storage";
import type { useSummaryLink } from "@/hooks/use-summary-link";
import type { Locale } from "@/lib/i18n/types";
import {
  countDaysMetGoal,
  formatVolume,
  formatVolumeCompact,
  getDayStatus,
  getTodayDateStr,
  getWaterForDate,
  getWaterInRange,
  getWaterPerDay,
  WATER_MIN_ML,
  type WaterDayStatus,
} from "@/lib/water";
import { cn } from "@/lib/utils";

type RangeDays = 1 | 7 | 30;

function dayStatusLabel(
  status: WaterDayStatus,
  t: ReturnType<typeof useLocale>["t"],
) {
  if (status === "low") return t("water.status.low");
  if (status === "good") return t("water.status.good");
  if (status === "above") return t("water.status.above");
  return t("water.status.empty");
}

function dateFnsLocale(locale: Locale) {
  return locale === "id" ? idLocale : enUS;
}

const barColorByStatus = {
  empty: "bg-muted-foreground/20",
  low: "bg-amber-500",
  good: "bg-emerald-500",
  above: "bg-sky-500",
} as const;

export function WaterSummary({
  compact = false,
  link,
}: {
  compact?: boolean;
  link: ReturnType<typeof useSummaryLink>;
}) {
  const { data, mounted } = useAppStorage();
  const { locale, t } = useLocale();
  const pending = useRemoteDataPending();
  const range: RangeDays = compact ? 7 : link.range;

  if (!mounted || pending) return <SummaryChartSkeleton />;

  const entries = data?.water.entries ?? [];
  const today = getTodayDateStr();
  const chartDays = range === 1 ? 7 : range;
  const perDay = range === 1 ? [] : getWaterPerDay(entries, chartDays, new Date(), locale);
  const maxMl = Math.max(...perDay.map((d) => d.totalMl), WATER_MIN_ML);
  const dayEntries = getWaterForDate(entries, link.day);
  const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.amountMl, 0);
  const inRange = range === 1 ? dayEntries : getWaterInRange(entries, range);
  const totalMlInRange = range === 1 ? dayTotal : inRange.reduce((sum, entry) => sum + entry.amountMl, 0);
  const daysMetGoal = countDaysMetGoal(perDay);
  const hasChartData = perDay.some((d) => d.totalMl > 0);
  const dfLocale = dateFnsLocale(locale);
  const dateLabel = format(parseISO(link.day), "d MMM", { locale: dfLocale });
  const totalCaption =
    range === 1
      ? link.day === today
        ? t("water.totalToday")
        : t("water.totalOnDay", { date: dateLabel })
      : t("water.totalInRange", { count: range });

  const chartFrom = perDay[0]
    ? format(parseISO(perDay[0].date), "d MMM", { locale: dfLocale })
    : "";
  const chartTo = perDay[perDay.length - 1]
    ? format(parseISO(perDay[perDay.length - 1].date), "d MMM yyyy", {
        locale: dfLocale,
      })
    : "";

  return (
    <Card className="rounded-2xl shadow-sm">
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
          <div className="flex gap-1 rounded-full bg-white/45 p-1 ring-1 ring-white/70">
            {(compact ? ([7, 30] as RangeDays[]) : ([1, 7, 30] as RangeDays[])).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => link.setRange(days)}
                className={cn(
                  "min-h-9 flex-1 rounded-full text-sm font-semibold transition-all",
                  range === days
                    ? "bg-lilac-deep text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-white/55",
                )}
              >
                {days === 1
                  ? link.day === today
                    ? t("common.today")
                    : dateLabel
                  : t("water.rangeDays", { count: days })}
              </button>
            ))}
          </div>
          {range === 1 ? null : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("water.rangeHint")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-lilac/35 px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {formatVolume(totalMlInRange, locale)}
            </p>
            <p className="text-xs text-muted-foreground">{totalCaption}</p>
          </div>
          {range === 1 ? (
            <div className="rounded-xl bg-lilac/20 px-3 py-3 text-center">
              <p className="text-lg font-bold">{dayStatusLabel(getDayStatus(dayTotal), t)}</p>
              <p className="text-xs text-muted-foreground">
                {t("water.goalMin", { amount: formatVolume(WATER_MIN_ML, locale) })}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-lilac/20 px-3 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {daysMetGoal}
                <span className="text-lg font-medium text-muted-foreground">/{chartDays}</span>
              </p>
              <p className="text-xs text-muted-foreground">{t("water.daysMetGoal")}</p>
            </div>
          )}
        </div>

        {range === 1 && dayTotal === 0 && entries.length > 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("water.emptyDay")}</p>
        ) : null}

        {range === 1 ? null : (
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
        )}

        {entries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("water.logToSeePatterns")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
