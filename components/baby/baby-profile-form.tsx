"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { GenderIcon } from "@/components/baby/gender-icon";
import { genderLabel } from "@/lib/baby-utils";
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
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<Gender | "">(initial?.gender ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dueDate || !gender) return;
    onSave({ name: name.trim(), gender, dueDate });
  };

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="baby-name">Baby name</Label>
        <Input
          id="baby-name"
          placeholder="e.g. Little Star"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-11 rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <Select
          value={gender || null}
          onValueChange={(v) => setGender(v as Gender)}
        >
          <SelectTrigger className="min-h-11 w-full rounded-xl">
            <span
              className={cn(
                "flex flex-1 items-center gap-2 text-left text-sm",
                !gender && "text-muted-foreground",
              )}
            >
              {gender ? <GenderIcon gender={gender} className="size-4" /> : null}
              {gender ? genderLabel(gender) : "Select gender"}
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
                {genderLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="due-date">Expected delivery date</Label>
        <Input
          id="due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="Select date"
          className="h-11 rounded-xl"
          required
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
            Cancel
          </Button>
        )}
        <Button type="submit" className="min-h-11 flex-1 rounded-xl">
          Save
        </Button>
      </div>
    </form>
  );
}
