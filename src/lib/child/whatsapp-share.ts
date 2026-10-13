import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { describeFeed, describePump, formatDuration, growthByDay, sleepMinutes } from "@/lib/child/summary";
import { formatGrams, kgToGrams } from "@/lib/child/weight";
import type {
  DiaperEntry,
  EliminationMode,
  FeedEntry,
  GrowthEntry,
  PoopAmount,
  PoopColor,
  PoopTexture,
  PottyEntry,
  PumpEntry,
  SleepEntry,
} from "@/lib/child/types";

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

export function dayShareText(
  input: {
    name: string;
    date: string;
    dateLabel: string;
    feeds: FeedEntry[];
    diapers: DiaperEntry[];
    potty: PottyEntry[];
    sleeps: SleepEntry[];
    growth: GrowthEntry[];
    elimination: EliminationMode;
    locale: "en" | "id";
  },
  t: Translate,
): string {
  const feeds = input.feeds.filter((entry) => entry.date === input.date);
  const ml = feeds.reduce((sum, entry) => sum + (entry.amountMl ?? 0), 0);
  const sleeps = input.sleeps.filter((entry) => entry.date === input.date);
  const sleepMin = sleeps.reduce((sum, entry) => sum + sleepMinutes(entry), 0);
  const source = input.elimination === "potty" ? input.potty : input.diapers;
  const dayElimination = source.filter((entry) => entry.date === input.date);
  const pee = dayElimination.filter((entry) => entry.kind === "pee" || entry.kind === "both").length;
  const poop = dayElimination.filter((entry) => entry.kind === "poop" || entry.kind === "both").length;
  const latest = growthByDay(input.growth)[0];
  const measures = latest
    ? [
        latest.weightKg !== undefined ? t("share.weight", { value: formatGrams(kgToGrams(latest.weightKg)) }) : "",
        latest.lengthCm !== undefined ? t("share.length", { value: latest.lengthCm }) : "",
        latest.headCm !== undefined ? t("share.head", { value: latest.headCm }) : "",
      ].filter(Boolean)
    : [];
  const growthLine =
    latest && measures.length
      ? t("share.growth", {
          measures: measures.join(", "),
          date: format(parseISO(latest.date), "d MMM yyyy", {
            locale: input.locale === "id" ? idLocale : enUS,
          }),
        })
      : t("share.noGrowth");
  const heading = [input.name, input.dateLabel].filter(Boolean).join(" · ");
  return [
    heading,
    t("share.milk", { count: feeds.length, ml }),
    t("share.peePoop", { pee, poop }),
    t("share.sleep", { duration: formatDuration(sleepMin, t) }),
    growthLine,
  ].join("\n");
}
