"use client";

import { useState } from "react";
import {
  LogForm,
  LogScreen,
  NumberField,
  SubmitButton,
} from "@/components/child/form-bits";
import { GrowthHistoryTable } from "@/components/child/growth-history";
import { GrowthPageSkeleton, LoadFailed } from "@/components/layout/data-skeletons";
import { GrowthCompareSummary } from "@/components/child/page-summary";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { growthByDay } from "@/lib/child/summary";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { getChildProfile } from "@/services/child.service";
import { deleteGrowth, listGrowth, replaceGrowthDay, saveMergedGrowth } from "@/services/growth.service";

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function GrowthPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const growthRemote = useRemote("growth", listGrowth, signedIn);
  const profileRemote = useRemote("child", getChildProfile, signedIn);
  const [date, setDate] = useState(getTodayDateStr);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [head, setHead] = useState("");

  if (!growthRemote.ready || !profileRemote.ready) return <GrowthPageSkeleton />;
  if (
    (growthRemote.error && growthRemote.data == null) ||
    (profileRemote.error && profileRemote.data == null)
  ) {
    return (
      <LoadFailed
        onRetry={() => {
          growthRemote.reload();
          profileRemote.reload();
        }}
      />
    );
  }

  const growth = growthRemote.data ?? [];
  const weightKg = optionalNumber(weight);
  const lengthCm = optionalNumber(length);
  const headCm = optionalNumber(head);
  const canSave = Boolean(date && (weightKg || lengthCm || headCm));
  const days = growthByDay(growth);
  const birthDate = profileRemote.data?.birthDate ?? null;
  const sex = profileRemote.data?.gender ?? null;

  return (
    <LogScreen>
      <GrowthCompareSummary
        entries={growth}
        birthDate={birthDate}
        sex={sex}
      />
      <div id="growth-add" className="scroll-mt-24">
        <LogForm
          title={t("growth.add")}
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            void commitSave(
              "growth",
              () =>
                saveMergedGrowth(growth, {
                  date,
                  ...(weightKg !== undefined ? { weightKg } : {}),
                  ...(lengthCm !== undefined ? { lengthCm } : {}),
                  ...(headCm !== undefined ? { headCm } : {}),
                }),
              "save",
              undefined,
              "growth",
            ).then((ok) => {
              if (!ok) return;
              setWeight("");
              setLength("");
              setHead("");
            });
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
        onReplace={(sourceIds, entry) => {
          void commitSave(
            "growth",
            () => replaceGrowthDay(growth, sourceIds, entry),
            "update",
            undefined,
            "growth",
          );
        }}
        onDelete={(id) => {
          const day = days.find((entry) => entry.id === id);
          const ids = day?.sourceIds ?? [id];
          void commitSave(
            "growth",
            async () => {
              for (const entryId of ids) await deleteGrowth(entryId);
            },
            "delete",
            undefined,
            "growth",
          );
        }}
      />
    </LogScreen>
  );
}
