"use client";

import { useEffect, useState } from "react";
import { BabyProfileForm } from "./baby-profile-form";
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

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Edit baby profile</SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-4">{form}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit baby profile</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
