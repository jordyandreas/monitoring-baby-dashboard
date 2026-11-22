"use client";

import { useState } from "react";
import { parseISO } from "date-fns";
import { Moon } from "lucide-react";
import {
  ChoiceRow,
  DateField,
  LogForm,
  NumberField,
  SubmitButton,
  TimeField,
} from "@/components/child/form-bits";
import { commitSave } from "@/components/ui/save-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SleepFormSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useBottleMlPresets } from "@/hooks/use-bottle-ml-presets";
import { useNow } from "@/hooks/use-now";
import { useRemote } from "@/hooks/use-remote";
import {
  activeSleep,
  FORGOTTEN_SLEEP_MINUTES,
  formatDuration,
  sleepElapsedMinutes,
} from "@/lib/child/summary";
import type {
  DiaperEntry,
  DiaperKind,
  PoopAmount,
  FeedEntry,
  FeedKind,
  FeedSide,
  PoopColor,
  PoopTexture,
  PumpEntry,
  SleepEntry,
  SleepKind,
} from "@/lib/child/types";
import { cn } from "@/utils/cn";
import { formatTimeLabel, getCurrentTimeString } from "@/utils/time";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { diaperShareText, feedShareText, pumpShareText, sleepShareText } from "@/lib/child/whatsapp-share";
import { saveDiaper } from "@/services/diapers.service";
import { saveFeed } from "@/services/feed.service";
import { savePump } from "@/services/pump.service";
import { listSleeps, saveSleep } from "@/services/sleep.service";

/** Per-feed shortcuts. Steps grow from a newborn feed toward a typical feed by age 2. */
const NURSING_MINUTES = [5, 10, 15, 20, 30, 45];

