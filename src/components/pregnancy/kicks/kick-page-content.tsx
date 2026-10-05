"use client";

import { KickForm } from "@/components/pregnancy/kicks/kick-form";
import { KickList } from "@/components/pregnancy/kicks/kick-list";
import { KickSummary } from "@/components/pregnancy/kicks/kick-summary";
import { useLocale } from "@/components/providers/locale-provider";
import { useSummaryLink } from "@/hooks/use-summary-link";

export function KickPageContent() {
  const { t } = useLocale();
  const summary = useSummaryLink();

  return (
    <div className="space-y-6">
      <KickForm />
      <KickSummary link={summary} />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold md:text-xl">{t("kicks.recentLogs")}</h2>
        <KickList selectedDate={summary.day} onSelectDate={summary.selectHistoryDate} />
      </section>
    </div>
  );
}
