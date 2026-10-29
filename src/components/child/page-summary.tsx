"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { Baby, Info, Milk, Moon, Ruler, Weight } from "lucide-react";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import { PumpIcon } from "@/components/icons/pump-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { ActivityAreaChart } from "@/components/summary/activity-area-chart";
import { SummaryRangeControl } from "@/components/summary/summary-range-control";
import {
  datesBetween,
  diaperDaySummary,
  feedDaySummary,
  formatDuration,
  growthComparison,
  pumpDaySummary,
  recentDates,
  sessionIntervals,
  sleepDaySummary,
  sleepMinutes,
} from "@/lib/child/summary";
import { formatGrams, kgToGrams } from "@/lib/child/weight";
import type { DiaperEntry, FeedEntry, GrowthEntry, PumpEntry, SleepEntry } from "@/lib/child/types";
import {
  describePercentile,
  englishOrdinal,
  measurementAgeDays,
  whoPercentile,
  whoSex,
  type WhoMetric,
} from "@/lib/child/who-growth";
import type { Locale } from "@/lib/i18n/types";
import type { Gender } from "@/lib/pregnancy/types";
import { useSummaryLink, type SummaryRange } from "@/hooks/use-summary-link";
import { cn } from "@/utils/cn";

export { useSummaryLink };

