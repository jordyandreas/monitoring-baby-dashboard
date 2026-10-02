"use client";

import { useState } from "react";
import {
  LogForm,
  LogScreen,
  NumberField,
  SubmitButton,
} from "@/components/child/form-bits";
import { GrowthHistoryTable } from "@/components/child/growth-history";
import { GrowthCompareSummary } from "@/components/child/page-summary";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { growthByDay } from "@/lib/child/summary";
import { getTodayDateStr } from "@/lib/vitamins";

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function GrowthPageContent() {
  const { t } = useLocale();
  const { data, mounted, addGrowth, removeGrowth, replaceGrowthDay } = useChildStorage();
  const [date, setDate] = useState(getTodayDateStr);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [head, setHead] = useState("");

  if (!mounted) return null;

  const weightKg = optionalNumber(weight);
  const lengthCm = optionalNumber(length);
  const headCm = optionalNumber(head);
  const canSave = Boolean(date && (weightKg || lengthCm || headCm));
  const days = growthByDay(data.growth);
  const birthDate = data.profile?.birthDate ?? null;
  const sex = data.profile?.gender ?? null;

  return (
    <LogScreen>
      <GrowthCompareSummary
        entries={data.growth}
        birthDate={birthDate}
        sex={sex}
      />
      <div id="growth-add" className="scroll-mt-24">
        <LogForm
          title={t("growth.add")}
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            addGrowth({
              date,
              ...(weightKg !== undefined ? { weightKg } : {}),
              ...(lengthCm !== undefined ? { lengthCm } : {}),
              ...(headCm !== undefined ? { headCm } : {}),
            });
            setWeight("");
            setLength("");
            setHead("");
          }}
        >
          <div className="min-w-0 space-y-2">
            <Label>{t("child.date")}</Label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder={t("common.selectDate")}
              clearAriaLabel={t("common.clearDate")}
              toDate={new Date()}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField
              id="growth-weight"
              label={t("growth.weight")}
              value={weight}
              onChange={setWeight}
              step="0.01"
              unit="kg"
            />
            <NumberField
              id="growth-length"
              label={t("growth.length")}
              value={length}
              onChange={setLength}
              step="0.1"
              unit="cm"
            />
            <NumberField
              id="growth-head"
              label={t("growth.head")}
              value={head}
              onChange={setHead}
              step="0.1"
              unit="cm"
            />
          </div>
          <SubmitButton label={t("growth.add")} disabled={!canSave} />
        </LogForm>
      </div>
      <GrowthHistoryTable
        days={days}
        birthDate={birthDate}
        onReplace={replaceGrowthDay}
        onDelete={(id) => {
          const day = days.find((entry) => entry.id === id);
          removeGrowth(day?.sourceIds ?? [id]);
        }}
      />
    </LogScreen>
  );
}
