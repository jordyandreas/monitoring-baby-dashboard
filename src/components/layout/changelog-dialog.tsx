"use client";

import { useLocale } from "@/components/providers/locale-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changelog } from "@/lib/changelog";

export function ChangelogDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, intlLocale } = useLocale();
  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${isoDate}T12:00:00`));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,760px)] overflow-y-auto rounded-2xl sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("changelog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {changelog.map((entry) => (
            <section key={entry.date} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{formatDate(entry.date)}</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
                {entry.itemKeys.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
