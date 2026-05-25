"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocale } from "@/components/providers/locale-provider";

interface EddInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EddInfoBody() {
  const { t } = useLocale();

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      <p>{t("baby.eddInfoP1")}</p>
      <p>{t("baby.eddInfoP2")}</p>
      <p>{t("baby.eddInfoP3")}</p>
      <p className="text-xs text-muted-foreground">{t("baby.eddInfoSource")}</p>
    </div>
  );
}

function EddInfoGotItButton({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();

  return (
    <Button
      type="button"
      className="min-h-11 w-full rounded-xl"
      onClick={onClose}
    >
      {t("baby.eddInfoGotIt")}
    </Button>
  );
}

export function EddInfoDialog({ open, onOpenChange }: EddInfoDialogProps) {
  const { t } = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const close = () => onOpenChange(false);
  const title = t("baby.eddInfoTitle");

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-3xl px-6 pb-8"
        >
          <div className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="text-lg font-bold">{title}</SheetTitle>
            <SheetDescription asChild>
              <div className="pt-1">
                <EddInfoBody />
              </div>
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="px-0 pt-4">
            <EddInfoGotItButton onClose={close} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <EddInfoBody />
        <EddInfoGotItButton onClose={close} />
      </DialogContent>
    </Dialog>
  );
}
