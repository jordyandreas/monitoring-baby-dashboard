"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { FeedRangeSummary, useSummaryLink } from "@/components/child/page-summary";
import { FeedLogForm } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemote } from "@/hooks/use-remote";
import { feedHistoryParts } from "@/lib/child/summary";
import { feedShareText } from "@/lib/child/whatsapp-share";
import { deleteFeed, listFeeds } from "@/services/feed.service";

export function FeedPageContent() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const { data, ready } = useRemote("feed", listFeeds, signedIn);
  const [editingId, setEditingId] = useState<string | null>(null);
  const summary = useSummaryLink();
  const feeds = data ?? [];
  const editing = feeds.find((entry) => entry.id === editingId) ?? null;

  if (!ready) return <LogPageSkeleton tiles={4} />;

  return (
    <LogScreen>
      <FeedLogForm />
      <FeedRangeSummary entries={feeds} link={summary} />
      <ChildDayHistory
        selectedDate={summary.day}
        onSelectDate={summary.selectHistoryDate}
        entries={feeds.map((entry) => ({
          ...entry,
          ...feedHistoryParts(entry, t),
          shareText: feedShareText(entry, t),
        }))}
        emptyLabel={t("feed.empty")}
        onDelete={(id) => {
          void commitSave("feed", () => deleteFeed(id), "delete", undefined, "feed");
        }}
        onEdit={setEditingId}
      />
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("feed.edit")}</DialogTitle>
          {editing ? (
            <FeedLogForm key={editing.id} initial={editing} onSaved={() => setEditingId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </LogScreen>
  );
}