function SummaryShell({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="size-5 text-lilac-deep" />
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function todayKey() {
  return format(startOfDay(new Date()), "yyyy-MM-dd");
}

function useSummaryWindow(
  dates: string[],
  link: ReturnType<typeof useSummaryLink>,
) {
  const { locale } = useLocale();
  const { range, setRange, day, setDay, customFrom, customTo, setCustomFrom, setCustomTo } = link;
  const today = todayKey();
  const markedDates = [...new Set(dates)];
  const dfLocale = locale === "id" ? idLocale : enUS;
  const axis =
    range === 1
      ? [
          {
            date: day,
            dayLabel: format(parseISO(day), "d", { locale: dfLocale }),
            fullLabel: format(parseISO(day), "EEE, d MMM yyyy", { locale: dfLocale }),
            isToday: day === today,
          },
        ]
      : range === "custom"
        ? customFrom && customTo
          ? datesBetween(customFrom, customTo, locale)
          : []
        : recentDates(range, locale);
  const showChart = axis.length > 1;
  return {
    range,
    setRange,
    day,
    setDay,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    markedDates,
    axis,
    today,
    locale,
    showChart,
  };
}

function shortDayLabel(day: string, locale: Locale) {
  return format(parseISO(day), "d MMM", { locale: locale === "id" ? idLocale : enUS });
}

function spanCaption(from: string, to: string, locale: Locale) {
  const dfLocale = locale === "id" ? idLocale : enUS;
  return {
    from: format(parseISO(from), "d MMM", { locale: dfLocale }),
    to: format(parseISO(to), "d MMM yyyy", { locale: dfLocale }),
  };
}

function rangeCaption({
  range,
  day,
  today,
  customFrom,
  customTo,
  locale,
  todayKeyName,
  onDayKey,
  inRangeKey,
  inSpanKey,
  t,
}: {
  range: SummaryRange;
  day: string;
  today: string;
  customFrom: string;
  customTo: string;
  locale: Locale;
  todayKeyName: string;
  onDayKey: string;
  inRangeKey: string;
  inSpanKey: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (range === "custom" && customFrom && customTo) {
    return t(inSpanKey, spanCaption(customFrom, customTo, locale));
  }
  if (range !== 1 && range !== "custom") {
    return t(inRangeKey, { count: range });
  }
  if (day === today) return t(todayKeyName);
  return t(onDayKey, { date: shortDayLabel(day, locale) });
}

function IntervalStat({
  value,
  caption,
  className,
  valueClass,
  captionClass,
}: {
  value: string;
  caption: string;
  className: string;
  valueClass: string;
  captionClass: string;
}) {
  return (
    <div className={cn("rounded-xl px-3 py-3", className)}>
      <p className={cn("font-bold tabular-nums", valueClass)}>{value}</p>
      <p className={cn("text-xs font-semibold", captionClass)}>{caption}</p>
    </div>
  );
}

function IntervalBand({
  title,
  entries,
}: {
  title: string;
  entries: { date: string; time: string }[];
}) {
  const { t } = useLocale();
  const interval = sessionIntervals(entries);
  const label = (minutes: number | undefined) => (minutes === undefined ? "—" : formatDuration(minutes, t));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <IntervalStat
          value={label(interval?.average)}
          caption={t("child.intervalAvg")}
          className="bg-lilac/40"
          valueClass="text-xl text-lilac-foreground"
          captionClass="text-lilac-foreground/70"
        />
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <IntervalStat
            value={label(interval?.shortest)}
            caption={t("child.intervalShortest")}
            className="bg-baby-sky/40"
            valueClass="text-lg text-sky-foreground"
            captionClass="text-sky-foreground/70"
          />
          <IntervalStat
            value={label(interval?.longest)}
            caption={t("child.intervalLongest")}
            className="bg-mint/40"
            valueClass="text-lg text-mint-foreground"
            captionClass="text-mint-foreground/70"
          />
        </div>
      </div>
      {interval ? null : (
        <p className="text-xs leading-relaxed text-muted-foreground">{t("child.intervalNeedTwo")}</p>
      )}
    </div>
  );
}

function StatTile({
  value,
  caption,
  emphasis = false,
}: {
  value: string;
  caption: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-3 text-center",
        emphasis ? "bg-lilac/35" : "bg-lilac/20",
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

export function FeedRangeSummary({
  entries,
  link,
}: {
  entries: FeedEntry[];
  link: ReturnType<typeof useSummaryLink>;
}) {
  const { t } = useLocale();
  const period = useSummaryWindow(
    entries.map((entry) => entry.date),
    link,
  );
  const { range, day, today, axis, locale, showChart, customFrom, customTo } = period;
  const byDay = axis.map((item) => ({
    ...item,
    entries: entries.filter((entry) => entry.date === item.date),
  }));
  const inRange = byDay.flatMap((item) => item.entries);
  const summary = feedDaySummary(inRange);
  const counts = byDay.map((item) => item.entries.length);
  const maxCount = Math.max(...counts, 1);

  return (
    <SummaryShell icon={Milk} title={t("feed.summaryTitle")} subtitle={t("feed.summarySubtitle")}>
      <SummaryRangeControl
        range={range}
        day={day}
        today={today}
        customFrom={customFrom}
        customTo={customTo}
        onRangeChange={period.setRange}
        onCustomFromChange={period.setCustomFrom}
        onCustomToChange={period.setCustomTo}
      />
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          value={String(summary.count)}
          caption={rangeCaption({
            range,
            day,
            today,
            customFrom,
            customTo,
            locale,
            todayKeyName: "feed.feedsToday",
            onDayKey: "feed.feedsOnDay",
            inRangeKey: "feed.feedsInRange",
            inSpanKey: "feed.feedsInSpan",
            t,
          })}
          emphasis
        />
        <StatTile value={t("child.summaryMl", { ml: summary.ml })} caption={t("feed.summaryBottle")} />
        <StatTile
          value={summary.avgMl === null ? "—" : t("child.summaryMl", { ml: summary.avgMl })}
          caption={t("feed.summaryAvg")}
        />
        <StatTile value={formatDuration(summary.nursingMin, t)} caption={t("feed.summaryNursing")} />
      </div>
      <IntervalBand title={t("feed.intervalTitle")} entries={inRange} />
      {!showChart && inRange.length === 0 && entries.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("child.emptyDay")}</p>
      ) : null}
      {showChart ? (
        <ActivityAreaChart
          title={t("feed.dailyActivity")}
          hint={t("feed.dailyActivityHint")}
          days={byDay.map((item) => ({ ...item, value: item.entries.length }))}
          maxValue={maxCount}
          valueLabel={(value) => String(value)}
          ariaLabel={(value, date) => t("feed.barAria", { count: value, date })}
          locale={locale}
        />
      ) : null}
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("feed.logPatterns")}</p>
      ) : null}
    </SummaryShell>
  );
}

