import { Badge } from "@/components/ui/badge";
import {
  genderBadgeClass,
  genderLabel,
  getGenderIcon,
} from "@/lib/baby-utils";
import type { Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GenderBadge({
  gender,
  className,
}: {
  gender: Gender;
  className?: string;
}) {
  const Icon = getGenderIcon(gender);

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-1 text-xs font-semibold capitalize",
        genderBadgeClass(gender),
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {genderLabel(gender)}
    </Badge>
  );
}
