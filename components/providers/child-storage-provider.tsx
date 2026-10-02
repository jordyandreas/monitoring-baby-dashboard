"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  getChildStorageServerSnapshot,
  getChildStorageSnapshot,
  isChildStorageHydrated,
  subscribeChildStorage,
  updateChildStorage,
} from "@/lib/child/storage";
import type {
  ChildProfile,
  ChildStorage,
  DiaperEntry,
  FeedEntry,
  GrowthEntry,
  HealthEntry,
  MealEntry,
  MilestoneKey,
  PottyEntry,
  SleepEntry,
  SolidEntry,
} from "@/lib/child/types";
import { mergeGrowthDay } from "@/lib/child/summary";
import { reportSave, showSaveToast } from "@/components/ui/save-toast";
import {
  syncChildProfile,
  syncDiaperDelete,
  syncDiaperInsert,
  syncDiaperUpdate,
  syncFeedDelete,
  syncFeedInsert,
  syncFeedUpdate,
  syncGrowthDelete,
  syncGrowthInsert,
  syncHealthDelete,
  syncHealthInsert,
  syncMealDelete,
  syncMealInsert,
  syncMilestone,
  syncPottyDelete,
  syncPottyInsert,
  syncSleepDelete,
  syncSleepInsert,
  syncSleepUpdate,
  syncSolidDelete,
  syncSolidInsert,
} from "@/lib/supabase/repositories/child-sync";

function newId(): string {
  return crypto.randomUUID();
}

function reportChildSave(
  write: Parameters<typeof reportSave>[1],
  action: "save" | "delete" = "save",
  whatsappText?: string,
) {
  reportSave("child", write, action, whatsappText);
}

type ChildStorageContextValue = {
  data: ChildStorage;
  mounted: boolean;
  saveProfile: (profile: ChildProfile) => void;
  addFeed: (entry: Omit<FeedEntry, "id">, whatsappText?: string) => void;
  updateFeed: (id: string, entry: Omit<FeedEntry, "id">) => void;
  removeFeed: (id: string) => void;
  addDiaper: (entry: Omit<DiaperEntry, "id">, whatsappText?: string) => void;
  updateDiaper: (id: string, entry: Omit<DiaperEntry, "id">) => void;
  removeDiaper: (id: string) => void;
  addSleep: (entry: Omit<SleepEntry, "id">) => void;
  updateSleep: (id: string, entry: Omit<SleepEntry, "id">) => void;
  removeSleep: (id: string) => void;
  addGrowth: (entry: Omit<GrowthEntry, "id">) => void;
  replaceGrowthDay: (sourceIds: string[], entry: Omit<GrowthEntry, "id">) => void;
  removeGrowth: (id: string | string[]) => void;
  addSolid: (entry: Omit<SolidEntry, "id">) => void;
  removeSolid: (id: string) => void;
  addHealth: (entry: Omit<HealthEntry, "id">) => void;
  removeHealth: (id: string) => void;
  addPotty: (entry: Omit<PottyEntry, "id">) => void;
  removePotty: (id: string) => void;
  addMeal: (entry: Omit<MealEntry, "id">) => void;
  removeMeal: (id: string) => void;
  setMilestone: (key: MilestoneKey, date: string | null) => void;
};

const ChildStorageContext = createContext<ChildStorageContextValue | null>(null);

