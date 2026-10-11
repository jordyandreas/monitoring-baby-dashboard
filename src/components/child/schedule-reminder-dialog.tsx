"use client";

import { useId, useState, type FormEvent } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import {
  parseInterval,
  reminderFor,
  splitInterval,
  type ScheduleKind,
  type ScheduleReminder,
} from "@/lib/child/schedule-reminder";
import { listScheduleReminders, saveScheduleReminders } from "@/services/schedule-reminder.service";

type Draft = {
  enabled: boolean;
  hours: string;
  minutes: string;
};

function draftFrom(reminder: ScheduleReminder): Draft {
  const parts = splitInterval(reminder.intervalMinutes);
  return { enabled: reminder.enabled, hours: parts.hours, minutes: parts.minutes };
}

function rowFrom(kind: ScheduleKind, draft: Draft, stored: ScheduleReminder): ScheduleReminder | null {
  const parsed = parseInterval(draft.hours, draft.minutes);
  if (draft.enabled) {
    if (parsed === null) return null;
    return { kind, enabled: true, intervalMinutes: parsed };
  }
  return { kind, enabled: false, intervalMinutes: parsed ?? stored.intervalMinutes };
}

function KindFields({
  label,
  draft,
  onChange,
}: {
  label: string;
  draft: Draft;
  onChange: (draft: Draft) => void;
}) {
  const { t } = useLocale();
  const baseId = useId();
  const hoursId = `${baseId}-hours`;
  const minutesId = `${baseId}-minutes`;

  return (
    <div className="space-y-3 rounded-2xl bg-lilac/40 p-3">
      <div className="flex items-center gap-3">
        <Checkbox
          id={baseId}
          checked={draft.enabled}
          onCheckedChange={(checked) => onChange({ ...draft, enabled: checked === true })}
        />
        <Label htmlFor={baseId} className="text-sm font-medium">
          {label}
        </Label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={hoursId}>{t("schedule.hours")}</Label>
          <Input
            id={hoursId}
            inputMode="numeric"
            disabled={!draft.enabled}
            value={draft.hours}
            onChange={(event) => onChange({ ...draft, hours: event.target.value })}
            className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={minutesId}>{t("schedule.minutes")}</Label>
          <Input
            id={minutesId}
            inputMode="numeric"
            disabled={!draft.enabled}
            value={draft.minutes}
            onChange={(event) => onChange({ ...draft, minutes: event.target.value })}
            className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
          />
        </div>
      </div>
    </div>
  );
}

export function ScheduleReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const remote = useRemote("schedule", listScheduleReminders, open);
  const [feedOverride, setFeedOverride] = useState<Draft | null>(null);
  const [pumpOverride, setPumpOverride] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const storedFeed = remote.data ? reminderFor(remote.data, "feed") : null;
  const storedPump = remote.data ? reminderFor(remote.data, "pump") : null;
  const feed = feedOverride ?? (storedFeed ? draftFrom(storedFeed) : null);
  const pump = pumpOverride ?? (storedPump ? draftFrom(storedPump) : null);

  const close = (next: boolean) => {
    if (!next) {
      setFeedOverride(null);
      setPumpOverride(null);
      setError(null);
    }
    onOpenChange(next);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!storedFeed || !storedPump || !feed || !pump) return;
    const nextFeed = rowFrom("feed", feed, storedFeed);
    const nextPump = rowFrom("pump", pump, storedPump);
    if (!nextFeed || !nextPump) {
      setError(t("schedule.invalid"));
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await commitSave("schedule", () => saveScheduleReminders([nextFeed, nextPump]), "save");
    setBusy(false);
    if (ok) close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="max-h-[min(90vh,760px)] overflow-y-auto rounded-2xl sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("schedule.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("schedule.hint")}</p>
          {remote.error ? <p className="text-sm text-destructive">{remote.error}</p> : null}
          {feed && pump ? (
            <>
              <KindFields label={t("pages.feed.title")} draft={feed} onChange={setFeedOverride} />
              <KindFields label={t("pages.pump.title")} draft={pump} onChange={setPumpOverride} />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="min-h-11 w-full rounded-full" loading={busy}>
                {t("schedule.save")}
              </Button>
            </>
          ) : remote.error ? null : (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
