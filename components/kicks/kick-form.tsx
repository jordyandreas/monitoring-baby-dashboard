"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
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
    <div className="min-w-0 space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
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

      <form onSubmit={handleSubmit} className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="kick-date">Date</Label>
          <DatePicker
            id="kick-date"
            value={fields.date}
            onChange={(date) => setFields((f) => ({ ...f, date }))}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="kick-time">Time</Label>
          <TimePicker
            id="kick-time"
            value={fields.time}
            onChange={(time) => setFields((f) => ({ ...f, time }))}
          />
        </div>
        <Button
          type="submit"
          className="min-h-11 rounded-xl sm:col-span-2"
        >
          Add kick
        </Button>
      </form>
    </div>
  );
}
