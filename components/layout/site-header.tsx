"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby } from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { isNavActive, navRoutes } from "@/components/layout/nav-routes";
import { ReminderSettingsDialog } from "@/components/reminders/reminder-settings-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <>
      <header className="sticky top-0 z-40 h-20 border-b border-border/80 bg-card/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-bold text-foreground"
          >
            <Baby className="size-6 shrink-0 text-lilac-deep" aria-hidden />
            <span className="truncate">{t("pages.home.title")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ReminderSettingsDialog />
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 hidden h-20 border-b border-border/80 bg-card/90 backdrop-blur-md md:block">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-x-6 px-6 lg:gap-x-10 lg:px-10">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-bold text-foreground justify-self-start"
          >
            <Baby className="size-6 text-lilac-deep" aria-hidden />
            <span>{t("pages.home.title")}</span>
          </Link>
          <nav
            className="flex flex-wrap items-center justify-center gap-0.5 justify-self-center lg:gap-1"
            aria-label={t("nav.main")}
          >
            {navRoutes.map(({ href, labelKey, icon: Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors lg:gap-2 lg:px-4",
                    active
                      ? "bg-lilac/60 text-lilac-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {t(labelKey)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-end gap-2 justify-self-end">
            <ReminderSettingsDialog />
            <LocaleSwitcher />
          </div>
        </div>
      </header>
    </>
  );
}
