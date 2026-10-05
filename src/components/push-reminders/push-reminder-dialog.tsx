"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Bell, BellOff } from "lucide-react";
import { ReminderSkeleton } from "@/components/layout/data-skeletons";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { commitSave } from "@/components/ui/save-toast";
import { useRemote } from "@/hooks/use-remote";
import {
  isInstalledApp,
  isIosDevice,
  subscribeForPush,
} from "@/lib/push-reminders/browser";
import {
  DEFAULT_PUSH_PREFERENCES,
  type PushReminderPreferences,
} from "@/lib/push-reminders/schedule";
import { getVapidPublicKey } from "@/lib/supabase/env";
import { getBabyPlus } from "@/services/baby-plus.service";
import {
  getPushReminders,
  savePushReminders,
  savePushSubscription,
  sendTestPush,
} from "@/services/push-reminders.service";
import { formatTimeLabel } from "@/utils/time";
import { cn } from "@/utils/cn";

const HOURS = [1, 2, 3, 4, 5, 6] as const;

type PermissionState = "unsupported" | "default" | "granted" | "denied";

function permissionState(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function ReminderRow({
  id,
  label,
  description,
  enabled,
  onEnabledChange,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={enabled}
          onCheckedChange={(value) => onEnabledChange(value === true)}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <Label htmlFor={id} className="text-sm font-medium leading-snug">
            {label}
          </Label>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {enabled && children ? <div className="pl-7">{children}</div> : null}
    </div>
  );
}

function HourSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: number;
  onChange: (hours: number) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HOURS.map((hours) => (
          <SelectItem key={hours} value={String(hours)}>
            {hours === 1
              ? t("pushReminders.hoursOptionOne")
              : t("pushReminders.hoursOption", { hours })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PushReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(85vh,40rem)] overflow-y-auto rounded-2xl p-6 sm:max-w-lg [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg">
            <Bell className="size-5 text-lilac-deep" aria-hidden />
            {t("pushReminders.title")}
          </DialogTitle>
          <DialogDescription>{t("pushReminders.subtitle")}</DialogDescription>
        </DialogHeader>
        {open ? <PushReminderPanel /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PushReminderPanel() {
  const { t } = useLocale();
  const { signedIn } = useSupabase();
  const remindersRemote = useRemote("push-reminders", getPushReminders, signedIn);
  const babyPlusRemote = useRemote("babyPlus", getBabyPlus, signedIn);
  const [permission, setPermission] = useState<PermissionState>(permissionState);
  const [requesting, setRequesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const preferences = remindersRemote.data ?? DEFAULT_PUSH_PREFERENCES;
  const iosNeedsInstall = isIosDevice() && !isInstalledApp();
  const configured = Boolean(getVapidPublicKey());

  const refreshPermission = useCallback(() => {
    setPermission(permissionState());
  }, []);

  const patch = useCallback(
    (next: PushReminderPreferences) => {
      void commitSave("push-reminders", () => savePushReminders(next));
    },
    [],
  );

  const enablePush = useCallback(async (): Promise<boolean> => {
    setNotice(null);
    if (!configured) {
      setNotice(t("pushReminders.notConfigured"));
      return false;
    }
    if (iosNeedsInstall || permissionState() === "unsupported") {
      setNotice(
        iosNeedsInstall ? t("pushReminders.iosInstall") : t("pushReminders.unsupported"),
      );
      return false;
    }
    if (permissionState() === "denied") {
      setNotice(t("pushReminders.deniedBrowser"));
      return false;
    }
    setRequesting(true);
    try {
      if (permissionState() !== "granted") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") return false;
      } else {
        setPermission("granted");
      }
      const subscription = await subscribeForPush();
      if (!subscription) {
        setNotice(t("pushReminders.enableFailed"));
        return false;
      }
      await savePushSubscription(subscription);
      return true;
    } catch {
      setNotice(t("pushReminders.enableFailed"));
      return false;
    } finally {
      setRequesting(false);
      refreshPermission();
    }
  }, [configured, iosNeedsInstall, refreshPermission, t]);

  if (!remindersRemote.ready || !babyPlusRemote.ready) {
    return <ReminderSkeleton />;
  }

  const babyPlusTime = babyPlusRemote.data?.dailyTime ?? "";
  const canSchedule = permission === "granted" && configured && !iosNeedsInstall;

  const handleTest = async () => {
    setTestMessage(null);
    const ready = canSchedule || (await enablePush());
    if (!ready) {
      setTestMessage(t("pushReminders.testFailed"));
      return;
    }
    try {
      await sendTestPush(t("pushReminders.testTitle"), t("pushReminders.testBody"));
    } catch {
      setTestMessage(t("pushReminders.testFailed"));
    }
  };

  return (
    <div className="space-y-4">
      {iosNeedsInstall ? (
        <p className="text-sm text-muted-foreground">{t("pushReminders.iosInstall")}</p>
      ) : null}
      {!configured ? (
        <p className="text-sm text-muted-foreground">{t("pushReminders.notConfigured")}</p>
      ) : null}
      {permission === "unsupported" && !iosNeedsInstall ? (
        <p className="text-sm text-muted-foreground">{t("pushReminders.unsupported")}</p>
      ) : null}
      {permission !== "granted" && permission !== "unsupported" ? (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <p className="text-sm text-muted-foreground">
            {permission === "denied"
              ? t("pushReminders.deniedHint")
              : t("pushReminders.enableHint")}
          </p>
          {permission === "denied" ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <BellOff className="size-4 shrink-0" />
              {t("pushReminders.deniedBrowser")}
            </p>
          ) : (
            <Button type="button" size="sm" onClick={() => void enablePush()} loading={requesting}>
              <Bell className="size-4" />
              {t("pushReminders.enableButton")}
            </Button>
          )}
        </div>
      ) : null}
      {canSchedule ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("pushReminders.activeHint")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleTest()}>
            {t("pushReminders.testButton")}
          </Button>
          {testMessage ? <p className="text-xs text-destructive">{testMessage}</p> : null}
        </div>
      ) : null}
      {notice ? <p className="text-xs text-destructive">{notice}</p> : null}

      <div className={cn("space-y-3", !canSchedule && "opacity-70")}>
          <ReminderRow
            id="push-feed"
            label={t("pushReminders.feedLabel")}
            description={t("pushReminders.feedHint")}
            enabled={preferences.feed.enabled && canSchedule}
            onEnabledChange={async (checked) => {
              if (checked && !(await enablePush())) return;
              patch({ ...preferences, feed: { ...preferences.feed, enabled: checked } });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="push-feed-hours" className="text-xs">
                {t("pushReminders.intervalLabel")}
              </Label>
              <HourSelect
                id="push-feed-hours"
                value={preferences.feed.intervalHours}
                disabled={!canSchedule}
                onChange={(intervalHours) =>
                  patch({
                    ...preferences,
                    feed: { ...preferences.feed, intervalHours },
                  })
                }
              />
            </div>
          </ReminderRow>
            <ReminderRow
              id="push-vitamins"
              label={t("pushReminders.vitaminsLabel")}
              description={t("pushReminders.vitaminsHint")}
              enabled={preferences.vitamins.enabled && canSchedule}
              onEnabledChange={async (checked) => {
                if (checked && !(await enablePush())) return;
                patch({
                  ...preferences,
                  vitamins: { ...preferences.vitamins, enabled: checked },
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="push-vitamins-time" className="text-xs">
                  {t("pushReminders.timeLabel")}
                </Label>
                <TimePicker
                  id="push-vitamins-time"
                  value={preferences.vitamins.time}
                  disabled={!canSchedule}
                  onChange={(time) =>
                    patch({
                      ...preferences,
                      vitamins: { ...preferences.vitamins, time },
                    })
                  }
                />
              </div>
            </ReminderRow>
            <ReminderRow
              id="push-baby-plus"
              label={t("pushReminders.babyPlusLabel")}
              description={
                babyPlusTime
                  ? t("pushReminders.babyPlusUsesTime", { time: formatTimeLabel(babyPlusTime) })
                  : t("pushReminders.babyPlusNoTime")
              }
              enabled={preferences.babyPlus.enabled && canSchedule}
              onEnabledChange={async (checked) => {
                if (checked && !(await enablePush())) return;
                patch({
                  ...preferences,
                  babyPlus: { ...preferences.babyPlus, enabled: checked },
                });
              }}
            />
            <ReminderRow
              id="push-kicks"
              label={t("pushReminders.kicksLabel")}
              description={t("pushReminders.kicksHint")}
              enabled={preferences.kicks.enabled && canSchedule}
              onEnabledChange={async (checked) => {
                if (checked && !(await enablePush())) return;
                patch({
                  ...preferences,
                  kicks: { ...preferences.kicks, enabled: checked },
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="push-kicks-time" className="text-xs">
                  {t("pushReminders.timeLabel")}
                </Label>
                <TimePicker
                  id="push-kicks-time"
                  value={preferences.kicks.time}
                  disabled={!canSchedule}
                  onChange={(time) =>
                    patch({ ...preferences, kicks: { ...preferences.kicks, time } })
                  }
                />
              </div>
            </ReminderRow>
            <ReminderRow
              id="push-hydration"
              label={t("pushReminders.hydrationLabel")}
              description={t("pushReminders.hydrationHint")}
              enabled={preferences.hydration.enabled && canSchedule}
              onEnabledChange={async (checked) => {
                if (checked && !(await enablePush())) return;
                patch({
                  ...preferences,
                  hydration: { ...preferences.hydration, enabled: checked },
                });
              }}
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="push-hydration-hours" className="text-xs">
                    {t("pushReminders.intervalLabel")}
                  </Label>
                  <HourSelect
                    id="push-hydration-hours"
                    value={preferences.hydration.intervalHours}
                    disabled={!canSchedule}
                    onChange={(intervalHours) =>
                      patch({
                        ...preferences,
                        hydration: { ...preferences.hydration, intervalHours },
                      })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="push-hydration-start" className="text-xs">
                      {t("pushReminders.hydrationFrom")}
                    </Label>
                    <TimePicker
                      id="push-hydration-start"
                      value={preferences.hydration.startTime}
                      disabled={!canSchedule}
                      onChange={(startTime) =>
                        patch({
                          ...preferences,
                          hydration: { ...preferences.hydration, startTime },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="push-hydration-end" className="text-xs">
                      {t("pushReminders.hydrationUntil")}
                    </Label>
                    <TimePicker
                      id="push-hydration-end"
                      value={preferences.hydration.endTime}
                      disabled={!canSchedule}
                      onChange={(endTime) =>
                        patch({
                          ...preferences,
                          hydration: { ...preferences.hydration, endTime },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </ReminderRow>
      </div>
    </div>
  );
}
