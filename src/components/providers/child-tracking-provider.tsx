"use client";

import { createContext, useContext, useMemo } from "react";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useRemote } from "@/hooks/use-remote";
import { eliminationMode, foodVisible } from "@/lib/child/tracking";
import type { ChildProfile, EliminationMode } from "@/lib/child/types";
import { getChildProfile } from "@/services/child.service";
import { listPotty } from "@/services/potty.service";

type ChildTrackingValue = {
  profile: ChildProfile | null;
  ready: boolean;
  showFood: boolean;
  elimination: EliminationMode;
  hasPottyLogs: boolean;
};

const ChildTrackingContext = createContext<ChildTrackingValue | null>(null);

export function ChildTrackingProvider({ children }: { children: React.ReactNode }) {
  const { signedIn } = useSupabase();
  const { mode } = useAppMode();
  const enabled = signedIn && mode === "child";
  const profileRemote = useRemote("child", getChildProfile, enabled);
  const pottyRemote = useRemote("potty", listPotty, enabled);
  const profile = enabled ? (profileRemote.data ?? null) : null;

  const value = useMemo<ChildTrackingValue>(
    () => ({
      profile,
      ready: !enabled || profileRemote.ready,
      showFood: foodVisible(profile),
      elimination: eliminationMode(profile),
      hasPottyLogs: (pottyRemote.data?.length ?? 0) > 0,
    }),
    [enabled, profile, profileRemote.ready, pottyRemote.data],
  );

  return <ChildTrackingContext.Provider value={value}>{children}</ChildTrackingContext.Provider>;
}

export function useChildTracking(): ChildTrackingValue {
  const value = useContext(ChildTrackingContext);
  if (!value) throw new Error("useChildTracking must be used within ChildTrackingProvider");
  return value;
}
