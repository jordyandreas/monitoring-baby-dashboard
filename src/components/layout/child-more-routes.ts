import { CircleDot, Flag, Moon, Syringe, Thermometer, Utensils } from "lucide-react";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import type { NavRoute } from "@/components/layout/nav-routes";
import type { EliminationMode } from "@/lib/child/types";

export function childMoreRoutesFor(input: {
  showFood: boolean;
  elimination: EliminationMode;
  hasPottyLogs: boolean;
}): NavRoute[] {
  const routes: NavRoute[] = [{ href: "/sleep", labelKey: "child.moreSleep", icon: Moon }];
  if (input.showFood) {
    routes.push({ href: "/food", labelKey: "child.moreFood", icon: Utensils });
  }
  routes.push({ href: "/health", labelKey: "child.moreHealth", icon: Thermometer });
  if (input.elimination === "potty") {
    routes.push({ href: "/diapers", labelKey: "child.diaperHistory", icon: DiaperIcon });
  } else if (input.hasPottyLogs) {
    routes.push({ href: "/potty", labelKey: "child.pottyHistory", icon: CircleDot });
  }
  routes.push(
    { href: "/milestones", labelKey: "child.moreMilestones", icon: Flag },
    { href: "/vaccines", labelKey: "child.moreVaccines", icon: Syringe },
  );
  return routes;
}
