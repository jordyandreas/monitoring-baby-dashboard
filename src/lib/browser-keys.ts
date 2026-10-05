const KEY_MOVES: ReadonlyArray<readonly [string, string]> = [
  ["baby-monitor-locale", "nurtory-locale"],
  ["baby-monitor-mode", "nurtory-mode"],
  ["baby-age-celebration-dismissed", "nurtory-age-celebration-dismissed"],
];

const KEY_DROPS = [
  "baby-monitor-v1",
  "baby-monitor-child-v1",
  "baby-monitor-child-owner-v1",
  "baby-monitor-supabase-migrated-v1",
  "baby-monitor-supabase-dirty-v1",
  "baby-monitor-child-dirty-v1",
  "baby-monitor-reminders-fired-v1",
  "nurtory-reminders-fired-v1",
];

/** Copy the preference keys that still matter, then drop the old note blobs. */
export function migrateBrowserKeys() {
  if (typeof window === "undefined") return;
  for (const [from, to] of KEY_MOVES) {
    const previous = localStorage.getItem(from);
    if (previous !== null && localStorage.getItem(to) === null) {
      localStorage.setItem(to, previous);
    }
    localStorage.removeItem(from);
  }
  for (const key of KEY_DROPS) localStorage.removeItem(key);
}
