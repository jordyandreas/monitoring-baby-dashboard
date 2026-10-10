/**
 * Runs before `pnpm build`. Writes today's changelog notes from files
 * added or edited since midnight, plus anything still uncommitted.
 * Hand-written notes in src/lib/changelog.ts are left alone.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildChangelog, type BuildChangelogEntry, type BuildChangelogItem } from "../src/lib/changelog-build";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/lib/changelog-build.ts");

type Copy = { en: string; id: string };

type Area = {
  id: string;
  match: (path: string) => boolean;
  added: Copy;
  updated: Copy;
};

const AREAS: readonly Area[] = [
  {
    id: "migration",
    match: (path) => path.startsWith("supabase/migrations/"),
    added: { en: "A database change was added.", id: "Perubahan database ditambahkan." },
    updated: { en: "The database setup was updated.", id: "Pengaturan database diperbarui." },
  },
  {
    id: "home",
    match: (path) => path === "src/components/child/child-home.tsx",
    added: { en: "The home screen has new activity details.", id: "Beranda punya detail aktivitas baru." },
    updated: { en: "The home screen was updated.", id: "Beranda diperbarui." },
  },
  {
    id: "last",
    match: (path) =>
      path === "src/components/child/last-log-line.tsx" ||
      path.endsWith("/feed-page.tsx") ||
      path.endsWith("/diaper-page.tsx") ||
      path.endsWith("/pump-page.tsx"),
    added: {
      en: "Milk, diaper, and pumping pages show when you last logged.",
      id: "Halaman susu, popok, dan pompa menampilkan kapan terakhir dicatat.",
    },
    updated: {
      en: "The latest milk, diaper, and pumping note is easier to see.",
      id: "Catatan terakhir susu, popok, dan pompa lebih mudah dilihat.",
    },
  },
  {
    id: "summary",
    match: (path) => path.endsWith("/page-summary.tsx") || path === "src/lib/child/summary.ts",
    added: {
      en: "Summaries show the gap between logs.",
      id: "Ringkasan menampilkan jarak antar catatan.",
    },
    updated: {
      en: "Milk, diaper, and pumping summaries were updated.",
      id: "Ringkasan susu, popok, dan pompa diperbarui.",
    },
  },
  {
    id: "diaper",
    match: (path) =>
      path.endsWith("/quick-log-forms.tsx") ||
      path === "src/lib/child/types.ts" ||
      path.endsWith("/child-mappers.ts") ||
      path.endsWith("/whatsapp-share.ts"),
    added: { en: "Diaper logging has a new detail.", id: "Catatan popok punya detail baru." },
    updated: { en: "Diaper logging was updated.", id: "Catatan popok diperbarui." },
  },
  {
    id: "sleep",
    match: (path) => path.includes("/sleep"),
    added: { en: "Sleep logging was added.", id: "Catatan tidur ditambahkan." },
    updated: { en: "Sleep logging was updated.", id: "Catatan tidur diperbarui." },
  },
  {
    id: "growth",
    match: (path) => path.includes("/growth"),
    added: { en: "Growth tracking was added.", id: "Catatan tumbuh ditambahkan." },
    updated: { en: "Growth tracking was updated.", id: "Catatan tumbuh diperbarui." },
  },
  {
    id: "changelog",
    match: (path) => path.includes("changelog"),
    added: {
      en: "The changelog can record what changed in a build.",
      id: "Changelog bisa mencatat apa yang berubah saat build.",
    },
    updated: {
      en: "The changelog was updated.",
      id: "Changelog diperbarui.",
    },
  },
  {
    id: "pregnancy",
    match: (path) => path.includes("/pregnancy/") || path.startsWith("src/lib/pregnancy/"),
    added: { en: "Pregnancy tools were added.", id: "Alat kehamilan ditambahkan." },
    updated: { en: "Pregnancy tools were updated.", id: "Alat kehamilan diperbarui." },
  },
];

const OTHER: Copy = {
  en: "Other parts of the app were updated.",
  id: "Bagian lain aplikasi diperbarui.",
};

function skip(path: string): boolean {
  if (!path || path.endsWith(".md")) return true;
  if (path === "src/lib/changelog.ts" || path === "src/lib/changelog-build.ts") return true;
  if (path.startsWith("src/lib/i18n/messages/")) return true;
  if (path.startsWith("scripts/")) return true;
  if (path.startsWith("supabase/functions/")) return true;
  return !path.startsWith("src/") && !path.startsWith("supabase/migrations/");
}

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
  } catch {
    return null;
  }
}

function lines(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

type FileChange = { path: string; added: boolean };

function collectChanges(): FileChange[] | null {
  const probe = git(["rev-parse", "--is-inside-work-tree"]);
  if (probe?.trim() !== "true") return null;

  const byPath = new Map<string, FileChange>();
  const note = (path: string, added: boolean) => {
    if (skip(path)) return;
    const prev = byPath.get(path);
    if (!prev) {
      byPath.set(path, { path, added });
      return;
    }
    prev.added = prev.added && added;
  };

  for (const path of lines(git(["ls-files", "--others", "--exclude-standard"]))) {
    note(path, true);
  }
  for (const path of lines(git(["diff", "--name-only", "HEAD"]))) {
    note(path, false);
  }

  const log = git(["log", "--since=midnight", "--name-status", "--pretty=format:---%H"]);
  let skipCommit = false;
  const pending: { path: string; added: boolean }[] = [];
  const flush = () => {
    if (!skipCommit) {
      for (const change of pending) note(change.path, change.added);
    }
    pending.length = 0;
    skipCommit = false;
  };

  for (const line of lines(log)) {
    if (line.startsWith("---")) {
      flush();
      continue;
    }
    const [status, first, second] = line.split("\t");
    const path = status.startsWith("R") || status.startsWith("C") ? second : first;
    if (!path) continue;
    if (path === "src/lib/changelog.ts") skipCommit = true;
    pending.push({ path, added: status.startsWith("A") });
  }
  flush();

  return [...byPath.values()];
}

function notesFor(changes: FileChange[]): BuildChangelogItem[] {
  const grouped = new Map<string, { area: Area | null; added: boolean }>();

  for (const change of changes) {
    const area = AREAS.find((item) => item.match(change.path));
    const key = area?.id ?? "other";
    const prev = grouped.get(key);
    if (!prev) {
      grouped.set(key, { area: area ?? null, added: change.added });
      continue;
    }
    prev.added = prev.added && change.added;
  }

  const items: BuildChangelogItem[] = [];
  for (const [key, group] of grouped) {
    if (key === "other") {
      items.push(
        group.added
          ? { en: "Something new was added elsewhere in the app.", id: "Ada tambahan di bagian lain aplikasi." }
          : OTHER,
      );
      continue;
    }
    const copy = group.added ? group.area!.added : group.area!.updated;
    items.push(copy);
  }
  return items;
}

function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function render(entries: readonly BuildChangelogEntry[]): string {
  const blocks = entries
    .map((entry) => {
      const items = entry.items
        .map((item) => `      { en: ${JSON.stringify(item.en)}, id: ${JSON.stringify(item.id)} },`)
        .join("\n");
      return `  {\n    date: ${JSON.stringify(entry.date)},\n    items: [\n${items}\n    ],\n  },`;
    })
    .join("\n");

  return `// Generated by scripts/write-changelog.ts during pnpm build. Do not edit by hand.

export type BuildChangelogItem = {
  en: string;
  id: string;
};

export type BuildChangelogEntry = {
  date: string;
  items: readonly BuildChangelogItem[];
};

export const buildChangelog: readonly BuildChangelogEntry[] = [
${blocks}
];
`;
}

function main() {
  const changes = collectChanges();
  if (!changes) {
    console.log("changelog: git is unavailable, leaving the changelog as it is.");
    return;
  }

  const today = todayKey();
  const items = notesFor(changes);
  const kept = buildChangelog.filter((entry) => entry.date !== today && entry.items.length > 0);
  const next = items.length > 0 ? [{ date: today, items }, ...kept] : [...kept];
  const content = render(next);
  const current = readFileSync(OUT, "utf8");
  if (current === content) {
    console.log(items.length === 0 ? "changelog: no updates to record." : "changelog: already up to date.");
    return;
  }
  writeFileSync(OUT, content);
  if (items.length === 0) {
    console.log("changelog: cleared today's generated notes.");
    return;
  }
  console.log(`changelog: recorded ${items.length} note(s) for ${today}.`);
}

main();
