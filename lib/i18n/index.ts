import type { Locale } from "./types";
import { en, type Messages } from "./messages/en";
import { id } from "./messages/id";

const catalogs: Record<Locale, Messages> = { en, id };

export type MessageKey = string;

type Params = Record<string, string | number>;

function getByPath(obj: object, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function interpolate(
  template: string,
  params?: Params,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function createTranslator(locale: Locale) {
  const messages = catalogs[locale];

  return function t(key: MessageKey, params?: Params): string {
    const value = getByPath(messages, key);
    if (typeof value !== "string") {
      return key;
    }
    return interpolate(value, params);
  };
}

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}
