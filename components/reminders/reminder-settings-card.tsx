"use client";

import { useCallback, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { useLocale } from "@/components/providers/locale-provider";
import { useAppStorage } from "@/hooks/use-app-storage";
import {
  ensureServiceWorker,
  getNotificationPermissionState,
  requestNotificationPermission,
  showTestNotification,
} from "@/lib/reminders/notify";
import { clearReminderFiredKeys } from "@/lib/reminders/fired-storage";
import { requestReminderCheck } from "@/lib/reminders/scheduler-events";
import type { RemindersState } from "@/lib/reminders/types";
import { getNamedVitamins, getTodayDateStr } from "@/lib/vitamins";
import { formatTimeLabel } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

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
  children?: React.ReactNode;
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
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {enabled && children ? (
        <div className="pl-7">{children}</div>
      ) : null}
    </div>
  );
}

export function ReminderSettingsPanel({ className }: { className?: string }) {
  const { data, mounted, updateReminders } = useAppStorage();
  const { t } = useLocale();
  const [permission, setPermission] = useState(() =>
    getNotificationPermissionState(),
  );
  const [requesting, setRequesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const refreshPermission = useCallback(() => {
    setPermission(getNotificationPermissionState());
  }, []);

  const patchReminders = useCallback(
    (patch: Partial<RemindersState>) => {
      updateReminders((prev) => ({
        ...prev,
        ...patch,
        vitamins: { ...prev.vitamins, ...patch.vitamins },
        babyPlus: { ...prev.babyPlus, ...patch.babyPlus },
        kicks: { ...prev.kicks, ...patch.kicks },
        hydration: { ...prev.hydration, ...patch.hydration },
      }));
      requestReminderCheck();
    },
    [updateReminders],
  );

  const handleEnableNotifications = async (): Promise<boolean> => {
    setRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === "granted") {
        await ensureServiceWorker();
        requestReminderCheck();
        return true;
      }
      return false;
    } finally {
      setRequesting(false);
    }
  };

  const ensureCanSchedule = async (): Promise<boolean> => {
    if (getNotificationPermissionState() === "granted") return true;
    if (getNotificationPermissionState() === "denied") return false;
    return handleEnableNotifications();
  };

  if (!mounted) return null;

  const reminders = data.reminders;
  const babyPlusTime = data.babyPlus.dailyTime;
  const canSchedule = permission === "granted";
  const hasNamedVitamins =
    getNamedVitamins(data.vitamins.items).length > 0;

  const handleTestNotification = async () => {
    setTestMessage(null);
    const ok = await showTestNotification(
      t("reminders.testTitle"),
      t("reminders.testBody"),
    );
    if (!ok) {
      setTestMessage(t("reminders.testFailed"));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
        {permission === "unsupported" ? (
          <p className="text-sm text-muted-foreground">
            {t("reminders.unsupported")}
          </p>
        ) : permission !== "granted" ? (
          <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
            <p className="text-sm text-muted-foreground">
              {permission === "denied"
                ? t("reminders.deniedHint")
                : t("reminders.enableHint")}
            </p>
            {permission !== "denied" ? (
              <Button
                type="button"
                size="sm"
                onClick={handleEnableNotifications}
                disabled={requesting}
              >
                <Bell className="size-4" />
                {requesting
                  ? t("reminders.enabling")
                  : t("reminders.enableButton")}
              </Button>
            ) : (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <BellOff className="size-4 shrink-0" />
                {t("reminders.deniedBrowser")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {t("reminders.activeHint")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
            >
              {t("reminders.testButton")}
            </Button>
            {testMessage ? (
              <p className="text-xs text-destructive">{testMessage}</p>
            ) : null}
          </div>
        )}

        {reminders.vitamins.enabled && canSchedule && !hasNamedVitamins ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
            {t("reminders.noVitaminsSetup")}
          </p>
        ) : null}

        <div className="space-y-3">
          <ReminderRow
            id="reminder-vitamins"
            label={t("reminders.vitaminsLabel")}
            description={t("reminders.vitaminsHint")}
            enabled={reminders.vitamins.enabled && canSchedule}
            onEnabledChange={async (checked) => {
              if (checked && !(await ensureCanSchedule())) return;
              refreshPermission();
              patchReminders({
                vitamins: { ...reminders.vitamins, enabled: checked },
              });
            }}
          >
            <TimePicker
              id="reminder-vitamins-time"
              value={reminders.vitamins.time}
              onChange={(time) => {
                clearReminderFiredKeys([`vitamins:${getTodayDateStr()}`]);
                patchReminders({
                  vitamins: { ...reminders.vitamins, time },
                });
              }}
              disabled={!canSchedule}
            />
          </ReminderRow>

          <ReminderRow
            id="reminder-baby-plus"
            label={t("reminders.babyPlusLabel")}
            description={
              babyPlusTime
                ? t("reminders.babyPlusUsesTime", {
                    time: formatTimeLabel(babyPlusTime),
                  })
                : t("reminders.babyPlusNoTime")
            }
            enabled={reminders.babyPlus.enabled && canSchedule}
            onEnabledChange={async (checked) => {
              if (checked && !(await ensureCanSchedule())) return;
              refreshPermission();
              patchReminders({
                babyPlus: { ...reminders.babyPlus, enabled: checked },
              });
            }}
          />

          <ReminderRow
            id="reminder-kicks"
            label={t("reminders.kicksLabel")}
            description={t("reminders.kicksHint")}
            enabled={reminders.kicks.enabled && canSchedule}
            onEnabledChange={async (checked) => {
              if (checked && !(await ensureCanSchedule())) return;
              refreshPermission();
              patchReminders({
                kicks: { ...reminders.kicks, enabled: checked },
              });
            }}
          >
            <TimePicker
              id="reminder-kicks-time"
              value={reminders.kicks.time}
              onChange={(time) => {
                clearReminderFiredKeys([`kicks:${getTodayDateStr()}`]);
                patchReminders({ kicks: { ...reminders.kicks, time } });
              }}
              disabled={!canSchedule}
            />
          </ReminderRow>

          <ReminderRow
            id="reminder-hydration"
            label={t("reminders.hydrationLabel")}
            description={t("reminders.hydrationHint", {
              hours: reminders.hydration.intervalHours,
            })}
            enabled={reminders.hydration.enabled && canSchedule}
            onEnabledChange={async (checked) => {
              if (checked && !(await ensureCanSchedule())) return;
              refreshPermission();
              patchReminders({
                hydration: { ...reminders.hydration, enabled: checked },
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="hydration-start" className="text-xs">
                  {t("reminders.hydrationFrom")}
                </Label>
                <TimePicker
                  id="hydration-start"
                  value={reminders.hydration.startTime}
                  onChange={(startTime) =>
                    patchReminders({
                      hydration: { ...reminders.hydration, startTime },
                    })
                  }
                  disabled={!canSchedule}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hydration-end" className="text-xs">
                  {t("reminders.hydrationUntil")}
                </Label>
                <TimePicker
                  id="hydration-end"
                  value={reminders.hydration.endTime}
                  onChange={(endTime) =>
                    patchReminders({
                      hydration: { ...reminders.hydration, endTime },
                    })
                  }
                  disabled={!canSchedule}
                />
              </div>
            </div>
          </ReminderRow>
        </div>
    </div>
  );
}
