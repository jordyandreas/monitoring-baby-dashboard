export type MigrationResult =
  | { status: "skipped"; reason: string }
  | { status: "success"; direction: "upload" | "download" | "none" }
  | { status: "error"; message: string };
