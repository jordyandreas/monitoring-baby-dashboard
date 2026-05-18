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
  onChange,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<"input">) {
  const isDateTime = type != null && DATE_TIME_TYPES.has(type)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const focusedRef = React.useRef(false)
  const onChangeRef = React.useRef(onChange)

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const [draft, setDraft] = React.useState(() =>
    String(value ?? defaultValue ?? ""),
  )

  React.useEffect(() => {
    if (!focusedRef.current && value !== undefined) {
      setDraft(String(value))
    }
  }, [value])

  React.useEffect(() => {
    if (!isDateTime) return
    const el = inputRef.current
    if (!el) return

    const handleNativeChange = (event: Event) => {
      const next = (event.target as HTMLInputElement).value
      setDraft(next)
      focusedRef.current = false
      onChangeRef.current?.(
        event as unknown as React.ChangeEvent<HTMLInputElement>,
      )
    }

    el.addEventListener("change", handleNativeChange)
    return () => el.removeEventListener("change", handleNativeChange)
  }, [isDateTime])

  const showPlaceholder =
    isDateTime &&
    placeholder != null &&
    draft === "" &&
    (value === "" || value === undefined)

  const displayValue = isDateTime ? draft : value

  const input = (
    <InputPrimitive
      ref={inputRef}
      type={type}
      data-slot="input"
      value={displayValue}
      defaultValue={isDateTime ? undefined : defaultValue}
      placeholder={isDateTime ? undefined : placeholder}
      onFocus={(e) => {
        focusedRef.current = true
        onFocus?.(e)
      }}
      onBlur={(e) => {
        focusedRef.current = false
        onBlur?.(e)
      }}
      onChange={(e) => {
        if (isDateTime) {
          // iOS Safari maps React onChange to `input`, which fires while scrolling.
          return
        }
        onChange?.(e)
      }}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        isDateTime &&
          "flex items-center py-0 leading-none max-w-full appearance-none [-webkit-appearance:none] [&::-webkit-calendar-picker-indicator]:my-0 [&::-webkit-date-and-time-value]:flex [&::-webkit-date-and-time-value]:min-h-0 [&::-webkit-date-and-time-value]:min-w-0 [&::-webkit-date-and-time-value]:items-center [&::-webkit-date-and-time-value]:leading-none [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:min-h-0 [&::-webkit-datetime-edit]:items-center [&::-webkit-datetime-edit]:leading-none [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:items-center [&::-webkit-datetime-edit-fields-wrapper]:p-0",
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
