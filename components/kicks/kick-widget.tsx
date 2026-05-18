"use client";

import Link from "next/link";
import { ChevronRight, Footprints } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingCard } from "@/components/layout/loading-card";
import { useAppStorage } from "@/hooks/use-app-storage";
import { getKicksInRange, getTopHours } from "@/lib/kicks";
import { cn } from "@/lib/utils";

export function KickWidget() {
  const { data, mounted } = useAppStorage();

  if (!mounted) return <LoadingCard />;

  const kicks = data?.kicks ?? [];
  const last7 = getKicksInRange(kicks, 7).length;
  const topHours = getTopHours(kicks, 7, 1);

  return (
    <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-mint/25 to-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Footprints className="size-5 text-lilac-deep" />
          Baby kicks
        </CardTitle>
        <CardDescription>Track movement patterns over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-card/80 px-4 py-3">
          <p className="text-2xl font-bold">{last7}</p>
          <p className="text-sm text-muted-foreground">kicks in the last 7 days</p>
        </div>
        {topHours[0] && (
          <p className="text-sm text-muted-foreground">
            Most active around{" "}
            <span className="font-semibold text-foreground">
              {topHours[0].label}
            </span>
          </p>
        )}
        <Link
          href="/kicks"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "min-h-11 w-full rounded-xl",
          )}
        >
          Open kick monitor
          <ChevronRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
