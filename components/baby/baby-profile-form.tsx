"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { EddInfoDialog } from "./edd-info-dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { GenderIcon } from "@/components/baby/gender-icon";
import { useLocale } from "@/components/providers/locale-provider";
import { genderLabel } from "@/lib/i18n/baby";
import { calculateDueDateFromLmp } from "@/lib/pregnancy";
import type { BabyProfile, Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BabyProfileFormProps {
  initial?: BabyProfile | null;
  onSave: (profile: BabyProfile) => void;
  onCancel?: () => void;
}

const GENDER_OPTIONS: Gender[] = ["girl", "boy", "not-yet"];

export function BabyProfileForm({
  initial,
  onSave,
  onCancel,
}: BabyProfileFormProps) {
  const { t } = useLocale();
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<Gender | "">(initial?.gender ?? "");
  const [lmpDate, setLmpDate] = useState(initial?.lmpDate ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [eddInfoOpen, setEddInfoOpen] = useState(false);

  const calculatedDueDate = lmpDate ? calculateDueDateFromLmp(lmpDate) : "";
  const dueDateFromLmp = Boolean(
    lmpDate && dueDate && calculatedDueDate && dueDate === calculatedDueDate,
  );

  const handleLmpChange = (value: string) => {
    setLmpDate(value);
    if (!value) {
      setDueDate("");
      return;
    }
    const calculated = calculateDueDateFromLmp(value);
    if (calculated) setDueDate(calculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dueDate || !gender) return;
    onSave({
      name: name.trim(),
      gender,
      dueDate,
      ...(lmpDate ? { lmpDate } : {}),
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baby-name">{t("baby.babyName")}</Label>
          <Input
            id="baby-name"
            placeholder={t("baby.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 rounded-xl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t("baby.gender")}</Label>
          <Select
            value={gender || undefined}
            onValueChange={(v) => setGender(v as Gender)}
          >
            <SelectTrigger className="min-h-11 w-full rounded-xl">
              <span
                className={cn(
                  "flex flex-1 items-center gap-2 text-left text-sm",
                  !gender && "text-muted-foreground",
                )}
              >
                {gender ? (
                  <GenderIcon gender={gender} className="size-4" />
                ) : null}
                {gender ? genderLabel(gender, t) : t("common.selectGender")}
              </span>
            </SelectTrigger>
            <SelectContent className="p-2">
              {GENDER_OPTIONS.map((option) => (
                <SelectItem
                  key={option}
                  value={option}
                  className="rounded-lg py-2.5 pr-8 pl-2.5 capitalize"
                >
                  <GenderIcon
                    gender={option}
                    className="size-4 text-muted-foreground"
                  />
                  {genderLabel(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="lmp-date">{t("baby.lmpCalculation")}</Label>
          <p className="text-xs text-muted-foreground">{t("baby.lmpHint")}</p>
          <DatePicker
            id="lmp-date"
            value={lmpDate}
            onChange={handleLmpChange}
            placeholder={t("common.selectDate")}
            clearAriaLabel={t("common.clearDate")}
          />
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="shrink-0 text-xs uppercase text-muted-foreground">
            {t("baby.or")}
          </span>
          <Separator className="flex-1" />
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="due-date">{t("baby.expectedDelivery")}</Label>
            <button
              type="button"
              onClick={() => setEddInfoOpen(true)}
              aria-label={t("baby.eddInfoAria")}
              className="inline-flex shrink-0 rounded-full text-muted-foreground transition-colors hover:text-lilac-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="size-4" aria-hidden />
            </button>
          </div>
          <DatePicker
            id="due-date"
            value={dueDate}
            onChange={setDueDate}
            placeholder={t("common.selectDate")}
            disabled={dueDateFromLmp}
            clearAriaLabel={t("common.clearDate")}
          />
        </div>

        <div className="flex gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 rounded-xl"
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
          )}
          <Button type="submit" className="min-h-11 flex-1 rounded-xl">
            {t("common.save")}
          </Button>
        </div>
      </form>

      <EddInfoDialog open={eddInfoOpen} onOpenChange={setEddInfoOpen} />
    </>
  );
}
