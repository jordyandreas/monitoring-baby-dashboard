"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
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
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateString(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            className,
          )}
        >
        <span className="truncate">
          {value ? formatDateLabel(value) : placeholder}
        </span>
        <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
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
  );
}
