"use client";

import { ChildHome } from "@/components/child/child-home";
import { PregnancyHome } from "@/components/home/pregnancy-home";
import { useAppMode } from "@/components/providers/app-mode-provider";

export function HomeSwitch() {
  const { mode, hydrated } = useAppMode();
  if (!hydrated) return null;
  if (mode === "child") return <ChildHome />;
  return <PregnancyHome />;
}
