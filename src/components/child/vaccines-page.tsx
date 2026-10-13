"use client";

import { LogScreen } from "@/components/child/form-bits";
import { MilestonesSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { VACCINE_GROUPS, vaccineLabelKey } from "@/lib/child/vaccines";
import type { VaccineKey } from "@/lib/child/types";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { useRemote } from "@/hooks/use-remote";
import { deleteVaccine, listVaccines, saveVaccine } from "@/services/vaccines.service";

export function VaccinesPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready, error, reload } = useRemote("vaccine", listVaccines, signedIn);
  const placeholder = remotePlaceholder(ready, error, data, reload, <MilestonesSkeleton />);
  if (placeholder) return placeholder;
  const vaccines = data ?? [];
  const setVaccine = (key: VaccineKey, date: string | null) => {
    void commitSave(
      "vaccine",
      () => (date ? saveVaccine(key, date) : deleteVaccine(key)),
      date ? "save" : "delete",
      undefined,
      "vaccine",
    );
  };

  return (
    <LogScreen>
      <p className="text-sm text-muted-foreground">{t("vaccines.hint")}</p>
      {VACCINE_GROUPS.map((group) => (
        <section key={group.ageKey} className="space-y-3">
          <h2 className="text-lg font-semibold">{t(group.ageKey)}</h2>
          <ul className="space-y-3">
            {group.keys.map((key) => {
              const saved = vaccines.find((entry) => entry.key === key);
              return (
                <li key={key} className="space-y-3 rounded-2xl glass-regular p-4">
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(saved)}
                      onChange={(event) => setVaccine(key, event.target.checked ? getTodayDateStr() : null)}
                      className="size-4"
                    />
                    {t(vaccineLabelKey(key))}
                  </label>
                  {saved ? (
                    <div className="min-w-0 space-y-2">
                      <Label>{t("vaccines.date")}</Label>
                      <DatePicker
                        value={saved.date}
                        onChange={(value) => setVaccine(key, value || null)}
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
        </section>
      ))}
    </LogScreen>
  );
}
