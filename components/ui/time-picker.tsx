"use client";

import * as React from "react";
import { ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatTimeLabel,
  getCurrentTimeString,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  parseTimeString,
  toTimeString,
} from "@/lib/time-utils";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder = "Select time",
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parts =
    parseTimeString(value) ??
    parseTimeString(getCurrentTimeString()) ?? { hour: "00", minute: "00" };

  const updateTime = (hour: string, minute: string) => {
    onChange(toTimeString(hour, minute));
  };

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
          {value ? formatTimeLabel(value) : placeholder}
        </span>
        <ClockIcon className="size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex gap-2">
          <div className="min-w-0 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hour</Label>
            <Select
              value={parts.hour}
              onValueChange={(hour) => hour && updateTime(hour, parts.minute)}
            >
              <SelectTrigger className="h-11 w-[4.75rem] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {HOUR_OPTIONS.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Minute</Label>
            <Select
              value={parts.minute}
              onValueChange={(minute) =>
                minute && updateTime(parts.hour, minute)
              }
            >
              <SelectTrigger className="h-11 w-[4.75rem] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {MINUTE_OPTIONS.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          type="button"
          className="mt-3 h-9 w-full rounded-xl"
          onClick={() => setOpen(false)}
        >
          Done
        </Button>
      </PopoverContent>
    </Popover>
  );
}
