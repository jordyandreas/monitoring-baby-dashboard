import type { LucideIcon } from "lucide-react";
import { Baby, Footprints, Music, Pill } from "lucide-react";

export type PageMeta = {
  titleKey: string;
  descriptionKey?: string;
  icon: LucideIcon;
};

export const pageMetaByPath: Record<string, PageMeta> = {
  "/": {
    titleKey: "pages.home.title",
    descriptionKey: "pages.home.description",
    icon: Baby,
  },
  "/baby-plus": {
    titleKey: "pages.babyPlus.title",
    descriptionKey: "pages.babyPlus.description",
    icon: Music,
  },
  "/kicks": {
    titleKey: "pages.kicks.title",
    descriptionKey: "pages.kicks.description",
    icon: Footprints,
  },
  "/vitamins": {
    titleKey: "pages.vitamins.title",
    descriptionKey: "pages.vitamins.description",
    icon: Pill,
  },
};

export function getPageMeta(pathname: string): PageMeta {
  return pageMetaByPath[pathname] ?? pageMetaByPath["/"];
}
