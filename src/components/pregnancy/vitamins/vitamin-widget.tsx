"use client";

import { FeatureLink } from "@/components/layout/feature-link";
import { ChevronRight, Pill } from "lucide-react";
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
import { useSupabase } from "@/components/providers/supabase-provider";
import { useRemote } from "@/hooks/use-remote";
import {
  countCompleted,
  formatVitaminDate,
  getNamedVitamins,
  getTodayDateStr,
} from "@/lib/pregnancy/vitamins";
import { getVitamins } from "@/services/vitamins.service";
import { cn } from "@/utils/cn";

export function VitaminWidget({ className }: { className?: string }) {
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("vitamins", getVitamins, signedIn);
  const { locale, t } = useLocale();

  if (!ready) return <DashboardCardSkeleton className={className} lines={2} />;

  const vitamins = data ?? {
    items: [],
    today: { date: "", completed: {} },
    yesterday: null,
  };

  const named = getNamedVitamins(vitamins.items);
  const todayRecord = vitamins.today.date
    ? vitamins.today
    : { date: getTodayDateStr(), completed: {} };
  const done = countCompleted(vitamins.items, todayRecord.completed);
  const total = named.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  const remaining = named.filter((item) => !todayRecord.completed[item.id]);

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-2xl bg-gradient-to-br from-secondary/35 to-white/20 shadow-sm",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pill className="size-5 text-lilac-deep" />
          {t("vitamins.title")}
        </CardTitle>
        <CardDescription>{t("vitamins.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">{t("vitamins.emptyHint")}</p>
        ) : (
          <>
            <div className="rounded-xl bg-card/80 px-4 py-3">
              <p className="text-2xl font-bold">
                {done}
                <span className="text-lg font-medium text-muted-foreground">
                  {" "}
                  / {total}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {t("vitamins.takenToday", {
                  date: formatVitaminDate(todayRecord.date, locale),
                })}
              </p>
              <Progress value={progress} className="mt-3 h-2" />
            </div>

            {done === total ? (
              <p className="rounded-xl bg-lilac/30 px-3 py-2 text-center text-sm font-medium text-lilac-foreground">
                {t("vitamins.allDone")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t("vitamins.left", { count: remaining.length })}
                </span>{" "}
                {remaining
                  .slice(0, 3)
                  .map((v) => v.name)
                  .join(", ")}
                {remaining.length > 3 &&
                  ` ${t("vitamins.more", { count: remaining.length - 3 })}`}
              </p>
            )}
          </>
        )}

        <FeatureLink
          href="/vitamins"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-auto min-h-11 w-full rounded-xl",
          )}
        >
          {total === 0 ? t("vitamins.setup") : t("vitamins.open")}
          <ChevronRight className="size-4" />
        </FeatureLink>
      </CardContent>
    </Card>
  );
}
