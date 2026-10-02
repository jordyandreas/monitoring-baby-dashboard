"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  ensureSupabaseSession,
  resetEnsureSupabaseSession,
  type AuthStatus,
} from "@/lib/supabase/auth";
import {
  getSupabaseBrowserClient,
  resetSupabaseBrowserClient,
} from "@/lib/supabase/client";
import { childStorageHasData } from "@/lib/child/storage";
import {
  signInWithEmail as signInWithEmailRequest,
  signOutToGuest as signOutToGuestRequest,
  signUpWithEmail as signUpWithEmailRequest,
} from "@/lib/supabase/email-auth";
import { isSupabaseEnabled, isSupabaseSyncEnabled } from "@/lib/supabase/env";
import { armLiveSync, discardQueuedWrites, holdLiveSync, stopLiveSync } from "@/lib/supabase/live-sync";
import { hasSyncableLocalStorage, runLocalStorageMigration, type MigrationResult } from "@/lib/supabase/migrate-local";
import { fetchRemoteAppSlice } from "@/lib/supabase/repositories/app-data";
import { fetchRemoteChild } from "@/lib/supabase/repositories/child-sync";
import { CHILD_DIRTY_KEY, LOCAL_DIRTY_KEY } from "@/lib/supabase/sync-constants";

export type AccountActionResult = {
  error: string | null;
  notice: "confirm-email" | "signed-out" | null;
};

interface SupabaseContextValue {
  enabled: boolean;
  authStatus: AuthStatus;
  session: Session | null;
  user: User | null;
  migration: MigrationResult | null;
  authError: string | null;
  retryAuth: () => void;
  signUpWithEmail: (email: string, password: string) => Promise<AccountActionResult>;
  signInWithEmail: (email: string, password: string) => Promise<AccountActionResult>;
  signOutToGuest: () => Promise<AccountActionResult>;
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

  const retryAuth = useCallback(() => {
    resetEnsureSupabaseSession();
    resetSupabaseBrowserClient();
    setAuthAttempt((n) => n + 1);
  }, []);

  const adoptSession = useCallback(async (next: Session, mode: "keep" | "switch" | "guest") => {
    setSession(next);
    setUser(next.user);
    setAuthStatus("ready");
    setAuthError(null);
    if (mode === "keep") return;

    holdLiveSync();
    let pullRemote = false;
    if (mode === "switch") {
      const supabase = getSupabaseBrowserClient();
      let remoteHas = false;
      if (supabase) {
        try {
          const slice = await fetchRemoteAppSlice(supabase, next.user.id);
          remoteHas =
            slice.baby !== null ||
            slice.kicks.length > 0 ||
            slice.water.entries.length > 0 ||
            slice.vitamins.items.length > 0 ||
            Boolean(slice.babyPlus.startDate);
          if (!remoteHas && isSupabaseSyncEnabled("child")) {
            remoteHas = childStorageHasData(await fetchRemoteChild(supabase, next.user.id));
          }
        } catch {
          remoteHas = false;
        }
      }
      pullRemote = remoteHas;
      if (remoteHas) {
        localStorage.removeItem(LOCAL_DIRTY_KEY);
        localStorage.removeItem(CHILD_DIRTY_KEY);
        discardQueuedWrites();
      } else if (hasSyncableLocalStorage()) {
        localStorage.setItem(LOCAL_DIRTY_KEY, "1");
        localStorage.setItem(CHILD_DIRTY_KEY, "1");
      }
    }
    await armLiveSync(next.user.id, { pullRemote });
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<AccountActionResult> => {
      const result = await signUpWithEmailRequest(email, password);
      if (!result.ok) return { error: result.message, notice: null };
      await adoptSession(result.session, "keep");
      return { error: null, notice: result.pendingConfirmation ? "confirm-email" : null };
    },
    [adoptSession],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AccountActionResult> => {
      const result = await signInWithEmailRequest(email, password);
      if (!result.ok) return { error: result.message, notice: null };
      await adoptSession(result.session, "switch");
      return { error: null, notice: null };
    },
    [adoptSession],
  );

  const signOutToGuest = useCallback(async (): Promise<AccountActionResult> => {
    const result = await signOutToGuestRequest();
    if (!result.ok) return { error: result.message, notice: null };
    await adoptSession(result.session, "guest");
    return { error: null, notice: "signed-out" };
  }, [adoptSession]);

  useEffect(() => {
    if (!enabled) {
      setAuthStatus("disabled");
      return;
    }

    let active = true;
    let authSubscription: { unsubscribe: () => void } | undefined;
    holdLiveSync();

    async function run() {
      setAuthStatus("loading");
      setAuthError(null);
      setMigration(null);

      const { session: nextSession, error } = await ensureSupabaseSession();
      if (!active) return;

      if (error || !nextSession?.user) {
        stopLiveSync();
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
      if (!active) return;
      setMigration(result);

      const freshDevice = result.status === "skipped" && result.reason === "no local data";
      if (result.status === "skipped" && !freshDevice) {
        stopLiveSync();
      } else {
        await armLiveSync(nextSession.user.id, {
          pullRemote:
            freshDevice || (result.status === "success" && result.direction === "none"),
        });
      }
    }

    void run();

    return () => {
      active = false;
      holdLiveSync();
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
      signUpWithEmail,
      signInWithEmail,
      signOutToGuest,
    }),
    [
      enabled,
      authStatus,
      session,
      user,
      migration,
      authError,
      retryAuth,
      signUpWithEmail,
      signInWithEmail,
      signOutToGuest,
    ],
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
