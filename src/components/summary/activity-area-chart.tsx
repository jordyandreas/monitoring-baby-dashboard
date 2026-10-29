"use client";

import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/utils/cn";

export type ActivityChartDay = {
  date: string;
  dayLabel: string;
  fullLabel: string;
  isToday: boolean;
  value: number;
};

type ActivityAreaChartProps = {
  title: string;
  hint: ReactNode;
  days: ActivityChartDay[];
  maxValue: number;
  valueLabel: (value: number) => string;
  ariaLabel: (value: number, date: string) => string;
  locale: Locale;
  /** Optional per-day point fill (e.g. water status colors). */
  pointColor?: (day: ActivityChartDay) => string;
  className?: string;
};

/** Wider viewBox so stroke/dot/font stay thin when the SVG stretches on desktop. */
const WIDTH = 560;
const HEIGHT = 176;
const PAD = { top: 14, right: 14, bottom: 30, left: 44 };

function chartAnchorIndexes(count: number): number[] {
  if (count <= 1) return [0];
  const slots = Math.min(5, count);
  const indexes = new Set<number>();
  for (let slot = 0; slot < slots; slot += 1) {
    indexes.add(Math.round((slot * (count - 1)) / (slots - 1)));
  }
  return [...indexes].sort((a, b) => a - b);
}

function yAxisTicks(maxValue: number): number[] {
  const top = Math.max(maxValue, 1);
  if (top <= 1) return [0, 1];
  if (top <= 2) return [0, 1, 2].filter((n) => n <= top);
  const mid = top / 2;
  const midTick = Number.isInteger(top) ? Math.round(mid) : Number(mid.toFixed(mid >= 10 ? 0 : 1));
  const unique = [...new Set([0, midTick, top])].sort((a, b) => a - b);
  return unique;
}