export function PumpRangeSummary({
  entries,
  link,
}: {
  entries: PumpEntry[];
  link: ReturnType<typeof useSummaryLink>;
}) {
  const { t } = useLocale();
  const period = useSummaryWindow(
    entries.map((entry) => entry.date),
    link,
  );
  const { range, day, today, axis, locale, showChart, customFrom, customTo } = period;
  const byDay = axis.map((item) => ({
    ...item,
    entries: entries.filter((entry) => entry.date === item.date),
  }));
  const inRange = byDay.flatMap((item) => item.entries);
  const summary = pumpDaySummary(inRange);
  const counts = byDay.map((item) => item.entries.length);
  const maxCount = Math.max(...counts, 1);

  return (
    <SummaryShell icon={PumpIcon} title={t("pump.summaryTitle")} subtitle={t("pump.summarySubtitle")}>
      <SummaryRangeControl
        range={range}
        day={day}
        today={today}
        customFrom={customFrom}
        customTo={customTo}
        onRangeChange={period.setRange}
        onCustomFromChange={period.setCustomFrom}
        onCustomToChange={period.setCustomTo}
      />
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          value={String(summary.count)}
          caption={rangeCaption({
            range,
            day,
            today,
            customFrom,
            customTo,
            locale,
            todayKeyName: "pump.sessionsToday",
            onDayKey: "pump.sessionsOnDay",
            inRangeKey: "pump.sessionsInRange",
            inSpanKey: "pump.sessionsInSpan",
            t,
          })}
          emphasis
        />
        <StatTile value={t("child.summaryMl", { ml: summary.ml })} caption={t("pump.summaryTotal")} />
        <StatTile
          value={summary.avgMl === null ? "—" : t("child.summaryMl", { ml: summary.avgMl })}
          caption={t("pump.summaryAvg")}
        />
      </div>
      <IntervalBand title={t("pump.intervalTitle")} entries={inRange} />
      {!showChart && inRange.length === 0 && entries.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("child.emptyDay")}</p>
      ) : null}
      {showChart ? (
        <ActivityAreaChart
          title={t("pump.dailyActivity")}
          hint={t("pump.dailyActivityHint")}
          days={byDay.map((item) => ({ ...item, value: item.entries.length }))}
          maxValue={maxCount}
          valueLabel={(value) => String(value)}
          ariaLabel={(value, date) => t("pump.barAria", { count: value, date })}
          locale={locale}
        />
      ) : null}
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("pump.logPatterns")}</p>
      ) : null}
    </SummaryShell>
  );
}

export function DiaperRangeSummary({
  entries,
  link,
}: {
  entries: DiaperEntry[];
  link: ReturnType<typeof useSummaryLink>;
}) {
  const { t } = useLocale();
  const period = useSummaryWindow(
    entries.map((entry) => entry.date),
    link,
  );
  const { range, day, today, axis, locale, showChart, customFrom, customTo } = period;
  const byDay = axis.map((item) => ({
    ...item,
    entries: entries.filter((entry) => entry.date === item.date),
  }));
  const summary = diaperDaySummary(byDay.flatMap((item) => item.entries));
  const maxCount = Math.max(...byDay.map((item) => item.entries.length), 1);

  return (
    <SummaryShell icon={DiaperIcon} title={t("diaper.summaryTitle")} subtitle={t("diaper.summarySubtitle")}>
      <SummaryRangeControl
        range={range}
        day={day}
        today={today}
        customFrom={customFrom}
        customTo={customTo}
        onRangeChange={period.setRange}
        onCustomFromChange={period.setCustomFrom}
        onCustomToChange={period.setCustomTo}
      />
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          value={String(summary.count)}
          caption={rangeCaption({
            range,
            day,
            today,
            customFrom,
            customTo,
            locale,
            todayKeyName: "diaper.changesToday",
            onDayKey: "diaper.changesOnDay",
            inRangeKey: "diaper.changesInRange",
            inSpanKey: "diaper.changesInSpan",
            t,
          })}
          emphasis
        />
        <StatTile value={String(summary.pee)} caption={t("diaper.pee")} />
        <StatTile value={String(summary.poop)} caption={t("diaper.poop")} />
      </div>
      <IntervalBand title={t("diaper.intervalTitle")} entries={byDay.flatMap((item) => item.entries)} />
      {!showChart && summary.count === 0 && entries.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("child.emptyDay")}</p>
      ) : null}
      {showChart ? (
        <ActivityAreaChart
          title={t("diaper.dailyActivity")}
          hint={t("diaper.dailyActivityHint")}
          days={byDay.map((item) => ({ ...item, value: item.entries.length }))}
          maxValue={maxCount}
          valueLabel={(value) => String(value)}
          ariaLabel={(value, date) => t("diaper.barAria", { count: value, date })}
          locale={locale}
        />
      ) : null}
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("diaper.logPatterns")}</p>
      ) : null}
    </SummaryShell>
  );
}

