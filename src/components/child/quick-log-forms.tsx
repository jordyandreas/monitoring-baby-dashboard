"use client";

import { useEffect, useState } from "react";
import { parseISO } from "date-fns";
import { Moon, Pencil, Sun } from "lucide-react";
import {
  ChoiceRow,
  DateField,
  LogForm,
  NumberField,
  SubmitButton,
  TimeField,
} from "@/components/child/form-bits";
import { commitSave } from "@/components/ui/save-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useBottleMlPresets } from "@/hooks/use-bottle-ml-presets";
import { useRemote } from "@/hooks/use-remote";
import {
  activeSleep,
  clockOf,
  FORGOTTEN_SLEEP_MINUTES,
  formatDuration,
  sleepElapsedMinutes,
  sleepMinutes,
  sleepPeriodAt,
  sleepRange,
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
  SleepPeriod,
} from "@/lib/child/types";
import { cn } from "@/utils/cn";
import { formatTimeLabel, getCurrentTimeString } from "@/utils/time";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { diaperShareText, feedShareText, pumpShareText } from "@/lib/child/whatsapp-share";
import { saveDiaper } from "@/services/diapers.service";
import { saveFeed } from "@/services/feed.service";
import { savePump } from "@/services/pump.service";
import { endSleep, listSleeps, saveSleep } from "@/services/sleep.service";

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

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function SleepLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: SleepEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [startTime, setStartTime] = useState(() => (initial ? clockOf(initial.startedAt) : getCurrentTimeString()));
  const [endTime, setEndTime] = useState(() =>
    initial?.endedAt ? clockOf(initial.endedAt) : getCurrentTimeString(),
  );
  const [awake, setAwake] = useState(initial ? Boolean(initial.endedAt) : true);
  const [period, setPeriod] = useState<SleepPeriod>(() => initial?.period ?? sleepPeriodAt(new Date()));
  const editing = Boolean(initial);
  const ongoing = Boolean(initial && !initial.endedAt);
  const range = date && startTime ? sleepRange(date, startTime, awake ? endTime : undefined) : null;
  // Clock fields have minute precision and `now` ticks every 30s, so allow the current minute.
  const latest = useNow().getTime() + 60_000;
  const canSave =
    range !== null &&
    parseISO(range.startedAt).getTime() <= latest &&
    (!awake ||
      (range.endedAt !== undefined &&
        parseISO(range.endedAt).getTime() <= latest &&
        sleepMinutes({ id: "draft", date, period, ...range }) > 0));

  return (
    <LogForm
      title={editing ? t("sleep.edit") : t("sleep.add")}
      description={editing ? undefined : t("sleep.manualHint")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || !range) return;
        const entry: SleepEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          period,
          ...range,
        };
        void commitSave("sleep", () => saveSleep(entry), initial ? "update" : "save", undefined, "sleep").then((ok) => {
          if (!ok) return;
          if (!initial) {
            setStartTime(getCurrentTimeString());
            setEndTime(getCurrentTimeString());
          }
          onSaved?.();
        });
      }}
    >
      <DateField date={date} onDate={setDate} />
      {ongoing ? (
        <ChoiceRow
          label={t("sleep.status")}
          value={awake ? "awake" : "asleep"}
          onChange={(value) => setAwake(value === "awake")}
          options={[
            { value: "asleep", label: t("sleep.stillAsleep") },
            { value: "awake", label: t("sleep.awake") },
          ]}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <TimeField label={t("sleep.start")} time={startTime} onTime={setStartTime} />
        {awake ? <TimeField label={t("sleep.end")} time={endTime} onTime={setEndTime} /> : null}
      </div>
      <ChoiceRow
        label={t("pages.sleep.title")}
        value={period}
        onChange={setPeriod}
        options={[
          { value: "day", label: t("sleep.day") },
          { value: "night", label: t("sleep.night") },
        ]}
      />
      <SubmitButton label={editing ? t("common.save") : t("sleep.add")} disabled={!canSave} />
    </LogForm>
  );
}

