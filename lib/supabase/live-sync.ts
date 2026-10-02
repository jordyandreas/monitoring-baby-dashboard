import type { SupabaseClient } from "@supabase/supabase-js";
import { readChildStorage, replaceChildStorage, childStorageHasData } from "@/lib/child/storage";
import { readStorage, updateAppStorage } from "@/lib/storage";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseSyncEnabled, type SupabaseSyncDomain } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RemoteAppSlice } from "@/lib/supabase/mappers";
import {
  fetchRemoteAppSlice,
  upsertAppStorageToRemote,
} from "@/lib/supabase/repositories/app-data";
import { fetchRemoteChild, replaceRemoteChild } from "@/lib/supabase/repositories/child-sync";
import { CHILD_DIRTY_KEY, LOCAL_DIRTY_KEY } from "@/lib/supabase/sync-constants";
import { rolloverVitaminState } from "@/lib/vitamins";

type Client = SupabaseClient<Database>;
type WriteFn = (supabase: Client, userId: string) => Promise<void>;
type QueuedWrite = {
  domain: SupabaseSyncDomain;
  write: WriteFn;
  onError?: () => void;
};
type Gate = "waiting" | "live" | "stopped";

let gate: Gate = "waiting";
let epoch = 0;
let activeUserId: string | null = null;
let queue: QueuedWrite[] = [];
let tail: Promise<void> = Promise.resolve();
let healPregnancy = false;
let healChild = false;

let notice: string | null = null;
const listeners = new Set<() => void>();

export function subscribeSyncNotice(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncNotice(): string | null {
  return notice;
}

function setNotice(message: string | null) {
  if (notice === message) return;
  notice = message;
  listeners.forEach((listener) => listener());
}

function isDirty(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCAL_DIRTY_KEY) === "1";
}

function markDirty() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_DIRTY_KEY, "1");
}

function clearDirty() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_DIRTY_KEY);
}

function isChildDirty(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CHILD_DIRTY_KEY) === "1";
}

function markChildDirty() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHILD_DIRTY_KEY, "1");
}

function clearChildDirty() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHILD_DIRTY_KEY);
}

function markDirtyFor(domain: SupabaseSyncDomain) {
  if (domain === "child") markChildDirty();
  else markDirty();
}

function clearNoticeIfClean() {
  if (!isDirty() && !isChildDirty()) setNotice(null);
}

function applyRemote(remote: RemoteAppSlice) {
  updateAppStorage((prev) => ({
    ...prev,
    ...(isSupabaseSyncEnabled("baby") ? { baby: remote.baby } : {}),
    ...(isSupabaseSyncEnabled("babyPlus") ? { babyPlus: remote.babyPlus } : {}),
    ...(isSupabaseSyncEnabled("kicks") ? { kicks: remote.kicks } : {}),
    ...(isSupabaseSyncEnabled("water") ? { water: remote.water } : {}),
    ...(isSupabaseSyncEnabled("vitamins")
      ? { vitamins: rolloverVitaminState(remote.vitamins) }
      : {}),
    ...(isSupabaseSyncEnabled("reminders") ? { reminders: remote.reminders } : {}),
  }));
}

async function pushLocalSnapshot(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not configured");
  await upsertAppStorageToRemote(supabase, userId, readStorage());
  clearDirty();
  clearNoticeIfClean();
}

async function pushChildSnapshot(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not configured");
  await replaceRemoteChild(supabase, userId, readChildStorage());
  clearChildDirty();
  clearNoticeIfClean();
}

async function reconcileChild(userId: string, preferLocal: boolean) {
  if (!isSupabaseSyncEnabled("child")) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const local = readChildStorage();
  if (preferLocal) {
    await pushChildSnapshot(userId);
    return;
  }
  const remote = await fetchRemoteChild(supabase, userId);
  if (!childStorageHasData(remote) && childStorageHasData(local)) {
    await pushChildSnapshot(userId);
    return;
  }
  if (childStorageHasData(remote)) {
    replaceChildStorage(remote);
  }
  clearChildDirty();
  clearNoticeIfClean();
}

function runSerial(task: () => Promise<void>) {
  tail = tail.then(task, task);
}

async function withRetries(fn: () => Promise<void>) {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await fn();
      return;
    } catch (err) {
      last = err;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw last instanceof Error ? last : new Error("Sync failed");
}

