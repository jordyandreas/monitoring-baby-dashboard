"use client";

import { FeatureLink } from "@/components/layout/feature-link";
import { ChevronRight, Music } from "lucide-react";
import { ProgramEndsLine } from "@/components/pregnancy/baby-plus/program-ends-line";
import { TodayListeningStatus } from "@/components/pregnancy/baby-plus/today-listening-status";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardCardSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useRemote } from "@/hooks/use-remote";
import {
  countCompletions,
  parseStartDate,
  TOTAL_DAYS,
} from "@/lib/pregnancy/baby-plus";
import { getBabyPlus } from "@/services/baby-plus.service";
import { cn } from "@/utils/cn";

export function BabyPlusWidget({ className }: { className?: string }) {
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("babyPlus", getBabyPlus, signedIn);
  const { t } = useLocale();

  const placeholder = remotePlaceholder(
    ready,
    error,
    data,
    reload,
    <DashboardCardSkeleton className={className} lines={2} />,
  );
  if (placeholder) return placeholder;

  const { startDate, dailyTime, completions } = data ?? {
    startDate: "",
    dailyTime: "",
    completions: {},
  };
  const parsedStart = parseStartDate(startDate);
  const completed = countCompletions(completions);
  const progressPercent = (completed / TOTAL_DAYS) * 100;

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-2xl bg-gradient-to-br from-secondary/40 to-white/20 shadow-sm",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="size-5 text-lilac-deep" />
          {t("babyPlus.title")}
        </CardTitle>
        <CardDescription>{t("babyPlus.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        {!parsedStart ? (
          <p className="text-sm text-muted-foreground">{t("babyPlus.setStartHint")}</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("common.progress")}</span>
                <span className="font-semibold">
                  {t("babyPlus.daysProgress", {
                    completed,
                    total: TOTAL_DAYS,
                  })}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
            </div>
            <TodayListeningStatus
              startDate={parsedStart}
              dailyTime={dailyTime}
              completions={completions}
            />
            <ProgramEndsLine startDate={parsedStart} dailyTime={dailyTime} />
          </>
        )}
        <FeatureLink
          href="/baby-plus"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-auto min-h-11 w-full rounded-xl",
          )}
        >
          {t("babyPlus.open")}
          <ChevronRight className="size-4" />
        </FeatureLink>
      </CardContent>
    </Card>
  );
}
