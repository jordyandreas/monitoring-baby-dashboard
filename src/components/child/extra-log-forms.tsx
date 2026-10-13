"use client";

import { useState } from "react";
import {
  ChoiceRow,
  DateTimeFields,
  LogForm,
  NumberField,
  SubmitButton,
  TextField,
} from "@/components/child/form-bits";
import { commitSave } from "@/components/ui/save-toast";
import { useLocale } from "@/components/providers/locale-provider";
import type { FoodEntry, FoodSlot, HealthEntry, PottyEntry, PottyKind } from "@/lib/child/types";
import { getCurrentTimeString } from "@/utils/time";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { saveFood } from "@/services/food.service";
import { saveHealth } from "@/services/health.service";
import { savePotty } from "@/services/potty.service";

const FOOD_SLOTS: FoodSlot[] = ["breakfast", "lunch", "snack", "dinner"];

function slotLabel(slot: FoodSlot, t: (key: string) => string): string {
  if (slot === "breakfast") return t("food.breakfast");
  if (slot === "lunch") return t("food.lunch");
  if (slot === "dinner") return t("food.dinner");
  return t("food.snack");
}

export function FoodLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: FoodEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [name, setName] = useState(initial?.name ?? "");
  const [slot, setSlot] = useState<FoodSlot>(initial?.slot ?? "snack");
  const [allergy, setAllergy] = useState(initial?.allergyNote ?? "");
  const editing = Boolean(initial);
  const fieldId = initial ? `food-edit-${initial.id}` : "food";
  const canSave = Boolean(date && time && name.trim());

  return (
    <LogForm
      title={editing ? t("food.edit") : t("food.add")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const entry: FoodEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          time,
          name: name.trim(),
          slot,
          ...(allergy.trim() ? { allergyNote: allergy.trim() } : {}),
        };
        void commitSave("food", () => saveFood(entry), editing ? "update" : "save", undefined, "food").then((ok) => {
          if (!ok) return;
          onSaved?.();
          if (editing) return;
          setName("");
          setAllergy("");
          setTime(getCurrentTimeString());
        });
      }}
    >
      <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
      <TextField id={`${fieldId}-name`} label={t("food.name")} value={name} onChange={setName} />
      <ChoiceRow
        label={t("food.slot")}
        value={slot}
        onChange={setSlot}
        options={FOOD_SLOTS.map((value) => ({ value, label: slotLabel(value, t) }))}
      />
      <TextField id={`${fieldId}-allergy`} label={t("food.allergy")} value={allergy} onChange={setAllergy} />
      <SubmitButton label={editing ? t("common.save") : t("food.add")} disabled={!canSave} />
    </LogForm>
  );
}

export function TemperatureLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: HealthEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [temp, setTemp] = useState(initial?.temperatureC !== undefined ? String(initial.temperatureC) : "");
  const editing = Boolean(initial);
  const temperatureC = Number(temp);
  const canSave = Boolean(date && time && Number.isFinite(temperatureC) && temperatureC > 30 && temperatureC < 45);

  return (
    <LogForm
      title={editing ? t("health.temperatureEdit") : t("health.temperatureAdd")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const entry: HealthEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          time,
          kind: "temperature",
          name: "",
          dose: "",
          temperatureC,
        };
        void commitSave(
          "health",
          () => saveHealth(entry),
          editing ? "update" : "save",
          undefined,
          "temperature",
        ).then((ok) => {
          if (!ok) return;
          onSaved?.();
          if (editing) return;
          setTemp("");
          setTime(getCurrentTimeString());
        });
      }}
    >
      <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
      <NumberField
        id={initial ? `temp-edit-${initial.id}` : "health-temp"}
        label={t("health.temp")}
        value={temp}
        onChange={setTemp}
        step="0.1"
      />
      <SubmitButton label={editing ? t("common.save") : t("health.temperatureAdd")} disabled={!canSave} />
    </LogForm>
  );
}

export function MedicineLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: HealthEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [name, setName] = useState(initial?.name ?? "");
  const [dose, setDose] = useState(initial?.dose ?? "");
  const editing = Boolean(initial);
  const fieldId = initial ? `medicine-edit-${initial.id}` : "medicine";
  const canSave = Boolean(date && time && name.trim());

  return (
    <LogForm
      title={editing ? t("health.medicineEdit") : t("health.medicineAdd")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const entry: HealthEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          time,
          kind: "medicine",
          name: name.trim(),
          dose: dose.trim(),
        };
        void commitSave(
          "health",
          () => saveHealth(entry),
          editing ? "update" : "save",
          undefined,
          "medicine",
        ).then((ok) => {
          if (!ok) return;
          onSaved?.();
          if (editing) return;
          setName("");
          setDose("");
          setTime(getCurrentTimeString());
        });
      }}
    >
      <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
      <TextField id={`${fieldId}-name`} label={t("health.name")} value={name} onChange={setName} />
      <TextField id={`${fieldId}-dose`} label={t("health.dose")} value={dose} onChange={setDose} />
      <SubmitButton label={editing ? t("common.save") : t("health.medicineAdd")} disabled={!canSave} />
    </LogForm>
  );
}

export function PottyLogForm({
  onSaved,
  initial,
  embedded,
}: {
  onSaved?: () => void;
  initial?: PottyEntry;
  embedded?: boolean;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(initial?.date ?? getTodayDateStr);
  const [time, setTime] = useState(initial?.time ?? getCurrentTimeString);
  const [kind, setKind] = useState<PottyKind>(initial?.kind ?? "pee");
  const editing = Boolean(initial);
  const canSave = Boolean(date && time);

  return (
    <LogForm
      title={editing ? t("potty.edit") : t("potty.add")}
      embedded={embedded ?? editing}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        const entry: PottyEntry = {
          id: initial?.id ?? crypto.randomUUID(),
          date,
          time,
          kind,
        };
        void commitSave("potty", () => savePotty(entry), editing ? "update" : "save", undefined, "potty").then(
          (ok) => {
            if (!ok) return;
            onSaved?.();
            if (!editing) setTime(getCurrentTimeString());
          },
        );
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
      <SubmitButton label={editing ? t("common.save") : t("potty.add")} disabled={!canSave} />
    </LogForm>
  );
}
