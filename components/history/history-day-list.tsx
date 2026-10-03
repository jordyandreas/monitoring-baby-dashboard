"use client";

import { useState, type ComponentType } from "react";
import { Droplets, Footprints, Milk, Moon, Pencil, Trash2 } from "lucide-react";
import { EmphasizedDetail } from "@/components/child/emphasized-detail";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import type { HistoryIcon, HistoryTone } from "@/lib/child/summary";
import { cn } from "@/lib/utils";

const toneClass: Record<HistoryTone, string> = {
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  lilac: "bg-lilac/60 text-lilac-foreground",
  violet: "bg-violet-100 text-violet-700",
};

const historyIcons: Record<HistoryIcon, ComponentType<{ className?: string }>> = {
  feed: Milk,
  diaper: DiaperIcon,
  sleep: Moon,
  kick: Footprints,
  water: Droplets,
};

export function HistoryDayList({
  items,
  emptyLabel,
  deleteLabel,
  editLabel,
  confirmTitle,
  confirmBody,
  onDelete,
  onEdit,
}: {
  items: {
    id: string;
    time: string;
    title: string;
    subtitle?: string;
    tone: HistoryTone;
    icon: HistoryIcon;
  }[];
  emptyLabel: string;
  deleteLabel: string;
  editLabel?: string;
  confirmTitle: string;
  confirmBody: string;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const { t } = useLocale();
  const [pending, setPending] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = historyIcons[item.icon];
          return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl glass-regular px-4 py-3 shadow-sm"
          >
            <span className="w-[4.5rem] shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
              {item.time}
            </span>
            <span className="h-8 w-px shrink-0 bg-border" aria-hidden />
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                toneClass[item.tone],
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              {item.subtitle ? <EmphasizedDetail text={item.subtitle} /> : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {onEdit ? (
                <button
                  type="button"
                  aria-label={editLabel}
                  onClick={() => onEdit(item.id)}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label={deleteLabel}
                onClick={() => setPending(item.id)}
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={confirmTitle}
        description={confirmBody}
        confirmLabel={deleteLabel}
        cancelLabel={t("common.cancel")}
        confirmVariant="destructive"
        onConfirm={() => {
          if (pending) onDelete(pending);
          setPending(null);
        }}
      />
    </>
  );
}
