"use client";

import Link from "next/link";
import { ChevronRight, Music } from "lucide-react";
import { ProgramEndsLine } from "@/components/baby-plus/program-ends-line";
import { TodayListeningStatus } from "@/components/baby-plus/today-listening-status";
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
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  countCompletions,
  parseStartDate,
  TOTAL_DAYS,
} from "@/lib/baby-plus";
import { cn } from "@/lib/utils";

export function BabyPlusWidget({ className }: { className?: string }) {
  const { data, mounted } = useAppStorage();

  if (!mounted) return <LoadingCard />;

  const { startDate, dailyTime, completions } = data?.babyPlus ?? {
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
        "flex h-full flex-col rounded-2xl border-border/60 bg-gradient-to-br from-secondary/50 to-card shadow-sm",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="size-5 text-lilac-deep" />
          Baby Plus
        </CardTitle>
        <CardDescription>
          16 sounds · 9 days each · belly learning program
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        {!parsedStart ? (
          <p className="text-sm text-muted-foreground">
            Set a start date to begin your 144-day listening journey.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">
                  {completed} / {TOTAL_DAYS} days
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
            </div>
            <TodayListeningStatus
              startDate={parsedStart}
              dailyTime={dailyTime}
              completions={completions}
            />
            <ProgramEndsLine
              startDate={parsedStart}
              dailyTime={dailyTime}
              dateFormat="MMM d, yyyy"
            />
          </>
        )}
        <Link
          href="/baby-plus"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-auto min-h-11 w-full rounded-xl",
          )}
        >
          Open Baby Plus
          <ChevronRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
