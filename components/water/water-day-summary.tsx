"use client";

import { AlertCircle, CheckCircle2, Droplets, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import {
  formatVolume,
  getDayStatus,
  getDayTotalMl,
  getProgressPercent,
  mlToGlasses,
  WATER_MIN_ML,
  WATER_TARGET_ML,
  type WaterDayStatus,
} from "@/lib/water";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  WaterDayStatus,
  { icon: typeof Droplets; className: string; badgeClass: string }
> = {
  empty: {
    icon: Droplets,
    className: "text-muted-foreground",
    badgeClass: "bg-muted/80 text-muted-foreground",
  },
  low: {
    icon: AlertCircle,
    className: "text-amber-600 dark:text-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  good: {
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  },
  above: {
    icon: TrendingUp,
    className: "text-sky-600 dark:text-sky-500",
    badgeClass: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  },
};

export function WaterDaySummary({
  record,
  glassSizeMl,
  muted = false,
}: {
  record: { entries: { amountMl: number }[] };
  glassSizeMl: number;
  muted?: boolean;
}) {
  const { locale, t } = useLocale();
  const totalMl = getDayTotalMl(record.entries);
  const status = getDayStatus(totalMl);
  const progress = getProgressPercent(totalMl);
  const glasses = mlToGlasses(totalMl, glassSizeMl);
  const { icon: StatusIcon, className, badgeClass } = statusStyles[status];

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-border/60 p-4 shadow-sm",
        muted ? "bg-muted/30" : "bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tabular-nums">
            {formatVolume(totalMl, locale)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("water.glassesCount", {
              count: glasses,
              size: formatVolume(glassSizeMl, locale),
            })}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            badgeClass,
          )}
        >
          <StatusIcon className={cn("size-3.5 shrink-0", className)} />
          {t(`water.status.${status}`)}
        </span>
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>
            {t("water.goalMin", { amount: formatVolume(WATER_MIN_ML, locale) })}
          </span>
          <span>
            {t("water.goalMax", { amount: formatVolume(WATER_TARGET_ML, locale) })}
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
        <p className="mt-1.5 text-xs text-muted-foreground">{t("water.guideline")}</p>
      </div>
    </div>
  );
}
