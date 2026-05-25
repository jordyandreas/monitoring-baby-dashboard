"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { FlagEn, FlagId } from "@/components/layout/flag-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocale } from "@/components/providers/locale-provider";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const options: {
  value: Locale;
  labelKey: "locale.en" | "locale.id";
  Flag: typeof FlagEn;
}[] = [
  { value: "en", labelKey: "locale.en", Flag: FlagEn },
  { value: "id", labelKey: "locale.id", Flag: FlagId },
];

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === locale) ?? options[0];
  const CurrentFlag = current.Flag;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-foreground shadow-sm transition-colors hover:bg-muted/40",
            className,
          )}
          aria-label={t("locale.aria")}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <CurrentFlag />
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto min-w-54 gap-2 p-2"
        role="listbox"
        aria-label={t("locale.aria")}
      >
        {options.map(({ value, labelKey, Flag }) => {
          const active = locale === value;
          return (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                setLocale(value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                active ? "bg-muted/50" : "hover:bg-muted/60",
              )}
            >
              <Flag />
              <span className="min-w-0 flex-1 text-sm font-bold uppercase tracking-wide text-foreground">
                {t(labelKey)}
              </span>
              {active ? (
                <Check
                  className="size-4 shrink-0 text-emerald-600"
                  strokeWidth={3}
                  aria-hidden
                />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
