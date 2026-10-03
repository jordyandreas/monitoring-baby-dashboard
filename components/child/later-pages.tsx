"use client";

import { useState } from "react";
import {
  ChoiceRow,
  DateTimeFields,
  LogForm,
  LogScreen,
  NumberField,
  SubmitButton,
  TextField,
  formatLogWhen,
  newestFirst,
} from "@/components/child/form-bits";
import { HistoryList } from "@/components/child/history-list";
import { ListPageSkeleton, MilestonesSkeleton } from "@/components/layout/data-skeletons";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { describeHealth, describeMeal, describePotty, describeSolid } from "@/lib/child/summary";
import { MILESTONE_KEYS, type MealSlot, type MilestoneKey, type PottyKind } from "@/lib/child/types";
import { getCurrentTimeString } from "@/lib/time-utils";
import { getTodayDateStr } from "@/lib/vitamins";

function useClock() {
  const [date, setDate] = useState(getTodayDateStr);
  const [time, setTime] = useState(getCurrentTimeString);
  return { date, setDate, time, setTime };
}

export function SolidsPageContent() {
  const { t, locale } = useLocale();
  const { data, mounted, addSolid, removeSolid } = useChildStorage();
  const { date, setDate, time, setTime } = useClock();
  const [name, setName] = useState("");
  const [allergy, setAllergy] = useState("");
  const pending = useRemoteDataPending();
  if (!mounted || pending) return <ListPageSkeleton />;
  const items = newestFirst(data.solids).map((entry) => ({
    id: entry.id,
    title: formatLogWhen(entry.date, entry.time, locale),
    detail: describeSolid(entry, t),
  }));
  return (
    <LogScreen>
      <LogForm
        title={t("solids.add")}
        onSubmit={(event) => {
          event.preventDefault();
          if (!date || !time || !name.trim()) return;
          addSolid({
            date,
            time,
            name: name.trim(),
            ...(allergy.trim() ? { allergyNote: allergy.trim() } : {}),
          });
          setName("");
          setAllergy("");
          setTime(getCurrentTimeString());
        }}
      >
        <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
        <TextField id="solid-name" label={t("solids.name")} value={name} onChange={setName} />
        <TextField id="solid-allergy" label={t("solids.allergy")} value={allergy} onChange={setAllergy} />
        <SubmitButton label={t("solids.add")} disabled={!date || !time || !name.trim()} />
      </LogForm>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("child.history")}</h2>
        <HistoryList items={items} emptyLabel={t("solids.empty")} onDelete={removeSolid} />
      </section>
    </LogScreen>
  );
}

export function HealthPageContent() {
  const { t, locale } = useLocale();
  const { data, mounted, addHealth, removeHealth } = useChildStorage();
  const { date, setDate, time, setTime } = useClock();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [temp, setTemp] = useState("");
  const pending = useRemoteDataPending();
  if (!mounted || pending) return <ListPageSkeleton />;
  const temperatureC = temp.trim() ? Number(temp) : undefined;
  const tempOk = temperatureC === undefined || (Number.isFinite(temperatureC) && temperatureC > 30 && temperatureC < 45);
  const canSave = Boolean(date && time && tempOk && (name.trim() || temperatureC !== undefined));
  const items = newestFirst(data.health).map((entry) => ({
    id: entry.id,
    title: formatLogWhen(entry.date, entry.time, locale),
    detail: describeHealth(entry, t),
  }));
  return (
    <LogScreen>
      <LogForm
        title={t("health.add")}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          addHealth({
            date,
            time,
            name: name.trim(),
            dose: dose.trim(),
            ...(temperatureC !== undefined ? { temperatureC } : {}),
          });
          setName("");
          setDose("");
          setTemp("");
          setTime(getCurrentTimeString());
        }}
      >
        <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
        <TextField id="health-name" label={t("health.name")} value={name} onChange={setName} />
        <TextField id="health-dose" label={t("health.dose")} value={dose} onChange={setDose} />
        <NumberField id="health-temp" label={t("health.temp")} value={temp} onChange={setTemp} step="0.1" />
        <SubmitButton label={t("health.add")} disabled={!canSave} />
      </LogForm>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("child.history")}</h2>
        <HistoryList items={items} emptyLabel={t("health.empty")} onDelete={removeHealth} />
      </section>
    </LogScreen>
  );
}

