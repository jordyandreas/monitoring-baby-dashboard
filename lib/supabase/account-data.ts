import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChildStorage } from "@/lib/child/types";
import { readChildStorage, replaceChildStorage, resetChildStorage } from "@/lib/child/storage";
import { resetAppStorage, updateAppStorage } from "@/lib/storage";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseSyncEnabled, type SupabaseSyncDomain } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RemoteAppSlice } from "@/lib/supabase/mappers";
import {
  fetchRemoteAppSlice,
} from "@/lib/supabase/repositories/app-data";
import { fetchRemoteChild } from "@/lib/supabase/repositories/child-sync";
import { CHILD_OWNER_KEY } from "@/lib/supabase/sync-constants";
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
let childBusy = 0;
let pregnancyBusy = 0;

let notice: string | null = null;
const listeners = new Set<() => void>();

type ChildRemotePhase = "idle" | "loading" | "ready";
let childRemotePhase: ChildRemotePhase = "idle";
const childRemoteListeners = new Set<() => void>();

function setChildRemotePhase(next: ChildRemotePhase) {
  if (childRemotePhase === next) return;
  childRemotePhase = next;
  childRemoteListeners.forEach((listener) => listener());
}

export function subscribeChildRemotePhase(listener: () => void): () => void {
  childRemoteListeners.add(listener);
  return () => childRemoteListeners.delete(listener);
}

export function getChildRemotePhase(): ChildRemotePhase {
  return childRemotePhase;
}

export function getChildRemotePhaseServerSnapshot(): ChildRemotePhase {
  return "idle";
}

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

function writeChildOwner(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHILD_OWNER_KEY, userId);
}

function clearChildOwner() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHILD_OWNER_KEY);
}

function childWritesPending() {
  return queue.some((item) => item.domain === "child");
}

function dropQueuedChildWrites() {
  queue = queue.filter((item) => item.domain !== "child");
}

function isPregnancyDomain(domain: SupabaseSyncDomain) {
  return domain !== "child";
}

function pregnancyWritesPending() {
  return queue.some((item) => isPregnancyDomain(item.domain));
}

function dropQueuedPregnancyWrites() {
  queue = queue.filter((item) => !isPregnancyDomain(item.domain));
}

function clearNoticeIfClean() {
  setNotice(null);
}

function applyRemote(remote: RemoteAppSlice) {
  const pending = new Set(
    queue.filter((item) => isPregnancyDomain(item.domain)).map((item) => item.domain),
  );
  updateAppStorage((prev) => ({
    ...prev,
    ...(isSupabaseSyncEnabled("baby") && !pending.has("baby") ? { baby: remote.baby } : {}),
    ...(isSupabaseSyncEnabled("babyPlus") && !pending.has("babyPlus")
      ? { babyPlus: remote.babyPlus }
      : {}),
    ...(isSupabaseSyncEnabled("kicks") && !pending.has("kicks") ? { kicks: remote.kicks } : {}),
    ...(isSupabaseSyncEnabled("water") && !pending.has("water") ? { water: remote.water } : {}),
    ...(isSupabaseSyncEnabled("vitamins") && !pending.has("vitamins")
      ? { vitamins: rolloverVitaminState(remote.vitamins) }
      : {}),
    ...(isSupabaseSyncEnabled("reminders") && !pending.has("reminders")
      ? { reminders: remote.reminders }
      : {}),
  }));
}

/** Show this account's pregnancy rows. Nothing already stored in the browser is uploaded. */
async function loadPregnancyAccount(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const remote = await fetchRemoteAppSlice(supabase, userId);
  if (activeUserId !== userId) return;
  applyRemote(remote);
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function overlayList<T extends { id: string }>(remote: T[], before: T[], after: T[]): T[] {
  const beforeById = new Map(before.map((entry) => [entry.id, entry]));
  const afterById = new Map(after.map((entry) => [entry.id, entry]));
  const remoteIds = new Set(remote.map((entry) => entry.id));
  const kept = remote.flatMap((entry) => {
    const previous = beforeById.get(entry.id);
    const current = afterById.get(entry.id);
    if (previous && !current) return [];
    if (previous && current && !sameJson(previous, current)) return [current];
    return [entry];
  });
  const added = after.filter((entry) => !beforeById.has(entry.id) && !remoteIds.has(entry.id));
  return [...added, ...kept];
}

function overlayMilestones(
  remote: ChildStorage["milestones"],
  before: ChildStorage["milestones"],
  after: ChildStorage["milestones"],
): ChildStorage["milestones"] {
  const beforeByKey = new Map(before.map((entry) => [entry.key, entry]));
  const afterByKey = new Map(after.map((entry) => [entry.key, entry]));
  const remoteKeys = new Set(remote.map((entry) => entry.key));
  const kept = remote.flatMap((entry) => {
    const previous = beforeByKey.get(entry.key);
    const current = afterByKey.get(entry.key);
    if (previous && !current) return [];
    if (previous && current && !sameJson(previous, current)) return [current];
    return [entry];
  });
  const added = after.filter((entry) => !beforeByKey.has(entry.key) && !remoteKeys.has(entry.key));
  return [...kept, ...added];
}

/** Keep a row the user saved while the account read was still in flight. */
function overlayChildChanges(remote: ChildStorage, before: ChildStorage, after: ChildStorage): ChildStorage {
  if (sameJson(before, after)) return remote;
  return {
    ...remote,
    profile: sameJson(before.profile, after.profile) ? remote.profile : after.profile,
    feeds: overlayList(remote.feeds, before.feeds, after.feeds),
    diapers: overlayList(remote.diapers, before.diapers, after.diapers),
    sleeps: overlayList(remote.sleeps, before.sleeps, after.sleeps),
    growth: overlayList(remote.growth, before.growth, after.growth),
    solids: overlayList(remote.solids, before.solids, after.solids),
    health: overlayList(remote.health, before.health, after.health),
    potty: overlayList(remote.potty, before.potty, after.potty),
    meals: overlayList(remote.meals, before.meals, after.meals),
    milestones: overlayMilestones(remote.milestones, before.milestones, after.milestones),
  };
}

/** Show this account's rows. Nothing already stored in the browser is uploaded. */
async function loadChildAccount(userId: string) {
  if (!isSupabaseSyncEnabled("child")) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const before = readChildStorage();
  const remote = await fetchRemoteChild(supabase, userId);
  if (activeUserId !== userId) return;
  const local = readChildStorage();
  replaceChildStorage(
    childWritesPending() ? overlayChildChanges(remote, before, local) : remote,
  );
  writeChildOwner(userId);
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
      const message = err instanceof Error ? err.message : "Sync failed";
      setNotice(message);
      onError?.();
    }
  };
}

