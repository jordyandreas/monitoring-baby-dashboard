export type ChangelogEntry = {
  date: string;
  itemKeys: readonly string[];
};

/** Newest first. Add a dated entry here and matching copy in en.ts and id.ts. */
export const changelog: readonly ChangelogEntry[] = [
  {
    date: "2026-10-11",
    itemKeys: ["changelog.schedule"],
  },
  {
    date: "2026-10-10",
    itemKeys: ["changelog.lastSeen", "changelog.intervals", "changelog.poopMedium"],
  },
  {
    date: "2026-10-09",
    itemKeys: ["changelog.poopAmount"],
  },
  {
    date: "2026-10-07",
    itemKeys: ["changelog.feedback"],
  },
  {
    date: "2026-10-06",
    itemKeys: ["changelog.pump", "changelog.pushReminders"],
  },
  {
    date: "2026-10-04",
    itemKeys: ["changelog.glass"],
  },
  {
    date: "2026-10-03",
    itemKeys: ["changelog.quickLog", "changelog.whatsappShare", "changelog.ageCelebration"],
  },
  {
    date: "2026-10-02",
    itemKeys: ["changelog.childMode", "changelog.accountSync", "changelog.editDelete"],
  },
];
