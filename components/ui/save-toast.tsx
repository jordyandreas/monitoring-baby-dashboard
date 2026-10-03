"use client";

import { Check, CircleAlert, X } from "lucide-react";
import { toast, Toaster, type ExternalToast } from "sonner";
import { useLocale } from "@/components/providers/locale-provider";
import { scheduleRemoteWrite } from "@/lib/supabase/account-data";
import type { SupabaseSyncDomain } from "@/lib/supabase/env";
import { openWhatsAppShare } from "@/lib/whatsapp-share";
import { cn } from "@/lib/utils";

const TOAST_MS = 5000;
const WHATSAPP_TOAST_MS = 8000;

type SaveToastKind = "success" | "error";
type SaveToastAction = "save" | "update" | "delete";

export type SaveToastTopic =
  | "feed"
  | "diaper"
  | "sleep"
  | "growth"
  | "profile"
  | "solid"
  | "health"
  | "potty"
  | "meal"
  | "milestone"
  | "baby"
  | "babyPlus"
  | "kick"
  | "water"
  | "vitamin"
  | "glass";

function toastMessage(
  t: ReturnType<typeof useLocale>["t"],
  kind: SaveToastKind,
  action: SaveToastAction,
  topic?: SaveToastTopic,
) {
  if (!topic) {
    if (kind === "error") {
      return action === "delete" ? t("toast.deleteFailed") : t("toast.failed");
    }
    return action === "delete" ? t("toast.deleted") : t("toast.saved");
  }

  if (kind === "error" && action === "delete") {
    switch (topic) {
      case "feed":
        return t("toast.feedDeleteFailed");
      case "diaper":
        return t("toast.diaperDeleteFailed");
      case "sleep":
        return t("toast.sleepDeleteFailed");
      case "growth":
        return t("toast.growthDeleteFailed");
      case "solid":
        return t("toast.solidDeleteFailed");
      case "health":
        return t("toast.healthDeleteFailed");
      case "potty":
        return t("toast.pottyDeleteFailed");
      case "meal":
        return t("toast.mealDeleteFailed");
      case "milestone":
        return t("toast.milestoneDeleteFailed");
      case "kick":
        return t("toast.kickDeleteFailed");
      case "water":
        return t("toast.waterDeleteFailed");
      default:
        return t("toast.deleteFailed");
    }
  }

  if (kind === "error" && action === "update") {
    switch (topic) {
      case "feed":
        return t("toast.feedUpdateFailed");
      case "diaper":
        return t("toast.diaperUpdateFailed");
      case "sleep":
        return t("toast.sleepUpdateFailed");
      case "growth":
        return t("toast.growthUpdateFailed");
      default:
        return t("toast.failed");
    }
  }

  if (kind === "error") {
    switch (topic) {
      case "feed":
        return t("toast.feedFailed");
      case "diaper":
        return t("toast.diaperFailed");
      case "sleep":
        return t("toast.sleepFailed");
      case "growth":
        return t("toast.growthFailed");
      case "profile":
        return t("toast.profileFailed");
      case "solid":
        return t("toast.solidFailed");
      case "health":
        return t("toast.healthFailed");
      case "potty":
        return t("toast.pottyFailed");
      case "meal":
        return t("toast.mealFailed");
      case "milestone":
        return t("toast.milestoneFailed");
      case "baby":
        return t("toast.babyFailed");
      case "babyPlus":
        return t("toast.babyPlusFailed");
      case "kick":
        return t("toast.kickFailed");
      case "water":
        return t("toast.waterFailed");
      case "vitamin":
        return t("toast.vitaminFailed");
      case "glass":
        return t("toast.glassFailed");
    }
  }

  if (action === "delete") {
    switch (topic) {
      case "feed":
        return t("toast.feedDeleted");
      case "diaper":
        return t("toast.diaperDeleted");
      case "sleep":
        return t("toast.sleepDeleted");
      case "growth":
        return t("toast.growthDeleted");
      case "solid":
        return t("toast.solidDeleted");
      case "health":
        return t("toast.healthDeleted");
      case "potty":
        return t("toast.pottyDeleted");
      case "meal":
        return t("toast.mealDeleted");
      case "milestone":
        return t("toast.milestoneDeleted");
      case "kick":
        return t("toast.kickDeleted");
      case "water":
        return t("toast.waterDeleted");
      default:
        return t("toast.deleted");
    }
  }

  if (action === "update") {
    switch (topic) {
      case "feed":
        return t("toast.feedUpdated");
      case "diaper":
        return t("toast.diaperUpdated");
      case "sleep":
        return t("toast.sleepUpdated");
      case "growth":
        return t("toast.growthUpdated");
      default:
        return t("toast.saved");
    }
  }

  switch (topic) {
    case "feed":
      return t("toast.feedSaved");
    case "diaper":
      return t("toast.diaperSaved");
    case "sleep":
      return t("toast.sleepSaved");
    case "growth":
      return t("toast.growthSaved");
    case "profile":
      return t("toast.profileSaved");
    case "solid":
      return t("toast.solidSaved");
    case "health":
      return t("toast.healthSaved");
    case "potty":
      return t("toast.pottySaved");
    case "meal":
      return t("toast.mealSaved");
    case "milestone":
      return t("toast.milestoneSaved");
    case "baby":
      return t("toast.babySaved");
    case "babyPlus":
      return t("toast.babyPlusSaved");
    case "kick":
      return t("toast.kickSaved");
    case "water":
      return t("toast.waterSaved");
    case "vitamin":
      return t("toast.vitaminSaved");
    case "glass":
      return t("toast.glassSaved");
  }
}

function SaveToastCard({
  id,
  kind,
  action,
  topic,
  whatsappText,
}: {
  id: string | number;
  kind: SaveToastKind;
  action: SaveToastAction;
  topic?: SaveToastTopic;
  whatsappText?: string;
}) {
  const { t } = useLocale();
  const ok = kind === "success";
  const message = toastMessage(t, kind, action, topic);

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-[min(20rem,calc(100vw-2rem))] items-center gap-3 rounded-2xl glass-clear px-3 py-3 text-card-foreground",
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
  topic?: SaveToastTopic,
) {
  const options: ExternalToast = {
    id,
    unstyled: true,
    duration: whatsappText ? WHATSAPP_TOAST_MS : TOAST_MS,
  };
  return toast.custom(
    (toastId) => (
      <SaveToastCard
        id={toastId}
        kind={kind}
        action={action}
        topic={topic}
        whatsappText={whatsappText}
      />
    ),
    options,
  );
}

export function reportSave(
  domain: SupabaseSyncDomain,
  write: Parameters<typeof scheduleRemoteWrite>[1],
  action: SaveToastAction = "save",
  whatsappText?: string,
  topic?: SaveToastTopic,
) {
  const id = showSaveToast("success", undefined, action, whatsappText, topic);
  scheduleRemoteWrite(domain, write, () => showSaveToast("error", id, action, undefined, topic));
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