export function FeedLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: FeedEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const bottleMl = useBottleMlPresets();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [kind, setKind] = useState<FeedKind>(initial?.kind ?? "bottle-breast");
  const [side, setSide] = useState<FeedSide>(initial?.side ?? "left");
  const [minutes, setMinutes] = useState(initial?.durationMin !== undefined ? String(initial.durationMin) : "");
  const [amount, setAmount] = useState(initial?.amountMl !== undefined ? String(initial.amountMl) : "");
  const editing = Boolean(initial);
  const fieldId = initial ? `feed-edit-${initial.id}` : "feed";

  const duration = Number(minutes);
  const ml = Number(amount);
  const canSave =
    Boolean(date && time) &&
    (kind === "breast" ? duration > 0 && duration <= 240 : ml > 0 && ml <= 2000);

  return (
    <LogForm
      title={editing ? t("feed.edit") : t("feed.add")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const next =
          kind === "breast"
            ? { date, time, kind, side, durationMin: Math.round(duration) }
            : { date, time, kind, amountMl: Math.round(ml) };
        const entry = { id: initial?.id ?? crypto.randomUUID(), ...next };
        const text = feedShareText(entry, t);
        void commitSave("feed", () => saveFeed(entry), initial ? "update" : "save", text, "feed").then((ok) => {
          if (!ok) return;
          if (!initial) {
            if (kind === "breast") setMinutes("");
            else setAmount("");
            setTime(getCurrentTimeString());
          }
          onSaved?.();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <DateField date={date} onDate={setDate} />
        <TimeField label={t("child.time")} time={time} onTime={setTime} />
      </div>
      <div className={kind === "breast" ? "grid grid-cols-1 gap-3 md:grid-cols-2" : "grid gap-3"}>
        <ChoiceRow
          className="min-w-0"
          label={t("pages.feed.title")}
          value={kind}
          onChange={setKind}
          options={[
            { value: "bottle-breast", label: t("feed.kindBottleBreast") },
            { value: "breast", label: t("feed.kindBreast") },
            { value: "formula", label: t("feed.kindFormula") },
          ]}
        />
        {kind === "breast" ? (
          <ChoiceRow
            className="min-w-0"
            label={t("feed.sideLabel")}
            value={side}
            onChange={setSide}
            options={[
              { value: "left", label: t("feed.left") },
              { value: "right", label: t("feed.right") },
              { value: "both", label: t("feed.both") },
            ]}
          />
        ) : null}
      </div>
      {kind === "breast" ? (
        <NumberField
          id={`${fieldId}-minutes`}
          label={t("feed.minutes")}
          value={minutes}
          onChange={setMinutes}
          presets={NURSING_MINUTES}
          presetUnit="min"
          placeholder={t("feed.minutesPlaceholder")}
        />
      ) : (
        <NumberField
          id={`${fieldId}-amount`}
          label={t("feed.amount")}
          value={amount}
          onChange={setAmount}
          presets={bottleMl}
          presetUnit="ml"
          placeholder={t("feed.amountPlaceholder")}
        />
      )}
      <SubmitButton label={editing ? t("common.save") : t("feed.add")} disabled={!canSave} />
    </LogForm>
  );
}

export function PumpLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: PumpEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const bottleMl = useBottleMlPresets();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [amount, setAmount] = useState(initial?.amountMl !== undefined ? String(initial.amountMl) : "");
  const editing = Boolean(initial);
  const fieldId = initial ? `pump-edit-${initial.id}` : "pump";
  const ml = Number(amount);
  const canSave = Boolean(date && time) && amount.trim() !== "" && Number.isFinite(ml) && ml >= 0 && ml <= 2000;

  return (
    <LogForm
      title={editing ? t("pump.edit") : t("pump.add")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const entry: PumpEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          time,
          amountMl: Math.round(ml),
        };
        const text = pumpShareText(entry, t);
        void commitSave("pump", () => savePump(entry), initial ? "update" : "save", text, "pump").then((ok) => {
          if (!ok) return;
          if (!initial) {
            setAmount("");
            setTime(getCurrentTimeString());
          }
          onSaved?.();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <DateField date={date} onDate={setDate} />
        <TimeField label={t("child.time")} time={time} onTime={setTime} />
      </div>
      <NumberField
        id={`${fieldId}-amount`}
        label={t("pump.amount")}
        value={amount}
        onChange={setAmount}
        presets={bottleMl}
        presetUnit="ml"
        placeholder={t("pump.amountPlaceholder")}
      />
      <SubmitButton label={editing ? t("common.save") : t("pump.add")} disabled={!canSave} />
    </LogForm>
  );
}

export function DiaperLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: DiaperEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [kind, setKind] = useState<DiaperKind>(initial?.kind ?? "pee");
  const [color, setColor] = useState<PoopColor>(initial?.poopColor ?? "yellow");
  const [texture, setTexture] = useState<PoopTexture>(initial?.poopTexture ?? "soft");
  const [amount, setAmount] = useState<PoopAmount | "">(initial?.poopAmount ?? "");
  const editing = Boolean(initial);
  const needsPoop = kind === "poop" || kind === "both";
  const canSave = Boolean(date && time) && (!needsPoop || amount !== "");

  return (
    <LogForm
      title={editing ? t("diaper.edit") : t("diaper.add")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const next = {
          date,
          time,
          kind,
          ...(needsPoop && amount !== ""
            ? { poopColor: color, poopTexture: texture, poopAmount: amount }
            : {}),
        };
        const entry: DiaperEntry = { id: initial?.id ?? crypto.randomUUID(), ...next };
        const text = diaperShareText(entry, t);
        const loggedAs = kind === "pee" ? t("diaper.pee") : kind === "poop" ? t("diaper.poop") : "";
        const detail =
          kind === "both"
            ? undefined
            : t(initial ? "toast.diaperKindUpdated" : "toast.diaperKindSaved", { kind: loggedAs });
        void commitSave("diaper", () => saveDiaper(entry), initial ? "update" : "save", text, "diaper", detail).then((ok) => {
          if (!ok) return;
          if (!initial) setTime(getCurrentTimeString());
          onSaved?.();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <DateField date={date} onDate={setDate} />
        <TimeField label={t("child.time")} time={time} onTime={setTime} />
      </div>
      <div className={cn("grid gap-3", needsPoop && "sm:grid-cols-2")}>
        <ChoiceRow
          className="min-w-0"
          label={t("pages.diapers.title")}
          value={kind}
          onChange={setKind}
          options={[
            { value: "pee", label: t("diaper.pee") },
            { value: "poop", label: t("diaper.poop") },
            { value: "both", label: t("diaper.both") },
          ]}
        />
        {needsPoop ? (
          <ChoiceRow
            className="min-w-0"
            label={t("diaper.amount")}
            value={amount}
            onChange={setAmount}
            options={[
              { value: "little", label: t("diaper.little") },
              { value: "medium", label: t("diaper.medium") },
              { value: "much", label: t("diaper.much") },
            ]}
          />
        ) : null}
      </div>
      {needsPoop ? (
        <div className="grid gap-3 md:grid-cols-2">
          <ChoiceRow
            className="min-w-0"
            label={t("diaper.color")}
            value={color}
            onChange={setColor}
            options={[
              { value: "yellow", label: t("diaper.yellow") },
              { value: "green", label: t("diaper.green") },
              { value: "black", label: t("diaper.black") },
              { value: "brown", label: t("diaper.brown") },
              { value: "other", label: t("diaper.other") },
            ]}
          />
          <ChoiceRow
            className="min-w-0"
            label={t("diaper.texture")}
            value={texture}
            onChange={setTexture}
            options={[
              { value: "liquid", label: t("diaper.liquid") },
              { value: "soft", label: t("diaper.soft") },
              { value: "solid", label: t("diaper.solid") },
            ]}
          />
        </div>
      ) : null}
      <SubmitButton label={editing ? t("common.save") : t("diaper.add")} disabled={!canSave} />
    </LogForm>
  );
}

/** One moment: the baby fell asleep, or woke up. Either can be logged without the other. */
export function SleepLogForm({
  onSaved,
  initial,
  embedded,
  defaultKind = "sleep",
  entries = [],
  children,
}: {
  onSaved?: () => void;
  initial?: SleepEntry;
  entries?: SleepEntry[];
  embedded?: boolean;
  defaultKind?: SleepKind;
  children?: React.ReactNode;
}) {
  const { t, locale } = useLocale();
  const [kind, setKind] = useState<SleepKind>(initial?.kind ?? defaultKind);
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial);
  // Clock fields have minute precision and `now` ticks every 30s, so allow the current minute.
  const latest = useNow().getTime() + 60_000;
  const at = date && time ? parseISO(`${date}T${time}`) : null;
  const inFuture = at !== null && at.getTime() > latest;
  const canSave = at !== null && !inFuture && !saving;

  return (
    <LogForm
      title={editing ? t("sleep.edit") : t("sleep.add")}
      description={editing ? undefined : t("sleep.manualHint")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const entry: SleepEntry = { id: initial?.id ?? crypto.randomUUID(), date, time, kind };
        const detail = editing
          ? undefined
          : kind === "sleep"
            ? t("toast.sleepStarted", { time: formatTimeLabel(time, locale) })
            : t("toast.sleepWoke", { time: formatTimeLabel(time, locale) });
        const text = sleepShareText(entry, [...entries.filter((row) => row.id !== entry.id), entry], t);
        setSaving(true);
        void commitSave("sleep", () => saveSleep(entry), editing ? "update" : "save", text, "sleep", detail).then(
          (ok) => {
            setSaving(false);
            if (!ok) return;
            if (!initial) {
              setDate(getTodayDateStr());
              setTime(getCurrentTimeString());
            }
            onSaved?.();
          },
        );
      }}
    >
      {children}
      <div className="min-w-0 space-y-2">
        <Label htmlFor="sleep-kind">{t("sleep.momentLabel")}</Label>
        <Select value={kind} onValueChange={(value) => setKind(value as SleepKind)}>
          <SelectTrigger
            id="sleep-kind"
            className="w-full rounded-xl border-border bg-background px-2.5 data-[size=default]:h-11"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sleep">{t("sleep.momentSleep")}</SelectItem>
            <SelectItem value="wake">{t("sleep.momentWake")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={kind === "sleep" ? t("sleep.startDate") : t("sleep.endDate")}
          date={date}
          onDate={setDate}
        />
        <TimeField label={kind === "sleep" ? t("sleep.start") : t("sleep.end")} time={time} onTime={setTime} />
      </div>
      {inFuture ? <p className="text-sm text-destructive">{t("sleep.inFuture")}</p> : null}
      <SubmitButton
        label={editing ? t("common.save") : kind === "sleep" ? t("sleep.saveSleep") : t("sleep.saveWake")}
        disabled={!canSave}
      />
    </LogForm>
  );
}

/** New sleep or wake log. `withStatus` adds a running-sleep card where no "last" cards are shown. */
export function SleepTracker({
  entries,
  onSaved,
  embedded = false,
  withStatus = true,
}: {
  entries: SleepEntry[];
  onSaved?: () => void;
  embedded?: boolean;
  withStatus?: boolean;
}) {
  const { t, locale } = useLocale();
  const now = useNow();
  const active = activeSleep(entries);
  const elapsed = active ? sleepElapsedMinutes(active, now) : 0;

  return (
    <SleepLogForm
      key={active?.id ?? "awake"}
      defaultKind={active ? "wake" : "sleep"}
      entries={entries}
      onSaved={onSaved}
      embedded={embedded}
    >
      {active && withStatus ? (
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-900">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
            <Moon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("sleep.asleepSince", { time: formatTimeLabel(active.time, locale) })}</p>
            <p className="text-2xl font-bold tabular-nums">{formatDuration(elapsed, t)}</p>
          </div>
        </div>
      ) : null}
      {elapsed >= FORGOTTEN_SLEEP_MINUTES ? (
        <p className="text-sm font-medium text-destructive">{t("sleep.forgotWake")}</p>
      ) : null}
    </SleepLogForm>
  );
}

/** For places that do not already load sleep logs, like the quick-log button. */
export function SleepQuickLog({ onSaved, embedded }: { onSaved?: () => void; embedded?: boolean }) {
  const { signedIn } = useSupabase();
  const { data } = useRemote("sleep", listSleeps, signedIn);
  if (!data) return <SleepFormSkeleton embedded={embedded} />;
  return <SleepTracker entries={data} onSaved={onSaved} embedded={embedded} />;
}
