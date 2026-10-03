"use client";

import { useState } from "react";
import { FeatureLink } from "@/components/layout/feature-link";
import { format, parseISO } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import {
  Apple,
  Baby,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Flag,
  Milk,
  Moon,
  Pencil,
  Ruler,
  Trash2,
  Weight,
  Thermometer,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { AgeCelebrationCard } from "@/components/child/age-celebration-card";
import { ChildHomeSkeleton } from "@/components/layout/data-skeletons";
import { useRemoteDataPending } from "@/hooks/use-remote-data-pending";
import { ChildProfileForm } from "@/components/child/child-profile-form";
import { EmphasizedDetail } from "@/components/child/emphasized-detail";
import { formatLogWhen, LogForm, NumberField, SubmitButton } from "@/components/child/form-bits";
import { DiaperLogForm, FeedLogForm, SleepLogForm } from "@/components/child/quick-log-forms";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import { GenderIcon } from "@/components/baby/gender-icon";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatChildAge } from "@/lib/child/age";
import {
  formatDuration,
  growthComparison,
  todayTimeline,
  todayTotals,
  type TimelineKind,
} from "@/lib/child/summary";
import { genderLabel } from "@/lib/i18n/baby";
import { getTodayDateStr } from "@/lib/vitamins";
import { formatTimeLabel } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type QuickKind = "feed" | "diaper" | "sleep";
type LogFilter = "all" | QuickKind;
type IconType = LucideIcon | typeof DiaperIcon;

const LOG_ICONS: Record<TimelineKind, IconType> = {
  feed: Milk,
  diaper: DiaperIcon,
  sleep: Moon,
  solid: Apple,
  health: Thermometer,
  potty: CircleDot,
  meal: Utensils,
};

const LOG_TONE: Record<TimelineKind, string> = {
  feed: "bg-lilac/70 text-lilac-foreground",
  diaper: "bg-amber-100 text-amber-800",
  sleep: "bg-indigo-100 text-indigo-800",
  solid: "bg-emerald-100 text-emerald-800",
  health: "bg-rose-100 text-rose-800",
  potty: "bg-sky-100 text-sky-800",
  meal: "bg-orange-100 text-orange-800",
};

