"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { Baby, Milk, Moon, Ruler, Weight } from "lucide-react";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import {
  diaperDaySummary,
  feedDaySummary,
  formatDuration,
  growthComparison,
  recentDates,
  sleepDaySummary,
  sleepMinutes,
} from "@/lib/child/summary";
import type { DiaperEntry, FeedEntry, GrowthEntry, SleepEntry } from "@/lib/child/types";
import {
  describePercentile,
  englishOrdinal,
  measurementAgeDays,
  whoPercentile,
  whoSex,
  type WhoMetric,
} from "@/lib/child/who-growth";
import type { Locale } from "@/lib/i18n/types";
import type { Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

type RangeDays = 1 | 7 | 30;

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

function RangeToggle({
  range,
  onChange,
}: {
  range: RangeDays;
  onChange: (days: RangeDays) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-full bg-white/45 p-1 ring-1 ring-white/70">
        {([1, 7, 30] as RangeDays[]).map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => onChange(days)}
            className={cn(
              "min-h-9 flex-1 rounded-full text-sm font-semibold transition-all",
              range === days
                ? "bg-lilac-deep text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/55",
            )}
          >
            {days === 1 ? t("common.today") : t("child.rangeDays", { count: days })}
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("child.rangeHint")}</p>
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

function ActivityChart({
  title,
  hint,
  days,
  maxValue,
  barLabel,
  ariaLabel,
  locale,
}: {
  title: string;
  hint: string;
  days: { date: string; dayLabel: string; fullLabel: string; isToday: boolean; value: number }[];
  maxValue: number;
  barLabel: (value: number) => string;
  ariaLabel: (value: number, date: string) => string;
  locale: Locale;
}) {
  const { t } = useLocale();
  const dfLocale = locale === "id" ? idLocale : enUS;
  const chartFrom = days[0] ? format(parseISO(days[0].date), "d MMM", { locale: dfLocale }) : "";
  const chartTo = days[days.length - 1]
    ? format(parseISO(days[days.length - 1].date), "d MMM yyyy", { locale: dfLocale })
    : "";
  const hasChartData = days.some((day) => day.value > 0);
  const wide = days.length > 7;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {days.length > 1 && chartFrom && chartTo ? (
          <p className="text-xs text-muted-foreground">
            {t("child.chartDateRange", { from: chartFrom, to: chartTo })}
          </p>
        ) : null}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <div
        className="rounded-xl border border-border/50 bg-muted/20 px-2 pb-2 pt-3"
        role="img"
        aria-label={title}
      >
        {!hasChartData ? (
          <p className="mb-2 px-1 text-center text-xs text-muted-foreground">{t("child.chartEmpty")}</p>
        ) : null}
        <div className={cn("flex items-end justify-between", wide ? "h-24 gap-px" : "h-28 gap-1")}>
          {days.map((day) => {
            const barHeight = day.value > 0 ? Math.max(Math.round((day.value / maxValue) * 72), 12) : 4;
            const label = day.value > 0 ? barLabel(day.value) : "";
            return (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "relative flex w-full flex-col items-center justify-end",
                    wide ? "max-w-4" : "max-w-8",
                  )}
                  style={{ height: 80 }}
                  title={day.fullLabel}
                  aria-label={ariaLabel(day.value, day.fullLabel)}
                >
                  {label && !wide ? (
                    <span className="mb-0.5 font-semibold text-[10px] tabular-nums text-lilac-deep">
                      {label}
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "w-full rounded-t-sm bg-lilac-deep transition-colors",
                      day.value > 0 ? "opacity-100" : "opacity-15",
                    )}
                    style={{ height: barHeight }}
                  />
                </div>
                <span
                  className={cn(
                    "max-w-full truncate text-center font-medium text-muted-foreground",
                    wide ? "text-[8px]" : "text-[10px]",
                    day.isToday && "font-semibold text-lilac-deep",
                  )}
                >
                  {day.isToday && !wide ? t("common.today") : day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FeedRangeSummary({ entries }: { entries: FeedEntry[] }) {
  const { t, locale } = useLocale();
  const [range, setRange] = useState<RangeDays>(7);
  const axis = recentDates(range, locale);
  const byDay = axis.map((day) => ({
    ...day,
    entries: entries.filter((entry) => entry.date === day.date),
  }));
  const inRange = byDay.flatMap((day) => day.entries);
  const summary = feedDaySummary(inRange);
  const counts = byDay.map((day) => day.entries.length);
  const maxCount = Math.max(...counts, 1);

  return (
    <SummaryShell icon={Milk} title={t("feed.summaryTitle")} subtitle={t("feed.summarySubtitle")}>
      <RangeToggle range={range} onChange={setRange} />
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          value={String(summary.count)}
          caption={range === 1 ? t("feed.feedsToday") : t("feed.feedsInRange", { count: range })}
          emphasis
        />
        <StatTile value={t("child.summaryMl", { ml: summary.ml })} caption={t("feed.summaryBottle")} />
        <StatTile
          value={summary.avgMl === null ? "—" : t("child.summaryMl", { ml: summary.avgMl })}
          caption={t("feed.summaryAvg")}
        />
        <StatTile value={formatDuration(summary.nursingMin, t)} caption={t("feed.summaryNursing")} />
      </div>
      <ActivityChart
        title={t("feed.dailyActivity")}
        hint={t("feed.dailyActivityHint")}
        days={byDay.map((day) => ({ ...day, value: day.entries.length }))}
        maxValue={maxCount}
        barLabel={(value) => String(value)}
        ariaLabel={(value, date) => t("feed.barAria", { count: value, date })}
        locale={locale}
      />
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("feed.logPatterns")}</p>
      ) : null}
    </SummaryShell>
  );
}

export function DiaperRangeSummary({ entries }: { entries: DiaperEntry[] }) {
  const { t, locale } = useLocale();
  const [range, setRange] = useState<RangeDays>(7);
  const axis = recentDates(range, locale);
  const byDay = axis.map((day) => ({
    ...day,
    entries: entries.filter((entry) => entry.date === day.date),
  }));
  const summary = diaperDaySummary(byDay.flatMap((day) => day.entries));
  const maxCount = Math.max(...byDay.map((day) => day.entries.length), 1);

  return (
    <SummaryShell icon={DiaperIcon} title={t("diaper.summaryTitle")} subtitle={t("diaper.summarySubtitle")}>
      <RangeToggle range={range} onChange={setRange} />
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          value={String(summary.count)}
          caption={range === 1 ? t("diaper.changesToday") : t("diaper.changesInRange", { count: range })}
          emphasis
        />
        <StatTile value={String(summary.pee)} caption={t("diaper.pee")} />
        <StatTile value={String(summary.poop)} caption={t("diaper.poop")} />
      </div>
      <ActivityChart
        title={t("diaper.dailyActivity")}
        hint={t("diaper.dailyActivityHint")}
        days={byDay.map((day) => ({ ...day, value: day.entries.length }))}
        maxValue={maxCount}
        barLabel={(value) => String(value)}
        ariaLabel={(value, date) => t("diaper.barAria", { count: value, date })}
        locale={locale}
      />
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("diaper.logPatterns")}</p>
      ) : null}
    </SummaryShell>
  );
}

