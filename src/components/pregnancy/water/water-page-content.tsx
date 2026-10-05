"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { useSummaryLink } from "@/hooks/use-summary-link";
import { WaterList } from "./water-list";
import { WaterQuickAdd } from "./water-quick-add";
import { WaterSummary } from "./water-summary";

export function WaterPageContent() {
  const { t } = useLocale();
  const summary = useSummaryLink();

  return (
    <div className="space-y-6">
      <WaterQuickAdd />
      <WaterSummary link={summary} />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold md:text-xl">{t("water.recentLogs")}</h2>
        <WaterList selectedDate={summary.day} onSelectDate={summary.selectHistoryDate} />
      </section>
    </div>
  );
}
