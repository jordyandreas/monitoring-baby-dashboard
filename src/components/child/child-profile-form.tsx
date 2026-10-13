"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { GenderIcon } from "@/components/pregnancy/baby/gender-icon";
import { useLocale } from "@/components/providers/locale-provider";
import { genderLabel } from "@/lib/i18n/baby";
import type { ChildProfile, FoodTracking, EliminationTracking } from "@/lib/child/types";
import type { Gender } from "@/lib/pregnancy/types";
import { cn } from "@/utils/cn";

const GENDER_OPTIONS: Gender[] = ["girl", "boy", "not-yet"];

export function ChildProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ChildProfile | null;
  onSave: (profile: ChildProfile) => void;
  onCancel?: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<Gender | "">(initial?.gender ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [foodTracking, setFoodTracking] = useState<FoodTracking>(initial?.foodTracking ?? "auto");
  const [eliminationTracking, setEliminationTracking] = useState<EliminationTracking>(
    initial?.eliminationTracking ?? "auto",
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !gender || !birthDate) return;
    onSave({ name: name.trim(), gender, birthDate, foodTracking, eliminationTracking });
  };

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="child-name">{t("baby.babyName")}</Label>
        <Input
          id="child-name"
          placeholder={t("baby.namePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-h-11 rounded-xl"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label>{t("baby.gender")}</Label>
          <Select value={gender || undefined} onValueChange={(value) => setGender(value as Gender)}>
            <SelectTrigger className="min-h-11 w-full rounded-xl">
              <span
                className={cn(
                  "flex flex-1 items-center gap-2 text-left text-sm",
                  !gender && "text-muted-foreground",
                )}
              >
                {gender ? <GenderIcon gender={gender} className="size-4" /> : null}
                {gender ? genderLabel(gender, t) : t("common.selectGender")}
              </span>
            </SelectTrigger>
            <SelectContent className="p-2">
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option} className="rounded-lg py-2.5 pr-8 pl-2.5">
                  <GenderIcon gender={option} className="size-4 text-muted-foreground" />
                  {genderLabel(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="child-birth">{t("child.birthDate")}</Label>
          <DatePicker
            id="child-birth"
            value={birthDate}
            onChange={setBirthDate}
            placeholder={t("common.selectDate")}
            clearAriaLabel={t("common.clearDate")}
            toDate={new Date()}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TrackingSelect
          id="child-food-tracking"
          label={t("child.foodTracking")}
          hint={t("child.foodTrackingHint")}
          value={foodTracking}
          onChange={setFoodTracking}
          options={[
            { value: "auto", label: t("child.trackingAuto") },
            { value: "on", label: t("child.foodOn") },
            { value: "off", label: t("child.foodOff") },
          ]}
        />
        <TrackingSelect
          id="child-elimination-tracking"
          label={t("child.eliminationTracking")}
          hint={t("child.eliminationTrackingHint")}
          value={eliminationTracking}
          onChange={setEliminationTracking}
          options={[
            { value: "auto", label: t("child.trackingAuto") },
            { value: "diaper", label: t("child.eliminationDiaper") },
            { value: "potty", label: t("child.eliminationPotty") },
          ]}
        />
      </div>
      <div className="flex gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" className="min-h-11 flex-1 rounded-xl" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
        <Button type="submit" className="min-h-11 flex-1 rounded-xl" disabled={!name.trim() || !gender || !birthDate}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}

function TrackingSelect<T extends string>({
  id,
  label,
  hint,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  hint: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger id={id} className="min-h-11 w-full rounded-xl">
          <span className="flex-1 text-left text-sm">{selected?.label}</span>
        </SelectTrigger>
        <SelectContent className="p-2">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-lg py-2.5 pr-8 pl-2.5">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
