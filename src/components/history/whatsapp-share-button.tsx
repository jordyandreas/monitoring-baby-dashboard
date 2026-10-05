"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useLocale } from "@/components/providers/locale-provider";
import { openWhatsAppShare } from "@/lib/child/whatsapp-share";

export function WhatsAppShareButton({ text }: { text: string }) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      aria-label={t("toast.whatsapp")}
      onClick={() => openWhatsAppShare(text)}
      className="grid size-8 place-items-center rounded-full text-[#25D366] transition-colors hover:bg-muted"
    >
      <WhatsAppIcon className="size-5" />
    </button>
  );
}
