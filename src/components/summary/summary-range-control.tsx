"use client";

import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useLocale } from "@/components/providers/locale-provider";
import type { SummaryRange, SummaryRangePreset } from "@/hooks/use-summary-link";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/utils/cn";

function shortDayLabel(day: string, locale: Locale) {
  return format(parseISO(day), "d MMM", { locale: locale === "id" ? idLocale : enUS });
}

function spanLabel(from: string, to: string, locale: Locale) {
  const dfLocale = locale === "id" ? idLocale : enUS;
  const fromText = format(parseISO(from), "d MMM", { locale: dfLocale });
  const toText = format(parseISO(to), "d MMM yyyy", { locale: dfLocale });
  return `${fromText} – ${toText}`;
}

export function summaryPeriodLabel({
  range,
  day,
  today,
  customFrom,
  customTo,
  locale,
  t,
}: {
  range: SummaryRange;
  day: string;
  today: string;
  customFrom: string;
  customTo: string;
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (range === "custom") {
    if (customFrom && customTo) return spanLabel(customFrom, customTo, locale);
    return t("child.customRange");
  }
  if (range === 1) return day === today ? t("common.today") : shortDayLabel(day, locale);
  return t("child.rangeDays", { count: range });
}

export function SummaryRangeControl({
  range,
  day,
  today,
  customFrom,
  customTo,
  onRangeChange,
  onCustomFromChange,
  onCustomToChange,
  presets = [1, 7, 30],
  className,
}: {
  range: SummaryRange;
  day: string;
  today: string;
  customFrom: string;
  customTo: string;
  onRangeChange: (range: SummaryRange) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  presets?: SummaryRangePreset[];
  className?: string;
}) {
  const { t, locale } = useLocale();
  const label = summaryPeriodLabel({
    range,
    day,
    today,
    customFrom,
    customTo,
    locale,
    t,
  });
  const selectValue = range === "custom" ? "custom" : String(range);
  const maxDate = parseISO(today);

  const handleFromChange = (value: string) => {
    onCustomFromChange(value);
    if (value && customTo && value > customTo) onCustomToChange(value);
  };

  const handleToChange = (value: string) => {
    onCustomToChange(value);
    if (value && customFrom && value < customFrom) onCustomFromChange(value);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Select
        value={selectValue}
        onValueChange={(value) => {
          if (value === "custom") onRangeChange("custom");
          else onRangeChange(Number(value) as SummaryRangePreset);
        }}
      >
        <SelectTrigger
          aria-label={t("child.rangeChangeAria")}
          className={cn(
            "min-h-11 w-full max-w-full justify-between gap-2 rounded-xl border border-input bg-card",
            "px-3 py-2 text-sm font-semibold text-foreground shadow-sm",
            "hover:bg-card dark:bg-card dark:hover:bg-card",
            "*:data-[slot=select-value]:line-clamp-none",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-44">
          {presets.map((days) => (
            <SelectItem key={days} value={String(days)}>
              {days === 1
                ? day === today
                  ? t("common.today")
                  : shortDayLabel(day, locale)
                : t("child.rangeDays", { count: days })}
            </SelectItem>
          ))}
          <SelectItem value="custom">{t("child.customRange")}</SelectItem>
        </SelectContent>
      </Select>

      {range === "custom" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="summary-range-from">{t("child.rangeStart")}</Label>
            <DatePicker
              id="summary-range-from"
              value={customFrom}
              onChange={handleFromChange}
              placeholder={t("child.rangeStart")}
              toDate={maxDate}
              clearable={false}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="summary-range-to">{t("child.rangeEnd")}</Label>
            <DatePicker
              id="summary-range-to"
              value={customTo}
              onChange={handleToChange}
              placeholder={t("child.rangeEnd")}
              fromDate={customFrom ? parseISO(customFrom) : undefined}
              toDate={maxDate}
              clearable={false}
            />
          </div>
        </div>
      ) : null}

      {range === 1 ? null : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {range === "custom" ? t("child.customRangeHint") : t("child.rangeHint")}
        </p>
      )}
    </div>
  );
}
