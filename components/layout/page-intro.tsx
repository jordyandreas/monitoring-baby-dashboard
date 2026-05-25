"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/components/providers/locale-provider";
import { getPageMeta } from "@/lib/layout/page-meta";

export function PageIntro() {
  const pathname = usePathname();
  const { t } = useLocale();

  if (pathname === "/") return null;

  const meta = getPageMeta(pathname);
  const PageIcon = meta.icon;

  return (
    <div className="mb-6 space-y-1 md:hidden">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <PageIcon className="size-6 text-lilac-deep" aria-hidden />
        {t(meta.titleKey)}
      </h1>
      {meta.descriptionKey ? (
        <p className="text-sm text-muted-foreground">{t(meta.descriptionKey)}</p>
      ) : null}
    </div>
  );
}
