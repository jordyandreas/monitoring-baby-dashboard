"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby, Footprints, Home, Music, Pill } from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const navRoutes = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/vitamins", labelKey: "nav.vitamins", icon: Pill },
  { href: "/baby-plus", labelKey: "nav.babyPlus", icon: Music },
  { href: "/kicks", labelKey: "nav.kicks", icon: Footprints },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-bold text-foreground"
          >
            <Baby className="size-6 shrink-0 text-lilac-deep" aria-hidden />
            <span className="truncate">{t("pages.home.title")}</span>
          </Link>
          <LocaleSwitcher />
        </div>
      </header>

      <header className="sticky top-0 z-40 hidden border-b border-border/80 bg-card/90 backdrop-blur-md md:block">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-x-10 px-8 py-4 lg:gap-x-16 lg:px-10">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-bold text-foreground justify-self-start"
          >
            <Baby className="size-6 text-lilac-deep" aria-hidden />
            <span>{t("pages.home.title")}</span>
          </Link>
          <nav className="flex items-center justify-center gap-1 justify-self-center">
            {navRoutes.map(({ href, labelKey, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-lilac/60 text-lilac-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {t(labelKey)}
                </Link>
              );
            })}
          </nav>
          <div className="justify-self-end">
            <LocaleSwitcher />
          </div>
        </div>
      </header>
    </>
  );
}
