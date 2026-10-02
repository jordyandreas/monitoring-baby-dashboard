"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  APP_MODE_STORAGE_KEY,
  isAppMode,
  isChildPath,
  isPregnancyPath,
  type AppMode,
} from "@/lib/app-mode";

type AppModeContextValue = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  hydrated: boolean;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

function readStoredMode(): AppMode {
  if (typeof window === "undefined") return "pregnancy";
  const stored = window.localStorage.getItem(APP_MODE_STORAGE_KEY);
  return stored && isAppMode(stored) ? stored : "pregnancy";
}

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setModeState] = useState<AppMode>("pregnancy");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setModeState(readStoredMode());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(APP_MODE_STORAGE_KEY, mode);
  }, [mode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (isChildPath(pathname)) setModeState("child");
    else if (isPregnancyPath(pathname)) setModeState("pregnancy");
  }, [pathname, hydrated]);

  const setMode = useCallback(
    (next: AppMode) => {
      setModeState(next);
      if (next === "child" && isPregnancyPath(pathname)) router.push("/");
      if (next === "pregnancy" && isChildPath(pathname)) router.push("/");
    },
    [pathname, router],
  );

  const value = useMemo(
    () => ({ mode, setMode, hydrated }),
    [mode, setMode, hydrated],
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}
