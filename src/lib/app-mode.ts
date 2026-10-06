export const APP_MODE_STORAGE_KEY = "nurtory-mode";

export type AppMode = "pregnancy" | "child";

const PREGNANCY_PREFIXES = ["/vitamins", "/baby-plus", "/water", "/kicks"];
const CHILD_PREFIXES = [
  "/feed",
  "/pump",
  "/diapers",
  "/sleep",
  "/growth",
  "/solids",
  "/health",
  "/potty",
  "/meals",
  "/milestones",
];

export function isAppMode(value: string | null): value is AppMode {
  return value === "pregnancy" || value === "child";
}

export function isPregnancyPath(pathname: string): boolean {
  return PREGNANCY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isChildPath(pathname: string): boolean {
  return CHILD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
