"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const WINDOW = 7;

export function DateDayStrip({
  selectedDate,
  onSelect,
  markedDates,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  markedDates: string[];
}) {
  const { locale, t } = useLocale();
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const dfLocale = locale === "id" ? idLocale : enUS;
  const marks = new Set(markedDates);
  const center = startOfDay(anchor);
  const days = Array.from({ length: WINDOW * 2 + 1 }, (_, index) => {
    const day = addDays(center, index - WINDOW);
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      label: format(day, "EEE, d MMM yyyy", { locale: dfLocale }),
      weekday: format(day, "EEE", { locale: dfLocale }),
      dayNumber: format(day, "d", { locale: dfLocale }),
      marked: marks.has(date),
    };
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const button = selectedRef.current;
      const scroller = scrollerRef.current;
      if (!button || !scroller) return;
      const buttonBox = button.getBoundingClientRect();
      const scrollerBox = scroller.getBoundingClientRect();
      const delta =
        buttonBox.left + buttonBox.width / 2 - (scrollerBox.left + scrollerBox.width / 2);
      if (Math.abs(delta) < 1) return;
      scroller.scrollTo({ left: scroller.scrollLeft + delta });
    });
    return () => cancelAnimationFrame(frame);
  }, [anchor, selectedDate]);

  function shiftWindow(direction: -1 | 1) {
    const next = addDays(center, direction * WINDOW);
    setAnchor(next);
    onSelect(format(next, "yyyy-MM-dd"));
  }

  function nudge(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) {
      shiftWindow(direction);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    const atStart = el.scrollLeft <= 1;
    const atEnd = el.scrollLeft >= max - 1;
    if (max <= 1 || (direction < 0 && atStart) || (direction > 0 && atEnd)) {
      shiftWindow(direction);
      return;
    }
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.75, 280), behavior: "smooth" });
  }

  return (
    <div className="glass-regular flex items-center gap-1.5 rounded-2xl px-1.5 py-1">
      <button
        type="button"
        aria-label={t("common.earlierDays")}
        onClick={() => nudge(-1)}
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
      </button>
      <div
        ref={scrollerRef}
        className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max min-w-full items-center justify-between">
          {days.map((day) => {
            const selected = selectedDate === day.date;
            return (
              <button
                key={day.date}
                ref={selected ? selectedRef : undefined}
                type="button"
                aria-label={day.marked ? `${day.label} (${markedDates.filter((date) => date === day.date).length})` : day.label}
                onClick={() => onSelect(day.date)}
                className={cn(
                  "flex w-11 shrink-0 flex-col items-center rounded-lg px-1 py-1.5",
                  selected
                    ? "bg-lilac-deep text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-[11px] font-medium leading-none">{day.weekday}</span>
                <span
                  className={cn(
                    "mt-1 text-sm leading-none tabular-nums",
                    selected ? "font-semibold" : "font-medium text-foreground",
                  )}
                >
                  {day.dayNumber}
                </span>
                <span
                  className={cn(
                    "mt-1 size-1.5 rounded-full",
                    day.marked
                      ? selected
                        ? "bg-primary-foreground/80"
                        : "bg-lilac-deep/70"
                      : "invisible",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label={t("common.laterDays")}
        onClick={() => nudge(1)}
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
