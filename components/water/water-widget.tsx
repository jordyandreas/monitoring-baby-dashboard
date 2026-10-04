"use client";

import { FeatureLink } from "@/components/layout/feature-link";
import { ChevronRight, Droplets } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardCardSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  countDaysMetGoal,
  formatVolume,
  getDayTotalMl,
  getProgressPercent,
  getTodayDateStr,
  getWaterForDate,
  getWaterPerDay,
  mlToGlasses,
} from "@/lib/water";
import { cn } from "@/lib/utils";

export function WaterWidget({ className }: { className?: string }) {
  const { data, mounted } = useAppStorage();
  const { locale, t } = useLocale();
  const pending = useRemoteDataPending();

  if (!mounted || pending) return <DashboardCardSkeleton className={className} lines={2} />;

  const entries = data?.water.entries ?? [];
  const glassSizeMl = data?.water.glassSizeMl ?? 250;
  const todayStr = getTodayDateStr();
  const todayEntries = getWaterForDate(entries, todayStr);
  const todayMl = getDayTotalMl(todayEntries);
  const todayProgress = getProgressPercent(todayMl);
  const todayGlasses = mlToGlasses(todayMl, glassSizeMl);

  const weekDays = getWaterPerDay(entries, 7, new Date(), locale);
  const daysMetGoal = countDaysMetGoal(weekDays);

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-2xl bg-gradient-to-br from-secondary/35 to-white/20 shadow-sm",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Droplets className="size-5 text-lilac-deep" />
          {t("water.title")}
        </CardTitle>
        <CardDescription>{t("water.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="min-h-[7.5rem] rounded-xl bg-card/80 px-4 py-3">
          <p className="text-2xl font-bold tabular-nums">
            {formatVolume(todayMl, locale)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("water.todayGlasses", { count: todayGlasses })}
          </p>
          <Progress value={todayProgress} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{t("water.guidelineShort")}</p>
        </div>

        <div className="flex min-h-24 flex-1 flex-col justify-center rounded-xl bg-lilac/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">{t("water.weekMetGoal")}</p>
          <p className="mt-1 text-muted-foreground">
            {t("water.weekMetGoalDetail", { met: daysMetGoal, total: 7 })}
          </p>
        </div>

        <FeatureLink
          href="/water"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-auto min-h-11 w-full rounded-xl",
          )}
        >
          {t("water.open")}
          <ChevronRight className="size-4" />
        </FeatureLink>
      </CardContent>
    </Card>
  );
}