export function ChildHome() {
  const { t, locale } = useLocale();
  const { signedIn, requestLogin } = useSupabase();
  const {
    data,
    mounted,
    saveProfile,
    removeFeed,
    removeDiaper,
    removeSleep,
    removeSolid,
    removeHealth,
    removePotty,
    removeMeal,
  } = useChildStorage();
  const [editing, setEditing] = useState(false);
  const [editingLog, setEditingLog] = useState<{ kind: QuickKind; id: string } | null>(null);
  const [quick, setQuick] = useState<QuickKind | null>(null);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [logPage, setLogPage] = useState(1);
  const today = getTodayDateStr();
  const pending = useRemoteDataPending();

  if (!mounted || pending) return <ChildHomeSkeleton />;
  const todayStats = todayTotals(data, today);
  const timeline = todayTimeline(data, today, t);
  const profile = data.profile;
  const dfLocale = locale === "id" ? idLocale : enUS;

  const more = [
    { href: "/solids", label: t("child.moreSolids"), icon: Apple },
    { href: "/health", label: t("child.moreHealth"), icon: Thermometer },
    { href: "/potty", label: t("child.morePotty"), icon: CircleDot },
    { href: "/meals", label: t("child.moreMeals"), icon: Utensils },
    { href: "/milestones", label: t("child.moreMilestones"), icon: Flag },
  ];

  const shortcuts: { kind: QuickKind; label: string; icon: IconType }[] = [
    { kind: "feed", label: t("child.quickFeed"), icon: Milk },
    { kind: "diaper", label: t("child.quickDiaper"), icon: DiaperIcon },
    { kind: "sleep", label: t("child.quickSleep"), icon: Moon },
  ];

  return (
    <div className="space-y-6">
      {profile ? <AgeCelebrationCard name={profile.name} birthDate={profile.birthDate} /> : null}
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        {profile && !editing ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <GenderIcon gender={profile.gender} className="size-4" />
                  {genderLabel(profile.gender, t)}
                </span>
                <span>· {formatChildAge(profile.birthDate, t)}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4 shrink-0" aria-hidden />
                  {t("child.bornOn", {
                    date: format(parseISO(profile.birthDate), "d MMM yyyy", { locale: dfLocale }),
                  })}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("child.editProfile")}
              className="shrink-0 gap-2 rounded-full md:w-auto md:px-3.5"
              onClick={() => {
                if (!signedIn) {
                  requestLogin();
                  return;
                }
                setEditing(true);
              }}
            >
              <Pencil className="size-4" aria-hidden />
              <span className="sr-only md:not-sr-only">{t("child.editProfile")}</span>
            </Button>
          </div>
        ) : signedIn ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">{t("child.profileTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("child.profileHint")}</p>
            </div>
            <ChildProfileForm
              initial={profile}
              onSave={(next) => {
                saveProfile(next);
                setEditing(false);
              }}
              onCancel={profile ? () => setEditing(false) : undefined}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">{t("child.profileTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("child.profileHint")}</p>
            </div>
            <Button type="button" className="min-h-11 rounded-full" onClick={() => requestLogin()}>
              {t("account.signIn")}
            </Button>
          </div>
        )}
      </section>

      <GrowthSnapshot name={profile?.name} />

      <TodayActivity totals={todayStats} />

      <section className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {shortcuts.map((item) => {
            const active = quick === item.kind;
            const Icon = item.icon;
            return (
              <button
                key={item.kind}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (!signedIn) {
                    requestLogin();
                    return;
                  }
                  setQuick(active ? null : item.kind);
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl px-2 py-3.5 text-sm font-semibold",
                  active
                    ? "bg-lilac-deep text-primary-foreground"
                    : "bg-lilac/40 text-lilac-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
        {quick === "feed" ? <FeedLogForm /> : null}
        {quick === "diaper" ? <DiaperLogForm /> : null}
        {quick === "sleep" ? <SleepLogForm /> : null}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("child.timelineTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, dd MMMM yyyy", { locale: dfLocale })}
            </p>
          </div>
          <LogFilters
            value={logFilter}
            timeline={timeline}
            onChange={(next) => {
              setLogFilter(next);
              setLogPage(1);
            }}
          />
        </div>
        <TodayLogList
          items={visibleTimeline(timeline, logFilter)}
          filter={logFilter}
          page={logPage}
          onPage={setLogPage}
          onEdit={(id) => {
            if (!signedIn) {
              requestLogin();
              return;
            }
            const parsed = parseTimelineId(id);
            if (parsed && isQuickKind(parsed.kind)) {
              setEditingLog({ kind: parsed.kind, id: parsed.id });
            }
          }}
          onDelete={(id) => {
            if (!signedIn) {
              requestLogin();
              return;
            }
            const parsed = parseTimelineId(id);
            if (!parsed) return;
            if (parsed.kind === "feed") removeFeed(parsed.id);
            else if (parsed.kind === "diaper") removeDiaper(parsed.id);
            else if (parsed.kind === "sleep") removeSleep(parsed.id);
            else if (parsed.kind === "solid") removeSolid(parsed.id);
            else if (parsed.kind === "health") removeHealth(parsed.id);
            else if (parsed.kind === "potty") removePotty(parsed.id);
            else removeMeal(parsed.id);
          }}
        />
        <LogEditDialog editing={editingLog} onClose={() => setEditingLog(null)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("child.moreTitle")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {more.map((item) => {
            const Icon = item.icon;
            return (
              <FeatureLink
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm font-semibold hover:bg-muted/50"
              >
                <Icon className="size-4 text-lilac-deep" aria-hidden />
                {item.label}
              </FeatureLink>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const QUICK_KINDS: QuickKind[] = ["feed", "diaper", "sleep"];

function isQuickKind(kind: TimelineKind): kind is QuickKind {
  return QUICK_KINDS.includes(kind as QuickKind);
}

function parseTimelineId(value: string): { kind: TimelineKind; id: string } | null {
  const splitAt = value.indexOf("-");
  if (splitAt <= 0) return null;
  const kind = value.slice(0, splitAt);
  const id = value.slice(splitAt + 1);
  if (!id || !(kind in LOG_ICONS)) return null;
  return { kind: kind as TimelineKind, id };
}

function TodayLogList({
  items,
  filter,
  page,
  onPage,
  onEdit,
  onDelete,
}: {
  items: ReturnType<typeof todayTimeline>;
  filter: LogFilter;
  page: number;
  onPage: (page: number) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLocale();
  const [pending, setPending] = useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
        <LogEmpty filter={filter} />
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {visible.map((item) => {
          const Icon = LOG_ICONS[item.kind];
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm"
            >
              <span className="w-[4.5rem] shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
                {formatTimeLabel(item.time)}
              </span>
              <span className="h-8 w-px shrink-0 bg-border" aria-hidden />
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  LOG_TONE[item.kind],
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <EmphasizedDetail text={item.detail} />
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {isQuickKind(item.kind) ? (
                  <button
                    type="button"
                    aria-label={t("child.edit")}
                    onClick={() => onEdit(item.id)}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={t("child.remove")}
                  onClick={() => setPending(item.id)}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={t("child.deleteTitle")}
        description={t("child.deleteBody")}
        confirmLabel={t("child.remove")}
        cancelLabel={t("common.cancel")}
        confirmVariant="destructive"
        onConfirm={() => {
          if (pending) onDelete(pending);
          setPending(null);
        }}
      />
      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label={t("child.pagePrev")}
            disabled={current <= 1}
            onClick={() => onPage(current - 1)}
            className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <p className="text-sm font-semibold tabular-nums">
            {t("child.pageStatus", { page: current, pages: pageCount })}
          </p>
          <button
            type="button"
            aria-label={t("child.pageNext")}
            disabled={current >= pageCount}
            onClick={() => onPage(current + 1)}
            className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-foreground disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function visibleTimeline(
  items: ReturnType<typeof todayTimeline>,
  filter: LogFilter,
) {
  if (filter === "all") return items;
  return items.filter((item) => item.kind === filter);
}

function LogEditDialog({
  editing,
  onClose,
}: {
  editing: { kind: QuickKind; id: string } | null;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const { data } = useChildStorage();
  const feed = editing?.kind === "feed" ? data.feeds.find((entry) => entry.id === editing.id) : null;
  const diaper = editing?.kind === "diaper" ? data.diapers.find((entry) => entry.id === editing.id) : null;
  const sleep = editing?.kind === "sleep" ? data.sleeps.find((entry) => entry.id === editing.id) : null;
  const open = Boolean(feed || diaper || sleep);
  const title = feed ? t("feed.edit") : diaper ? t("diaper.edit") : t("sleep.edit");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {feed ? <FeedLogForm key={feed.id} initial={feed} onSaved={onClose} /> : null}
        {diaper ? <DiaperLogForm key={diaper.id} initial={diaper} onSaved={onClose} /> : null}
        {sleep ? <SleepLogForm key={sleep.id} initial={sleep} onSaved={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function LogEmpty({ filter }: { filter: LogFilter }) {
  const { t } = useLocale();
  if (filter === "feed") return t("child.filterEmptyFeed");
  if (filter === "diaper") return t("child.filterEmptyDiaper");
  if (filter === "sleep") return t("child.filterEmptySleep");
  return t("child.timelineEmpty");
}

function LogFilters({
  value,
  timeline,
  onChange,
}: {
  value: LogFilter;
  timeline: ReturnType<typeof todayTimeline>;
  onChange: (value: LogFilter) => void;
}) {
  const { t } = useLocale();
  const options: { id: LogFilter; label: string }[] = [
    { id: "all", label: t("child.filterAll") },
    { id: "feed", label: t("child.filterFeed") },
    { id: "diaper", label: t("child.filterDiaper") },
    { id: "sleep", label: t("child.filterSleep") },
  ];

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("child.timelineTitle")}>
      {options.map((option) => {
        const active = value === option.id;
        const count =
          option.id === "all"
            ? timeline.length
            : timeline.filter((item) => item.kind === option.id).length;
        const Icon = option.id === "all" ? null : LOG_ICONS[option.id];
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold",
              active
                ? "bg-lilac-deep text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
            {option.label}
            <span className={cn("tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function growthChange(
  current: number,
  previous: number | undefined,
  digits: number,
  unit: string,
): { text: string; tone: "up" | "down" | "same" } | null {
  if (previous === undefined) return null;
  const rounded = Number((current - previous).toFixed(digits));
  const prefix = rounded > 0 ? "+" : "";
  return {
    text: `${prefix}${rounded} ${unit}`,
    tone: rounded > 0 ? "up" : rounded < 0 ? "down" : "same",
  };
}

function GrowthSnapshot({ name }: { name?: string }) {
  const { t, locale } = useLocale();
  const { signedIn, requestLogin } = useSupabase();
  const { data, addGrowth } = useChildStorage();
  const compared = growthComparison(data.growth);
  const weight = compared.weight;
  const height = compared.height;
  const head = compared.head;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(getTodayDateStr);
  const [weightInput, setWeightInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [headInput, setHeadInput] = useState("");

  function openForm() {
    if (!signedIn) {
      requestLogin("/growth");
      return;
    }
    setDate(getTodayDateStr());
    setWeightInput("");
    setHeightInput("");
    setHeadInput("");
    setOpen(true);
  }

  const weightKg = optionalNumber(weightInput);
  const lengthCm = optionalNumber(heightInput);
  const headCm = optionalNumber(headInput);
  const canSave = Boolean(date && (weightKg || lengthCm || headCm));

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("child.measureTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {name ? t("child.measureHint", { name }) : t("child.measureHintPlain")}
          </p>
        </div>
        {open ? (
          <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("child.measureUpdate")}
            className="shrink-0 gap-2 rounded-full md:w-auto md:px-3.5"
            onClick={openForm}
          >
            <Pencil className="size-4" aria-hidden />
            <span className="sr-only md:not-sr-only">{t("child.measureUpdate")}</span>
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MeasureStat
          icon={Weight}
          iconClass="bg-lilac text-lilac-foreground"
          label={t("child.measureWeight")}
          value={weight ? `${weight.value} kg` : "—"}
          when={
            weight
              ? t("child.measureUpdated", { date: formatLogWhen(weight.date, "", locale) })
              : t("child.measureEmpty")
          }
          change={
            weight
              ? growthChange(weight.value, weight.previous, 2, "kg")
              : null
          }
        />
        <MeasureStat
          icon={Ruler}
          iconClass="bg-baby-sky text-sky-foreground"
          label={t("child.measureHeight")}
          value={height ? `${height.value} cm` : "—"}
          when={
            height
              ? t("child.measureUpdated", { date: formatLogWhen(height.date, "", locale) })
              : t("child.measureEmpty")
          }
          change={
            height
              ? growthChange(height.value, height.previous, 1, "cm")
              : null
          }
        />
        <MeasureStat
          icon={Baby}
          iconClass="bg-amber-100 text-amber-700"
          label={t("child.measureHead")}
          value={head ? `${head.value} cm` : "—"}
          when={
            head
              ? t("child.measureUpdated", { date: formatLogWhen(head.date, "", locale) })
              : t("child.measureEmpty")
          }
          change={
            head
              ? growthChange(head.value, head.previous, 1, "cm")
              : null
          }
        />
      </div>
      {open ? (
        <LogForm
          title={t("child.measureUpdate")}
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            addGrowth({
              date,
              ...(weightKg !== undefined ? { weightKg } : {}),
              ...(lengthCm !== undefined ? { lengthCm } : {}),
              ...(headCm !== undefined ? { headCm } : {}),
            });
            setOpen(false);
          }}
        >
          <div className="min-w-0 space-y-2">
            <Label>{t("child.date")}</Label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder={t("common.selectDate")}
              clearAriaLabel={t("common.clearDate")}
              toDate={new Date()}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField
              id="home-weight"
              label={t("growth.weight")}
              value={weightInput}
              onChange={setWeightInput}
              step="0.01"
              unit="kg"
            />
            <NumberField
              id="home-length"
              label={t("growth.length")}
              value={heightInput}
              onChange={setHeightInput}
              step="0.1"
              unit="cm"
            />
            <NumberField
              id="home-head"
              label={t("growth.head")}
              value={headInput}
              onChange={setHeadInput}
              step="0.1"
              unit="cm"
            />
          </div>
          <SubmitButton label={t("child.measureSave")} disabled={!canSave} />
        </LogForm>
      ) : null}
    </section>
  );
}

function MeasureStat({
  icon: Icon,
  iconClass,
  label,
  value,
  when,
  change,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  when: string;
  change?: { text: string; tone: "up" | "down" | "same" } | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-3">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        {change ? (
          <p
            className={cn(
              "text-xs font-semibold tabular-nums",
              change.tone === "up" && "text-emerald-600",
              change.tone === "down" && "text-destructive",
              change.tone === "same" && "text-muted-foreground",
            )}
          >
            {change.text}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">{when}</p>
      </div>
    </div>
  );
}

function TodayActivity({ totals }: { totals: ReturnType<typeof todayTotals> }) {
  const { t } = useLocale();
  const cards: {
    href: string;
    kind: QuickKind;
    label: string;
    value: string;
    detail?: string;
    tint: string;
  }[] = [
    {
      href: "/feed",
      kind: "feed",
      label: t("child.tagFeed"),
      value:
        totals.feedCount === 1
          ? t("child.feedsCountOne")
          : t("child.feedsCount", { count: totals.feedCount }),
      detail: t("child.mlTotal", { ml: totals.ml }),
      tint: "bg-muted/40",
    },
    {
      href: "/diapers",
      kind: "diaper",
      label: t("child.tagDiaper"),
      value: t("child.peePoop", { pee: totals.pee, poop: totals.poop }),
      tint: "bg-amber-50",
    },
    {
      href: "/sleep",
      kind: "sleep",
      label: t("child.tagSleep"),
      value: formatDuration(totals.sleepMin, t),
      tint: "bg-sky-50",
    },
  ];

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("child.activityTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("child.activityHint")}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-semibold">
          {totals.logCount === 1
            ? t("child.activityCountOne")
            : t("child.activityCount", { count: totals.logCount })}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = LOG_ICONS[card.kind];
          return (
            <FeatureLink
              key={card.href}
              href={card.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/60",
                card.tint,
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  LOG_TONE[card.kind],
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">{card.label}</span>
                <span className="block text-base font-bold">{card.value}</span>
                {card.detail ? (
                  <span className="block text-xs text-muted-foreground">{card.detail}</span>
                ) : null}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </FeatureLink>
          );
        })}
      </div>
    </section>
  );
}
