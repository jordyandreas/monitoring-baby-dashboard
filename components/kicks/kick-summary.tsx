"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { Activity } from "lucide-react";
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
import { kickCountLabel } from "@/lib/i18n/kicks";
import type { Locale } from "@/lib/i18n/types";
import {
  getKicksInRange,
  getKicksPerDay,
  getTopHours,
} from "@/lib/kicks";
import { cn } from "@/lib/utils";

type RangeDays = 7 | 30;

function dateFnsLocale(locale: Locale) {
  return locale === "id" ? idLocale : enUS;
}

export function KickSummary({ compact = false }: { compact?: boolean }) {
  const { data, mounted } = useAppStorage();
  const { locale, t } = useLocale();
  const [range, setRange] = useState<RangeDays>(7);

  if (!mounted) return <LoadingCard />;

  const kicks = data?.kicks ?? [];
  const chartDays = compact ? 7 : range;
  const perDay = getKicksPerDay(kicks, chartDays, new Date(), locale);
  const maxCount = Math.max(...perDay.map((d) => d.count), 1);
  const totalInRange = getKicksInRange(kicks, range).length;
  const topHours = getTopHours(kicks, range);
  const hasChartData = perDay.some((d) => d.count > 0);
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
        compact
          ? "bg-gradient-to-br from-mint/20 to-card"
          : "bg-card",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="size-5 text-lilac-deep" />
          {t("kicks.summaryTitle")}
        </CardTitle>
        {!compact && (
          <CardDescription>{t("kicks.summarySubtitle")}</CardDescription>
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
                {t("kicks.rangeDays", { count: days })}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("kicks.rangeHint")}
          </p>
        </div>

        <div className="rounded-xl bg-lilac/35 px-4 py-3 text-center">
          <p className="text-3xl font-bold text-foreground">{totalInRange}</p>
          <p className="text-sm text-muted-foreground">
            {t("kicks.kicksInRange", { count: range })}
          </p>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("kicks.dailyActivity")}
            </p>
            {chartFrom && chartTo && (
              <p className="text-xs text-muted-foreground">
                {t("kicks.chartDateRange", { from: chartFrom, to: chartTo })}
              </p>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("kicks.dailyActivityHint")}
          </p>
          <div
            className="rounded-xl border border-border/50 bg-muted/20 px-2 pb-2 pt-3"
            role="img"
            aria-label={t("kicks.dailyActivity")}
          >
            {!hasChartData && (
              <p className="mb-2 px-1 text-center text-xs text-muted-foreground">
                {t("kicks.chartEmptyPeriod")}
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
                  day.count > 0
                    ? Math.max(Math.round((day.count / maxCount) * 72), 12)
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
                      title={day.fullLabel}
                      aria-label={t("kicks.barAriaLabel", {
                        count: day.count,
                        date: day.fullLabel,
                      })}
                    >
                      {day.count > 0 && (
                        <span
                          className={cn(
                            "mb-0.5 font-semibold tabular-nums text-lilac-deep",
                            chartDays > 7 ? "text-[8px]" : "text-[10px]",
                          )}
                        >
                          {day.count}
                        </span>
                      )}
                      <div
                        className={cn(
                          "w-full rounded-t-sm bg-lilac-deep transition-colors",
                          day.count > 0 ? "opacity-100" : "opacity-15",
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
          </div>
        </div>

        {topHours.length > 0 && (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("kicks.mostActive")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("kicks.mostActiveHint")}
              </p>
            </div>
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
                    {kickCountLabel(slot.count, t)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {kicks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("kicks.logToSeePatterns")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