function requestHeal(userId: string, myEpoch: number, domain: SupabaseSyncDomain) {
  if (domain === "child") {
    if (healChild) return;
    healChild = true;
    runSerial(async () => {
      try {
        if (myEpoch !== epoch || gate !== "live") return;
        await pushChildSnapshot(userId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        setNotice(message);
      } finally {
        healChild = false;
      }
    });
    return;
  }
  if (healPregnancy) return;
  healPregnancy = true;
  runSerial(async () => {
    try {
      if (myEpoch !== epoch || gate !== "live") return;
      await pushLocalSnapshot(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setNotice(message);
    } finally {
      healPregnancy = false;
    }
  });
}

function execute(
  write: WriteFn,
  userId: string,
  myEpoch: number,
  domain: SupabaseSyncDomain,
  onError?: () => void,
) {
  return async () => {
    if (myEpoch !== epoch || gate !== "live") return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      await withRetries(() => write(supabase, userId));
      clearNoticeIfClean();
    } catch (err) {
      markDirtyFor(domain);
      const message = err instanceof Error ? err.message : "Sync failed";
      setNotice(message);
      onError?.();
      requestHeal(userId, myEpoch, domain);
    }
  };
}

/** Queue writes until anonymous auth finishes. Drop them if auth is stopped. */
export function holdLiveSync() {
  epoch += 1;
  gate = "waiting";
  activeUserId = null;
}

/** Drop writes queued for the previous session before applying another account. */
export function discardQueuedWrites() {
  queue = [];
}

export function stopLiveSync() {
  epoch += 1;
  gate = "stopped";
  activeUserId = null;
  if (queue.some((item) => item.domain !== "child")) markDirty();
  if (queue.some((item) => item.domain === "child")) markChildDirty();
  queue = [];
}

/**
 * After auth: push unsynced local data, or pull remote when this device
 * already migrated and nothing local is waiting.
 */
export async function armLiveSync(
  userId: string,
  options: { pullRemote: boolean },
) {
  const myEpoch = epoch;
  activeUserId = userId;
  if (gate === "stopped") return;
  gate = "waiting";

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    gate = "stopped";
    return;
  }

  const pregnancyPending = () =>
    queue.some((item) => item.domain !== "child") || isDirty();

  try {
    let needsPush = pregnancyPending();
    if (!needsPush && options.pullRemote) {
      const remote = await fetchRemoteAppSlice(supabase, userId);
      if (myEpoch !== epoch) return;
      if (pregnancyPending()) {
        needsPush = true;
      } else {
        applyRemote(remote);
      }
    }

    while (needsPush) {
      if (myEpoch !== epoch) return;
      queue = queue.filter((item) => item.domain === "child");
      await pushLocalSnapshot(userId);
      needsPush = queue.some((item) => item.domain !== "child");
    }
  } catch (err) {
    if (myEpoch !== epoch) return;
    markDirty();
    const message = err instanceof Error ? err.message : "Sync failed";
    setNotice(message);
  }

  if (myEpoch !== epoch) return;

  const preferLocal = isChildDirty() || queue.some((item) => item.domain === "child");
  queue = queue.filter((item) => item.domain !== "child");
  try {
    await reconcileChild(userId, preferLocal);
  } catch (err) {
    if (myEpoch !== epoch) return;
    const message = err instanceof Error ? err.message : "Sync failed";
    const missingTable = /schema cache|does not exist/i.test(message);
    if (missingTable) return;
    markChildDirty();
    setNotice(message);
  }

  if (myEpoch !== epoch) return;
  // Set live synchronously so a write cannot land in the boot queue after this.
  gate = "live";
  activeUserId = userId;
  const pending = queue;
  queue = [];
  for (const item of pending) {
    runSerial(execute(item.write, userId, myEpoch, item.domain, item.onError));
  }
}

export function scheduleRemoteWrite(
  domain: SupabaseSyncDomain,
  write: WriteFn,
  onError?: () => void,
) {
  if (!isSupabaseSyncEnabled(domain)) return;
  if (gate === "stopped") {
    markDirtyFor(domain);
    return;
  }
  if (gate !== "live" || !activeUserId) {
    queue.push({ domain, write, onError });
    return;
  }
  const userId = activeUserId;
  const myEpoch = epoch;
  runSerial(execute(write, userId, myEpoch, domain, onError));
}
