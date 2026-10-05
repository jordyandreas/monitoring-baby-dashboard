"use client";

import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn";

export type ExpandableFabAction = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function ExpandableFab({
  actions,
  label,
  closeLabel,
  className,
  onSelect,
  locked = false,
  onLocked,
}: {
  actions: ExpandableFabAction[];
  label: string;
  closeLabel: string;
  className?: string;
  onSelect: (id: string) => void;
  locked?: boolean;
  onLocked?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open
        ? createPortal(
            <button
              type="button"
              aria-label={closeLabel}
              className="fixed inset-0 z-[60] cursor-default bg-black/10"
              onClick={() => setOpen(false)}
            />,
            document.body,
          )
        : null}
      <div className={cn("relative z-50", className)}>
        <ul
          className={cn(
            "absolute right-0 bottom-full mb-3 flex flex-col-reverse items-end gap-3",
            !open && "pointer-events-none",
          )}
          inert={open ? undefined : true}
          aria-hidden={open ? undefined : true}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            const delay = open ? index * 55 : (actions.length - 1 - index) * 40;
            return (
              <li
                key={action.id}
                className={cn(
                  "origin-bottom-right transition-[opacity,transform] duration-300 ease-out motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-opacity motion-reduce:duration-150",
                  open
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-6 scale-75 opacity-0",
                )}
                style={{ transitionDelay: `${delay}ms` }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSelect(action.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="glass-clear rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-lilac-foreground">
                    {action.label}
                  </span>
                  <span className="glass-clear flex size-14 shrink-0 items-center justify-center rounded-full text-lilac-foreground">
                    <Icon className="size-6" aria-hidden />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? closeLabel : label}
          onClick={() => {
            if (locked) {
              onLocked?.();
              return;
            }
            setOpen((value) => !value);
          }}
          className="flex size-14 items-center justify-center rounded-full bg-lilac-deep text-primary-foreground shadow-lg"
        >
          <Plus
            className={cn(
              "size-7 transition-transform duration-200 ease-out motion-reduce:transition-none",
              open && "rotate-45",
            )}
            aria-hidden
          />
        </button>
      </div>
    </>
  );
}
