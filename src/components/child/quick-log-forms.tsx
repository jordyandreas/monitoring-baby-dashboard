"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
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
import { useRemote } from "@/hooks/use-remote";
import {
  activeSleep,
  clockOf,
  FORGOTTEN_SLEEP_MINUTES,
  formatDuration,
  sleepElapsedMinutes,
  sleepPeriodAt,
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
const MAX_SLEEP_MINUTES = 24 * 60;

function dateOf(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

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
  const [endDate, setEndDate] = useState(() =>
    initial?.endedAt ? dateOf(initial.endedAt) : (initial?.date ?? getTodayDateStr()),
  );
  const [endTime, setEndTime] = useState(() =>
    initial?.endedAt ? clockOf(initial.endedAt) : getCurrentTimeString(),
  );
  const [awake, setAwake] = useState(initial ? Boolean(initial.endedAt) : true);
  const editing = Boolean(initial);
  const ongoing = Boolean(initial && !initial.endedAt);
  const startedAt = date && startTime ? parseISO(`${date}T${startTime}`) : null;
  const endedAt = awake && endDate && endTime ? parseISO(`${endDate}T${endTime}`) : null;
  const duration = startedAt && endedAt ? Math.round((endedAt.getTime() - startedAt.getTime()) / 60000) : 0;
  const tooLong = duration >= MAX_SLEEP_MINUTES;
  // Clock fields have minute precision and `now` ticks every 30s, so allow the current minute.
  const latest = useNow().getTime() + 60_000;
  const canSave =
    startedAt !== null &&
    startedAt.getTime() <= latest &&
    (!awake || (endedAt !== null && endedAt.getTime() <= latest && duration > 0 && !tooLong));
  const inFuture = (startedAt?.getTime() ?? 0) > latest || (endedAt?.getTime() ?? 0) > latest;
  const problem = inFuture
    ? t("sleep.inFuture")
    : !startedAt || !endedAt
      ? null
      : duration <= 0
        ? t("sleep.wakeBeforeStart")
        : tooLong
          ? t("sleep.tooLong")
          : null;

  return (
    <LogForm
      title={editing ? t("sleep.edit") : t("sleep.add")}
      description={editing ? undefined : t("sleep.manualHint")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || !startedAt) return;
        const entry: SleepEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          period: sleepPeriodAt(startedAt),
          startedAt: startedAt.toISOString(),
          ...(endedAt ? { endedAt: endedAt.toISOString() } : {}),
        };
        void commitSave("sleep", () => saveSleep(entry), initial ? "update" : "save", undefined, "sleep").then((ok) => {
          if (!ok) return;
          if (!initial) {
            const today = getTodayDateStr();
            const now = getCurrentTimeString();
            setDate(today);
            setStartTime(now);
            setEndDate(today);
            setEndTime(now);
          }
          onSaved?.();
        });
      }}
    >
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
        <DateField
          label={t("sleep.startDate")}
          date={date}
          onDate={(value) => {
            setDate(value);
            if (value && (!endDate || endDate < value)) setEndDate(value);
          }}
        />
        <TimeField label={t("sleep.start")} time={startTime} onTime={setStartTime} />
      </div>
      {awake ? (
        <div className="grid grid-cols-2 gap-3">
          <DateField label={t("sleep.endDate")} date={endDate} onDate={setEndDate} />
          <TimeField label={t("sleep.end")} time={endTime} onTime={setEndTime} />
        </div>
      ) : null}
      {problem ? (
        <p className="text-sm text-destructive">{problem}</p>
      ) : canSave && awake ? (
        <p className="text-sm text-muted-foreground">
          {t("sleep.durationPreview", { duration: formatDuration(duration, t) })}
        </p>
      ) : null}
      <SubmitButton label={editing ? t("common.save") : t("sleep.add")} disabled={!canSave} />
    </LogForm>
  );
}

type SleepMoment = "sleep" | "wake";

