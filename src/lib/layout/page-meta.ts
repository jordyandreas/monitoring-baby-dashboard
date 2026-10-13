import type { ComponentType } from "react";
import {
  Baby,
  CircleDot,
  Droplets,
  Flag,
  Footprints,
  Milk,
  Moon,
  Music,
  Pill,
  Ruler,
  Syringe,
  Thermometer,
  Utensils,
} from "lucide-react";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import { PumpIcon } from "@/components/icons/pump-icon";

export type PageMeta = {
  titleKey: string;
  descriptionKey?: string;
  icon: ComponentType<{ className?: string }>;
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
  "/water": {
    titleKey: "pages.water.title",
    descriptionKey: "pages.water.description",
    icon: Droplets,
  },
  "/feed": {
    titleKey: "pages.feed.title",
    descriptionKey: "pages.feed.description",
    icon: Milk,
  },
  "/pump": {
    titleKey: "pages.pump.title",
    descriptionKey: "pages.pump.description",
    icon: PumpIcon,
  },
  "/diapers": {
    titleKey: "pages.diapers.title",
    descriptionKey: "pages.diapers.description",
    icon: DiaperIcon,
  },
  "/sleep": {
    titleKey: "pages.sleep.title",
    descriptionKey: "pages.sleep.description",
    icon: Moon,
  },
  "/growth": {
    titleKey: "pages.growth.title",
    descriptionKey: "pages.growth.description",
    icon: Ruler,
  },
  "/food": {
    titleKey: "pages.food.title",
    descriptionKey: "pages.food.description",
    icon: Utensils,
  },
  "/health": {
    titleKey: "pages.health.title",
    descriptionKey: "pages.health.description",
    icon: Thermometer,
  },
  "/potty": {
    titleKey: "pages.potty.title",
    descriptionKey: "pages.potty.description",
    icon: CircleDot,
  },
  "/milestones": {
    titleKey: "pages.milestones.title",
    descriptionKey: "pages.milestones.description",
    icon: Flag,
  },
  "/vaccines": {
    titleKey: "pages.vaccines.title",
    descriptionKey: "pages.vaccines.description",
    icon: Syringe,
  },
};

export function getPageMeta(pathname: string): PageMeta {
  return pageMetaByPath[pathname] ?? pageMetaByPath["/"];
}
