"use client";

import { useEffect, useId, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Baby, LogOut, UserRound } from "lucide-react";
import { headerIconButtonClassName } from "@/components/layout/header-icon-button";
import { useAppMode } from "@/components/providers/app-mode-provider";
import { useAppStorage } from "@/components/providers/app-storage-provider";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isEmailAccount } from "@/lib/supabase/email-auth";
import { cn } from "@/lib/utils";

type AuthMode = "sign-up" | "sign-in";

function textValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@")) return null;
  return trimmed;
}

function nameFromRecord(record: Record<string, unknown> | null | undefined): string | null {
  if (!record) return null;
  for (const key of ["display_name", "full_name", "fullName", "name"]) {
    const value = textValue(record[key]);
    if (value) return value;
  }
  const parts = [
    textValue(record.first_name) ?? textValue(record.given_name),
    textValue(record.middle_name),
    textValue(record.last_name) ?? textValue(record.family_name),
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" ") : null;
}

function accountName(user: User): string | null {
  const fromMeta = nameFromRecord(user.user_metadata as Record<string, unknown>);
  if (fromMeta) return fromMeta;
  for (const identity of user.identities ?? []) {
    const fromIdentity = nameFromRecord(identity.identity_data as Record<string, unknown>);
    if (fromIdentity) return fromIdentity;
  }
  return null;
}

function initialsFrom(label: string): string {
  const parts = label.split(/[\s._+\-@]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || "?").toUpperCase();
}

export function AccountDialog() {
  const { t } = useLocale();
  const { mode: appMode } = useAppMode();
  const { data: appData } = useAppStorage();
  const { data: childData } = useChildStorage();
  const { enabled, user, signedIn, requestLogin, signOut: signOutAccount } = useSupabase();
  const [freshUser, setFreshUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled || !isEmailAccount(user)) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) setFreshUser(data.user);
    });
    return () => {
      active = false;
    };
  }, [enabled, user]);

  if (!enabled) return null;

  const authUser = freshUser ?? user;

  const signOut = async () => {
    setError(null);
    setBusy(true);
    const result = await signOutAccount();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMenuOpen(false);
  };

  if (signedIn && user?.email) {
    const childName = childData.profile?.name?.trim() || null;
    const babyName = appData.baby?.name?.trim() || null;
    const setupName = appMode === "child" ? childName || babyName : babyName || childName;
    const name = setupName || (authUser ? accountName(authUser) : null);
    const initials = initialsFrom(name ?? user.email.split("@")[0] ?? user.email);

    return (
      <Popover
        open={menuOpen}
        onOpenChange={(next) => {
          setMenuOpen(next);
          if (!next) setError(null);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={headerIconButtonClassName(
              "border-transparent bg-lilac text-xs font-bold text-lilac-foreground hover:bg-lilac/80",
            )}
            aria-label={t("account.open")}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            {initials}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-72 gap-0 overflow-hidden rounded-xl p-0 shadow-lg"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lilac text-sm font-semibold text-lilac-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              {name ? <p className="truncate font-semibold text-foreground">{name}</p> : null}
              <p className="truncate text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-border" />
          {error ? <p className="px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={signOut}
          >
            {busy ? (
              <Spinner className="text-muted-foreground" />
            ) : (
              <LogOut className="size-4 text-muted-foreground" aria-hidden />
            )}
            {t("account.signOut")}
          </button>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      type="button"
      className={headerIconButtonClassName()}
      aria-label={t("account.open")}
      onClick={() => requestLogin()}
    >
      <UserRound className="size-5" aria-hidden />
    </button>
  );
}

export function LoginDialog() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const emailId = useId();
  const passwordId = useId();
  const { enabled, signedIn, takePendingPath, signUpWithEmail, signInWithEmail } = useSupabase();
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  const resetFeedback = () => {
    setError(null);
    setNotice(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    if (password.length < 6) {
      setError(t("account.passwordShort"));
      return;
    }
    setBusy(true);
    const result =
      authMode === "sign-up"
        ? await signUpWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPassword("");
    if (result.notice === "confirm-email") {
      setNotice(t("account.confirmEmail"));
      return;
    }
    const next = takePendingPath();
    if (next && next !== pathname) router.push(next);
  };

  return (
    <Dialog open={enabled && !signedIn}>
      <DialogContent
        className="z-[80] sm:max-w-md"
        overlayClassName="z-[80] bg-black/25 backdrop-blur-lg!"
        showCloseButton={false}
        aria-describedby={undefined}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="items-center gap-3 pt-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-lilac text-lilac-deep">
            <Baby className="size-7" aria-hidden />
          </span>
          <DialogTitle className="text-xl font-bold text-foreground">
            {t("pages.home.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold",
                authMode === "sign-up" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
              onClick={() => {
                setAuthMode("sign-up");
                resetFeedback();
              }}
            >
              {t("account.signUp")}
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold",
                authMode === "sign-in" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
              onClick={() => {
                setAuthMode("sign-in");
                resetFeedback();
              }}
            >
              {t("account.signIn")}
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailId}>{t("account.email")}</Label>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={passwordId}>{t("account.password")}</Label>
            <Input
              id={passwordId}
              type="password"
              autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 rounded-xl"
            />
          </div>
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="min-h-11 w-full rounded-full" loading={busy}>
            {authMode === "sign-up" ? t("account.submitSignUp") : t("account.submitSignIn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
