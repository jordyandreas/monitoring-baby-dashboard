"use client";

import { VitaminTrackerSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  formatVitaminDate,
  getNamedVitamins,
  getTodayDateStr,
  getYesterdayDateStr,
} from "@/lib/vitamins";
import { VitaminChecklist } from "./vitamin-checklist";
import { VitaminNameForm } from "./vitamin-name-form";

export function VitaminTracker() {
  const { data, mounted, setVitaminItems, toggleVitamin } = useAppStorage();
  const { locale, t } = useLocale();
  const pending = useRemoteDataPending();

  if (!mounted || pending) return <VitaminTrackerSkeleton />;

  const vitamins = data?.vitamins ?? {
    items: [],
    today: { date: "", completed: {} },
    yesterday: null,
  };

  const named = getNamedVitamins(vitamins.items);
  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  return (
    <div className="space-y-6">
      <VitaminNameForm
        savedItems={vitamins.items}
        onSave={setVitaminItems}
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
            onToggle={(id, checked) => toggleVitamin("today", id, checked)}
          />

          {vitamins.yesterday ? (
            <VitaminChecklist
              title={t("common.yesterday")}
              subtitle={formatVitaminDate(vitamins.yesterday.date, locale)}
              record={vitamins.yesterday}
              items={vitamins.items}
              onToggle={(id, checked) =>
                toggleVitamin("yesterday", id, checked)
              }
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
