"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Droplets, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import { formatVolume, GLASS_SIZE_PRESETS, normalizeGlassSize } from "@/lib/pregnancy/water";
import { getWater, insertWater, saveGlassSize } from "@/services/water.service";
import { cn } from "@/utils/cn";

function getNowFields() {
  const now = new Date();
  return {
    date: format(now, "yyyy-MM-dd"),
    time: format(now, "HH:mm"),
  };
}

export function WaterQuickAdd() {
  const { signedIn } = useSupabase();
  const { data } = useRemote("water", getWater, signedIn);
  const { locale, t } = useLocale();
  const [customMl, setCustomMl] = useState("");

  const glassSizeMl = data?.glassSizeMl ?? 250;

  const add = (amountMl: number) => {
    const now = getNowFields();
    void commitSave(
      "water",
      () => insertWater({ ...now, amountMl, id: crypto.randomUUID() }),
      "save",
      undefined,
      "water",
    );
  };

  const handleAddGlass = () => {
    add(glassSizeMl);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.round(Number(customMl));
    if (!parsed || parsed <= 0 || parsed > 2000) return;
    add(parsed);
    setCustomMl("");
  };

  return (
    <div className="space-y-4 rounded-2xl glass-regular p-4 shadow-sm">
      <Button
        type="button"
        className="min-h-12 w-full rounded-xl text-base"
        onClick={handleAddGlass}
      >
        <Droplets className="size-5" />
        {t("water.addGlass", { amount: formatVolume(glassSizeMl, locale) })}
      </Button>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("water.glassSize")}</Label>
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GLASS_SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                void commitSave("water", () => saveGlassSize(normalizeGlassSize(size)), "save", undefined, "glass");
              }}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                glassSizeMl === size
                  ? "border-lilac-deep bg-lilac/40 text-lilac-foreground"
                  : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70",
              )}
            >
              {formatVolume(size, locale)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/80 px-2 text-muted-foreground">
            {t("water.orCustom")}
          </span>
        </div>
      </div>

      <form onSubmit={handleAddCustom} className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="water-custom-ml" className="sr-only">
            {t("water.customAmount")}
          </Label>
          <Input
            id="water-custom-ml"
            type="number"
            inputMode="numeric"
            min={1}
            max={2000}
            placeholder={t("water.customPlaceholder")}
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            className="h-11 min-h-11 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-11 min-h-11 shrink-0 rounded-xl px-4"
        >
          <Plus className="size-4" />
          {t("water.add")}
        </Button>
      </form>
    </div>
  );
}
