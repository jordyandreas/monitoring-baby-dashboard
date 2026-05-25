"use client";

import Link from "next/link";
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
import { LoadingCard } from "@/components/layout/loading-card";
import { useLocale } from "@/components/providers/locale-provider";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  countCompleted,
  formatVitaminDate,
  getNamedVitamins,
  getTodayDateStr,
} from "@/lib/vitamins";
import { cn } from "@/lib/utils";

export function VitaminWidget({ className }: { className?: string }) {
  const { data, mounted } = useAppStorage();
  const { locale, t } = useLocale();

  if (!mounted) return <LoadingCard />;

  const vitamins = data?.vitamins ?? {
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
        "flex h-full flex-col rounded-2xl border-border/60 bg-gradient-to-br from-secondary/40 to-card shadow-sm",
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

        <Link
          href="/vitamins"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-auto min-h-11 w-full rounded-xl",
          )}
        >
          {total === 0 ? t("vitamins.setup") : t("vitamins.open")}
          <ChevronRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
