"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LogOut, MessageSquare, ScrollText, UserRound } from "lucide-react";
import { ChangelogDialog } from "@/components/layout/changelog-dialog";
import { headerIconButtonClassName } from "@/components/layout/header-icon-button";
import { useAppMode } from "@/components/providers/app-mode-provider";
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
import { useRemote } from "@/hooks/use-remote";
import { commitSave } from "@/components/ui/save-toast";
import { getBaby } from "@/services/baby.service";
import { getChildProfile } from "@/services/child.service";
import { insertFeedback } from "@/services/feedback.service";
import { cn } from "@/utils/cn";

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
  const { enabled, user, signedIn, requestLogin, signOut: signOutAccount } = useSupabase();
  const babyRemote = useRemote("baby", getBaby, signedIn);
  const childRemote = useRemote("child", getChildProfile, signedIn);
  const [freshUser, setFreshUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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
    const childName = childRemote.data?.name?.trim() || null;
    const babyName = babyRemote.data?.name?.trim() || null;
    const setupName = appMode === "child" ? childName || babyName : babyName || childName;
    const name = setupName || (authUser ? accountName(authUser) : null);
    const initials = initialsFrom(name ?? user.email.split("@")[0] ?? user.email);

    return (
      <>
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
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                setChangelogOpen(true);
              }}
            >
              <ScrollText className="size-4 text-muted-foreground" aria-hidden />
              {t("changelog.open")}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                setFeedbackOpen(true);
              }}
            >
              <MessageSquare className="size-4 text-muted-foreground" aria-hidden />
              {t("account.sendFeedback")}
            </button>
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
        <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
        <FeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          defaultName={(authUser ? accountName(authUser) : null) ?? name ?? ""}
          defaultEmail={user.email}
        />
      </>
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
        className="login-pane z-[80] sm:max-w-md"
        overlayClassName="login-overlay z-[80]"
        showCloseButton={false}
        aria-describedby={undefined}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="items-center gap-3 pt-2 text-center">
          <img src="/logo.png" alt="" className="size-14" />
          <DialogTitle className="text-xl font-bold text-foreground">
            {t("pages.home.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-white/75 p-1 ring-1 ring-lilac/30">
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold",
                authMode === "sign-up"
                  ? "bg-lilac-deep text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/80",
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
                authMode === "sign-in"
                  ? "bg-lilac-deep text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/80",
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
              placeholder={t("account.emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={passwordId}>{t("account.password")}</Label>
            <Input
              id={passwordId}
              type="password"
              autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
              required
              placeholder={t("account.passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
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

function FeedbackDialog({
  open,
  onOpenChange,
  defaultName,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultEmail: string;
}) {
  const { t } = useLocale();
  const nameId = useId();
  const emailId = useId();
  const whatsappId = useId();
  const messageId = useId();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setName(defaultName);
      setEmail(defaultEmail);
      setWhatsapp("");
      setMessage("");
      setError(null);
    }
    wasOpen.current = open;
  }, [open, defaultName, defaultEmail]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedWhatsapp = whatsapp.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedWhatsapp || !trimmedMessage) {
      setError(t("account.feedbackRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t("account.feedbackEmailInvalid"));
      return;
    }
    if (trimmedWhatsapp.replace(/\D/g, "").length < 8) {
      setError(t("account.feedbackWhatsappInvalid"));
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await commitSave(
      "feedback",
      () =>
        insertFeedback({
          name: trimmedName,
          email: trimmedEmail,
          whatsapp: trimmedWhatsapp,
          message: trimmedMessage,
        }),
      "save",
      undefined,
      undefined,
      t("account.feedbackSent"),
    );
    setBusy(false);
    if (!ok) {
      setError(t("account.feedbackFailed"));
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,760px)] overflow-y-auto rounded-2xl sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("account.feedbackTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>{t("account.feedbackName")}</Label>
            <Input
              id={nameId}
              autoComplete="name"
              required
              placeholder={t("account.feedbackNamePlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailId}>{t("account.feedbackEmail")}</Label>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              placeholder={t("account.feedbackEmailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={whatsappId}>{t("account.feedbackWhatsapp")}</Label>
            <Input
              id={whatsappId}
              type="tel"
              autoComplete="tel"
              required
              inputMode="tel"
              placeholder={t("account.feedbackWhatsappPlaceholder")}
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              className="min-h-11 rounded-xl border-lilac/40 bg-white/90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={messageId}>{t("account.feedbackMessage")}</Label>
            <textarea
              id={messageId}
              required
              rows={4}
              placeholder={t("account.feedbackMessagePlaceholder")}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-28 w-full rounded-xl border border-lilac/40 bg-white/90 px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="min-h-11 w-full rounded-full" loading={busy}>
            {t("account.feedbackSubmit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
