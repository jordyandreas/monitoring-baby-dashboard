import { getVapidPublicKey } from "@/lib/supabase/env";

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
  );
}

export async function registerPushWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    await navigator.serviceWorker.register("/sw.js");
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

function urlBase64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

export async function subscribeForPush(): Promise<{
  endpoint: string;
  p256dh: string;
  auth: string;
} | null> {
  const publicKey = getVapidPublicKey();
  if (!publicKey) return null;
  const registration = await registerPushWorker();
  if (!registration) return null;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBytes(publicKey),
    }));
  const json = subscription.toJSON();
  if (!subscription.endpoint || !json.keys?.p256dh || !json.keys.auth) return null;
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}
