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
  const kind =
    entry.kind === "pee" ? t("diaper.pee") : entry.kind === "poop" ? t("diaper.poop") : t("diaper.both");
  const color = entry.poopColor ? t(POOP_COLOR_KEYS[entry.poopColor]) : "";
  const texture = entry.poopTexture ? t(POOP_TEXTURE_KEYS[entry.poopTexture]) : "";
  const detail =
    entry.kind === "pee" ? kind : [kind, color, texture].filter(Boolean).join(" · ");
  return `${t("pages.diapers.title")} · ${entry.time}\n${detail}`;
}

export function openWhatsAppShare(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