/** Logs one moment after the fact: a sleep that started, or the wake-up that ends the running sleep. */
function SleepMomentForm({
  active,
  onSaved,
  embedded,
  children,
}: {
  active: SleepEntry | null;
  onSaved?: () => void;
  embedded: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useLocale();
  const [moment, setMoment] = useState<SleepMoment>(active ? "wake" : "sleep");
  const [date, setDate] = useState(getTodayDateStr);
  const [time, setTime] = useState(getCurrentTimeString);
  const [saving, setSaving] = useState(false);
  const latest = useNow().getTime() + 60_000;
  const at = date && time ? parseISO(`${date}T${time}`) : null;
  const duration =
    moment === "wake" && active && at ? Math.round((at.getTime() - parseISO(active.startedAt).getTime()) / 60000) : 0;

  let problem: string | null = null;
  if (moment === "sleep" && active) problem = t("sleep.alreadyAsleep");
  else if (moment === "wake" && !active) problem = t("sleep.noActiveSleep");
  else if (at && at.getTime() > latest) problem = t("sleep.inFuture");
  else if (moment === "wake" && at && duration <= 0) problem = t("sleep.wakeBeforeStart");
  else if (moment === "wake" && duration >= MAX_SLEEP_MINUTES) problem = t("sleep.tooLong");
  const canSave = at !== null && problem === null && !saving;

  return (
    <LogForm
      title={t("sleep.add")}
      description={t("sleep.manualHint")}
      embedded={embedded}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || !at) return;
        let save;
        if (moment === "sleep") {
          const entry: SleepEntry = {
            id: crypto.randomUUID(),
            date,
            startedAt: at.toISOString(),
            period: sleepPeriodAt(at),
          };
          save = commitSave("sleep", () => saveSleep(entry), "save", undefined, "sleep", t("toast.sleepStarted", {
            time: formatTimeLabel(time),
          }));
        } else if (active) {
          save = commitSave("sleep", () => endSleep(active.id, at.toISOString()), "update", undefined, "sleep", t(
            "toast.sleepEnded",
            { duration: formatDuration(duration, t) },
          ));
        } else {
          return;
        }
        setSaving(true);
        void save.then((ok) => {
          setSaving(false);
          if (ok) onSaved?.();
        });
      }}
    >
      {children}
      <div className="min-w-0 space-y-2">
        <Label htmlFor="sleep-moment">{t("sleep.momentLabel")}</Label>
        <Select value={moment} onValueChange={(value) => setMoment(value as SleepMoment)}>
          <SelectTrigger
            id="sleep-moment"
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
          label={moment === "sleep" ? t("sleep.startDate") : t("sleep.endDate")}
          date={date}
          onDate={setDate}
        />
        <TimeField label={moment === "sleep" ? t("sleep.start") : t("sleep.end")} time={time} onTime={setTime} />
      </div>
      {problem ? (
        <p className="text-sm text-destructive">{problem}</p>
      ) : moment === "wake" && active && duration > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("sleep.asleepSince", { time: formatTimeLabel(clockOf(active.startedAt)) })} ·{" "}
          {t("sleep.durationPreview", { duration: formatDuration(duration, t) })}
        </p>
      ) : null}
      <SubmitButton label={moment === "sleep" ? t("sleep.saveSleep") : t("sleep.saveWake")} disabled={!canSave} />
    </LogForm>
  );
}

/** Logs sleep and wake-up as separate moments. While a sleep is running, it shows how long it has lasted. */
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
  const active = activeSleep(entries);
  const elapsed = active ? sleepElapsedMinutes(active, now) : 0;

  return (
    <SleepMomentForm key={active?.id ?? "idle"} active={active} onSaved={onSaved} embedded={embedded}>
        {active ? (
          <div className="space-y-2">
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
          </div>
        ) : null}
    </SleepMomentForm>
  );
}

/** For places that do not already load sleep logs, like the quick-log button. */
export function SleepQuickLog({ onSaved, embedded }: { onSaved?: () => void; embedded?: boolean }) {
  const { signedIn } = useSupabase();
  const { data } = useRemote("sleep", listSleeps, signedIn);
  if (!data) return <SleepFormSkeleton embedded={embedded} />;
  return <SleepTracker entries={data} onSaved={onSaved} embedded={embedded} />;
}
