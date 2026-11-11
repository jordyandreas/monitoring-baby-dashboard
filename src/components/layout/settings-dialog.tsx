"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import {
  DEFAULT_BOTTLE_ML,
  normalizeBottleMlPresets,
  parseBottleMlToAdd,
} from "@/lib/child/bottle-presets";
import { getBottleMlPresets, saveBottleMlPresets } from "@/services/settings.service";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const remote = useRemote("bottle-presets", getBottleMlPresets, open);
  const baseId = useId();
  const amountId = `${baseId}-amount`;
  const [draft, setDraft] = useState<number[] | null>(null);
  const [addValue, setAddValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setDraft(null);
      setAddValue("");
      setError(null);
      return;
    }
    if (remote.data) setDraft(remote.data);
  }, [open, remote.data]);

  const presets = draft ?? remote.data;

  const close = (next: boolean) => {
    if (!next) {
      setDraft(null);
      setAddValue("");
      setError(null);
    }
    onOpenChange(next);
  };

  const addPreset = () => {
    if (!presets) return;
    const parsed = parseBottleMlToAdd(addValue, presets);
    if (!parsed.ok) {
      if (parsed.reason === "duplicate") setError(t("settings.duplicate"));
      else if (parsed.reason === "max") setError(t("settings.maxPresets"));
      else setError(t("settings.invalid"));
      return;
    }
    setError(null);
    setDraft(normalizeBottleMlPresets([...presets, parsed.ml]));
    setAddValue("");
  };

  const removePreset = (ml: number) => {
    if (!presets) return;
    if (presets.length <= 1) {
      setError(t("settings.minOne"));
      return;
    }
    setError(null);
    setDraft(presets.filter((value) => value !== ml));
  };

  const resetDefaults = () => {
    setError(null);
    setDraft([...DEFAULT_BOTTLE_ML]);
    setAddValue("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!presets || presets.length === 0) {
      setError(t("settings.minOne"));
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await commitSave(
      "bottle-presets",
      () => saveBottleMlPresets(presets),
      "save",
      undefined,
      "settings",
    );
    setBusy(false);
    if (ok) close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="z-[80] max-h-[min(90vh,760px)] overflow-y-auto rounded-2xl sm:max-w-md"
        overlayClassName="z-[80]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t("settings.bottleMlTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("settings.bottleMlHint")}</p>
          </div>
          {remote.error ? <p className="text-sm text-destructive">{remote.error}</p> : null}
          {presets ? (
            <>
              <div className="flex flex-wrap gap-2">
                {presets.map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-lilac/40 bg-lilac/30 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-lilac/50"
                    aria-label={t("settings.remove", { ml })}
                    onClick={() => removePreset(ml)}
                  >
                    {t("child.summaryMl", { ml })}
                    <X className="size-3.5 text-muted-foreground" aria-hidden />
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor={amountId}>{t("feed.amount")}</Label>
                  <Input
                    id={amountId}
                    inputMode="numeric"
                    value={addValue}
                    onChange={(event) => {
                      setAddValue(event.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addPreset();
                      }
                    }}
                    placeholder={t("settings.amountPlaceholder")}
                    className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 shrink-0 rounded-full"
                  onClick={addPreset}
                >
                  {t("settings.add")}
                </Button>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 rounded-full"
                  onClick={resetDefaults}
                >
                  {t("settings.reset")}
                </Button>
                <Button type="submit" className="min-h-11 flex-1 rounded-full" loading={busy}>
                  {t("settings.save")}
                </Button>
              </div>
            </>
          ) : remote.error ? null : (
            <div role="status" aria-busy="true" aria-label={t("common.loading")} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-8 w-16 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