export function SleepRangeSummary({
  entries,
  link,
}: {
  entries: SleepEntry[];
  link: ReturnType<typeof useSummaryLink>;
}) {
  const { t } = useLocale();
  const period = useSummaryWindow(
    entries.map((entry) => entry.date),
    link,
  );
  const { range, day, today, axis, locale, showChart, customFrom, customTo } = period;
  const byDay = axis.map((item) => {
    const dayEntries = entries.filter((entry) => entry.date === item.date);
    return {
      ...item,
      entries: dayEntries,
      minutes: dayEntries.reduce((sum, entry) => sum + sleepMinutes(entry), 0),
    };
  });
  const summary = sleepDaySummary(byDay.flatMap((item) => item.entries));
  const maxMinutes = Math.max(...byDay.map((item) => item.minutes), 1);

  return (
    <SummaryShell icon={Moon} title={t("sleep.summaryTitle")} subtitle={t("sleep.summarySubtitle")}>
      <SummaryRangeControl
        range={range}
        day={day}
        today={today}
        customFrom={customFrom}
        customTo={customTo}
        onRangeChange={period.setRange}
        onCustomFromChange={period.setCustomFrom}
        onCustomToChange={period.setCustomTo}
      />
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          value={formatDuration(summary.total, t)}
          caption={rangeCaption({
            range,
            day,
            today,
            customFrom,
            customTo,
            locale,
            todayKeyName: "sleep.totalToday",
            onDayKey: "sleep.totalOnDay",
            inRangeKey: "sleep.totalInRange",
            inSpanKey: "sleep.totalInSpan",
            t,
          })}
          emphasis
        />
        <StatTile value={String(summary.count)} caption={t("sleep.summarySessions")} />
        <StatTile value={formatDuration(summary.nap, t)} caption={t("sleep.day")} />
        <StatTile value={formatDuration(summary.night, t)} caption={t("sleep.night")} />
      </div>
      {!showChart && summary.count === 0 && entries.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("child.emptyDay")}</p>
      ) : null}
      {showChart ? (
        <ActivityAreaChart
          title={t("sleep.dailyActivity")}
          hint={t("sleep.dailyActivityHint")}
          days={byDay.map((item) => ({ ...item, value: item.minutes }))}
          maxValue={maxMinutes}
          valueLabel={(value) => formatDuration(value, t)}
          ariaLabel={(value, date) => t("sleep.barAria", { duration: formatDuration(value, t), date })}
          locale={locale}
        />
      ) : null}
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("sleep.logPatterns")}</p>
      ) : null}
    </SummaryShell>
  );
}

function signed(value: number, digits: number, unit: string) {
  const rounded = Number(value.toFixed(digits));
  const prefix = rounded > 0 ? "+" : "";
  const text = digits === 0 ? formatGrams(rounded) : String(rounded);
  return `${prefix}${text} ${unit}`;
}

function PercentileLabel({ percentile }: { percentile: number | null }) {
  const { t, locale } = useLocale();
  if (percentile == null) return null;
  const band = describePercentile(percentile);
  if (band.kind === "low") return <>{t("growth.percentileLow")}</>;
  if (band.kind === "high") return <>{t("growth.percentileHigh")}</>;
  return (
    <>
      {t("growth.percentileAbout", {
        ordinal: locale === "en" ? englishOrdinal(band.n) : String(band.n),
        n: band.n,
      })}
    </>
  );
}

function latestPercentile(
  metric: WhoMetric,
  sex: Gender | null,
  birthDate: string | null,
  current: { value: number; date: string } | null,
): number | null {
  const who = whoSex(sex);
  if (!current || !birthDate || !who) return null;
  const ageDays = measurementAgeDays(birthDate, current.date);
  if (ageDays == null) return null;
  return whoPercentile(metric, who, ageDays, current.value);
}

