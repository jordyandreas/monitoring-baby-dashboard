"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  completionKey,
  countCompletions,
  formatDisplayDate,
  getBlockDates,
  getProgramEnd,
  getProgramPosition,
  isDateInFuture,
  isToday,
  parseStartDate,
  TOTAL_DAYS,
  TOTAL_SOUNDS,
} from "@/lib/baby-plus";
import { cn } from "@/lib/utils";

export function BabyPlusSchedule() {
  const [resetOpen, setResetOpen] = useState(false);
  const { data, updateBabyPlus, resetBabyPlus } = useAppStorage();
  const babyPlus = data?.babyPlus ?? { startDate: "", completions: {} };
  const { startDate, completions } = babyPlus;
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
    updateBabyPlus((prev) => ({ ...prev, startDate: value }));
  };

  const toggleCompletion = (
    soundIndex: number,
    dayIndex: number,
    checked: boolean,
  ) => {
    const key = completionKey(soundIndex, dayIndex);
    updateBabyPlus((prev) => ({
      ...prev,
      completions: {
        ...prev.completions,
        [key]: checked,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <Label htmlFor="start-date">Program start date</Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          disabled={hasCompletions && !!startDate}
          className="min-h-11 rounded-xl"
        />
        {hasCompletions && startDate && (
          <p className="text-xs text-muted-foreground">
            Start date is locked after your first check-in. Reset the program to
            change it.
          </p>
        )}
        {parsedStart && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-semibold">
                {completed} / {TOTAL_DAYS}
              </span>
            </div>
            <Progress value={(completed / TOTAL_DAYS) * 100} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Ends {format(getProgramEnd(parsedStart), "EEEE, MMM d, yyyy")}
            </p>
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
              Reset program
            </Button>
            <ConfirmDialog
              open={resetOpen}
              onOpenChange={setResetOpen}
              description="Reset the entire Baby Plus program? All checkmarks will be cleared."
              onConfirm={resetBabyPlus}
              confirmVariant="destructive"
            />
          </>
        )}
      </section>

      {!parsedStart ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Choose a start date above to see your 16-sound schedule.
        </p>
      ) : (
        <Accordion
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
                className="overflow-hidden rounded-2xl border border-border/60 bg-card px-4 shadow-sm"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex flex-1 items-center gap-2 pr-2 text-left">
                    <span className="font-semibold">
                      Sound {soundIndex + 1}
                    </span>
                    {blockDone && (
                      <Badge
                        variant="outline"
                        className="border-mint/60 bg-mint/30 text-mint-foreground"
                      >
                        <Check className="size-3" />
                        Done
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="bg-lilac/60 text-lilac-foreground">
                        Current
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
                              Day {dayIndex + 1}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDisplayDate(date)}
                              {today && " · Today"}
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
