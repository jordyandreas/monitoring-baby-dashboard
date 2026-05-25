"use client";

import * as React from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateLabel, parseDateString, toDateString } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = React.useState(false);
  const selected = parseDateString(value);
  const showClear = clearable && Boolean(value) && !disabled;

  const handleClear = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  return (
    <div className="relative min-w-0">
      <Popover open={disabled ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            data-empty={!value}
            className={cn(
              "h-11 w-full justify-between rounded-xl px-2.5 font-normal",
              "data-[empty=true]:text-muted-foreground",
              showClear && "pr-10",
              className,
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {value ? formatDateLabel(value) : placeholder}
            </span>
            {!showClear && (
              <CalendarIcon
                className="size-4 shrink-0 opacity-60"
                aria-hidden
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            captionLayout="dropdown"
            startMonth={fromDate}
            endMonth={toDate}
            disabled={[
              ...(fromDate ? [{ before: fromDate }] : []),
              ...(toDate ? [{ after: toDate }] : []),
            ]}
            onSelect={(date) => {
              onChange(toDateString(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
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
