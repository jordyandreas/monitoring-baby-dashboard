"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  getAppStorageServerSnapshot,
  getAppStorageSnapshot,
  isAppStorageHydrated,
  subscribeAppStorage,
  updateAppStorage,
} from "@/lib/storage";
import type {
  AppStorage,
  BabyPlusState,
  BabyProfile,
  KickEntry,
  VitaminItem,
  VitaminState,
} from "@/lib/types";
import { rolloverVitaminState, syncVitaminItems } from "@/lib/vitamins";

interface AppStorageContextValue {
  data: AppStorage;
  mounted: boolean;
  isLoading: boolean;
  setBaby: (baby: BabyProfile | null) => void;
  setBabyPlus: (babyPlus: BabyPlusState) => void;
  updateBabyPlus: (updater: (prev: BabyPlusState) => BabyPlusState) => void;
  addKick: (kick: Omit<KickEntry, "id">) => void;
  removeKick: (id: string) => void;
  resetBabyPlus: () => void;
  setVitaminItems: (items: VitaminItem[]) => void;
  toggleVitamin: (
    day: "today" | "yesterday",
    vitaminId: string,
    checked: boolean,
  ) => void;
}

const AppStorageContext = createContext<AppStorageContextValue | null>(null);

export function AppStorageProvider({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(
    subscribeAppStorage,
    getAppStorageSnapshot,
    getAppStorageServerSnapshot,
  );
  const mounted = useSyncExternalStore(
    subscribeAppStorage,
    isAppStorageHydrated,
    () => false,
  );

  const persist = useCallback((updater: (prev: AppStorage) => AppStorage) => {
    updateAppStorage(updater);
  }, []);

  const updateVitamins = useCallback(
    (updater: (prev: VitaminState) => VitaminState) => {
      persist((prev) => ({
        ...prev,
        vitamins: rolloverVitaminState(
          updater(rolloverVitaminState(prev.vitamins)),
        ),
      }));
    },
    [persist],
  );

  const setBaby = useCallback(
    (baby: BabyProfile | null) => {
      persist((prev) => ({ ...prev, baby }));
    },
    [persist],
  );

  const setBabyPlus = useCallback(
    (babyPlus: BabyPlusState) => {
      persist((prev) => ({ ...prev, babyPlus }));
    },
    [persist],
  );

  const updateBabyPlus = useCallback(
    (updater: (prev: BabyPlusState) => BabyPlusState) => {
      persist((prev) => ({
        ...prev,
        babyPlus: updater(prev.babyPlus),
      }));
    },
    [persist],
  );

  const addKick = useCallback(
    (kick: Omit<KickEntry, "id">) => {
      persist((prev) => ({
        ...prev,
        kicks: [{ ...kick, id: crypto.randomUUID() }, ...prev.kicks],
      }));
    },
    [persist],
  );

  const removeKick = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        kicks: prev.kicks.filter((k) => k.id !== id),
      }));
    },
    [persist],
  );

  const resetBabyPlus = useCallback(() => {
    updateBabyPlus(() => ({ startDate: "", dailyTime: "", completions: {} }));
  }, [updateBabyPlus]);

  const setVitaminItems = useCallback(
    (items: VitaminItem[]) => {
      updateVitamins((prev) => syncVitaminItems(prev, items));
    },
    [updateVitamins],
  );

  const toggleVitamin = useCallback(
    (day: "today" | "yesterday", vitaminId: string, checked: boolean) => {
      updateVitamins((prev) => {
        if (day === "yesterday" && !prev.yesterday) return prev;

        const key = day === "today" ? "today" : "yesterday";
        const record =
          key === "today" ? prev.today : prev.yesterday!;

        const completed = { ...record.completed };
        if (checked) {
          completed[vitaminId] = true;
        } else {
          delete completed[vitaminId];
        }

        if (key === "today") {
          return { ...prev, today: { ...prev.today, completed } };
        }

        return {
          ...prev,
          yesterday: { ...prev.yesterday!, completed },
        };
      });
    },
    [updateVitamins],
  );

  const value = useMemo(
    () => ({
      data,
      mounted,
      isLoading: !mounted,
      setBaby,
      setBabyPlus,
      updateBabyPlus,
      addKick,
      removeKick,
      resetBabyPlus,
      setVitaminItems,
      toggleVitamin,
    }),
    [
      data,
      mounted,
      setBaby,
      setBabyPlus,
      updateBabyPlus,
      addKick,
      removeKick,
      resetBabyPlus,
      setVitaminItems,
      toggleVitamin,
    ],
  );

  return (
    <AppStorageContext.Provider value={value}>
      {children}
    </AppStorageContext.Provider>
  );
}

export function useAppStorage() {
  const context = useContext(AppStorageContext);
  if (!context) {
    throw new Error("useAppStorage must be used within AppStorageProvider");
  }
  return context;
}
