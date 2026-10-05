export const DATA_REFRESH_EVENT = "nurtory-data-refresh";

export function notifyDataRefresh(feature: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT, { detail: feature }));
}
