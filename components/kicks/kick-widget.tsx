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
import { DashboardCardSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { useAppStorage } from "@/hooks/use-app-storage";
import { getKicksInRange, getTopHours } from "@/lib/kicks";
import { cn } from "@/lib/utils";

export function KickWidget({ className }: { className?: string }) {
  const { data, mounted } = useAppStorage();
  const { t } = useLocale();
  const pending = useRemoteDataPending();

  if (!mounted || pending) return <DashboardCardSkeleton className={className} lines={3} />;

  const kicks = data?.kicks ?? [];
  const last7 = getKicksInRange(kicks, 7).length;
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
      <CardContent className="flex flex-1 flex-col space-y-4">
        <div className="rounded-xl bg-card/80 px-4 py-3">
          <p className="text-2xl font-bold">{last7}</p>
          <p className="text-sm text-muted-foreground">{t("kicks.last7Days")}</p>
        </div>
        {topHours.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("kicks.mostActive")}
            </p>
            <ul className="space-y-1.5">
              {topHours.map((slot) => (
                <li
                  key={slot.hour}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="w-[4.5rem] shrink-0 font-medium">
                    {slot.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-lilac/30">
                    <div
                      className="h-full rounded-full bg-lilac-deep"
                      style={{
                        width: `${(slot.count / (topHours[0]?.count ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {slot.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
