"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useLocale } from "@/components/providers/locale-provider";
import { openWhatsAppShare } from "@/lib/child/whatsapp-share";
import { cn } from "@/utils/cn";

export function WhatsAppShareButton({ text, className }: { text: string; className?: string }) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      aria-label={t("toast.whatsapp")}
      onClick={() => openWhatsAppShare(text)}
      className={cn(
        "grid size-8 place-items-center rounded-full text-[#25D366] transition-colors hover:bg-muted",
        className,
      )}
    >
      <WhatsAppIcon className="size-5" />
    </button>
  );
}
