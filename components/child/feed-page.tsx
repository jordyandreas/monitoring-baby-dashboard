"use client";

import { useState } from "react";
import { ChildDayHistory } from "@/components/child/day-history";
import { FeedRangeSummary } from "@/components/child/page-summary";
import { FeedLogForm } from "@/components/child/quick-log-forms";
import { LogScreen } from "@/components/child/form-bits";
import { LogPageSkeleton } from "@/components/layout/data-skeletons";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { feedHistoryParts } from "@/lib/child/summary";

export function FeedPageContent() {
  const { t } = useLocale();
  const { data, mounted, removeFeed } = useChildStorage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = data.feeds.find((entry) => entry.id === editingId) ?? null;

  const pending = useRemoteDataPending();

  if (!mounted || pending) return <LogPageSkeleton tiles={4} />;

  return (
    <LogScreen>
      <FeedLogForm />
      <FeedRangeSummary entries={data.feeds} />
      <ChildDayHistory
        entries={data.feeds.map((entry) => ({
          ...entry,
          ...feedHistoryParts(entry, t),
        }))}
        emptyLabel={t("feed.empty")}
        onDelete={removeFeed}
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
