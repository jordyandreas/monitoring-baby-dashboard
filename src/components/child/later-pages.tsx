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
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { describeHealth, describeMeal, describePotty, describeSolid } from "@/lib/child/summary";
import { MILESTONE_KEYS, type MealSlot, type MilestoneKey, type PottyKind } from "@/lib/child/types";
import { getCurrentTimeString } from "@/utils/time";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { deleteHealth, listHealth, saveHealth } from "@/services/health.service";
import { deleteMeal, listMeals, saveMeal } from "@/services/meals.service";
import { deleteMilestone, listMilestones, saveMilestone } from "@/services/milestones.service";
import { deletePotty, listPotty, savePotty } from "@/services/potty.service";
import { deleteSolid, listSolids, saveSolid } from "@/services/solids.service";

function useClock() {
  const [date, setDate] = useState(getTodayDateStr);
  const [time, setTime] = useState(getCurrentTimeString);
  return { date, setDate, time, setTime };
}

export function SolidsPageContent() {
  const { t, locale } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("solid", listSolids, signedIn);
  const { date, setDate, time, setTime } = useClock();
  const [name, setName] = useState("");
  const [allergy, setAllergy] = useState("");
  if (!ready) return <ListPageSkeleton />;
  const items = newestFirst(data ?? []).map((entry) => ({
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
          void commitSave(
            "solid",
            () =>
              saveSolid({
                id: crypto.randomUUID(),
                date,
                time,
                name: name.trim(),
                ...(allergy.trim() ? { allergyNote: allergy.trim() } : {}),
              }),
            "save",
            undefined,
            "solid",
          ).then((ok) => {
            if (!ok) return;
            setName("");
            setAllergy("");
            setTime(getCurrentTimeString());
          });
        }}
      >
        <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
        <TextField id="solid-name" label={t("solids.name")} value={name} onChange={setName} />
        <TextField id="solid-allergy" label={t("solids.allergy")} value={allergy} onChange={setAllergy} />
        <SubmitButton label={t("solids.add")} disabled={!date || !time || !name.trim()} />
      </LogForm>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("child.history")}</h2>
        <HistoryList
          items={items}
          emptyLabel={t("solids.empty")}
          onDelete={(id) => {
            void commitSave("solid", () => deleteSolid(id), "delete", undefined, "solid");
          }}
        />
      </section>
    </LogScreen>
  );
}

export function HealthPageContent() {
  const { t, locale } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("health", listHealth, signedIn);
  const { date, setDate, time, setTime } = useClock();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [temp, setTemp] = useState("");
  if (!ready) return <ListPageSkeleton />;
  const temperatureC = temp.trim() ? Number(temp) : undefined;
  const tempOk = temperatureC === undefined || (Number.isFinite(temperatureC) && temperatureC > 30 && temperatureC < 45);
  const canSave = Boolean(date && time && tempOk && (name.trim() || temperatureC !== undefined));
  const items = newestFirst(data ?? []).map((entry) => ({
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
          void commitSave(
            "health",
            () =>
              saveHealth({
                id: crypto.randomUUID(),
                date,
                time,
                name: name.trim(),
                dose: dose.trim(),
                ...(temperatureC !== undefined ? { temperatureC } : {}),
              }),
            "save",
            undefined,
            "health",
          ).then((ok) => {
            if (!ok) return;
            setName("");
            setDose("");
            setTemp("");
            setTime(getCurrentTimeString());
          });
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
        <HistoryList
          items={items}
          emptyLabel={t("health.empty")}
          onDelete={(id) => {
            void commitSave("health", () => deleteHealth(id), "delete", undefined, "health");
          }}
        />
      </section>
    </LogScreen>
  );
}

export function PottyPageContent() {
  const { t, locale } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("potty", listPotty, signedIn);
  const { date, setDate, time, setTime } = useClock();
  const [kind, setKind] = useState<PottyKind>("pee");
  if (!ready) return <ListPageSkeleton />;
  const items = newestFirst(data ?? []).map((entry) => ({
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
          void commitSave(
            "potty",
            () => savePotty({ id: crypto.randomUUID(), date, time, kind }),
            "save",
            undefined,
            "potty",
          ).then((ok) => {
            if (ok) setTime(getCurrentTimeString());
          });
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
        <HistoryList
          items={items}
          emptyLabel={t("potty.empty")}
          onDelete={(id) => {
            void commitSave("potty", () => deletePotty(id), "delete", undefined, "potty");
          }}
        />
      </section>
    </LogScreen>
  );
}

export function MealsPageContent() {
  const { t, locale } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("meal", listMeals, signedIn);
  const { date, setDate, time, setTime } = useClock();
  const [slot, setSlot] = useState<MealSlot>("breakfast");
  const [note, setNote] = useState("");
  if (!ready) return <ListPageSkeleton />;
  const items = newestFirst(data ?? []).map((entry) => ({
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
          void commitSave(
            "meal",
            () => saveMeal({ id: crypto.randomUUID(), date, time, slot, note: note.trim() }),
            "save",
            undefined,
            "meal",
          ).then((ok) => {
            if (!ok) return;
            setNote("");
            setTime(getCurrentTimeString());
          });
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
        <HistoryList
          items={items}
          emptyLabel={t("meals.empty")}
          onDelete={(id) => {
            void commitSave("meal", () => deleteMeal(id), "delete", undefined, "meal");
          }}
        />
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
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("milestone", listMilestones, signedIn);
  if (!ready) return <MilestonesSkeleton />;
  const milestones = data ?? [];
  const setMilestone = (key: MilestoneKey, date: string | null) => {
    void commitSave(
      "milestone",
      () => (date ? saveMilestone(key, date) : deleteMilestone(key)),
      date ? "save" : "delete",
      undefined,
      "milestone",
    );
  };
  return (
    <LogScreen>
      <ul className="space-y-3">
        {MILESTONE_KEYS.map((key) => {
          const saved = milestones.find((entry) => entry.key === key);
          return (
            <li key={key} className="space-y-3 rounded-2xl glass-regular p-4">
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
