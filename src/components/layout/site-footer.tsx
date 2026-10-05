"use client";

import Link from "next/link";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/utils/cn";

export function SiteFooter() {
  const { t } = useLocale();
  const { mode } = useAppMode();
  const year = new Date().getFullYear();

  return (
    <footer className="glass-bar mt-10 mb-[calc(6.5rem+env(safe-area-inset-bottom))] border-t border-border md:mb-0">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-start md:justify-between md:gap-10 md:px-6 lg:px-10",
          mode === "child" && "pr-20 md:pr-24 lg:pr-28",
        )}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <Link href="/" className="mt-0.5 shrink-0">
            <img src="/logo.png" alt="" className="size-8" />
          </Link>
          <div className="min-w-0">
            <p className="font-bold text-foreground">{t("pages.home.title")}</p>
            <p className="mt-1 max-w-sm leading-relaxed">{t("footer.tagline")}</p>
          </div>
        </div>
        <div className="max-w-md space-y-2 leading-relaxed md:text-right">
          <p>{t("footer.disclaimer")}</p>
          <p>{t("footer.copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
