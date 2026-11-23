"use client";

import * as React from "react";
import { endOfDay, startOfDay } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocale } from "@/components/providers/locale-provider";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { dateFnsLocale, formatDateLabel, parseDateString, toDateString } from "@/utils/date";
import { cn } from "@/utils/cn";

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Earliest selectable day (inclusive). */
  fromDate?: Date;
  /** Latest selectable day (inclusive). */
  toDate?: Date;
  /** Show clear (X) control when a date is set. Default true. */
  clearable?: boolean;
  clearAriaLabel?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  fromDate,
  toDate,
  clearable = true,
  clearAriaLabel = "Clear date",
}: DatePickerProps) {
  const { t, locale } = useLocale();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const selected = parseDateString(value);
  const showClear = clearable && Boolean(value) && !disabled;
  const isOpen = disabled ? false : open;

  const handleClear = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  const select = (date: Date | undefined) => {
    onChange(toDateString(date));
    setOpen(false);
  };

  const now = new Date();
  const todaySelectable =
    (!fromDate || now >= startOfDay(fromDate)) &&
    (!toDate || now <= endOfDay(toDate));

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      disabled={disabled}
      data-empty={!value}
      onClick={isMobile ? () => setOpen(true) : undefined}
      className={cn(
        "h-11 w-full justify-between rounded-xl px-2.5 font-normal",
        "data-[empty=true]:text-muted-foreground",
        showClear && "pr-10",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-left">
        {value ? formatDateLabel(value, locale) : placeholder}
      </span>
      {!showClear && (
        <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
      )}
    </Button>
  );

  const calendar = (calendarClassName?: string) => (
    <Calendar
      mode="single"
      selected={selected}
      defaultMonth={selected}
      captionLayout="dropdown"
      locale={dateFnsLocale(locale)}
      startMonth={fromDate}
      endMonth={toDate}
      className={calendarClassName}
      disabled={[
        ...(fromDate ? [{ before: fromDate }] : []),
        ...(toDate ? [{ after: toDate }] : []),
      ]}
      onSelect={select}
    />
  );

  return (
    <div className="relative min-w-0">
      {isMobile ? (
        <>
          {trigger}
          <Sheet open={isOpen} onOpenChange={setOpen}>
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="gap-0 rounded-t-3xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
              <SheetHeader className="px-2 pt-3 pb-1 text-left">
                <SheetTitle className="text-lg font-bold">
                  {placeholder || t("common.selectDate")}
                </SheetTitle>
              </SheetHeader>
              {calendar(
                "mx-auto bg-transparent px-0 [--cell-size:--spacing(11)]",
              )}
              <div className="mt-2 flex gap-2 px-2">
                {showClear && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 rounded-xl"
                    onClick={() => select(undefined)}
                  >
                    {clearAriaLabel}
                  </Button>
                )}
                {todaySelectable && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 rounded-xl"
                    onClick={() => select(now)}
                  >
                    {t("common.today")}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Popover open={isOpen} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {calendar()}
          </PopoverContent>
        </Popover>
      )}
      {showClear && (
        <button
          type="button"
          aria-label={clearAriaLabel}
          disabled={disabled}
          onClick={handleClear}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1/2 right-2.5 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
