"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: LucideIcon;
  onConfirm: () => void;
  confirmVariant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  icon: Icon = AlertTriangle,
  onConfirm,
  confirmVariant = "default",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-2xl sm:max-w-sm"
      >
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div
            className={cn(
              "mb-1 flex size-12 items-center justify-center rounded-full",
              confirmVariant === "destructive"
                ? "bg-destructive/15 text-destructive"
                : "bg-lilac/40 text-lilac-deep",
            )}
          >
            <Icon className="size-6" aria-hidden />
          </div>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex-row justify-center gap-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="min-h-10 flex-1 rounded-xl sm:flex-none sm:px-6"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className="min-h-10 flex-1 rounded-xl sm:flex-none sm:px-6"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