/** "Fell asleep" now, "Woke up" later. Manual entry stays available for sleeps logged after the fact. */
export function SleepTracker({
  entries,
  onSaved,
  embedded = false,
}: {
  entries: SleepEntry[];
  onSaved?: () => void;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const now = useNow();
  const [panel, setPanel] = useState<"none" | "manual" | "edit">("none");
  const [busyFor, setBusyFor] = useState<SleepEntry[] | null>(null);
  const active = activeSleep(entries);
  // Stays busy until the list reloads, so a second tap cannot start a duplicate sleep.
  const busy = busyFor === entries;

  function run(save: () => Promise<void>, action: "save" | "update", detail: string) {
    setBusyFor(entries);
    void commitSave("sleep", save, action, undefined, "sleep", detail).then((ok) => {
      if (!ok) {
        setBusyFor(null);
        return;
      }
      setPanel("none");
      onSaved?.();
    });
  }

  function start() {
    if (active) return;
    const startedAt = new Date();
    const entry: SleepEntry = {
      id: crypto.randomUUID(),
      date: getTodayDateStr(),
      startedAt: startedAt.toISOString(),
      period: sleepPeriodAt(startedAt),
    };
    run(() => saveSleep(entry), "save", t("toast.sleepStarted", { time: formatTimeLabel(clockOf(entry.startedAt)) }));
  }

  function wake() {
    if (!active) return;
    const endedAt = new Date();
    const minutes = sleepElapsedMinutes(active, endedAt);
    run(() => endSleep(active.id, endedAt.toISOString()), "update", t("toast.sleepEnded", { duration: formatDuration(minutes, t) }));
  }

  const elapsed = active ? sleepElapsedMinutes(active, now) : 0;

  return (
    <section className={embedded ? "w-full min-w-0 space-y-4" : "space-y-4 rounded-2xl glass-regular p-4"}>
      <div className={embedded ? "pr-8" : undefined}>
        <h2 className="text-base font-semibold">{t("sleep.trackerTitle")}</h2>
        {active ? null : <p className="mt-1 text-sm text-muted-foreground">{t("sleep.trackerHint")}</p>}
      </div>
      {active ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-900">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
              <Moon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {t("sleep.asleepSince", { time: formatTimeLabel(clockOf(active.startedAt)) })}
              </p>
              <p className="text-2xl font-bold tabular-nums">{formatDuration(elapsed, t)}</p>
            </div>
          </div>
          {elapsed >= FORGOTTEN_SLEEP_MINUTES ? (
            <p className="text-sm font-medium text-destructive">{t("sleep.forgotWake")}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" className="min-h-11 flex-1 gap-2 rounded-full" disabled={busy} onClick={wake}>
              <Sun className="size-4" aria-hidden />
              {t("sleep.wakeNow")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 gap-2 rounded-full"
              aria-pressed={panel === "edit"}
              onClick={() => setPanel(panel === "edit" ? "none" : "edit")}
            >
              <Pencil className="size-4" aria-hidden />
              {t("child.edit")}
            </Button>
          </div>
          {panel === "edit" ? (
            <SleepLogForm key={active.id} initial={active} embedded onSaved={() => setPanel("none")} />
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <Button type="button" className="min-h-12 w-full gap-2 rounded-full" disabled={busy} onClick={start}>
            <Moon className="size-4" aria-hidden />
            {t("sleep.startNow")}
          </Button>
          <button
            type="button"
            aria-expanded={panel === "manual"}
            onClick={() => setPanel(panel === "manual" ? "none" : "manual")}
            className="w-full text-center text-sm font-semibold text-lilac-deep hover:underline"
          >
            {t("sleep.addManual")}
          </button>
          {panel === "manual" ? (
            <SleepLogForm
              embedded
              onSaved={() => {
                setPanel("none");
                onSaved?.();
              }}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}

/** For places that do not already load sleep logs, like the quick-log button. */
export function SleepQuickLog({ onSaved, embedded }: { onSaved?: () => void; embedded?: boolean }) {
  const { signedIn } = useSupabase();
  const { data } = useRemote("sleep", listSleeps, signedIn);
  if (!data) return <Skeleton className="h-40 rounded-2xl" />;
  return <SleepTracker entries={data} onSaved={onSaved} embedded={embedded} />;
}