export function PottyPageContent() {
  const { t, locale } = useLocale();
  const { data, mounted, addPotty, removePotty } = useChildStorage();
  const { date, setDate, time, setTime } = useClock();
  const [kind, setKind] = useState<PottyKind>("pee");
  const pending = useRemoteDataPending();
  if (!mounted || pending) return <ListPageSkeleton />;
  const items = newestFirst(data.potty).map((entry) => ({
    id: entry.id,
    title: formatLogWhen(entry.date, entry.time, locale),
    detail: describePotty(entry, t),
  }));
  return (
    <LogScreen>
      <LogForm
        title={t("potty.add")}
        onSubmit={(event) => {
          event.preventDefault();
          if (!date || !time) return;
          addPotty({ date, time, kind });
          setTime(getCurrentTimeString());
        }}
      >
        <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
        <ChoiceRow
          label={t("pages.potty.title")}
          value={kind}
          onChange={setKind}
          options={[
            { value: "pee", label: t("potty.pee") },
            { value: "poop", label: t("potty.poop") },
            { value: "accident", label: t("potty.accident") },
            { value: "diaper", label: t("potty.diaper") },
          ]}
        />
        <SubmitButton label={t("potty.add")} disabled={!date || !time} />
      </LogForm>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("child.history")}</h2>
        <HistoryList items={items} emptyLabel={t("potty.empty")} onDelete={removePotty} />
      </section>
    </LogScreen>
  );
}

export function MealsPageContent() {
  const { t, locale } = useLocale();
  const { data, mounted, addMeal, removeMeal } = useChildStorage();
  const { date, setDate, time, setTime } = useClock();
  const [slot, setSlot] = useState<MealSlot>("breakfast");
  const [note, setNote] = useState("");
  const pending = useRemoteDataPending();
  if (!mounted || pending) return <ListPageSkeleton />;
  const items = newestFirst(data.meals).map((entry) => ({
    id: entry.id,
    title: formatLogWhen(entry.date, entry.time, locale),
    detail: describeMeal(entry, t),
  }));
  return (
    <LogScreen>
      <LogForm
        title={t("meals.add")}
        onSubmit={(event) => {
          event.preventDefault();
          if (!date || !time) return;
          addMeal({ date, time, slot, note: note.trim() });
          setNote("");
          setTime(getCurrentTimeString());
        }}
      >
        <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
        <ChoiceRow
          label={t("pages.meals.title")}
          value={slot}
          onChange={setSlot}
          options={[
            { value: "breakfast", label: t("meals.breakfast") },
            { value: "lunch", label: t("meals.lunch") },
            { value: "snack", label: t("meals.snack") },
            { value: "dinner", label: t("meals.dinner") },
          ]}
        />
        <TextField id="meal-note" label={t("meals.note")} value={note} onChange={setNote} />
        <SubmitButton label={t("meals.add")} disabled={!date || !time} />
      </LogForm>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("child.history")}</h2>
        <HistoryList items={items} emptyLabel={t("meals.empty")} onDelete={removeMeal} />
      </section>
    </LogScreen>
  );
}

function milestoneLabel(key: MilestoneKey, t: (key: string) => string): string {
  switch (key) {
    case "smile":
      return t("milestones.smile");
    case "roll":
      return t("milestones.roll");
    case "sit":
      return t("milestones.sit");
    case "crawl":
      return t("milestones.crawl");
    case "stand":
      return t("milestones.stand");
    case "walk":
      return t("milestones.walk");
    case "firstWord":
      return t("milestones.firstWord");
    default:
      return t("milestones.run");
  }
}

export function MilestonesPageContent() {
  const { t } = useLocale();
  const { data, mounted, setMilestone } = useChildStorage();
  const pending = useRemoteDataPending();
  if (!mounted || pending) return <MilestonesSkeleton />;
  return (
    <LogScreen>
      <ul className="space-y-3">
        {MILESTONE_KEYS.map((key) => {
          const saved = data.milestones.find((entry) => entry.key === key);
          return (
            <li key={key} className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(saved)}
                  onChange={(event) => setMilestone(key, event.target.checked ? getTodayDateStr() : null)}
                  className="size-4"
                />
                {milestoneLabel(key, t)}
              </label>
              {saved ? (
                <div className="min-w-0 space-y-2">
                  <Label>{t("milestones.date")}</Label>
                  <DatePicker
                    value={saved.date}
                    onChange={(value) => setMilestone(key, value || null)}
                    placeholder={t("common.selectDate")}
                    clearAriaLabel={t("common.clearDate")}
                    toDate={new Date()}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </LogScreen>
  );
}
