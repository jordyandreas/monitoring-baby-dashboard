"use client";

import { useEffect, useRef } from "react";
import type { KickDateStripItem } from "@/lib/kicks";
import { cn } from "@/lib/utils";

interface KickDateStripProps {
  days: KickDateStripItem[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function KickDateStrip({
  days,
  selectedDate,
  onSelect,
}: KickDateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [days.length]);

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-lilac/20 to-card p-3 shadow-sm">
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-center overflow-x-auto overscroll-x-contain py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {days.map((day, index) => (
            <div
              key={day.date}
              className="flex shrink-0 items-center py-1"
            >
              <button
                ref={day.isToday ? todayRef : undefined}
                type="button"
                onClick={() => onSelect(day.date)}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3.5 py-2.5 text-sm font-medium transition-all",
                  selectedDate === day.date
                    ? "border-lilac-deep bg-lilac-deep text-primary-foreground shadow-md"
                    : "border-transparent bg-card text-muted-foreground hover:border-lilac/40 hover:bg-card hover:text-foreground",
                  day.isToday &&
                    selectedDate !== day.date &&
                    "border-lilac-deep/40 bg-lilac/20",
                )}
              >
                <span>{day.label}</span>
                {day.kickCount > 0 && (
                  <span
                    className={cn(
                      "inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none",
                      selectedDate === day.date
                        ? "bg-primary-foreground/25 text-primary-foreground"
                        : "bg-lilac/60 text-lilac-foreground",
                    )}
                  >
                    {day.kickCount}
                  </span>
                )}
              </button>
              {index < days.length - 1 && (
                <span
                  className="mx-2.5 shrink-0 select-none text-muted-foreground/40"
                  aria-hidden
                >
                  |
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
