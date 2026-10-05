"use client";

import { useEffect } from "react";
import { registerPushWorker } from "@/lib/push-reminders/browser";

export function PushWorker() {
  useEffect(() => {
    void registerPushWorker();
  }, []);
  return null;
}
