import type { LucideIcon } from "lucide-react";
import { Droplets, Footprints, Home, Music, Pill } from "lucide-react";

export type NavRoute = {
  href: string;
  labelKey: string;
  /** Shorter label for bottom nav on small screens */
  mobileLabelKey?: string;
  icon: LucideIcon;
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

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
