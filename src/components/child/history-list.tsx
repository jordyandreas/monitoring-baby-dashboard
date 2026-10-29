"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListEmptyState } from "@/components/ui/list-empty-state";
import { useLocale } from "@/components/providers/locale-provider";

export function HistoryList({
  items,
  emptyLabel,
  emptyIcon,
  onDelete,
}: {
  items: { id: string; title: string; detail: ReactNode }[];
  emptyLabel: string;
  emptyIcon?: ComponentType<{ className?: string }>;
  onDelete: (id: string) => void;
}) {
  const { t } = useLocale();
  const [pending, setPending] = useState<string | null>(null);

  if (items.length === 0) {
    return <ListEmptyState icon={emptyIcon} label={emptyLabel} />;
  }

  return (
    <>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl glass-regular">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              <div className="text-sm text-muted-foreground">{item.detail}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("child.remove")}
              onClick={() => setPending(item.id)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={t("child.deleteTitle")}
        description={t("child.deleteBody")}
        confirmLabel={t("child.remove")}
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
