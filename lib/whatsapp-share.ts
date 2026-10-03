import { describeFeed } from "@/lib/child/summary";
import type { DiaperEntry, FeedEntry, PoopColor, PoopTexture } from "@/lib/child/types";

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

export function feedShareText(entry: Omit<FeedEntry, "id">, t: Translate): string {
  const detail = describeFeed({ ...entry, id: "" }, t);
  return `${t("pages.feed.title")} · ${entry.time}\n${detail}`;
}

export function diaperShareText(entry: Omit<DiaperEntry, "id">, t: Translate): string {
  if (entry.kind === "pee") return `${t("diaper.pee")} · ${entry.time}`;
  if (entry.kind === "both") return `${t("diaper.pee")} & ${t("diaper.poop")} · ${entry.time}`;
  const color = entry.poopColor ? t(POOP_COLOR_KEYS[entry.poopColor]) : "";
  const texture = entry.poopTexture ? t(POOP_TEXTURE_KEYS[entry.poopTexture]) : "";
  return [t("diaper.poop"), color, texture, entry.time].filter(Boolean).join(" · ");
}

export function openWhatsAppShare(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
