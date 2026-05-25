export const LOCALES = ["en", "id"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = "baby-monitor-locale";

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeToIntl(locale: Locale): string {
  return locale === "id" ? "id-ID" : "en-US";
}
