import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../lib/i18n/messages/en";
import { id } from "../lib/i18n/messages/id";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIRS = ["app", "components", "lib"];

/** Keys passed to t("...") in source files. */
export function collectUsedKeys(): Set<string> {
  const keys = new Set<string>();
  const pattern = /\bt\(\s*["'`]([\w.]+)["'`]/g;

  for (const file of walkSourceFiles()) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(pattern)) {
      keys.add(match[1]);
    }
  }

  return keys;
}

function walkSourceFiles(): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const rel = relative(ROOT, full);

      if (
        rel.startsWith("lib/i18n/messages") ||
        rel.startsWith("scripts/") ||
        rel.startsWith("scripts\\") ||
        entry === "node_modules"
      ) {
        continue;
      }

      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        files.push(full);
      }
    }
  }

  for (const dir of SOURCE_DIRS) {
    walk(join(ROOT, dir));
  }

  return files;
}

export function flattenMessageKeys(
  obj: object,
  prefix = "",
): Map<string, string> {
  const map = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      map.set(path, value);
    } else if (value && typeof value === "object") {
      for (const [childKey, childValue] of flattenMessageKeys(value, path)) {
        map.set(childKey, childValue);
      }
    }
  }

  return map;
}

export function unflattenMessageKeys(
  flat: Map<string, string>,
): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const [path, value] of flat) {
    const parts = path.split(".");
    let cursor: Record<string, unknown> = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in cursor) || typeof cursor[part] !== "object") {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }

    cursor[parts[parts.length - 1]] = value;
  }

  return root;
}

function escapeString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function serializeObject(obj: Record<string, unknown>, indent = 0): string {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const safeKey = /^[a-zA-Z_][\w]*$/.test(key) ? key : `"${key}"`;
    if (typeof value === "string") {
      lines.push(`${inner}${safeKey}: "${escapeString(value)}",`);
    } else if (value && typeof value === "object") {
      lines.push(
        `${inner}${safeKey}: {\n${serializeObject(value as Record<string, unknown>, indent + 1)}\n${inner}},`,
      );
    }
  }

  return lines.join("\n");
}

export function serializeMessagesTs(
  constName: string,
  obj: Record<string, unknown>,
  header: string,
): string {
  return `${header}\nexport const ${constName}: Messages = {\n${serializeObject(obj, 0)}\n};\n`;
}

export function getEnCatalog() {
  return flattenMessageKeys(en);
}

export function getIdCatalog() {
  return flattenMessageKeys(id);
}

export function writeIdCatalog(flat: Map<string, string>) {
  const nested = unflattenMessageKeys(flat);
  const content = serializeMessagesTs(
    "id",
    nested,
    `import type { Messages } from "./en";`,
  );
  const outPath = join(ROOT, "lib/i18n/messages/id.ts");
  writeFileSync(outPath, content, "utf8");
  return outPath;
}
