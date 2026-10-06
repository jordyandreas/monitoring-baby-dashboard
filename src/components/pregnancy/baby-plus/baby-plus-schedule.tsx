"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgramEndsLine } from "@/components/pregnancy/baby-plus/program-ends-line";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { Progress } from "@/components/ui/progress";
import { BabyPlusSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import {
  completionKey,
  countCompletions,
  formatDisplayDate,
  getBlockDates,
  getProgramPosition,
  isDateInFuture,
  isToday,
  parseStartDate,
  TOTAL_DAYS,
  TOTAL_SOUNDS,
} from "@/lib/pregnancy/baby-plus";
import type { BabyPlusState } from "@/lib/pregnancy/types";
import { DEFAULT_STORAGE } from "@/lib/pregnancy/types";
import { getBabyPlus, saveBabyPlus } from "@/services/baby-plus.service";
import { cn } from "@/utils/cn";

export function BabyPlusSchedule() {
  const { locale, t } = useLocale();
  const { signedIn } = useSupabase();
  const [resetOpen, setResetOpen] = useState(false);
  const { data, ready, error, reload } = useRemote("babyPlus", getBabyPlus, signedIn);
  const placeholder = remotePlaceholder(ready, error, data, reload, <BabyPlusSkeleton />);
  if (placeholder) return placeholder;
  const babyPlus = data ?? DEFAULT_STORAGE.babyPlus;
  const persist = (next: BabyPlusState, detail?: string) => {
    void commitSave("babyPlus", () => saveBabyPlus(next), "save", undefined, "babyPlus", detail);
  };
  const { startDate, dailyTime, completions } = babyPlus;
  const parsedStart = parseStartDate(startDate);
  const completed = countCompletions(completions);
  const hasCompletions = completed > 0;
  const position = parsedStart
    ? getProgramPosition(parsedStart)
    : { status: "before" as const };
  const defaultOpen =
    position.status === "active"
      ? `sound-${position.soundIndex}`
      : undefined;

  const handleStartDateChange = (value: string) => {
    persist({ ...babyPlus, startDate: value });
  };

  const handleDailyTimeChange = (value: string) => {
    persist({ ...babyPlus, dailyTime: value });
  };

  const toggleCompletion = (
    soundIndex: number,
    dayIndex: number,
    checked: boolean,
  ) => {
    const key = completionKey(soundIndex, dayIndex);
    persist(
      {
        ...babyPlus,
        completions: { ...babyPlus.completions, [key]: checked },
      },
      checked
        ? t("toast.babyPlusItemSaved", { sound: soundIndex + 1, day: dayIndex + 1 })
        : undefined,
    );
  };

  return (
    <div className="space-y-6">
      <section className="min-w-0 space-y-3 rounded-2xl glass-regular p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="start-date">{t("babyPlus.programStart")}</Label>
            <DatePicker
              id="start-date"
              value={startDate}
              onChange={handleStartDateChange}
              placeholder={t("common.selectDate")}
              disabled={hasCompletions && !!startDate}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="daily-time">{t("babyPlus.dailyTime")}</Label>
            <TimePicker
              id="daily-time"
              value={dailyTime}
              onChange={handleDailyTimeChange}
              placeholder={t("common.selectTime")}
              disabled={!parsedStart}
            />
          </div>
        </div>
        {hasCompletions && startDate && (
          <p className="text-xs text-muted-foreground">{t("babyPlus.startLocked")}</p>
        )}
        {!parsedStart && (
          <p className="text-xs text-muted-foreground">{t("babyPlus.setStartFirst")}</p>
        )}
        {parsedStart && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("babyPlus.overallProgress")}</span>
              <span className="font-semibold">
                {completed} / {TOTAL_DAYS}
              </span>
            </div>
            <Progress value={(completed / TOTAL_DAYS) * 100} className="h-3" />
            <ProgramEndsLine startDate={parsedStart} dailyTime={dailyTime} />
          </div>
        )}
        {hasCompletions && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="size-4" />
              {t("babyPlus.resetProgram")}
            </Button>
            <ConfirmDialog
              open={resetOpen}
              onOpenChange={setResetOpen}
              title={t("common.confirmTitle")}
              description={t("babyPlus.resetConfirm")}
              cancelLabel={t("common.cancel")}
              confirmLabel={t("common.ok")}
              onConfirm={() => persist({ startDate: "", dailyTime: "", completions: {} })}
              confirmVariant="destructive"
            />
          </>
        )}
      </section>

      {!parsedStart ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("babyPlus.chooseStartHint")}
        </p>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={defaultOpen ? [defaultOpen] : undefined}
          className="space-y-2"
        >
          {Array.from({ length: TOTAL_SOUNDS }, (_, soundIndex) => {
            const dates = getBlockDates(parsedStart, soundIndex);
            const blockDone = dates.every(
              (_, dayIndex) =>
                completions[completionKey(soundIndex, dayIndex)],
            );
            const isCurrent =
              position.status === "active" &&
              position.soundIndex === soundIndex;

            return (
              <AccordionItem
                key={soundIndex}
                value={`sound-${soundIndex}`}
                className="overflow-hidden rounded-2xl glass-regular px-4 shadow-sm"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex flex-1 items-center gap-2 pr-2 text-left">
                    <span className="font-semibold">
                      {t("babyPlus.sound")} {soundIndex + 1}
                    </span>
                    {blockDone && (
                      <Badge
                        variant="outline"
                        className="border-mint/60 bg-mint/30 text-mint-foreground"
                      >
                        <Check className="size-3" />
                        {t("common.done")}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="bg-lilac/60 text-lilac-foreground">
                        {t("common.current")}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-2">
                    {dates.map((date, dayIndex) => {
                      const key = completionKey(soundIndex, dayIndex);
                      const done = !!completions[key];
                      const future = isDateInFuture(date);
                      const today = isToday(date);

                      return (
                        <li
                          key={key}
                          className={cn(
                            "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                            today && "border-lilac-deep/40 bg-lilac/40",
                            future && "opacity-50",
                            done && !today && "bg-mint/15",
                          )}
                        >
                          <Checkbox
                            id={key}
                            checked={done}
                            disabled={future}
                            onCheckedChange={(checked) =>
                              toggleCompletion(
                                soundIndex,
                                dayIndex,
                                checked === true,
                              )
                            }
                          />
                          <label
                            htmlFor={key}
                            className={cn(
                              "flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm",
                              future && "cursor-not-allowed",
                            )}
                          >
                            <span className="font-medium">
                              {t("common.day")} {dayIndex + 1}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDisplayDate(date, locale)}
                              {today && ` · ${t("common.today")}`}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
