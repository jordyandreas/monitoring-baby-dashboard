"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { WaterList } from "./water-list";
import { WaterQuickAdd } from "./water-quick-add";
import { WaterSummary } from "./water-summary";

export function WaterPageContent() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-lilac/20 px-4 py-3 text-sm text-muted-foreground">
        {t("water.intro")}
      </p>
      <WaterQuickAdd />
      <WaterSummary />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold md:text-xl">{t("water.recentLogs")}</h2>
        <WaterList />
      </section>
    </div>
  );
}
