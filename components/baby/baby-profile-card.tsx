"use client";

import { useState } from "react";
import { Baby, Calendar, Pencil } from "lucide-react";
import { BabyProfileForm } from "./baby-profile-form";
import { BabyProfileDialog } from "./baby-profile-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingCard } from "@/components/layout/loading-card";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  formatDueDate,
  genderBadgeClass,
  genderLabel,
  getDueDateCountdown,
} from "@/lib/baby-utils";

export function BabyProfileCard() {
  const { data, mounted, setBaby } = useAppStorage();
  const [open, setOpen] = useState(false);

  if (!mounted) return <LoadingCard />;

  const baby = data?.baby;

  if (!baby) {
    return (
      <Card className="overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-lilac/30 via-card to-secondary/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Baby className="size-6 text-lilac-deep" />
            Your little one
          </CardTitle>
          <CardDescription>
            Add your baby&apos;s name, gender, and expected delivery date to get
            started.
          </CardDescription>
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

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-border/60 bg-gradient-to-br from-lilac/25 via-card to-mint/20 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-2xl">{baby.name}</CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={genderBadgeClass(baby.gender)}
              >
                {genderLabel(baby.gender)}
              </Badge>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => setOpen(true)}
            aria-label="Edit profile"
          >
            <Pencil className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 text-lilac-deep" />
            <span>Due {formatDueDate(baby.dueDate)}</span>
          </div>
          <p className="rounded-xl bg-lilac/40 px-4 py-3 text-sm font-medium text-lilac-foreground">
            {getDueDateCountdown(baby.dueDate)}
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
