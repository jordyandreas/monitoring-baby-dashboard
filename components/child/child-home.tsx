"use client";

import { useState } from "react";
import Link from "next/link";
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
  Weight,
  Thermometer,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { ChildProfileForm } from "@/components/child/child-profile-form";
import { EmphasizedDetail } from "@/components/child/emphasized-detail";
import { formatLogWhen, LogForm, NumberField, SubmitButton } from "@/components/child/form-bits";
import { DiaperLogForm, FeedLogForm, SleepLogForm } from "@/components/child/quick-log-forms";
import { DiaperIcon } from "@/components/icons/diaper-icon";
import { GenderIcon } from "@/components/baby/gender-icon";
import { useChildStorage } from "@/components/providers/child-storage-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { formatChildAge } from "@/lib/child/age";
import {
  formatDuration,
  latestGrowth,
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
  const { data, mounted, saveProfile } = useChildStorage();
  const [editing, setEditing] = useState(false);
  const [quick, setQuick] = useState<QuickKind | null>(null);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [logPage, setLogPage] = useState(1);
  const today = getTodayDateStr();
  const todayStats = todayTotals(data, today);
  const timeline = todayTimeline(data, today, t);
  const profile = data.profile;
  const dfLocale = locale === "id" ? idLocale : enUS;

  if (!mounted) return null;

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
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" aria-hidden />
              <span className="sr-only md:not-sr-only">{t("child.editProfile")}</span>
            </Button>
          </div>
        ) : (
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
                onClick={() => setQuick(active ? null : item.kind)}
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
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("child.moreTitle")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {more.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm font-semibold hover:bg-muted/50"
              >
                <Icon className="size-4 text-lilac-deep" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TodayLogList({
  items,
  filter,
  page,
  onPage,
}: {
  items: ReturnType<typeof todayTimeline>;
  filter: LogFilter;
  page: number;
  onPage: (page: number) => void;
}) {
  const { t } = useLocale();
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
      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
        {visible.map((item) => {
          const Icon = LOG_ICONS[item.kind];
          return (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  LOG_TONE[item.kind],
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <EmphasizedDetail text={item.detail} />
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums">{formatTimeLabel(item.time)}</p>
            </li>
          );
        })}
      </ul>
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

function GrowthSnapshot({ name }: { name?: string }) {
  const { t, locale } = useLocale();
  const { data, addGrowth } = useChildStorage();
  const weight = latestGrowth(data.growth, "weightKg");
  const height = latestGrowth(data.growth, "lengthCm");
  const head = latestGrowth(data.growth, "headCm");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(getTodayDateStr);
  const [weightInput, setWeightInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [headInput, setHeadInput] = useState("");

  function openForm() {
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
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  when: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-3">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
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
            <Link
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
            </Link>
          );
        })}
      </div>
    </section>
  );
}
