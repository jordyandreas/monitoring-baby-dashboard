"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { ReminderSettingsPanel } from "@/components/reminders/reminder-settings-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { headerIconButtonClassName } from "@/components/layout/header-icon-button";
import { useLocale } from "@/components/providers/locale-provider";

export function ReminderSettingsDialog({ className }: { className?: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={headerIconButtonClassName(className)}
          aria-label={t("reminders.openAria")}
        >
          <Bell className="size-5 text-lilac-deep" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(85vh,40rem)] overflow-y-auto rounded-2xl p-6 sm:max-w-lg [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg">
            <Bell className="size-5 text-lilac-deep" aria-hidden />
            {t("reminders.title")}
          </DialogTitle>
          <DialogDescription>{t("reminders.subtitle")}</DialogDescription>
        </DialogHeader>
        <ReminderSettingsPanel />
      </DialogContent>
    </Dialog>
  );
}
