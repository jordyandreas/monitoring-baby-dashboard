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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocale } from "@/components/providers/locale-provider";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  formatTimeLabel,
  from12Hour,
  getCurrentTimeString,
  HOUR_12_OPTIONS,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  parseTimeString,
  to12Hour,
  toTimeString,
  usesAmPm,
} from "@/utils/time";
import { cn } from "@/utils/cn";

export interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type TimeParts = { hour: string; minute: string };
type Period = "AM" | "PM";

function resolveParts(value: string): TimeParts {
  return (
    parseTimeString(value) ??
    parseTimeString(getCurrentTimeString()) ?? { hour: "00", minute: "00" }
  );
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: TimePickerProps) {
  const { t, locale } = useLocale();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const amPm = usesAmPm(locale);
  const parts = resolveParts(value);
  const { hour12, period } = to12Hour(parts.hour);
  const title = placeholder ?? t("common.selectTime");

  const updateTime = (hour: string, minute: string) => {
    onChange(toTimeString(hour, minute));
  };

  const selectTriggerClass = "h-11 w-[4.75rem] rounded-xl";

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
        className,
      )}
    >
      <span className="truncate">
        {value ? formatTimeLabel(value, locale) : title}
      </span>
      <ClockIcon className="size-4 shrink-0 opacity-60" aria-hidden />
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={disabled ? false : open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="gap-0 rounded-t-3xl px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
            <SheetHeader className="px-0 pt-3 pb-2 text-left">
              <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
            </SheetHeader>
            <MobileTimeWheel
              initial={parts}
              amPm={amPm}
              onCancel={() => setOpen(false)}
              onDone={(next) => {
                updateTime(next.hour, next.minute);
                setOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex gap-2">
          <div className="min-w-0 space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("common.hour")}</Label>
            {amPm ? (
              <Select
                value={hour12}
                onValueChange={(next) =>
                  next && updateTime(from12Hour(next, period), parts.minute)
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {HOUR_12_OPTIONS.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={parts.hour}
                onValueChange={(hour) => hour && updateTime(hour, parts.minute)}
              >
                <SelectTrigger className={selectTriggerClass}>
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
            )}
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("common.minute")}</Label>
            <Select
              value={parts.minute}
              onValueChange={(minute) =>
                minute && updateTime(parts.hour, minute)
              }
            >
              <SelectTrigger className={selectTriggerClass}>
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
          {amPm ? (
            <div className="min-w-0 space-y-1.5">
              <Label className="invisible text-xs" aria-hidden>
                AM/PM
              </Label>
              <Select
                value={period}
                onValueChange={(next) =>
                  next &&
                  updateTime(from12Hour(hour12, next as Period), parts.minute)
                }
              >
                <SelectTrigger className={selectTriggerClass} aria-label="AM/PM">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          className="mt-3 h-9 w-full rounded-xl"
          onClick={() => setOpen(false)}
        >
          {t("common.done")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

const PERIOD_OPTIONS: Period[] = ["AM", "PM"];

function MobileTimeWheel({
  initial,
  amPm,
  onCancel,
  onDone,
}: {
  initial: TimeParts;
  amPm: boolean;
  onCancel: () => void;
  onDone: (parts: TimeParts) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = React.useState(initial);
  const { hour12, period } = to12Hour(draft.hour);

  return (
    <>
      <div className="relative mx-auto flex w-full max-w-xs items-center justify-center gap-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 rounded-xl bg-muted"
        />
        {amPm ? (
          <WheelColumn
            label={t("common.hour")}
            options={HOUR_12_OPTIONS}
            value={hour12}
            onChange={(next) =>
              setDraft((d) => ({
                ...d,
                hour: from12Hour(next, to12Hour(d.hour).period),
              }))
            }
          />
        ) : (
          <WheelColumn
            label={t("common.hour")}
            options={HOUR_OPTIONS}
            value={draft.hour}
            onChange={(hour) => setDraft((d) => ({ ...d, hour }))}
          />
        )}
        <span aria-hidden className="relative text-xl font-semibold">
          :
        </span>
        <WheelColumn
          label={t("common.minute")}
          options={MINUTE_OPTIONS}
          value={draft.minute}
          onChange={(minute) => setDraft((d) => ({ ...d, minute }))}
        />
        {amPm ? (
          <WheelColumn
            label="AM/PM"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(next) =>
              setDraft((d) => ({
                ...d,
                hour: from12Hour(to12Hour(d.hour).hour12, next as Period),
              }))
            }
          />
        ) : null}
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 rounded-xl"
          onClick={() => onDone(draft)}
        >
          {t("common.done")}
        </Button>
      </div>
    </>
  );
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

function WheelColumn({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.indexOf(value));
  const [activeIndex, setActiveIndex] = React.useState(selectedIndex);

  React.useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    // Only position on mount; afterwards the scroll position drives the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const indexAt = (scrollTop: number) =>
    Math.min(options.length - 1, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const index = indexAt(el.scrollTop);
    setActiveIndex(index);
    if (options[index] !== value) onChange(options[index]);
  };

  const scrollToIndex = (index: number) => {
    ref.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      scrollToIndex(
        Math.min(options.length - 1, Math.max(0, activeIndex + delta)),
      );
    }
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      style={{
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        paddingBlock: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
      }}
      className={cn(
        "relative w-16 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "mask-[linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          role="option"
          tabIndex={-1}
          aria-selected={index === activeIndex}
          onClick={() => scrollToIndex(index)}
          style={{ height: ITEM_HEIGHT }}
          className={cn(
            "flex w-full snap-center items-center justify-center text-lg tabular-nums transition-colors",
            index === activeIndex
              ? "font-semibold text-foreground"
              : "text-muted-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
