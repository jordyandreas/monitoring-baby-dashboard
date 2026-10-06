import { Apple, CircleDot, Flag, Moon, Thermometer, Utensils } from "lucide-react";
import type { NavRoute } from "@/components/layout/nav-routes";

export const childMoreRoutes: NavRoute[] = [
  { href: "/sleep", labelKey: "child.moreSleep", icon: Moon },
  { href: "/solids", labelKey: "child.moreSolids", icon: Apple },
  { href: "/health", labelKey: "child.moreHealth", icon: Thermometer },
  { href: "/potty", labelKey: "child.morePotty", icon: CircleDot },
  { href: "/meals", labelKey: "child.moreMeals", icon: Utensils },
  { href: "/milestones", labelKey: "child.moreMilestones", icon: Flag },
];
