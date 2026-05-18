import type { Gender } from "./types";

export function getKickButtonLabel(gender?: Gender | null): string {
  if (gender === "boy") return "He's kicking now";
  if (gender === "girl") return "She's kicking now";
  return "Baby's kicking now";
}
