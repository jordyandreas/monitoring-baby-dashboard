"use client";

import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { useLocale } from "@/components/providers/locale-provider";
import { formatTimeLabel } from "@/utils/time";
import { cn } from "@/utils/cn";

export function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex max-w-full flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold",
              value === option.value
                ? "bg-lilac-deep text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DateField({
  date,
  onDate,
}: {
  date: string;
  onDate: (value: string) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="min-w-0 space-y-2">
      <Label>{t("child.date")}</Label>
      <DatePicker
        value={date}
        onChange={onDate}
        placeholder={t("common.selectDate")}
        clearAriaLabel={t("common.clearDate")}
        toDate={new Date()}
      />
    </div>
  );
}

export function TimeField({
  label,
  time,
  onTime,
}: {
  label: string;
  time: string;
  onTime: (value: string) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="min-w-0 space-y-2">
      <Label>{label}</Label>
      <TimePicker value={time} onChange={onTime} placeholder={t("common.selectTime")} />
    </div>
  );
}

export function DateTimeFields({
  date,
  time,
  onDate,
  onTime,
}: {
  date: string;
  time: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DateField date={date} onDate={onDate} />
      <TimeField label={t("child.time")} time={time} onTime={onTime} />
    </div>
  );
}

export function LogForm({
  title,
  description,
  onSubmit,
  embedded = false,
  children,
}: {
  title: string;
  description?: string;
  onSubmit: (event: React.FormEvent) => void;
  embedded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={
        embedded
          ? "w-full min-w-0 space-y-4"
          : "space-y-4 rounded-2xl glass-regular p-4"
      }
    >
      <div className={embedded ? "pr-8" : undefined}>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </form>
  );
}

export function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <Button type="submit" className="min-h-11 w-full rounded-full" disabled={disabled}>
      {label}
    </Button>
  );
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  step = "1",
  unit,
  presets,
  presetUnit,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
  unit?: string;
  presets?: number[];
  presetUnit?: "min" | "ml";
}) {
  const { t } = useLocale();
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          step={step}
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn("min-h-11 w-full rounded-xl", unit && "pr-12")}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      {presets && presetUnit ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const selected = Number(value) === preset;
            const presetLabel =
              presetUnit === "min"
                ? t("child.minutesShort", { minutes: preset })
                : t("child.summaryMl", { ml: preset });
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(String(preset))}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold",
                  selected
                    ? "bg-lilac-deep text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {presetLabel}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl"
      />
    </div>
  );
}

export function LogScreen({
  extra,
  children,
}: {
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 space-y-6">
      {extra}
      {children}
    </div>
  );
}

export function formatLogWhen(date: string, time: string, locale: "en" | "id"): string {
  const label = format(parseISO(date), "d MMM yyyy", {
    locale: locale === "id" ? idLocale : enUS,
  });
  return time ? `${label} · ${formatTimeLabel(time)}` : label;
}

export function newestFirst<T extends { date: string; time?: string; startTime?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const aKey = `${a.date}T${a.startTime ?? a.time ?? ""}`;
    const bKey = `${b.date}T${b.startTime ?? b.time ?? ""}`;
    return bKey.localeCompare(aKey);
  });
}
