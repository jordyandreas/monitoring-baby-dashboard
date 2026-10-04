"use client";

import { useState } from "react";
import { format, startOfDay } from "date-fns";

export type SummaryRange = 1 | 7 | 30;

function todayKey() {
  return format(startOfDay(new Date()), "yyyy-MM-dd");
}

export function useSummaryLink() {
  const [range, setRange] = useState<SummaryRange>(7);
  const [day, setDay] = useState(todayKey);
  const selectHistoryDate = (next: string) => {
    setDay(next);
    setRange(1);
  };
  return { range, day, setRange, setDay, selectHistoryDate };
}
