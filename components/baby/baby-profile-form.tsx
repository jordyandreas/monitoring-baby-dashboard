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
  SelectValue,
} from "@/components/ui/select";
import type { BabyProfile, Gender } from "@/lib/types";

interface BabyProfileFormProps {
  initial?: BabyProfile | null;
  onSave: (profile: BabyProfile) => void;
  onCancel?: () => void;
}

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
    <form onSubmit={handleSubmit} className="space-y-4">
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
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="girl">Girl</SelectItem>
            <SelectItem value="boy">Boy</SelectItem>
            <SelectItem value="not-yet">Not yet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due-date">Expected delivery date</Label>
        <Input
          id="due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="min-h-11 rounded-xl"
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
