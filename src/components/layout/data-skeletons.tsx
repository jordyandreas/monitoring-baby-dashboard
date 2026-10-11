"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

const CHART_BARS = [46, 72, 28, 64, 80, 36, 58];

export function LoadFailed({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const { t } = useLocale();
  return (
    <div role="alert" className={cn("rounded-2xl glass-regular px-4 py-8 text-center", className)}>
      <p className="text-sm font-medium text-foreground">{t("common.loadFailed")}</p>
      <Button type="button" className="mt-4 min-h-11 rounded-full px-5" onClick={onRetry}>
        {t("toast.retry")}
      </Button>
    </div>
  );
}

/** Skeleton while the first load is in flight, or a retry prompt if it failed. */
export function remotePlaceholder(
  ready: boolean,
  error: string | null,
  data: unknown,
  reload: () => void,
  skeleton: ReactNode,
): ReactNode | null {
  if (!ready) return skeleton;
  if (error && data == null) return <LoadFailed onRetry={reload} />;
  return null;
}

function SkeletonStatus({ className, children }: { className?: string; children: ReactNode }) {
  const { t } = useLocale();
  return (
    <div className={className} role="status" aria-busy="true" aria-label={t("common.loading")}>
      {children}
    </div>
  );
}

function ChartBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-28 items-end gap-1 rounded-xl border border-border/50 bg-muted/20 px-2 pt-3 pb-2", className)}>
      {CHART_BARS.map((height, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <Skeleton className="w-full max-w-8 rounded-t-sm" style={{ height }} />
          <Skeleton className="h-2 w-4" />
        </div>
      ))}
    </div>
  );
}

function LogRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl glass-regular px-4 py-3 shadow-sm">
      <Skeleton className="h-4 w-16" />
      <span className="h-8 w-px shrink-0 bg-border" />
      <Skeleton className="size-8 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

function DayStrip() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} className="h-14 w-12 shrink-0 rounded-2xl" />
      ))}
    </div>
  );
}

function LastLogSkeleton() {
  return (
    <div className="h-full rounded-2xl bg-lilac/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="hidden h-3 w-24 sm:block" />
      </div>
      <Skeleton className="mt-2 h-6 w-28" />
      <Skeleton className="mt-2 h-3 w-24 sm:hidden" />
      <Skeleton className="mt-2 h-4 w-40" />
    </div>
  );
}

function NextLogSkeleton() {
  return (
    <div className="h-full rounded-2xl bg-lilac/60 px-4 py-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-6 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

function IntervalSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-36" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="space-y-2 rounded-xl bg-lilac/40 px-3 py-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <div className="space-y-2 rounded-xl bg-baby-sky/40 px-3 py-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="space-y-2 rounded-xl bg-mint/40 px-3 py-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormCard({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4 rounded-2xl glass-regular p-4">
      <Skeleton className="h-5 w-36" />
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}

export function ChildHomeSkeleton() {
  return (
    <SkeletonStatus className="space-y-6">
      <section className="rounded-2xl glass-regular p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="size-9 rounded-full" />
        </div>
      </section>
      <section className="space-y-4 rounded-2xl glass-regular p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4 rounded-2xl glass-regular p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-start gap-3 rounded-2xl bg-muted/40 px-3 py-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-16" />
                {index < 3 ? <Skeleton className="h-3 w-24" /> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-12 rounded-2xl" />
        ))}
      </div>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <LogRow />
        <LogRow />
        <LogRow />
      </section>
      <section className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-2xl" />
          ))}
        </div>
      </section>
    </SkeletonStatus>
  );
}

