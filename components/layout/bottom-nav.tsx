"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Footprints, Home, Music, Pill } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const navRoutes = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/vitamins", labelKey: "nav.vitamins", icon: Pill },
  { href: "/baby-plus", labelKey: "nav.plus", icon: Music },
  { href: "/kicks", labelKey: "nav.kicks", icon: Footprints },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {navRoutes.map(({ href, labelKey, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 min-w-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-semibold transition-colors",
                active
                  ? "bg-lilac/50 text-lilac-foreground"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <Icon className={cn("size-5", active && "text-lilac-deep")} />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
