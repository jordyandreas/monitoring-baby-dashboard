import { describeFeed, describePump } from "@/lib/child/summary";
import type { DiaperEntry, FeedEntry, PoopAmount, PoopColor, PoopTexture, PumpEntry } from "@/lib/child/types";

type Translate = (key: string, params?: Record<string, string | number>) => string;

const POOP_COLOR_KEYS: Record<PoopColor, string> = {
  yellow: "diaper.yellow",
  green: "diaper.green",
  black: "diaper.black",
  brown: "diaper.brown",
  other: "diaper.other",
};

const POOP_TEXTURE_KEYS: Record<PoopTexture, string> = {
  liquid: "diaper.liquid",
  soft: "diaper.soft",
  solid: "diaper.solid",
};

const POOP_AMOUNT_KEYS: Record<PoopAmount, string> = {
  little: "diaper.little",
  medium: "diaper.medium",
  much: "diaper.much",
};

export function feedShareText(entry: Omit<FeedEntry, "id">, t: Translate): string {
  const detail = describeFeed({ ...entry, id: "" }, t);
  return `${t("pages.feed.title")} · ${entry.time}\n${detail}`;
}

export function pumpShareText(entry: Omit<PumpEntry, "id">, t: Translate): string {
  const detail = describePump({ ...entry, id: "" }, t);
  return `${t("pages.pump.title")} · ${entry.time}\n${detail}`;
}

export function diaperShareText(entry: Omit<DiaperEntry, "id">, t: Translate): string {
  if (entry.kind === "pee") return `${t("diaper.pee")} · ${entry.time}`;
  const kind = entry.kind === "both" ? `${t("diaper.pee")} & ${t("diaper.poop")}` : t("diaper.poop");
  const color = entry.poopColor ? t(POOP_COLOR_KEYS[entry.poopColor]) : "";
  const texture = entry.poopTexture ? t(POOP_TEXTURE_KEYS[entry.poopTexture]) : "";
  const amount = entry.poopAmount ? t(POOP_AMOUNT_KEYS[entry.poopAmount]) : "";
  return [kind, color, texture, amount, entry.time].filter(Boolean).join(" · ");
}

export function openWhatsAppShare(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
