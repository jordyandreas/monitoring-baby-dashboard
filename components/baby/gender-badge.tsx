"use client";

import { Badge } from "@/components/ui/badge";
import { GenderIcon } from "@/components/baby/gender-icon";
import { useLocale } from "@/components/providers/locale-provider";
import { genderLabel } from "@/lib/i18n/baby";
import { genderBadgeClass } from "@/lib/baby-utils";
import type { Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GenderBadge({
  gender,
  className,
}: {
  gender: Gender;
  className?: string;
}) {
  const { t } = useLocale();

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-1 text-xs font-semibold capitalize",
        genderBadgeClass(gender),
        className,
      )}
    >
      <GenderIcon gender={gender} className="size-3.5" />
      {genderLabel(gender, t)}
    </Badge>
  );
}
