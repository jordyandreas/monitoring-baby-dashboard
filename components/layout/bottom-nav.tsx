"use client";

import { FeatureLink } from "@/components/layout/feature-link";
import { usePathname } from "next/navigation";
import { isNavActive, navRoutesFor } from "@/components/layout/nav-routes";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { mode } = useAppMode();
  const routes = navRoutesFor(mode);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card md:hidden"
      aria-label={t("nav.main")}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {routes.map(({ href, labelKey, mobileLabelKey, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <FeatureLink
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors",
                active
                  ? "bg-lilac/50 text-lilac-foreground"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <Icon className={cn("size-5 shrink-0", active && "text-lilac-deep")} />
              <span className="max-w-full truncate">
                {t(mobileLabelKey ?? labelKey)}
              </span>
            </FeatureLink>
          );
        })}
      </div>
    </nav>
  );
}
