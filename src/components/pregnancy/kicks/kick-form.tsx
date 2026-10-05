"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import { getKickButtonLabel } from "@/lib/i18n/kicks";
import { getBaby } from "@/services/baby.service";
import { insertKick } from "@/services/kicks.service";

function getNowFields() {
  const now = new Date();
  return {
    date: format(now, "yyyy-MM-dd"),
    time: format(now, "HH:mm"),
  };
}

export function KickForm() {
  const { signedIn } = useSupabase();
  const { data: baby } = useRemote("baby", getBaby, signedIn);
  const { t } = useLocale();
  const [fields, setFields] = useState(getNowFields);

  const gender = baby?.gender;
  const kickLabel = getKickButtonLabel(gender, t);

  const save = (entry: { date: string; time: string }) => {
    void commitSave("kicks", () => insertKick({ ...entry, id: crypto.randomUUID() }), "save", undefined, "kick");
  };

  const handleQuickAdd = () => {
    const now = getNowFields();
    save(now);
    setFields(now);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.date || !fields.time) return;
    save(fields);
    setFields(getNowFields());
  };

  return (
    <div className="min-w-0 space-y-4 rounded-2xl glass-regular p-4 shadow-sm">
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
          <span className="bg-white/80 px-2 text-muted-foreground">
            {t("kicks.orCustom")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="kick-date">{t("kicks.date")}</Label>
          <DatePicker
            id="kick-date"
            value={fields.date}
            onChange={(date) => setFields((f) => ({ ...f, date }))}
            placeholder={t("common.selectDate")}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="kick-time">{t("kicks.time")}</Label>
          <TimePicker
            id="kick-time"
            value={fields.time}
            onChange={(time) => setFields((f) => ({ ...f, time }))}
            placeholder={t("common.selectTime")}
          />
        </div>
        <Button
          type="submit"
          className="min-h-11 rounded-xl sm:col-span-2"
        >
          {t("kicks.addKick")}
        </Button>
      </form>
    </div>
  );
}
