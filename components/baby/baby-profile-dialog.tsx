"use client";

import { useEffect, useState } from "react";
import { BabyProfileForm } from "./baby-profile-form";
import { useLocale } from "@/components/providers/locale-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { BabyProfile } from "@/lib/types";

interface BabyProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: BabyProfile;
  onSave: (profile: BabyProfile) => void;
}

export function BabyProfileDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: BabyProfileDialogProps) {
  const { t } = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const form = (
    <BabyProfileForm
      initial={initial}
      onSave={onSave}
      onCancel={() => onOpenChange(false)}
    />
  );

  const title = t("baby.editBabyProfile");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-6">
          <SheetHeader className="px-0 pt-5">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{form}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