function GrowthStatTile({
  icon: Icon,
  iconClass,
  label,
  measuredOn,
  current,
  percentile,
  onPercentileInfo,
}: {
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  measuredOn?: string;
  current: { value: number; unit: string; digits: number; delta?: number } | null;
  percentile: number | null;
  onPercentileInfo: () => void;
}) {
  const { t } = useLocale();
  const grew = current?.delta !== undefined && current.delta > 0;
  const dropped = current?.delta !== undefined && current.delta < 0;
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-3">
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", iconClass)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {measuredOn ? <p className="text-xs text-muted-foreground">{measuredOn}</p> : null}
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">
        {current ? `${formatMeasure(current.value, current.digits)} ${current.unit}` : "—"}
      </p>
      {percentile != null ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <PercentileLabel percentile={percentile} />
          <button
            type="button"
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label={t("growth.percentileInfo")}
            onClick={onPercentileInfo}
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        {current?.delta !== undefined ? (
          <span
            className={cn(
              "font-semibold",
              grew && "text-emerald-600",
              dropped && "text-destructive",
            )}
          >
            {signed(current.delta, current.digits, current.unit)} {t("growth.sinceLast")}
          </span>
        ) : (
          t("growth.noPrevious")
        )}
      </p>
    </div>
  );
}

function formatMeasure(value: number, digits: number): string {
  const rounded = Number(value.toFixed(digits));
  return digits === 0 ? formatGrams(rounded) : String(rounded);
}

export function GrowthCompareSummary({
  entries,
  birthDate,
  sex,
}: {
  entries: GrowthEntry[];
  birthDate: string | null;
  sex: Gender | null;
}) {
  const { t, locale } = useLocale();
  const [percentileInfoOpen, setPercentileInfoOpen] = useState(false);
  const compared = growthComparison(entries);
  const hasAny = Boolean(compared.weight || compared.height || compared.head);
  const canCompare = Boolean(birthDate && whoSex(sex));
  const dfLocale = locale === "id" ? idLocale : enUS;
  const formatMeasuredOn = (date: string) => format(parseISO(date), "d MMM yyyy", { locale: dfLocale });
  const sharedDate = sharedMeasurementDate(compared);
  const tileDate = (date: string | undefined) => (date && !sharedDate ? formatMeasuredOn(date) : undefined);
  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ruler className="size-5 text-lilac-deep" />
          {t("growth.summaryTitle")}
        </CardTitle>
        <CardDescription>
          {sharedDate
            ? t("growth.summarySubtitleDated", { date: formatMeasuredOn(sharedDate) })
            : t("growth.summarySubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAny ? (
          <p className="text-center text-sm text-muted-foreground">{t("growth.empty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <GrowthStatTile
              icon={Weight}
              iconClass="bg-lilac text-lilac-foreground"
              label={t("child.measureWeight")}
              measuredOn={tileDate(compared.weight?.date)}
              current={
                compared.weight
                  ? {
                      value: kgToGrams(compared.weight.value),
                      unit: "gr",
                      digits: 0,
                      ...(compared.weight.previous !== undefined
                        ? { delta: kgToGrams(compared.weight.value) - kgToGrams(compared.weight.previous) }
                        : {}),
                    }
                  : null
              }
              percentile={latestPercentile("weight", sex, birthDate, compared.weight)}
              onPercentileInfo={() => setPercentileInfoOpen(true)}
            />
            <GrowthStatTile
              icon={Ruler}
              iconClass="bg-baby-sky text-sky-foreground"
              label={t("child.measureHeight")}
              measuredOn={tileDate(compared.height?.date)}
              current={compared.height ? { ...compared.height, unit: "cm", digits: 1 } : null}
              percentile={latestPercentile("length", sex, birthDate, compared.height)}
              onPercentileInfo={() => setPercentileInfoOpen(true)}
            />
            <GrowthStatTile
              icon={Baby}
              iconClass="bg-amber-100 text-amber-700"
              label={t("child.measureHead")}
              measuredOn={tileDate(compared.head?.date)}
              current={compared.head ? { ...compared.head, unit: "cm", digits: 1 } : null}
              percentile={latestPercentile("head", sex, birthDate, compared.head)}
              onPercentileInfo={() => setPercentileInfoOpen(true)}
            />
          </div>
        )}
        {hasAny && !canCompare ? (
          <p className="text-xs text-muted-foreground">{t("growth.percentileNeedsSex")}</p>
        ) : null}
      </CardContent>
      <Dialog open={percentileInfoOpen} onOpenChange={setPercentileInfoOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("growth.percentileInfoTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("growth.percentileInfoBody")}</p>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function sharedMeasurementDate(compared: ReturnType<typeof growthComparison>): string | null {
  const dates = [compared.weight?.date, compared.height?.date, compared.head?.date].filter(
    (date): date is string => Boolean(date),
  );
  if (dates.length === 0 || dates.some((date) => date !== dates[0])) return null;
  return dates[0];
}
