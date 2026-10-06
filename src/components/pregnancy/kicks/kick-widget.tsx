"use client";

import { FeatureLink } from "@/components/layout/feature-link";
import { ChevronRight, Footprints } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCardSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useRemote } from "@/hooks/use-remote";
import { getKicksForDate, getKicksInRange, getTodayDateStr, getTopHours } from "@/lib/pregnancy/kicks";
import { listKicks } from "@/services/kicks.service";
import { cn } from "@/utils/cn";

export function KickWidget({ className }: { className?: string }) {
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("kicks", listKicks, signedIn);
  const { t } = useLocale();

  const placeholder = remotePlaceholder(
    ready,
    error,
    data,
    reload,
    <DashboardCardSkeleton className={className} lines={3} />,
  );
  if (placeholder) return placeholder;

  const kicks = data ?? [];
  const last7 = getKicksInRange(kicks, 7).length;
  const todayCount = getKicksForDate(kicks, getTodayDateStr()).length;
  const topHours = getTopHours(kicks, 7);

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-2xl bg-gradient-to-br from-secondary/40 to-white/20 shadow-sm",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Footprints className="size-5 text-lilac-deep" />
          {t("kicks.title")}
        </CardTitle>
        <CardDescription>{t("kicks.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="min-h-[7.5rem] rounded-xl bg-card/80 px-4 py-3">
          <p className="text-2xl font-bold tabular-nums">{last7}</p>
          <p className="text-sm text-muted-foreground">{t("kicks.last7Days")}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {todayCount} {t("kicks.kicksToday")}
          </p>
        </div>
        <div className="flex min-h-24 flex-1 flex-col justify-center rounded-xl bg-lilac/30 px-4 py-3">
          <p className="text-sm font-medium text-foreground">{t("kicks.mostActive")}</p>
          {topHours.length > 0 ? (
            <ul className="mt-2.5 space-y-2">
              {topHours.map((slot) => (
                <li key={slot.hour} className="flex items-center gap-2 text-sm">
                  <span className="w-[4.5rem] shrink-0 font-medium">{slot.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full bg-lilac-deep"
                      style={{
                        width: `${(slot.count / (topHours[0]?.count ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-right text-muted-foreground tabular-nums">
                    {slot.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">{t("kicks.logToSeePatterns")}</p>
          )}
        </div>
        <FeatureLink
          href="/kicks"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-auto min-h-11 w-full rounded-xl",
          )}
        >
          {t("kicks.open")}
          <ChevronRight className="size-4" />
        </FeatureLink>
      </CardContent>
    </Card>
  );
}