export function LogPageSkeleton({
  tiles = 4,
  withLast = false,
  withNext = false,
  withLastPair = false,
}: {
  tiles?: number;
  withLast?: boolean;
  withNext?: boolean;
  withLastPair?: boolean;
}) {
  return (
    <SkeletonStatus className="w-full min-w-0 space-y-6">
      {withLast ? (
        withNext ? (
          <div className="grid grid-cols-2 items-stretch gap-2">
            <LastLogSkeleton />
            <NextLogSkeleton />
          </div>
        ) : withLastPair ? (
          <div className="grid grid-cols-2 items-stretch gap-2">
            <LastLogSkeleton />
            <LastLogSkeleton />
          </div>
        ) : (
          <LastLogSkeleton />
        )
      ) : null}
      <FormCard fields={3} />
      <section className="space-y-5 rounded-2xl glass-regular p-5 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
        <div className={cn("grid gap-3", tiles === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {Array.from({ length: tiles }, (_, index) => (
            <div key={index} className="space-y-2 rounded-xl bg-lilac/20 px-3 py-3">
              <Skeleton className="mx-auto h-7 w-16" />
              <Skeleton className="mx-auto h-3 w-20" />
            </div>
          ))}
        </div>
        {withLast ? <IntervalSkeleton /> : null}
        <ChartBars />
      </section>
      <section className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <DayStrip />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <LogRow />
        <LogRow />
        <LogRow />
      </section>
    </SkeletonStatus>
  );
}

export function GrowthPageSkeleton() {
  return (
    <SkeletonStatus className="w-full min-w-0 space-y-6">
      <section className="space-y-4 rounded-2xl glass-regular p-5 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2 rounded-2xl bg-muted/40 p-4">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
      <FormCard fields={2} />
      <section className="space-y-3 rounded-2xl glass-regular p-5 shadow-sm">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-2xl bg-muted/50 p-3">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </section>
    </SkeletonStatus>
  );
}

export function ListPageSkeleton() {
  return (
    <SkeletonStatus className="w-full min-w-0 space-y-6">
      <FormCard />
      <section className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl glass-regular">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="size-8 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonStatus>
  );
}

export function MilestonesSkeleton() {
  return (
    <SkeletonStatus className="w-full min-w-0 space-y-3">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="space-y-3 rounded-2xl glass-regular p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </SkeletonStatus>
  );
}

export function ProfileCardSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonStatus
      className={cn(
        "h-full space-y-4 rounded-2xl glass-regular bg-gradient-to-br from-secondary/40 to-white/20 p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="size-9 rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
    </SkeletonStatus>
  );
}

export function DashboardCardSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <SkeletonStatus
      className={cn(
        "flex h-full flex-col space-y-4 rounded-2xl glass-regular bg-gradient-to-br from-secondary/35 to-white/20 p-5 shadow-sm",
        className,
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-2 rounded-xl bg-card/80 px-4 py-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
      </div>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
      <Skeleton className="mt-auto h-11 w-full rounded-xl" />
    </SkeletonStatus>
  );
}

export function SummaryChartSkeleton() {
  return (
    <SkeletonStatus className="space-y-4 rounded-2xl glass-regular p-5 shadow-sm">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 flex-1 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <ChartBars />
    </SkeletonStatus>
  );
}

export function HistoryListSkeleton() {
  return (
    <SkeletonStatus className="space-y-3">
      <DayStrip />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <LogRow />
      <LogRow />
      <LogRow />
    </SkeletonStatus>
  );
}

export function VitaminTrackerSkeleton() {
  return (
    <SkeletonStatus className="space-y-6">
      <FormCard fields={3} />
      <section className="space-y-3 rounded-2xl glass-regular p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-5 rounded-sm" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </section>
    </SkeletonStatus>
  );
}

export function BabyPlusSkeleton() {
  return (
    <SkeletonStatus className="space-y-6">
      <section className="space-y-4 rounded-2xl glass-regular p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-4 w-48" />
      </section>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-2xl" />
      ))}
    </SkeletonStatus>
  );
}

export function ReminderSkeleton() {
  return (
    <SkeletonStatus className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      ))}
    </SkeletonStatus>
  );
}