export function SleepRangeSummary({ entries }: { entries: SleepEntry[] }) {
  const { t, locale } = useLocale();
  const [range, setRange] = useState<RangeDays>(7);
  const axis = recentDates(range, locale);
  const byDay = axis.map((day) => {
    const dayEntries = entries.filter((entry) => entry.date === day.date);
    return { ...day, entries: dayEntries, minutes: dayEntries.reduce((sum, entry) => sum + sleepMinutes(entry), 0) };
  });
  const summary = sleepDaySummary(byDay.flatMap((day) => day.entries));
  const maxMinutes = Math.max(...byDay.map((day) => day.minutes), 1);

  return (
    <SummaryShell icon={Moon} title={t("sleep.summaryTitle")} subtitle={t("sleep.summarySubtitle")}>
      <RangeToggle range={range} onChange={setRange} />
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          value={formatDuration(summary.total, t)}
          caption={range === 1 ? t("sleep.totalToday") : t("sleep.totalInRange", { count: range })}
          emphasis
        />
        <StatTile value={String(summary.count)} caption={t("sleep.summarySessions")} />
        <StatTile value={formatDuration(summary.nap, t)} caption={t("sleep.day")} />
        <StatTile value={formatDuration(summary.night, t)} caption={t("sleep.night")} />
      </div>
      <ActivityChart
        title={t("sleep.dailyActivity")}
        hint={t("sleep.dailyActivityHint")}
        days={byDay.map((day) => ({ ...day, value: day.minutes }))}
        maxValue={maxMinutes}
        barLabel={(value) => formatDuration(value, t)}
        ariaLabel={(value, date) => t("sleep.barAria", { duration: formatDuration(value, t), date })}
        locale={locale}
      />
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("sleep.logPatterns")}</p>
      ) : null}
    </SummaryShell>
  );
}

function signed(value: number, digits: number, unit: string) {
  const rounded = Number(value.toFixed(digits));
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded} ${unit}`;
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
  current,
  percentile,
}: {
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  current: { value: number; unit: string; digits: number; delta?: number } | null;
  percentile: number | null;
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
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">
        {current ? `${formatMeasure(current.value, current.digits)} ${current.unit}` : "—"}
      </p>
      {percentile != null ? (
        <p className="text-xs text-muted-foreground">
          <PercentileLabel percentile={percentile} />
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
  return String(Number(value.toFixed(digits)));
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
  const { t } = useLocale();
  const compared = growthComparison(entries);
  const hasAny = Boolean(compared.weight || compared.height || compared.head);
  const canCompare = Boolean(birthDate && whoSex(sex));
  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ruler className="size-5 text-lilac-deep" />
          {t("growth.summaryTitle")}
        </CardTitle>
        <CardDescription>{t("growth.summarySubtitle")}</CardDescription>
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
              current={compared.weight ? { ...compared.weight, unit: "kg", digits: 2 } : null}
              percentile={latestPercentile("weight", sex, birthDate, compared.weight)}
            />
            <GrowthStatTile
              icon={Ruler}
              iconClass="bg-baby-sky text-sky-foreground"
              label={t("child.measureHeight")}
              current={compared.height ? { ...compared.height, unit: "cm", digits: 1 } : null}
              percentile={latestPercentile("length", sex, birthDate, compared.height)}
            />
            <GrowthStatTile
              icon={Baby}
              iconClass="bg-amber-100 text-amber-700"
              label={t("child.measureHead")}
              current={compared.head ? { ...compared.head, unit: "cm", digits: 1 } : null}
              percentile={latestPercentile("head", sex, birthDate, compared.head)}
            />
          </div>
        )}
        {hasAny && !canCompare ? (
          <p className="text-xs text-muted-foreground">{t("growth.percentileNeedsSex")}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
