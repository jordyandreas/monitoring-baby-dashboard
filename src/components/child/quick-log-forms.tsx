"use client";

import { useState } from "react";
import {
  ChoiceRow,
  DateField,
  LogForm,
  NumberField,
  SubmitButton,
  TimeField,
} from "@/components/child/form-bits";
import { commitSave } from "@/components/ui/save-toast";
import { useLocale } from "@/components/providers/locale-provider";
import { sleepMinutes } from "@/lib/child/summary";
import type {
  DiaperEntry,
  DiaperKind,
  FeedEntry,
  FeedKind,
  FeedSide,
  PoopColor,
  PoopTexture,
  SleepEntry,
  SleepPeriod,
} from "@/lib/child/types";
import { getCurrentTimeString } from "@/utils/time";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { diaperShareText, feedShareText } from "@/lib/child/whatsapp-share";
import { saveDiaper } from "@/services/diapers.service";
import { saveFeed } from "@/services/feed.service";
import { saveSleep } from "@/services/sleep.service";

/** Per-feed shortcuts. Steps grow from a newborn feed toward a typical feed by age 2. */
const NURSING_MINUTES = [5, 10, 15, 20, 30, 45];
const BOTTLE_ML = [30, 45, 60, 90, 120, 180, 240];

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
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [kind, setKind] = useState<FeedKind>(initial?.kind ?? "breast");
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
            { value: "breast", label: t("feed.kindBreast") },
            { value: "bottle-breast", label: t("feed.kindBottleBreast") },
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
        />
      ) : (
        <NumberField
          id={`${fieldId}-amount`}
          label={t("feed.amount")}
          value={amount}
          onChange={setAmount}
          presets={BOTTLE_ML}
          presetUnit="ml"
        />
      )}
      <SubmitButton label={editing ? t("common.save") : t("feed.add")} disabled={!canSave} />
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
  const editing = Boolean(initial);
  const needsPoop = kind === "poop" || kind === "both";

  return (
    <LogForm
      title={editing ? t("diaper.edit") : t("diaper.add")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!date || !time) return;
        const next = {
          date,
          time,
          kind,
          ...(needsPoop ? { poopColor: color, poopTexture: texture } : {}),
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
      <ChoiceRow
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
      <SubmitButton label={editing ? t("common.save") : t("diaper.add")} disabled={!date || !time} />
    </LogForm>
  );
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
  const [startTime, setStartTime] = useState(initial?.startTime ?? getCurrentTimeString);
  const [endTime, setEndTime] = useState(initial?.endTime ?? getCurrentTimeString);
  const [period, setPeriod] = useState<SleepPeriod>(() => {
    if (initial) return initial.period;
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7 ? "night" : "day";
  });
  const editing = Boolean(initial);
  const duration = date && startTime && endTime ? sleepMinutes({ id: "draft", date, startTime, endTime, period }) : 0;

  return (
    <LogForm
      title={editing ? t("sleep.edit") : t("sleep.add")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (duration <= 0) return;
        const entry: SleepEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          startTime,
          endTime,
          period,
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
      <div className="grid grid-cols-2 gap-3">
        <TimeField label={t("sleep.start")} time={startTime} onTime={setStartTime} />
        <TimeField label={t("sleep.end")} time={endTime} onTime={setEndTime} />
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
      <SubmitButton label={editing ? t("common.save") : t("sleep.add")} disabled={duration <= 0} />
    </LogForm>
  );
}