/** Pause account writes while login is switching sessions. */
export function pauseAccountWrites() {
  epoch += 1;
  gate = "waiting";
  activeUserId = null;
}

/** Stop pregnancy requests and drop this browser's pregnancy cache when the session ends. */
export function endPregnancySession() {
  dropQueuedPregnancyWrites();
  resetAppStorage();
}

/**
 * After login, fill pregnancy and child screens from this account.
 * Browser cache is not uploaded.
 */
export async function loadAccountData(userId: string) {
  const myEpoch = epoch;
  activeUserId = userId;
  if (gate === "stopped") return;
  gate = "waiting";

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    gate = "stopped";
    setChildRemotePhase("ready");
    return;
  }

  setChildRemotePhase("loading");
  queue = [];
  resetChildStorage();
  resetAppStorage();

  try {
    await Promise.all([loadChildAccount(userId), loadPregnancyAccount(userId)]);
  } catch (err) {
    if (myEpoch !== epoch) return;
    const message = err instanceof Error ? err.message : "Sync failed";
    const missingTable = /schema cache|does not exist/i.test(message);
    if (!missingTable) setNotice(message);
  }

  if (myEpoch !== epoch) return;
  gate = "live";
  activeUserId = userId;
  setChildRemotePhase("ready");
  const pending = queue;
  queue = [];
  for (const item of pending) {
    runTracked(item, userId, myEpoch);
  }
}

/** Fetch pregnancy rows again when this tab becomes visible and nothing is being saved. */
export async function refreshPregnancyFromRemote(userId: string) {
  if (gate !== "live" || activeUserId !== userId) return;
  if (pregnancyWritesPending() || pregnancyBusy > 0) return;
  const myEpoch = epoch;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const remote = await fetchRemoteAppSlice(supabase, userId);
  if (myEpoch !== epoch || gate !== "live" || activeUserId !== userId) return;
  if (pregnancyWritesPending() || pregnancyBusy > 0) return;
  applyRemote(remote);
}

function runTracked(item: QueuedWrite, userId: string, myEpoch: number) {
  const pregnancy = isPregnancyDomain(item.domain);
  if (pregnancy) pregnancyBusy += 1;
  else childBusy += 1;
  runSerial(async () => {
    try {
      await execute(item.write, userId, myEpoch, item.domain, item.onError)();
    } finally {
      if (pregnancy) pregnancyBusy -= 1;
      else childBusy -= 1;
    }
  });
}

/** Fetch this account's child rows again when the tab becomes visible and nothing is being saved. */
export async function refreshChildFromRemote(userId: string) {
  if (gate !== "live" || activeUserId !== userId) return;
  if (!isSupabaseSyncEnabled("child")) return;
  if (childWritesPending() || childBusy > 0) return;
  const myEpoch = epoch;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const remote = await fetchRemoteChild(supabase, userId);
  if (myEpoch !== epoch || gate !== "live" || activeUserId !== userId) return;
  if (childWritesPending() || childBusy > 0) return;
  replaceChildStorage(remote);
  writeChildOwner(userId);
}

/** Stop child requests and drop this browser's child cache when the session ends. */
export function endChildSession() {
  epoch += 1;
  gate = "stopped";
  activeUserId = null;
  setChildRemotePhase("idle");
  dropQueuedChildWrites();
  clearChildOwner();
  resetChildStorage();
}

/** Drop unsynced child writes from the previous account before loading another. */
export function prepareChildAccountSwitch() {
  dropQueuedChildWrites();
}

export function scheduleRemoteWrite(
  domain: SupabaseSyncDomain,
  write: WriteFn,
  onError?: () => void,
) {
  if (!isSupabaseSyncEnabled(domain)) return;
  if (gate === "stopped") return;
  if (gate !== "live" || !activeUserId) {
    queue.push({ domain, write, onError });
    return;
  }
  const userId = activeUserId;
  const myEpoch = epoch;
  runTracked({ domain, write, onError }, userId, myEpoch);
}
