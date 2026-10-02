import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { WHO_LMS, type LmsRow } from "@/lib/child/who-lms";

export type WhoMetric = "weight" | "length" | "head";
export type WhoSex = "boy" | "girl";

export const WHO_CHART_PERCENTILES = [3, 15, 50, 85, 97] as const;
export type WhoChartPercentile = (typeof WHO_CHART_PERCENTILES)[number];

const WHO_MAX_DAY = 1826;

const Z_BY_PERCENTILE: Record<WhoChartPercentile, number> = {
  3: -1.8807936081512509,
  15: -1.0364333894937896,
  50: 0,
  85: 1.0364333894937896,
  97: 1.8807936081512509,
};

export function measurementAgeDays(birthDate: string, onDate: string): number | null {
  const birth = parseISO(birthDate);
  const on = parseISO(onDate);
  if (!isValid(birth) || !isValid(on)) return null;
  const days = differenceInCalendarDays(on, birth);
  if (days < 0) return null;
  return days;
}

export function whoSex(sex: string | null | undefined): WhoSex | null {
  if (sex === "boy" || sex === "girl") return sex;
  return null;
}

function tableFor(metric: WhoMetric, sex: WhoSex): readonly LmsRow[] {
  return WHO_LMS[metric][sex];
}

/** Linear interpolation of L, M, and S between the stored age knots. */
export function whoLms(
  metric: WhoMetric,
  sex: WhoSex,
  ageDays: number,
): { l: number; m: number; s: number } | null {
  if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > WHO_MAX_DAY) return null;
  const rows = tableFor(metric, sex);
  const last = rows.length - 1;
  if (ageDays < rows[0][0] || ageDays > rows[last][0]) return null;

  let lo = 0;
  let hi = last;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const day = rows[mid][0];
    if (day === ageDays) {
      return { l: rows[mid][1], m: rows[mid][2], s: rows[mid][3] };
    }
    if (day < ageDays) lo = mid + 1;
    else hi = mid - 1;
  }

  const lower = rows[hi];
  const upper = rows[lo];
  if (!lower || !upper || upper[0] === lower[0]) return null;
  const t = (ageDays - lower[0]) / (upper[0] - lower[0]);
  return {
    l: lower[1] + (upper[1] - lower[1]) * t,
    m: lower[2] + (upper[2] - lower[2]) * t,
    s: lower[3] + (upper[3] - lower[3]) * t,
  };
}

export function lmsZScore(
  value: number,
  lms: { l: number; m: number; s: number },
): number | null {
  if (!Number.isFinite(value) || value <= 0 || lms.m <= 0 || lms.s <= 0) return null;
  if (Math.abs(lms.l) < 1e-7) return Math.log(value / lms.m) / lms.s;
  const ratio = value / lms.m;
  if (ratio <= 0) return null;
  return (ratio ** lms.l - 1) / (lms.l * lms.s);
}

/** Standard normal CDF. Returns a probability from 0 to 1. */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const density = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const tail =
    density *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const upper = 1 - tail;
  return z >= 0 ? upper : 1 - upper;
}

/** Percentile from 0 to 100, or null when age or value is outside the WHO tables. */
export function whoPercentile(
  metric: WhoMetric,
  sex: WhoSex,
  ageDays: number,
  value: number,
): number | null {
  const lms = whoLms(metric, sex, ageDays);
  if (!lms) return null;
  const z = lmsZScore(value, lms);
  if (z == null || !Number.isFinite(z)) return null;
  return normalCdf(z) * 100;
}

export function whoValueAtPercentile(
  metric: WhoMetric,
  sex: WhoSex,
  ageDays: number,
  percentile: WhoChartPercentile,
): number | null {
  const lms = whoLms(metric, sex, ageDays);
  if (!lms) return null;
  const z = Z_BY_PERCENTILE[percentile];
  if (Math.abs(lms.l) < 1e-7) return lms.m * Math.exp(lms.s * z);
  const base = 1 + lms.l * lms.s * z;
  if (base <= 0) return null;
  return lms.m * base ** (1 / lms.l);
}

export function whoSeries(
  metric: WhoMetric,
  sex: WhoSex,
  percentile: WhoChartPercentile,
  toDay: number,
): { ageDays: number; value: number }[] {
  const end = Math.min(WHO_MAX_DAY, Math.max(0, toDay));
  const points: { ageDays: number; value: number }[] = [];
  for (let day = 0; day <= end; day += 7) {
    const value = whoValueAtPercentile(metric, sex, day, percentile);
    if (value != null) points.push({ ageDays: day, value });
  }
  if (end % 7 !== 0) {
    const value = whoValueAtPercentile(metric, sex, end, percentile);
    if (value != null) points.push({ ageDays: end, value });
  }
  return points;
}

export function describePercentile(
  percentile: number,
): { kind: "low" } | { kind: "high" } | { kind: "about"; n: number } {
  if (percentile < 0.5) return { kind: "low" };
  if (percentile > 99.5) return { kind: "high" };
  return { kind: "about", n: Math.round(percentile) };
}

export function englishOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** X-axis end for a chart: at least about six months, a month past the last point, and at most 5 years. */
export function chartEndDay(ageDays: number[]): number {
  const latest = ageDays.length > 0 ? Math.max(...ageDays) : 0;
  return Math.min(WHO_MAX_DAY, Math.max(183, latest + 31));
}
