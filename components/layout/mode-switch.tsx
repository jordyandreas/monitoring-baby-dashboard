"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { cn } from "@/lib/utils";

export function ModeSwitch({ className }: { className?: string }) {
  const { mode, setMode } = useAppMode();
  const { t } = useLocale();

  return (
    <div
      className={cn("flex h-9 items-center rounded-full bg-white/45 p-0.5 ring-1 ring-white/70", className)}
      role="group"
      aria-label={t("mode.switchAria")}
    >
      {(["pregnancy", "child"] as const).map((id) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(id)}
            className={cn(
              "flex h-full items-center rounded-full px-3 text-sm font-semibold transition-colors",
              active
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(id === "pregnancy" ? "mode.pregnancy" : "mode.child")}
          </button>
        );
      })}
    </div>
  );
}
