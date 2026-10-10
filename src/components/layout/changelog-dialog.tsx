"use client";

import { useLocale } from "@/components/providers/locale-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changelog } from "@/lib/changelog";
import { buildChangelog } from "@/lib/changelog-build";

export function ChangelogDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale, intlLocale } = useLocale();
  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${isoDate}T12:00:00`));
  const dates = [...new Set([...changelog.map((entry) => entry.date), ...buildChangelog.map((entry) => entry.date)])].sort(
    (a, b) => b.localeCompare(a),
  );

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
          {dates.map((date) => {
            const written = changelog.find((entry) => entry.date === date);
            const generated = buildChangelog.find((entry) => entry.date === date);
            const generatedLines = (generated?.items ?? []).map((item) => (locale === "id" ? item.id : item.en));
            return (
              <section key={date} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{formatDate(date)}</h3>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
                  {written?.itemKeys.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                  {generatedLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
