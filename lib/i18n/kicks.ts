import type { MessageKey } from "@/lib/i18n";
import type { Gender } from "@/lib/types";

type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

export function getKickButtonLabel(gender: Gender | undefined | null, t: TranslateFn): string {
  if (gender === "boy") return t("kicks.quickBoy");
  if (gender === "girl") return t("kicks.quickGirl");
  return t("kicks.quickDefault");
}

export function kickCountLabel(count: number, t: TranslateFn): string {
  return `${count} ${count === 1 ? t("common.kick") : t("common.kicks")}`;
}
