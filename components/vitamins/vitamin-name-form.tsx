"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface VitaminNameFormProps {
  savedItems: VitaminItem[];
  onSave: (items: VitaminItem[]) => void;
}

export function VitaminNameForm({ savedItems, onSave }: VitaminNameFormProps) {
  const [slots, setSlots] = useState<VitaminItem[]>(() =>
    toFormSlots(savedItems),
  );
  const [slotToRemove, setSlotToRemove] = useState<string | null>(null);

  useEffect(() => {
    setSlots(toFormSlots(savedItems));
  }, [savedItems]);

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
  const removeLabel = pendingSlot?.name.trim() || "this vitamin";

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <Label className="text-base font-semibold">Your vitamins</Label>
        <p className="text-sm text-muted-foreground">
          Add the vitamins you take daily. Start with three slots, or add more as
          needed.
        </p>
      </div>

      <ul className="space-y-2">
        {slots.map((slot, index) => (
          <li key={slot.id} className="flex gap-2">
            <Input
              value={slot.name}
              onChange={(e) => updateName(slot.id, e.target.value)}
              placeholder={`Vitamin ${index + 1}`}
              className="min-h-11 flex-1 rounded-xl"
            />
            {slots.length > MIN_SLOTS && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={() => setSlotToRemove(slot.id)}
                aria-label="Remove vitamin"
              >
                <Minus className="size-4" />
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
          Add vitamin
        </Button>
        <Button
          type="button"
          className="min-h-11 flex-1 rounded-xl sm:ml-auto"
          onClick={handleSave}
        >
          Save vitamins
        </Button>
      </div>

      <ConfirmDialog
        open={slotToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setSlotToRemove(null);
        }}
        description={`Remove ${removeLabel} from your list? It will also be removed from today and yesterday tracking.`}
        onConfirm={() => {
          if (slotToRemove) removeSlot(slotToRemove);
        }}
        confirmVariant="destructive"
      />
    </section>
  );
}
