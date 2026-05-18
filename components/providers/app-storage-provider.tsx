"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import type { AppStorage, BabyPlusState, BabyProfile, KickEntry } from "@/lib/types";

interface AppStorageContextValue {
  data: AppStorage | null;
  mounted: boolean;
  isLoading: boolean;
  setBaby: (baby: BabyProfile | null) => void;
  setBabyPlus: (babyPlus: BabyPlusState) => void;
  updateBabyPlus: (updater: (prev: BabyPlusState) => BabyPlusState) => void;
  addKick: (kick: Omit<KickEntry, "id">) => void;
  removeKick: (id: string) => void;
  resetBabyPlus: () => void;
}

const AppStorageContext = createContext<AppStorageContextValue | null>(null);

export function AppStorageProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppStorage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setData(readStorage());
    setMounted(true);
  }, []);

  const persist = useCallback((updater: (prev: AppStorage) => AppStorage) => {
    setData((prev) => {
      const base = prev ?? readStorage();
      const next = updater(base);
      writeStorage(next);
      return next;
    });
  }, []);

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
    updateBabyPlus(() => ({ startDate: "", completions: {} }));
  }, [updateBabyPlus]);

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
