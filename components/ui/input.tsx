import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const DATE_TIME_TYPES = new Set(["date", "time", "datetime-local"])

function Input({
  className,
  type,
  placeholder,
  value,
  defaultValue,
  ...props
}: React.ComponentProps<"input">) {
  const isDateTime = type != null && DATE_TIME_TYPES.has(type)
  const showPlaceholder =
    isDateTime &&
    placeholder != null &&
    (value === "" || (value === undefined && defaultValue === undefined))

  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      value={value}
      defaultValue={defaultValue}
      placeholder={isDateTime ? undefined : placeholder}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        isDateTime &&
          "block max-w-full appearance-none [-webkit-appearance:none] [&::-webkit-date-and-time-value]:min-w-0 [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:min-w-0 [&::-webkit-datetime-edit-fields-wrapper]:min-w-0",
        showPlaceholder &&
          "text-transparent [&::-webkit-date-and-time-value]:text-transparent [&::-webkit-datetime-edit]:text-transparent",
        className
      )}
      {...props}
    />
  )

  if (!showPlaceholder) {
    return input
  }

  return (
    <div className="relative min-w-0 w-full">
      {input}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-base text-muted-foreground md:text-sm"
      >
        {placeholder}
      </span>
    </div>
  )
}

export { Input }