export function ChildStorageProvider({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(
    subscribeChildStorage,
    getChildStorageSnapshot,
    getChildStorageServerSnapshot,
  );
  const mounted = useSyncExternalStore(
    subscribeChildStorage,
    isChildStorageHydrated,
    () => false,
  );

  const saveProfile = useCallback((profile: ChildProfile) => {
    updateChildStorage((prev) => ({ ...prev, profile }));
    reportChildSave((supabase, userId) => syncChildProfile(supabase, userId, profile));
  }, []);

  const addFeed = useCallback((entry: Omit<FeedEntry, "id">, whatsappText?: string) => {
    const next = { ...entry, id: newId() };
    updateChildStorage((prev) => ({ ...prev, feeds: [next, ...prev.feeds] }));
    reportChildSave((supabase, userId) => syncFeedInsert(supabase, userId, next), "save", whatsappText);
  }, []);

  const updateFeed = useCallback((id: string, entry: Omit<FeedEntry, "id">) => {
    const next = { ...entry, id };
    updateChildStorage((prev) => ({
      ...prev,
      feeds: prev.feeds.map((item) => (item.id === id ? next : item)),
    }));
    reportChildSave((supabase, userId) => syncFeedUpdate(supabase, userId, next));
  }, []);

  const removeFeed = useCallback((id: string) => {
    updateChildStorage((prev) => ({
      ...prev,
      feeds: prev.feeds.filter((entry) => entry.id !== id),
    }));
    reportChildSave((supabase, userId) => syncFeedDelete(supabase, userId, id), "delete");
  }, []);

  const addDiaper = useCallback((entry: Omit<DiaperEntry, "id">, whatsappText?: string) => {
    const next = { ...entry, id: newId() };
    updateChildStorage((prev) => ({ ...prev, diapers: [next, ...prev.diapers] }));
    reportChildSave(
      (supabase, userId) => syncDiaperInsert(supabase, userId, next),
      "save",
      whatsappText,
    );
  }, []);

  const updateDiaper = useCallback((id: string, entry: Omit<DiaperEntry, "id">) => {
    const next = { ...entry, id };
    updateChildStorage((prev) => ({
      ...prev,
      diapers: prev.diapers.map((item) => (item.id === id ? next : item)),
    }));
    reportChildSave((supabase, userId) => syncDiaperUpdate(supabase, userId, next));
  }, []);

  const removeDiaper = useCallback((id: string) => {
    updateChildStorage((prev) => ({
      ...prev,
      diapers: prev.diapers.filter((entry) => entry.id !== id),
    }));
    reportChildSave((supabase, userId) => syncDiaperDelete(supabase, userId, id), "delete");
  }, []);

  const addSleep = useCallback((entry: Omit<SleepEntry, "id">) => {
    const next = { ...entry, id: newId() };
    updateChildStorage((prev) => ({ ...prev, sleeps: [next, ...prev.sleeps] }));
    reportChildSave((supabase, userId) => syncSleepInsert(supabase, userId, next));
  }, []);

  const updateSleep = useCallback((id: string, entry: Omit<SleepEntry, "id">) => {
    const next = { ...entry, id };
    updateChildStorage((prev) => ({
      ...prev,
      sleeps: prev.sleeps.map((item) => (item.id === id ? next : item)),
    }));
    reportChildSave((supabase, userId) => syncSleepUpdate(supabase, userId, next));
  }, []);

  const removeSleep = useCallback((id: string) => {
    updateChildStorage((prev) => ({
      ...prev,
      sleeps: prev.sleeps.filter((entry) => entry.id !== id),
    }));
    reportChildSave((supabase, userId) => syncSleepDelete(supabase, userId, id), "delete");
  }, []);

  const addGrowth = useCallback((entry: Omit<GrowthEntry, "id">) => {
    let saved: GrowthEntry | null = null;
    let removedIds: string[] = [];
    updateChildStorage((prev) => {
      const merged = mergeGrowthDay(prev.growth, entry, newId());
      saved = merged.entry;
      removedIds = merged.removedIds;
      const rest = prev.growth.filter((item) => item.date !== entry.date);
      return { ...prev, growth: [merged.entry, ...rest] };
    });
    if (!saved) {
      showSaveToast("error");
      return;
    }
    const savedEntry = saved;
    const dropped = removedIds;
    reportChildSave(async (supabase, userId) => {
      await syncGrowthInsert(supabase, userId, savedEntry);
      for (const id of dropped) await syncGrowthDelete(supabase, userId, id);
    });
  }, []);

  const replaceGrowthDay = useCallback((sourceIds: string[], entry: Omit<GrowthEntry, "id">) => {
    let saved: GrowthEntry | null = null;
    let removedIds: string[] = [];
    updateChildStorage((prev) => {
      const rest = prev.growth.filter((item) => !sourceIds.includes(item.id));
      const merged = mergeGrowthDay(rest, entry, newId());
      saved = merged.entry;
      removedIds = [...new Set([...sourceIds, ...merged.removedIds])].filter((id) => id !== merged.entry.id);
      const withoutDay = rest.filter((item) => item.date !== entry.date);
      return { ...prev, growth: [merged.entry, ...withoutDay] };
    });
    if (!saved) {
      showSaveToast("error");
      return;
    }
    const savedEntry = saved;
    const dropped = removedIds;
    reportChildSave(async (supabase, userId) => {
      await syncGrowthInsert(supabase, userId, savedEntry);
      for (const id of dropped) await syncGrowthDelete(supabase, userId, id);
    });
  }, []);

  const removeGrowth = useCallback((id: string | string[]) => {
    const ids = new Set(Array.isArray(id) ? id : [id]);
    updateChildStorage((prev) => ({
      ...prev,
      growth: prev.growth.filter((entry) => !ids.has(entry.id)),
    }));
    reportChildSave(async (supabase, userId) => {
      for (const entryId of ids) await syncGrowthDelete(supabase, userId, entryId);
    }, "delete");
  }, []);

  const addSolid = useCallback((entry: Omit<SolidEntry, "id">) => {
    const next = { ...entry, id: newId() };
    updateChildStorage((prev) => ({ ...prev, solids: [next, ...prev.solids] }));
    reportChildSave((supabase, userId) => syncSolidInsert(supabase, userId, next));
  }, []);

  const removeSolid = useCallback((id: string) => {
    updateChildStorage((prev) => ({
      ...prev,
      solids: prev.solids.filter((entry) => entry.id !== id),
    }));
    reportChildSave((supabase, userId) => syncSolidDelete(supabase, userId, id), "delete");
  }, []);

  const addHealth = useCallback((entry: Omit<HealthEntry, "id">) => {
    const next = { ...entry, id: newId() };
    updateChildStorage((prev) => ({ ...prev, health: [next, ...prev.health] }));
    reportChildSave((supabase, userId) => syncHealthInsert(supabase, userId, next));
  }, []);

  const removeHealth = useCallback((id: string) => {
    updateChildStorage((prev) => ({
      ...prev,
      health: prev.health.filter((entry) => entry.id !== id),
    }));
    reportChildSave((supabase, userId) => syncHealthDelete(supabase, userId, id), "delete");
  }, []);

  const addPotty = useCallback((entry: Omit<PottyEntry, "id">) => {
    const next = { ...entry, id: newId() };
    updateChildStorage((prev) => ({ ...prev, potty: [next, ...prev.potty] }));
    reportChildSave((supabase, userId) => syncPottyInsert(supabase, userId, next));
  }, []);

  const removePotty = useCallback((id: string) => {
    updateChildStorage((prev) => ({
      ...prev,
      potty: prev.potty.filter((entry) => entry.id !== id),
    }));
    reportChildSave((supabase, userId) => syncPottyDelete(supabase, userId, id), "delete");
  }, []);

  const addMeal = useCallback((entry: Omit<MealEntry, "id">) => {
    const next = { ...entry, id: newId() };
    updateChildStorage((prev) => ({ ...prev, meals: [next, ...prev.meals] }));
    reportChildSave((supabase, userId) => syncMealInsert(supabase, userId, next));
  }, []);

  const removeMeal = useCallback((id: string) => {
    updateChildStorage((prev) => ({
      ...prev,
      meals: prev.meals.filter((entry) => entry.id !== id),
    }));
    reportChildSave((supabase, userId) => syncMealDelete(supabase, userId, id), "delete");
  }, []);

  const setMilestone = useCallback((key: MilestoneKey, date: string | null) => {
    updateChildStorage((prev) => {
      const rest = prev.milestones.filter((entry) => entry.key !== key);
      return {
        ...prev,
        milestones: date ? [...rest, { key, date }] : rest,
      };
    });
    reportChildSave((supabase, userId) => syncMilestone(supabase, userId, key, date));
  }, []);

  const value = useMemo(
    () => ({
      data,
      mounted,
      saveProfile,
      addFeed,
      updateFeed,
      removeFeed,
      addDiaper,
      updateDiaper,
      removeDiaper,
      addSleep,
      updateSleep,
      removeSleep,
      addGrowth,
      replaceGrowthDay,
      removeGrowth,
      addSolid,
      removeSolid,
      addHealth,
      removeHealth,
      addPotty,
      removePotty,
      addMeal,
      removeMeal,
      setMilestone,
    }),
    [
      data,
      mounted,
      saveProfile,
      addFeed,
      updateFeed,
      removeFeed,
      addDiaper,
      updateDiaper,
      removeDiaper,
      addSleep,
      updateSleep,
      removeSleep,
      addGrowth,
      replaceGrowthDay,
      removeGrowth,
      addSolid,
      removeSolid,
      addHealth,
      removeHealth,
      addPotty,
      removePotty,
      addMeal,
      removeMeal,
      setMilestone,
    ],
  );

  return (
    <ChildStorageContext.Provider value={value}>{children}</ChildStorageContext.Provider>
  );
}

export function useChildStorage() {
  const ctx = useContext(ChildStorageContext);
  if (!ctx) throw new Error("useChildStorage must be used within ChildStorageProvider");
  return ctx;
}
