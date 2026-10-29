"use client";

import { useState } from "react";
import { format, startOfDay, subDays } from "date-fns";

export type SummaryRangePreset = 1 | 7 | 30;
export type SummaryRange = SummaryRangePreset | "custom";

function todayKey() {
  return format(startOfDay(new Date()), "yyyy-MM-dd");
}

function defaultCustomFrom() {
  return format(subDays(startOfDay(new Date()), 6), "yyyy-MM-dd");
}

export function useSummaryLink() {
  const [range, setRangeState] = useState<SummaryRange>(1);
  const [day, setDay] = useState(todayKey);
  const [customFrom, setCustomFrom] = useState(defaultCustomFrom);
  const [customTo, setCustomTo] = useState(todayKey);

  const setRange = (next: SummaryRange) => {
    setRangeState(next);
    if (next === "custom") {
      setCustomFrom((from) => from || defaultCustomFrom());
      setCustomTo((to) => to || todayKey());
    }
  };

  const selectHistoryDate = (next: string) => {
    setDay(next);
    setRangeState(1);
  };

  return {
    range,
    day,
    setRange,
    setDay,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    selectHistoryDate,
  };
}
