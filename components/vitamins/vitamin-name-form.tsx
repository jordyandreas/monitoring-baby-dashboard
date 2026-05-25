"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/providers/locale-provider";
import type { VitaminItem } from "@/lib/types";

const MIN_SLOTS = 3;

function createSlot(name = ""): VitaminItem {
  return { id: crypto.randomUUID(), name };
}

function toFormSlots(items: VitaminItem[]): VitaminItem[] {
  if (items.length >= MIN_SLOTS) return items.map((i) => ({ ...i }));
  const slots = items.map((i) => ({ ...i }));
  while (slots.length < MIN_SLOTS) {
    slots.push(createSlot());
  }
  return slots;
}

function namedItemsFromSlots(slots: VitaminItem[]): VitaminItem[] {
  return slots
    .map((slot) => ({ ...slot, name: slot.name.trim() }))
    .filter((slot) => slot.name.length > 0);
}

function savedItemsKey(items: VitaminItem[]): string {
  return items.map((item) => `${item.id}:${item.name}`).join("|");
}

interface VitaminNameFormProps {
  savedItems: VitaminItem[];
  onSave: (items: VitaminItem[]) => void;
}

export function VitaminNameForm({ savedItems, onSave }: VitaminNameFormProps) {
  const { t } = useLocale();
  const savedKey = savedItemsKey(savedItems);
  const [slots, setSlots] = useState(() => toFormSlots(savedItems));
  const [syncedKey, setSyncedKey] = useState(savedKey);
  const [slotToRemove, setSlotToRemove] = useState<string | null>(null);

  if (savedKey !== syncedKey) {
    setSyncedKey(savedKey);
    setSlots(toFormSlots(savedItems));
  }

  const updateName = (id: string, name: string) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, name } : slot)),
    );
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, createSlot()]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= MIN_SLOTS) return;

    const nextSlots = slots.filter((slot) => slot.id !== id);
    setSlots(nextSlots);
    onSave(namedItemsFromSlots(nextSlots));
  };

  const handleSave = () => {
    onSave(namedItemsFromSlots(slots));
  };

  const pendingSlot = slotToRemove
    ? slots.find((slot) => slot.id === slotToRemove)
    : null;
  const removeLabel = pendingSlot?.name.trim() || t("vitamins.thisVitamin");

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <Label className="text-base font-semibold">{t("vitamins.yourVitamins")}</Label>
        <p className="text-sm text-muted-foreground">{t("vitamins.formHint")}</p>
      </div>

      <ul className="space-y-2">
        {slots.map((slot, index) => (
          <li key={slot.id} className="flex gap-2">
            <Input
              value={slot.name}
              onChange={(e) => updateName(slot.id, e.target.value)}
              placeholder={t("vitamins.placeholder", { index: index + 1 })}
              className="min-h-11 flex-1 rounded-xl"
            />
            {slots.length > MIN_SLOTS && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={() => setSlotToRemove(slot.id)}
                aria-label={t("vitamins.removeAria")}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-xl"
          onClick={addSlot}
        >
          <Plus className="size-4" />
          {t("vitamins.add")}
        </Button>
        <Button
          type="button"
          className="min-h-11 flex-1 rounded-xl sm:ml-auto"
          onClick={handleSave}
        >
          {t("vitamins.save")}
        </Button>
      </div>

      <ConfirmDialog
        open={slotToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setSlotToRemove(null);
        }}
        title={t("common.confirmTitle")}
        description={t("vitamins.removeConfirm", { name: removeLabel })}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.ok")}
        onConfirm={() => {
          if (slotToRemove) removeSlot(slotToRemove);
        }}
        confirmVariant="destructive"
      />
    </section>
  );
}
