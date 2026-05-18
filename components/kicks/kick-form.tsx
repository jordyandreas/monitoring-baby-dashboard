"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStorage } from "@/hooks/use-app-storage";
import { getKickButtonLabel } from "@/lib/kick-label";

function getNowFields() {
  const now = new Date();
  return {
    date: format(now, "yyyy-MM-dd"),
    time: format(now, "HH:mm"),
  };
}

export function KickForm() {
  const { data, addKick } = useAppStorage();
  const [fields, setFields] = useState(getNowFields);

  const gender = data?.baby?.gender;
  const kickLabel = getKickButtonLabel(gender);

  const handleQuickAdd = () => {
    const now = getNowFields();
    addKick(now);
    setFields(now);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.date || !fields.time) return;
    addKick(fields);
    setFields(getNowFields());
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <Button
        type="button"
        className="min-h-12 w-full rounded-xl text-base"
        onClick={handleQuickAdd}
      >
        <Plus className="size-5" />
        {kickLabel}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or custom</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kick-date">Date</Label>
          <Input
            id="kick-date"
            type="date"
            value={fields.date}
            onChange={(e) =>
              setFields((f) => ({ ...f, date: e.target.value }))
            }
            className="min-h-11 rounded-xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kick-time">Time</Label>
          <Input
            id="kick-time"
            type="time"
            value={fields.time}
            onChange={(e) =>
              setFields((f) => ({ ...f, time: e.target.value }))
            }
            className="min-h-11 rounded-xl"
            required
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="min-h-11 rounded-xl sm:col-span-2"
        >
          Add kick
        </Button>
      </form>
    </div>
  );
}
