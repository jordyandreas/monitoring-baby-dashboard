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
import { remotePlaceholder, SummaryChartSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { ActivityAreaChart } from "@/components/summary/activity-area-chart";
import { SummaryRangeControl } from "@/components/summary/summary-range-control";
import { useRemote } from "@/hooks/use-remote";
import type { useSummaryLink } from "@/hooks/use-summary-link";
import { kickCountLabel } from "@/lib/i18n/kicks";
import type { Locale } from "@/lib/i18n/types";
import {
  formatHourLabel,
  getKicksBetween,
  getKicksForDate,
  getKicksInRange,
  getKicksPerDay,
  getKicksPerDayBetween,
  getTodayDateStr,
  getTopHours,
  getTopHoursBetween,
} from "@/lib/pregnancy/kicks";
import type { KickEntry } from "@/lib/pregnancy/types";
import { listKicks } from "@/services/kicks.service";

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
  const { data, ready, error, reload } = useRemote("kicks", listKicks, signedIn);
  const { locale, t } = useLocale();
  const range = compact && link.range === 1 ? 7 : link.range;
  const presets = compact ? ([7, 30] as const) : ([1, 7, 30] as const);

  const placeholder = remotePlaceholder(ready, error, data, reload, <SummaryChartSkeleton />);
  if (placeholder) return placeholder;

  const kicks = data ?? [];
  const today = getTodayDateStr();
  const dfLocale = dateFnsLocale(locale);
  const dateLabel = format(parseISO(link.day), "d MMM", { locale: dfLocale });
  const customReady = Boolean(link.customFrom && link.customTo);

  const perDay =
    range === 1
      ? []
      : range === "custom"
        ? customReady
          ? getKicksPerDayBetween(kicks, link.customFrom, link.customTo, new Date(), locale)
          : []
        : getKicksPerDay(kicks, range, new Date(), locale);

  const maxCount = Math.max(...perDay.map((d) => d.count), 1);
  const dayCount = getKicksForDate(kicks, link.day).length;
  const totalInRange =
    range === 1
      ? dayCount
      : range === "custom"
        ? customReady
          ? getKicksBetween(kicks, link.customFrom, link.customTo).length
          : 0
        : getKicksInRange(kicks, range).length;
  const topHours =
    range === 1
      ? topHoursOnDate(kicks, link.day)
      : range === "custom"
        ? customReady
          ? getTopHoursBetween(kicks, link.customFrom, link.customTo)
          : []
        : getTopHours(kicks, range);
  const showChart = perDay.length > 1;

  const totalCaption =
    range === "custom" && customReady
      ? t("kicks.kicksInSpan", {
          from: format(parseISO(link.customFrom), "d MMM", { locale: dfLocale }),
          to: format(parseISO(link.customTo), "d MMM yyyy", { locale: dfLocale }),
        })
      : range === 1
        ? link.day === today
          ? t("kicks.kicksToday")
          : t("kicks.kicksOnDay", { date: dateLabel })
        : range === "custom"
          ? t("kicks.kicksInSpan", { from: "—", to: "—" })
          : t("kicks.kicksInRange", { count: range });

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
        <SummaryRangeControl
          range={range}
          day={link.day}
          today={today}
          customFrom={link.customFrom}
          customTo={link.customTo}
          onRangeChange={link.setRange}
          onCustomFromChange={link.setCustomFrom}
          onCustomToChange={link.setCustomTo}
          presets={[...presets]}
        />

        <div className="rounded-xl bg-lilac/35 px-4 py-3 text-center">
          <p className="text-3xl font-bold text-foreground">{totalInRange}</p>
          <p className="text-sm text-muted-foreground">{totalCaption}</p>
        </div>

        {!showChart && dayCount === 0 && kicks.length > 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("kicks.emptyDay")}</p>
        ) : null}

        {showChart ? (
          <ActivityAreaChart
            title={t("kicks.dailyActivity")}
            hint={t("kicks.dailyActivityHint")}
            days={perDay.map((day) => ({ ...day, value: day.count }))}
            maxValue={maxCount}
            valueLabel={(value) => String(value)}
            ariaLabel={(value, date) => t("kicks.barAriaLabel", { count: value, date })}
            locale={locale}
          />
        ) : null}

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
