"use client";

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
import { SummaryChartSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useRemote } from "@/hooks/use-remote";
import type { useSummaryLink } from "@/hooks/use-summary-link";
import { kickCountLabel } from "@/lib/i18n/kicks";
import type { Locale } from "@/lib/i18n/types";
import {
  formatHourLabel,
  getKicksForDate,
  getKicksInRange,
  getKicksPerDay,
  getTodayDateStr,
  getTopHours,
} from "@/lib/pregnancy/kicks";
import type { KickEntry } from "@/lib/pregnancy/types";
import { listKicks } from "@/services/kicks.service";
import { cn } from "@/utils/cn";

type RangeDays = 1 | 7 | 30;

function topHoursOnDate(kicks: KickEntry[], date: string) {
  const counts = new Map<number, number>();
  for (const kick of kicks) {
    if (kick.date !== date) continue;
    const hour = Number.parseInt(kick.time.split(":")[0] ?? "", 10);
    if (hour >= 0 && hour < 24) counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([hour, count]) => ({ hour, count, label: formatHourLabel(hour) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function dateFnsLocale(locale: Locale) {
  return locale === "id" ? idLocale : enUS;
}

export function KickSummary({
  compact = false,
  link,
}: {
  compact?: boolean;
  link: ReturnType<typeof useSummaryLink>;
}) {
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("kicks", listKicks, signedIn);
  const { locale, t } = useLocale();
  const range: RangeDays = compact ? 7 : link.range;

  if (!ready) return <SummaryChartSkeleton />;

  const kicks = data ?? [];
  const today = getTodayDateStr();
  const chartDays = range === 1 ? 7 : range;
  const perDay = range === 1 ? [] : getKicksPerDay(kicks, chartDays, new Date(), locale);
  const maxCount = Math.max(...perDay.map((d) => d.count), 1);
  const dayCount = getKicksForDate(kicks, link.day).length;
  const totalInRange = range === 1 ? dayCount : getKicksInRange(kicks, range).length;
  const topHours = range === 1 ? topHoursOnDate(kicks, link.day) : getTopHours(kicks, range);
  const hasChartData = perDay.some((d) => d.count > 0);
  const dfLocale = dateFnsLocale(locale);
  const dateLabel = format(parseISO(link.day), "d MMM", { locale: dfLocale });
  const totalCaption =
    range === 1
      ? link.day === today
        ? t("kicks.kicksToday")
        : t("kicks.kicksOnDay", { date: dateLabel })
      : t("kicks.kicksInRange", { count: range });

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
          <Activity className="size-5 text-lilac-deep" />
          {t("kicks.summaryTitle")}
        </CardTitle>
        {!compact && (
          <CardDescription>{t("kicks.summarySubtitle")}</CardDescription>
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
                  : t("kicks.rangeDays", { count: days })}
              </button>
            ))}
          </div>
          {range === 1 ? null : (
            <p className="text-xs leading-relaxed text-muted-foreground">{t("kicks.rangeHint")}</p>
          )}
        </div>

        <div className="rounded-xl bg-lilac/35 px-4 py-3 text-center">
          <p className="text-3xl font-bold text-foreground">{totalInRange}</p>
          <p className="text-sm text-muted-foreground">{totalCaption}</p>
        </div>

        {range === 1 && dayCount === 0 && kicks.length > 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("kicks.emptyDay")}</p>
        ) : null}

        {range === 1 ? null : (
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
        )}

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
