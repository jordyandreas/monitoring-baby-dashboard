"use client";

import { LoadingCard } from "@/components/layout/loading-card";
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

  if (!mounted) return <LoadingCard />;

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
          Save your vitamin names above to start daily tracking.
        </p>
      ) : (
        <>
          <VitaminChecklist
            title="Today"
            subtitle={formatVitaminDate(vitamins.today.date || todayStr)}
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
              title="Yesterday"
              subtitle={formatVitaminDate(vitamins.yesterday.date)}
              record={vitamins.yesterday}
              items={vitamins.items}
              onToggle={(id, checked) =>
                toggleVitamin("yesterday", id, checked)
              }
              muted
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No record for {formatVitaminDate(yesterdayStr)} yet — yesterday
              appears after your first full day of tracking.
            </p>
          )}
        </>
      )}
    </div>
  );
}
