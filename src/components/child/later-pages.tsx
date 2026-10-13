"use client";

import { LogScreen } from "@/components/child/form-bits";
import { MilestonesSkeleton, remotePlaceholder } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { MILESTONE_KEYS, type MilestoneKey } from "@/lib/child/types";
import { getTodayDateStr } from "@/lib/pregnancy/vitamins";
import { useRemote } from "@/hooks/use-remote";
import { deleteMilestone, listMilestones, saveMilestone } from "@/services/milestones.service";

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
  const { data, ready, error, reload } = useRemote("milestone", listMilestones, signedIn);
  const placeholder = remotePlaceholder(ready, error, data, reload, <MilestonesSkeleton />);
  if (placeholder) return placeholder;
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