function buildPaths(
  days: ActivityChartDay[],
  maxValue: number,
): { area: string; line: string; points: { x: number; y: number; day: ActivityChartDay }[] } {
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const safeMax = Math.max(maxValue, 1);
  const points = days.map((day, index) => {
    const x =
      days.length === 1
        ? PAD.left + innerW / 2
        : PAD.left + (index / (days.length - 1)) * innerW;
    const ratio = Math.max(day.value, 0) / safeMax;
    const y = PAD.top + innerH * (1 - ratio);
    return { x, y, day };
  });

  if (points.length === 0) return { area: "", line: "", points };

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const baseline = PAD.top + innerH;
  const first = points[0];
  const last = points[points.length - 1];
  const area = [
    `M${first.x.toFixed(1)} ${baseline.toFixed(1)}`,
    ...points.map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`),
    `L${last.x.toFixed(1)} ${baseline.toFixed(1)}`,
    "Z",
  ].join(" ");

  return { area, line, points };
}

export function ActivityAreaChart({
  title,
  hint,
  days,
  maxValue,
  valueLabel,
  ariaLabel,
  locale,
  pointColor,
  className,
}: ActivityAreaChartProps) {
  const { t } = useLocale();
  const gradientId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const chartFrom = days[0] ? format(parseISO(days[0].date), "d MMM", { locale: dfLocale }) : "";
  const chartTo = days[days.length - 1]
    ? format(parseISO(days[days.length - 1].date), "d MMM yyyy", { locale: dfLocale })
    : "";
  const hasChartData = days.some((day) => day.value > 0);
  const wide = days.length > 7;
  const anchors = chartAnchorIndexes(days.length);
  const scaleMax = Math.max(maxValue, 1);
  const { area, line, points } = buildPaths(days, scaleMax);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const ticks = yAxisTicks(scaleMax);
  const yOf = (value: number) => PAD.top + innerH * (1 - Math.max(value, 0) / scaleMax);
  const activePoint = points.find((point) => point.day.date === activeDate) ?? null;

  useEffect(() => {
    if (!activeDate) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setActiveDate(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeDate]);

  return (
    <div className={cn("space-y-2", className)}>
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
        ref={rootRef}
        className="relative rounded-xl border border-border/50 bg-muted/20 px-2 pb-2 pt-2"
      >
        {!hasChartData ? (
          <p className="mb-2 px-1 text-center text-xs text-muted-foreground">{t("child.chartEmpty")}</p>
        ) : null}
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          className="block h-auto max-w-full touch-manipulation"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--lilac-deep)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--lilac-deep)" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = yOf(tick);
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeOpacity={tick === 0 ? 1 : 0.7}
                />
                <text
                  x={PAD.left - 6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--muted-foreground)"
                  fontSize="10"
                >
                  {tick === 0 ? "0" : valueLabel(tick)}
                </text>
              </g>
            );
          })}

          {hasChartData && area ? (
            <path d={area} fill={`url(#${gradientId})`} stroke="none" />
          ) : null}
          {hasChartData && line ? (
            <path
              d={line}
              fill="none"
              stroke="var(--lilac-deep)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {points.map(({ x, y, day }) => {
            const showValue = day.value > 0 && !wide;
            const fill = pointColor?.(day) ?? "var(--lilac-deep)";
            const selected = activeDate === day.date;
            return (
              <g key={day.date}>
                {showValue ? (
                  <text
                    x={x}
                    y={Math.max(y - 9, 12)}
                    textAnchor="middle"
                    fill="var(--lilac-deep)"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {valueLabel(day.value)}
                  </text>
                ) : null}
                <circle
                  cx={x}
                  cy={y}
                  r={selected ? 4 : day.value > 0 ? 2.75 : 2}
                  fill={day.value > 0 ? fill : "var(--muted-foreground)"}
                  fillOpacity={day.value > 0 ? 1 : 0.35}
                  stroke={selected ? "var(--background)" : "none"}
                  strokeWidth={selected ? 1.5 : 0}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={wide ? 10 : 12}
                  fill="transparent"
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={ariaLabel(day.value, day.fullLabel)}
                  aria-expanded={selected}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveDate((current) => (current === day.date ? null : day.date));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveDate((current) => (current === day.date ? null : day.date));
                    }
                  }}
                />
              </g>
            );
          })}

          {(wide ? anchors : days.map((_, index) => index)).map((index) => {
            const point = points[index];
            if (!point) return null;
            const day = point.day;
            const isFirst = index === 0;
            const isLast = index === days.length - 1;
            let anchor: "start" | "middle" | "end" = "middle";
            if (wide) {
              if (isFirst) anchor = "start";
              else if (isLast) anchor = "end";
            }
            return (
              <text
                key={`label-${day.date}`}
                x={point.x}
                y={HEIGHT - 8}
                textAnchor={anchor}
                fill={day.isToday ? "var(--lilac-deep)" : "var(--muted-foreground)"}
                fontSize="10"
                fontWeight={day.isToday ? 600 : 500}
              >
                {day.isToday
                  ? t("common.today")
                  : wide
                    ? format(parseISO(day.date), "d MMM", { locale: dfLocale })
                    : day.dayLabel}
              </text>
            );
          })}
        </svg>

        {activePoint ? (
          <div
            className="absolute top-1.5 left-1/2 z-10 w-max max-w-[10.5rem] -translate-x-1/2 rounded-md border border-border/70 bg-background px-2 py-1.5 pr-6 text-center shadow-sm"
            role="dialog"
            aria-label={ariaLabel(activePoint.day.value, activePoint.day.fullLabel)}
          >
            <button
              type="button"
              className="absolute top-0.5 right-0.5 inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("toast.close")}
              onClick={(event) => {
                event.stopPropagation();
                setActiveDate(null);
              }}
            >
              <XIcon className="size-3" aria-hidden />
            </button>
            <p className="truncate text-[10px] leading-tight text-muted-foreground">
              {activePoint.day.fullLabel}
            </p>
            <p className="text-sm font-semibold leading-tight tabular-nums text-foreground">
              {valueLabel(activePoint.day.value)}
            </p>
          </div>
        ) : wide && hasChartData ? (
          <p className="px-1 pt-1 text-center text-[10px] text-muted-foreground">
            {t("child.chartTapHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
