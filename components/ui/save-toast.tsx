"use client";

import { Check, CircleAlert, X } from "lucide-react";
import { toast, Toaster, type ExternalToast } from "sonner";
import { useLocale } from "@/components/providers/locale-provider";
import { scheduleRemoteWrite } from "@/lib/supabase/live-sync";
import type { SupabaseSyncDomain } from "@/lib/supabase/env";
import { openWhatsAppShare } from "@/lib/whatsapp-share";
import { cn } from "@/lib/utils";

const TOAST_MS = 5000;
const WHATSAPP_TOAST_MS = 8000;

type SaveToastKind = "success" | "error";
type SaveToastAction = "save" | "delete";

function SaveToastCard({
  id,
  kind,
  action,
  whatsappText,
}: {
  id: string | number;
  kind: SaveToastKind;
  action: SaveToastAction;
  whatsappText?: string;
}) {
  const { t } = useLocale();
  const ok = kind === "success";
  const message = ok
    ? action === "delete"
      ? t("toast.deleted")
      : t("toast.saved")
    : action === "delete"
      ? t("toast.deleteFailed")
      : t("toast.failed");

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-[min(20rem,calc(100vw-2rem))] items-center gap-3 rounded-2xl border bg-card px-3 py-3 text-card-foreground shadow-lg",
        ok ? "border-mint-foreground/30" : "border-destructive/35",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-mint text-mint-foreground" : "bg-destructive/15 text-destructive",
        )}
        aria-hidden
      >
        {ok ? <Check className="size-4" strokeWidth={2.5} /> : <CircleAlert className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{message}</p>
        {ok && whatsappText ? (
          <button
            type="button"
            className="mt-1 text-sm font-semibold text-lilac-deep hover:underline"
            onClick={() => {
              openWhatsAppShare(whatsappText);
              toast.dismiss(id);
            }}
          >
            {t("toast.whatsapp")}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={t("toast.close")}
        onClick={() => toast.dismiss(id)}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function showSaveToast(
  kind: SaveToastKind,
  id?: string | number,
  action: SaveToastAction = "save",
  whatsappText?: string,
) {
  const options: ExternalToast = {
    id,
    unstyled: true,
    duration: whatsappText ? WHATSAPP_TOAST_MS : TOAST_MS,
  };
  return toast.custom(
    (toastId) => (
      <SaveToastCard id={toastId} kind={kind} action={action} whatsappText={whatsappText} />
    ),
    options,
  );
}

export function reportSave(
  domain: SupabaseSyncDomain,
  write: Parameters<typeof scheduleRemoteWrite>[1],
  action: SaveToastAction = "save",
  whatsappText?: string,
) {
  const id = showSaveToast("success", undefined, action, whatsappText);
  scheduleRemoteWrite(domain, write, () => showSaveToast("error", id, action));
}

export function SaveToaster() {
  return (
    <Toaster
      className="app-toaster"
      position="top-right"
      offset={{ top: "5.25rem", right: "1rem" }}
      mobileOffset={{ top: "5.25rem", right: "1rem", left: "1rem" }}
      gap={10}
      visibleToasts={4}
      duration={TOAST_MS}
      style={{ fontFamily: "inherit" }}
    />
  );
}
