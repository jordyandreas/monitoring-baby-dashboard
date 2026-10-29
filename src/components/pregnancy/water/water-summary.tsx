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
import { remotePlaceholder, SummaryChartSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { ActivityAreaChart } from "@/components/summary/activity-area-chart";
import { SummaryRangeControl } from "@/components/summary/summary-range-control";
import { useRemote } from "@/hooks/use-remote";
import type { useSummaryLink } from "@/hooks/use-summary-link";
import type { Locale } from "@/lib/i18n/types";
import {
  countDaysMetGoal,
  formatVolume,
  formatVolumeCompact,
  getDayStatus,
  getTodayDateStr,
  getWaterBetween,
  getWaterForDate,
  getWaterInRange,
  getWaterPerDay,
  getWaterPerDayBetween,
  WATER_MIN_ML,
  type WaterDayStatus,
} from "@/lib/pregnancy/water";
import { getWater } from "@/services/water.service";

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

const pointColorByStatus = {
  empty: "var(--muted-foreground)",
  low: "#f59e0b",
  good: "#10b981",
  above: "#0ea5e9",
} as const;

export function WaterSummary({
  compact = false,
  link,
}: {
  compact?: boolean;
  link: ReturnType<typeof useSummaryLink>;
}) {
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("water", getWater, signedIn);
  const { locale, t } = useLocale();
  const range = compact && link.range === 1 ? 7 : link.range;
  const presets = compact ? ([7, 30] as const) : ([1, 7, 30] as const);

  const placeholder = remotePlaceholder(ready, error, data, reload, <SummaryChartSkeleton />);
  if (placeholder) return placeholder;

  const entries = data?.entries ?? [];
  const today = getTodayDateStr();
  const dfLocale = dateFnsLocale(locale);
  const dateLabel = format(parseISO(link.day), "d MMM", { locale: dfLocale });
  const customReady = Boolean(link.customFrom && link.customTo);

  const perDay =
    range === 1
      ? []
      : range === "custom"
        ? customReady
          ? getWaterPerDayBetween(entries, link.customFrom, link.customTo, new Date(), locale)
          : []
        : getWaterPerDay(entries, range, new Date(), locale);

  const chartDays = perDay.length;
  const maxMl = Math.max(...perDay.map((d) => d.totalMl), WATER_MIN_ML);
  const dayEntries = getWaterForDate(entries, link.day);
  const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.amountMl, 0);
  const inRange =
    range === 1
      ? dayEntries
      : range === "custom"
        ? customReady
          ? getWaterBetween(entries, link.customFrom, link.customTo)
          : []
        : getWaterInRange(entries, range);
  const totalMlInRange =
    range === 1 ? dayTotal : inRange.reduce((sum, entry) => sum + entry.amountMl, 0);
  const daysMetGoal = countDaysMetGoal(perDay);
  const showChart = perDay.length > 1;
  const statusByDate = new Map(perDay.map((day) => [day.date, day.status]));

  const totalCaption =
    range === "custom" && customReady
      ? t("water.totalInSpan", {
          from: format(parseISO(link.customFrom), "d MMM", { locale: dfLocale }),
          to: format(parseISO(link.customTo), "d MMM yyyy", { locale: dfLocale }),
        })
      : range === 1
        ? link.day === today
          ? t("water.totalToday")
          : t("water.totalOnDay", { date: dateLabel })
        : range === "custom"
          ? t("water.totalInSpan", { from: "—", to: "—" })
          : t("water.totalInRange", { count: range });

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

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-lilac/35 px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {formatVolume(totalMlInRange, locale)}
            </p>
            <p className="text-xs text-muted-foreground">{totalCaption}</p>
          </div>
          {!showChart ? (
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

        {!showChart && dayTotal === 0 && entries.length > 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("water.emptyDay")}</p>
        ) : null}

        {showChart ? (
          <div className="space-y-2">
            <ActivityAreaChart
              title={t("water.dailyActivity")}
              hint={
                <>
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
                </>
              }
              days={perDay.map((day) => ({ ...day, value: day.totalMl }))}
              maxValue={maxMl}
              valueLabel={(value) => formatVolumeCompact(value)}
              ariaLabel={(value, date) =>
                t("water.barAriaLabel", {
                  amount: formatVolume(value, locale),
                  date,
                })
              }
              locale={locale}
              pointColor={(day) =>
                pointColorByStatus[statusByDate.get(day.date) ?? "empty"]
              }
            />
            <p className="text-center text-[10px] text-muted-foreground">
              {t("water.chartGoalLine", {
                min: formatVolume(WATER_MIN_ML, locale),
              })}
            </p>
          </div>
        ) : null}

        {entries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("water.logToSeePatterns")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
