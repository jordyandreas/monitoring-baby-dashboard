"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { ensureSupabaseSession, type AuthStatus } from "@/lib/supabase/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { runLocalStorageMigration, type MigrationResult } from "@/lib/supabase/migrate-local";

interface SupabaseContextValue {
  enabled: boolean;
  authStatus: AuthStatus;
  session: Session | null;
  user: User | null;
  migration: MigrationResult | null;
  authError: string | null;
  retryAuth: () => void;
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const enabled = isSupabaseEnabled();
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() =>
    enabled ? "loading" : "disabled",
  );
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [migration, setMigration] = useState<MigrationResult | null>(null);
  const [authAttempt, setAuthAttempt] = useState(0);
  const runIdRef = useRef(0);

  const retryAuth = useCallback(() => {
    setAuthAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setAuthStatus("disabled");
      return;
    }

    const runId = ++runIdRef.current;
    let authSubscription: { unsubscribe: () => void } | undefined;

    async function run() {
      setAuthStatus("loading");
      setAuthError(null);
      setMigration(null);

      const { session: nextSession, error } = await ensureSupabaseSession();
      if (runId !== runIdRef.current) return;

      if (error || !nextSession?.user) {
        setAuthStatus("error");
        setAuthError(error ?? "No session");
        setSession(null);
        setUser(null);
        return;
      }

      setSession(nextSession);
      setUser(nextSession.user);
      setAuthStatus("ready");

      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data } = supabase.auth.onAuthStateChange((_event, next) => {
          setSession(next);
          setUser(next?.user ?? null);
        });
        authSubscription = data.subscription;
      }

      const result = await runLocalStorageMigration(nextSession.user.id);
      if (runId !== runIdRef.current) return;
      setMigration(result);
    }

    void run();

    return () => {
      runIdRef.current += 1;
      authSubscription?.unsubscribe();
    };
  }, [enabled, authAttempt]);

  const value = useMemo(
    () => ({
      enabled,
      authStatus,
      session,
      user,
      migration,
      authError,
      retryAuth,
    }),
    [enabled, authStatus, session, user, migration, authError, retryAuth],
  );

  return (
    <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return context;
}
