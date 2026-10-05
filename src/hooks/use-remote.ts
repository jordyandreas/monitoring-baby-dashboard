"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DATA_REFRESH_EVENT } from "@/lib/refresh";

export function useRemote<T>(
  feature: string | readonly string[],
  load: () => Promise<T>,
  enabled: boolean,
) {
  const [data, setData] = useState<T | null>(null);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const loaded = useRef(false);
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setReady(true);
      loaded.current = false;
      return;
    }
    let cancelled = false;
    if (!loaded.current) setReady(false);
    load()
      .then((value) => {
        if (cancelled) return;
        setData(value);
        loaded.current = true;
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, load, tick]);

  const features = (Array.isArray(feature) ? feature : [feature]).join("\0");

  useEffect(() => {
    const names = features.split("\0");
    const onRefresh = (event: Event) => {
      const name = (event as CustomEvent<string>).detail;
      if (name === "*" || names.includes(name)) reload();
    };
    window.addEventListener(DATA_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(DATA_REFRESH_EVENT, onRefresh);
  }, [features, reload]);

  return { data, setData, ready, reload };
}
