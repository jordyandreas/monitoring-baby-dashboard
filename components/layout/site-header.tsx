"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby } from "lucide-react";
import { AccountDialog } from "@/components/layout/account-dialog";
import { FeatureLink } from "@/components/layout/feature-link";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { isNavActive, navRoutesFor } from "@/components/layout/nav-routes";
import { ReminderSettingsDialog } from "@/components/reminders/reminder-settings-dialog";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { REMINDERS_VISIBLE } from "@/lib/reminders/visibility";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { mode } = useAppMode();
  const routes = navRoutesFor(mode);

  return (
    <>
      <header className="glass-bar sticky top-0 z-40 h-20 md:hidden">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-bold text-foreground"
          >
            <Baby className="size-6 shrink-0 text-lilac-deep" aria-hidden />
            <span className="truncate">{t("pages.home.title")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeSwitch />
            {REMINDERS_VISIBLE ? <ReminderSettingsDialog /> : null}
            <LocaleSwitcher />
            <AccountDialog />
          </div>
        </div>
      </header>

      <header className="glass-bar sticky top-0 z-40 hidden h-20 md:block">
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
            {routes.map(({ href, labelKey, icon: Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <FeatureLink
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors lg:gap-2 lg:px-4",
                    active
                      ? "bg-white/80 text-lilac-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-white/45",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {t(labelKey)}
                </FeatureLink>
              );
            })}
          </nav>
          <div className="flex items-center justify-end gap-2 justify-self-end">
            <ModeSwitch />
            {REMINDERS_VISIBLE ? <ReminderSettingsDialog /> : null}
            <LocaleSwitcher />
            <AccountDialog />
          </div>
        </div>
      </header>
    </>
  );
}
