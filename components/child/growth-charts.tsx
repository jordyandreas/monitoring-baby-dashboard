"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { growthByDay } from "@/lib/child/summary";
import type { GrowthEntry } from "@/lib/child/types";
import {
  WHO_CHART_PERCENTILES,
  chartEndDay,
  measurementAgeDays,
  whoSeries,
  whoSex,
  type WhoMetric,
  type WhoSex,
} from "@/lib/child/who-growth";
import type { Gender } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

function fieldValue(entry: { weightKg?: number; lengthCm?: number; headCm?: number }, metric: WhoMetric) {
  if (metric === "weight") return entry.weightKg;
  if (metric === "length") return entry.lengthCm;
  return entry.headCm;
}

function linePath(
  points: { ageDays: number; value: number }[],
  xOf: (ageDays: number) => number,
  yOf: (value: number) => number,
): string {
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${xOf(point.ageDays).toFixed(1)} ${yOf(point.value).toFixed(1)}`;
    })
    .join(" ");
}

function axisTicks(min: number, max: number): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const rough = span / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / pow;
  const step = fraction >= 7.5 ? 10 * pow : fraction >= 3.5 ? 5 * pow : fraction >= 1.5 ? 2 * pow : pow;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 0.001; value += step) {
    ticks.push(Number(value.toFixed(4)));
  }
  return ticks.length > 0 ? ticks : [min];
}

function formatTick(value: number, stepHint: number): string {
  if (stepHint >= 1) return Math.round(value).toString();
  return value.toFixed(1);
}

function monthTicks(toDay: number): number[] {
  const months = toDay / 30.4375;
  const step = months <= 6 ? 1 : months <= 12 ? 2 : months <= 24 ? 6 : 12;
  const ticks: number[] = [];
  for (let month = 0; month <= months + 0.05; month += step) {
    const day = Math.round(month * 30.4375);
    if (day <= toDay) ticks.push(day);
  }
  return ticks;
}

function MetricChart({
  metric,
  label,
  unit,
  sex,
  birthDate,
  entries,
}: {
  metric: WhoMetric;
  label: string;
  unit: string;
  sex: WhoSex;
  birthDate: string;
  entries: GrowthEntry[];
}) {
  const { t } = useLocale();
  const points = growthByDay(entries)
    .flatMap((day) => {
      const value = fieldValue(day, metric);
      const ageDays = measurementAgeDays(birthDate, day.date);
      if (value === undefined || ageDays == null) return [];
      return [{ ageDays, value }];
    })
    .sort((a, b) => a.ageDays - b.ageDays);

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 px-4 py-6">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("growth.chartEmpty")}</p>
      </div>
    );
  }

  const toDay = chartEndDay(points.map((point) => point.ageDays));
  const curves = WHO_CHART_PERCENTILES.map((percentile) => ({
    percentile,
    points: whoSeries(metric, sex, percentile, toDay),
  }));
  const curveValues = curves.flatMap((curve) => curve.points.map((point) => point.value));
  const childValues = points.map((point) => point.value);
  const minValue = Math.min(...curveValues, ...childValues);
  const maxValue = Math.max(...curveValues, ...childValues);
  const span = Math.max(maxValue - minValue, metric === "weight" ? 0.4 : 1);
  const yMin = minValue - span * 0.08;
  const yMax = maxValue + span * 0.08;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const xOf = (ageDays: number) => PAD.left + (ageDays / toDay) * innerW;
  const yOf = (value: number) => PAD.top + ((yMax - value) / (yMax - yMin)) * innerH;
  const yTicks = axisTicks(yMin, yMax);
  const yStep = yTicks.length > 1 ? yTicks[1] - yTicks[0] : 1;
  const xTicks = monthTicks(toDay);

  return (
    <div className="min-w-0 space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="w-full min-w-0 overflow-hidden [contain:inline-size]">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          className="block h-auto max-w-full"
          role="img"
          aria-label={t("growth.chartAria", { metric: label })}
        >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke="var(--border)"
            />
            <text
              x={PAD.left - 6}
              y={yOf(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--muted-foreground)"
              fontSize="11"
            >
              {formatTick(tick, yStep)}
            </text>
          </g>
        ))}
        {curves.map((curve) => (
          <path
            key={curve.percentile}
            d={linePath(curve.points, xOf, yOf)}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth={curve.percentile === 50 ? 1.75 : 1}
            strokeOpacity={curve.percentile === 50 ? 0.85 : 0.4}
          />
        ))}
        <path
          d={linePath(points, xOf, yOf)}
          fill="none"
          stroke="var(--lilac-deep)"
          strokeWidth="2.25"
        />
        {points.map((point) => (
          <circle
            key={point.ageDays}
            cx={xOf(point.ageDays)}
            cy={yOf(point.value)}
            r="4"
            fill="var(--lilac-deep)"
          />
        ))}
        {xTicks.map((day) => (
          <text
            key={day}
            x={xOf(day)}
            y={HEIGHT - 8}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize="11"
          >
            {Math.round(day / 30.4375)}
          </text>
        ))}
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("growth.curveLegend")}
        {" · "}
        {t("growth.childLine")} ({unit})
      </p>
    </div>
  );
}

export function GrowthChartsSection({
  entries,
  birthDate,
  sex,
}: {
  entries: GrowthEntry[];
  birthDate: string | null;
  sex: Gender | null;
}) {
  const { t } = useLocale();
  const comparableSex = whoSex(sex);
  const charts: { metric: WhoMetric; label: string; unit: string }[] = [
    { metric: "weight", label: t("growth.chartWeight"), unit: "kg" },
    { metric: "length", label: t("growth.chartHeight"), unit: "cm" },
    { metric: "head", label: t("growth.chartHead"), unit: "cm" },
  ];

  return (
    <Card id="growth-charts" className="w-full min-w-0 max-w-full scroll-mt-24 overflow-hidden rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t("growth.chartsTitle")}</CardTitle>
        <CardDescription>{t("growth.chartsHint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!birthDate || !comparableSex ? (
          <p className="text-sm text-muted-foreground">{t("growth.chartsNeedSex")}</p>
        ) : (
          charts.map((chart) => (
            <MetricChart
              key={chart.metric}
              metric={chart.metric}
              label={chart.label}
              unit={chart.unit}
              sex={comparableSex}
              birthDate={birthDate}
              entries={entries}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
