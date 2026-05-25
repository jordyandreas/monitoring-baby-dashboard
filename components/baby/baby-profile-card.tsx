"use client";

import { useState } from "react";
import { Baby, Calendar, Heart, Pencil } from "lucide-react";
import { BabyProfileForm } from "./baby-profile-form";
import { BabyProfileDialog } from "./baby-profile-dialog";
import { GenderBadge } from "./gender-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingCard } from "@/components/layout/loading-card";
import { useLocale } from "@/components/providers/locale-provider";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  formatDueDate,
  getBabyGreeting,
  getDueDateCountdown,
  getPregnancyProgress,
} from "@/lib/i18n/baby";
import { cn } from "@/lib/utils";

export function BabyProfileCard({ className }: { className?: string }) {
  const { data, mounted, setBaby } = useAppStorage();
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);

  if (!mounted) return <LoadingCard />;

  const baby = data?.baby;

  if (!baby) {
    return (
      <Card
        className={cn(
          "h-full overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-secondary/50 to-card shadow-sm",
          className,
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Baby className="size-6 text-lilac-deep" />
            {t("baby.yourLittleOne")}
          </CardTitle>
          <CardDescription>{t("baby.addProfileHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BabyProfileForm
            onSave={(profile) => {
              setBaby(profile);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const pregnancy = getPregnancyProgress(baby.dueDate, t, locale);
  const greeting = getBabyGreeting(baby.name, baby.gender, t);

  return (
    <>
      <Card
        className={cn(
          "h-full overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-secondary/50 to-card shadow-sm",
          className,
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium leading-relaxed text-lilac-deep/90">
              {greeting}
            </p>
            <CardTitle className="text-2xl leading-tight">{baby.name}</CardTitle>
            <GenderBadge gender={baby.gender} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => setOpen(true)}
            aria-label={t("baby.editProfile")}
          >
            <Pencil className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-lilac/30 bg-lilac/20 px-4 py-3">
              <Heart className="mt-0.5 size-5 shrink-0 text-lilac-deep" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("baby.pregnancy")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {pregnancy.weekDisplay}
                </p>
                {pregnancy.trimesterLabel ? (
                  <p className="text-sm font-medium text-lilac-deep">
                    {pregnancy.trimesterLabel}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">{pregnancy.label}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3">
              <Calendar className="mt-0.5 size-5 shrink-0 text-lilac-deep" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("baby.expectedDelivery")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDueDate(baby.dueDate, locale)}
                </p>
              </div>
            </div>
          </div>

          <p className="rounded-xl bg-lilac/40 px-4 py-3 text-center text-sm font-medium text-lilac-foreground">
            {getDueDateCountdown(baby.dueDate, t)}
          </p>
        </CardContent>
      </Card>

      <BabyProfileDialog
        open={open}
        onOpenChange={setOpen}
        initial={baby}
        onSave={(profile) => {
          setBaby(profile);
          setOpen(false);
        }}
      />
    </>
  );
}
