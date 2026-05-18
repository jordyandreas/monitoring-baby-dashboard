"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby, Footprints, Home, Music } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/baby-plus", label: "Baby Plus", icon: Music },
  { href: "/kicks", label: "Kicks", icon: Footprints },
] as const;

const pageMeta: Record<
  string,
  { title: string; description?: string; icon: typeof Home }
> = {
  "/": {
    title: "Baby Monitor",
    description: "Your pregnancy companion — saved on this device only",
    icon: Baby,
  },
  "/baby-plus": {
    title: "Baby Plus",
    description:
      "Play one sound daily for 9 days, then move to the next — 16 sounds over 144 days.",
    icon: Music,
  },
  "/kicks": {
    title: "Kick monitor",
    description:
      "Log each kick to discover when your baby is most active.",
    icon: Footprints,
  },
};

export function SiteHeader() {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta["/"];
  const PageIcon = meta.icon;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur-md md:hidden">
        <div className="mx-auto max-w-3xl space-y-1 px-4 py-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <PageIcon className="size-6 text-lilac-deep" />
            {meta.title}
          </h1>
          {meta.description && (
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          )}
        </div>
      </header>

      <header className="sticky top-0 z-40 hidden border-b border-border/80 bg-card/90 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <Baby className="size-6 text-lilac-deep" />
            <span>Baby Monitor</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
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
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}
