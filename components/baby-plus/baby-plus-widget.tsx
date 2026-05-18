"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Music } from "lucide-react";
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
  getProgramEnd,
  getProgramPosition,
  parseStartDate,
  TOTAL_DAYS,
} from "@/lib/baby-plus";
import { cn } from "@/lib/utils";

export function BabyPlusWidget({ className }: { className?: string }) {
  const { data, mounted } = useAppStorage();

  if (!mounted) return <LoadingCard />;

  const { startDate, completions } = data?.babyPlus ?? {
    startDate: "",
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
            <TodayStatus startDate={parsedStart} />
            <p className="text-xs text-muted-foreground">
              Ends {format(getProgramEnd(parsedStart), "MMM d, yyyy")}
            </p>
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

function TodayStatus({ startDate }: { startDate: Date }) {
  const position = getProgramPosition(startDate);

  if (position.status === "before") {
    return (
      <p className="rounded-xl bg-muted px-3 py-2 text-sm">
        Program starts soon — get ready!
      </p>
    );
  }

  if (position.status === "after") {
    return (
      <p className="rounded-xl bg-mint/40 px-3 py-2 text-sm font-medium text-mint-foreground">
        Program complete — great job!
      </p>
    );
  }

  return (
    <p className="rounded-xl bg-lilac/40 px-3 py-2 text-sm font-medium text-lilac-foreground">
      Today: Sound {position.soundIndex + 1}, Day {position.dayIndex + 1}
    </p>
  );
}
