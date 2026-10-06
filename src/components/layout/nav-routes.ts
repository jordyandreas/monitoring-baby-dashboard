import type { ComponentType } from "react";
import { Droplets, Footprints, Home, Milk, Music, Pill, Ruler } from "lucide-react";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import { PumpIcon } from "@/components/icons/pump-icon";
import type { AppMode } from "@/lib/app-mode";

export type NavIcon = ComponentType<{ className?: string }>;

export type NavRoute = {
  href: string;
  labelKey: string;
  /** Shorter label for bottom nav on small screens */
  mobileLabelKey?: string;
  icon: NavIcon;
};

/** Home → Vitamins → Baby Plus → Water → Kicks */
export const navRoutes: NavRoute[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/vitamins", labelKey: "nav.vitamins", icon: Pill },
  {
    href: "/baby-plus",
    labelKey: "nav.babyPlus",
    mobileLabelKey: "nav.plus",
    icon: Music,
  },
  { href: "/water", labelKey: "nav.water", icon: Droplets },
  { href: "/kicks", labelKey: "nav.kicks", icon: Footprints },
];

/** Home → Milk → Diapers → Pump → Growth */
export const childNavRoutes: NavRoute[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/feed", labelKey: "nav.feed", icon: Milk },
  { href: "/diapers", labelKey: "nav.diaper", icon: DiaperIcon },
  { href: "/pump", labelKey: "nav.pump", icon: PumpIcon },
  { href: "/growth", labelKey: "nav.growth", icon: Ruler },
];

export function navRoutesFor(mode: AppMode): NavRoute[] {
  return mode === "child" ? childNavRoutes : navRoutes;
}

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
