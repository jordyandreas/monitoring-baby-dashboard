"use client";

import { VitaminTrackerSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import {
  formatVitaminDate,
  getNamedVitamins,
  getTodayDateStr,
  getYesterdayDateStr,
  rolloverVitaminState,
  syncVitaminItems,
} from "@/lib/pregnancy/vitamins";
import type { VitaminItem, VitaminState } from "@/lib/pregnancy/types";
import { DEFAULT_STORAGE } from "@/lib/pregnancy/types";
import { getVitamins, saveVitamins } from "@/services/vitamins.service";
import { VitaminChecklist } from "./vitamin-checklist";
import { VitaminNameForm } from "./vitamin-name-form";

export function VitaminTracker() {
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("vitamins", getVitamins, signedIn);
  const { locale, t } = useLocale();

  if (!ready) return <VitaminTrackerSkeleton />;

  const vitamins = data ?? DEFAULT_STORAGE.vitamins;
  const named = getNamedVitamins(vitamins.items);
  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  const persist = (next: VitaminState, detail?: string) => {
    void commitSave("vitamins", () => saveVitamins(next), "save", undefined, "vitamin", detail);
  };

  const toggle = (day: "today" | "yesterday", vitaminId: string, checked: boolean) => {
    const current = rolloverVitaminState(vitamins);
    if (day === "yesterday" && !current.yesterday) return;
    const record = day === "today" ? current.today : current.yesterday!;
    const completed = { ...record.completed };
    if (checked) completed[vitaminId] = true;
    else delete completed[vitaminId];
    const next =
      day === "today"
        ? { ...current, today: { ...current.today, completed } }
        : { ...current, yesterday: { ...current.yesterday!, completed } };
    const name = current.items.find((item) => item.id === vitaminId)?.name.trim() ?? "";
    persist(
      next,
      checked ? t("toast.vitaminTaken", { name: name || t("vitamins.thisVitamin") }) : undefined,
    );
  };

  return (
    <div className="space-y-6">
      <VitaminNameForm
        savedItems={vitamins.items}
        onSave={(items: VitaminItem[]) => persist(syncVitaminItems(vitamins, items))}
      />

      {named.length === 0 ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("vitamins.saveNamesHint")}
        </p>
      ) : (
        <>
          <VitaminChecklist
            title={t("common.today")}
            subtitle={formatVitaminDate(vitamins.today.date || todayStr, locale)}
            record={
              vitamins.today.date
                ? vitamins.today
                : { date: todayStr, completed: {} }
            }
            items={vitamins.items}
            onToggle={(id, checked) => toggle("today", id, checked)}
          />

          {vitamins.yesterday ? (
            <VitaminChecklist
              title={t("common.yesterday")}
              subtitle={formatVitaminDate(vitamins.yesterday.date, locale)}
              record={vitamins.yesterday}
              items={vitamins.items}
              onToggle={(id, checked) => toggle("yesterday", id, checked)}
              muted
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {t("vitamins.noYesterday", {
                date: formatVitaminDate(yesterdayStr, locale),
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
