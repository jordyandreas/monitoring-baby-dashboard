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
import { setAccountSession } from "@/lib/supabase/account-session";
import {
  ensureSupabaseSession,
  resetEnsureSupabaseSession,
  type AuthStatus,
} from "@/lib/supabase/auth";
import {
  getSupabaseBrowserClient,
  resetSupabaseBrowserClient,
} from "@/lib/supabase/client";
import {
  isEmailAccount,
  signInWithEmail as signInWithEmailRequest,
  signOut as signOutRequest,
  signUpWithEmail as signUpWithEmailRequest,
} from "@/lib/supabase/email-auth";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { notifyDataRefresh } from "@/lib/refresh";

export type AccountActionResult = {
  error: string | null;
  notice: "confirm-email" | "signed-out" | null;
};

interface SupabaseContextValue {
  enabled: boolean;
  authStatus: AuthStatus;
  session: Session | null;
  user: User | null;
  signedIn: boolean;
  loginOpen: boolean;
  authError: string | null;
  retryAuth: () => void;
  requestLogin: (nextPath?: string) => void;
  dismissLogin: () => void;
  takePendingPath: () => string | null;
  signUpWithEmail: (email: string, password: string) => Promise<AccountActionResult>;
  signInWithEmail: (email: string, password: string) => Promise<AccountActionResult>;
  signOut: () => Promise<AccountActionResult>;
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
  const [authAttempt, setAuthAttempt] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const pendingPath = useRef<string | null>(null);

  const signedIn = isEmailAccount(user);

  const retryAuth = useCallback(() => {
    setAccountSession(null);
    resetEnsureSupabaseSession();
    resetSupabaseBrowserClient();
    setAuthAttempt((n) => n + 1);
  }, []);

  const adoptSession = useCallback((next: Session) => {
    setAccountSession(next);
    setSession(next);
    setUser(next.user);
    setAuthStatus("ready");
    setAuthError(null);
  }, []);

  const requestLogin = useCallback(
    (nextPath?: string) => {
      if (!enabled || signedIn || authStatus === "loading") return;
      pendingPath.current = nextPath ?? null;
      setLoginOpen(true);
    },
    [authStatus, enabled, signedIn],
  );

  const dismissLogin = useCallback(() => {
    pendingPath.current = null;
    setLoginOpen(false);
  }, []);

  const takePendingPath = useCallback(() => {
    const next = pendingPath.current;
    pendingPath.current = null;
    setLoginOpen(false);
    return next;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<AccountActionResult> => {
      const result = await signUpWithEmailRequest(email, password);
      if (!result.ok) {
        if (result.message.toLowerCase().includes("confirm")) {
          return { error: null, notice: "confirm-email" };
        }
        return { error: result.message, notice: null };
      }
      adoptSession(result.session);
      return { error: null, notice: result.pendingConfirmation ? "confirm-email" : null };
    },
    [adoptSession],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AccountActionResult> => {
      const result = await signInWithEmailRequest(email, password);
      if (!result.ok) return { error: result.message, notice: null };
      adoptSession(result.session);
      return { error: null, notice: null };
    },
    [adoptSession],
  );

  const signOut = useCallback(async (): Promise<AccountActionResult> => {
    const result = await signOutRequest();
    if (!result.ok) return { error: result.message, notice: null };
    setAccountSession(null);
    setSession(null);
    setUser(null);
    setAuthStatus("ready");
    setAuthError(null);
    notifyDataRefresh("*");
    return { error: null, notice: null };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setAuthStatus("disabled");
      return;
    }

    let active = true;
    let authSubscription: { unsubscribe: () => void } | undefined;

    async function run() {
      setAuthStatus("loading");
      setAuthError(null);

      const { session: nextSession, error } = await ensureSupabaseSession();
      if (!active) return;

      if (error) {
        setAccountSession(null);
        setAuthStatus("error");
        setAuthError(error);
        setSession(null);
        setUser(null);
        return;
      }

      setAccountSession(nextSession);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthStatus("ready");

      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        if (!active) return;
        if (next && !isEmailAccount(next.user)) return;
        setAccountSession(next);
        setSession(next);
        setUser(next?.user ?? null);
        setAuthStatus("ready");
      });
      authSubscription = data.subscription;
    }

    void run();

    return () => {
      active = false;
      authSubscription?.unsubscribe();
    };
  }, [enabled, authAttempt]);

  const value = useMemo(
    () => ({
      enabled,
      authStatus,
      session,
      user,
      signedIn,
      loginOpen,
      authError,
      retryAuth,
      requestLogin,
      dismissLogin,
      takePendingPath,
      signUpWithEmail,
      signInWithEmail,
      signOut,
    }),
    [
      enabled,
      authStatus,
      session,
      user,
      signedIn,
      loginOpen,
      authError,
      retryAuth,
      requestLogin,
      dismissLogin,
      takePendingPath,
      signUpWithEmail,
      signInWithEmail,
      signOut,
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
