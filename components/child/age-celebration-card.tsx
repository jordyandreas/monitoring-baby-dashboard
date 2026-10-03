"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { PartyPopper, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import {
  AGE_CELEBRATION_DISMISS_KEY,
  ageCelebrationDismissToken,
  getAgeCelebration,
  type AgeCelebration,
} from "@/lib/child/age-celebration";
import { getTodayDateStr } from "@/lib/vitamins";
import { cn } from "@/lib/utils";

const CONFETTI_COLORS = ["#fff7d6", "#fde68a", "#fb7185", "#f9a8d4", "#a5b4fc", "#6ee7b7", "#ffffff"];

const PIECES: { className: string; tilt: string }[] = [
  { className: "left-[8%] top-3 h-2.5 w-1.5 bg-amber-200", tilt: "12deg" },
  { className: "left-[18%] bottom-3 h-2 w-2 rounded-full bg-rose-300", tilt: "0deg" },
  { className: "right-[22%] top-4 h-3 w-1.5 bg-white", tilt: "-18deg" },
  { className: "right-[10%] bottom-4 h-2 w-3 bg-emerald-200", tilt: "24deg" },
  { className: "left-[42%] top-2 h-1.5 w-3 bg-pink-200", tilt: "-8deg" },
  { className: "right-[40%] bottom-2 h-2.5 w-1.5 bg-amber-100", tilt: "16deg" },
];

const dismissListeners = new Set<() => void>();
let memoryDismissed: string | null = null;

function subscribeDismissals(listener: () => void) {
  dismissListeners.add(listener);
  return () => dismissListeners.delete(listener);
}

function getDismissedToken() {
  if (memoryDismissed !== null) return memoryDismissed;
  try {
    return localStorage.getItem(AGE_CELEBRATION_DISMISS_KEY) ?? "";
  } catch {
    return "";
  }
}

function dismissCelebration(token: string) {
  memoryDismissed = token;
  try {
    localStorage.setItem(AGE_CELEBRATION_DISMISS_KEY, token);
  } catch {
    // This view still hides when storage is blocked.
  }
  dismissListeners.forEach((listener) => listener());
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

function celebrationMessage(celebration: AgeCelebration, name: string, t: Translate): string {
  const params = { name, count: celebration.amount };
  if (celebration.kind === "week") {
    return celebration.amount === 1 ? t("celebration.weekOne", params) : t("celebration.weeks", params);
  }
  if (celebration.kind === "month") {
    return celebration.amount === 1 ? t("celebration.monthOne", params) : t("celebration.months", params);
  }
  if (celebration.kind === "hundred") return t("celebration.hundred", params);
  return celebration.amount === 1 ? t("celebration.birthday", params) : t("celebration.years", params);
}

function burstConfetti(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const origins = [
    { x: width * 0.5, y: height * 0.45 },
    { x: width * 0.18, y: height * 0.5 },
    { x: width * 0.82, y: height * 0.5 },
  ];

  const particles = origins.flatMap((origin) =>
    Array.from({ length: 28 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 4.4;
      return {
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.4,
        w: 6 + Math.random() * 7,
        h: 3 + Math.random() * 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.28,
        life: 1,
      };
    }),
  );

  let frame = 0;
  let raf = 0;

  const tick = () => {
    frame += 1;
    ctx.clearRect(0, 0, width, height);
    let alive = false;
    for (const piece of particles) {
      piece.life -= 0.012;
      if (piece.life <= 0) continue;
      alive = true;
      piece.vy += 0.07;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rot += piece.vr;
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.globalAlpha = Math.max(0, piece.life);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    }
    if (alive && frame < 180) raf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, width, height);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function AgeCelebrationCard({ name, birthDate }: { name: string; birthDate: string }) {
  const { t } = useLocale();
  const celebration = getAgeCelebration(birthDate);
  const token = celebration ? ageCelebrationDismissToken(celebration, getTodayDateStr()) : "";
  const dismissed = useSyncExternalStore(subscribeDismissals, getDismissedToken, () => "");
  const visible = Boolean(celebration) && dismissed !== token;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!visible || !canvas || !token) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const burstKey = `baby-age-celebration-burst:${token}`;
    try {
      if (sessionStorage.getItem(burstKey)) return;
    } catch {
      // Confetti still runs if storage is blocked.
    }

    const stop = burstConfetti(canvas);
    const markPlayed = window.setTimeout(() => {
      try {
        sessionStorage.setItem(burstKey, "1");
      } catch {
        // A repeat burst is fine if storage is blocked.
      }
    }, 400);

    return () => {
      window.clearTimeout(markPlayed);
      stop();
    };
  }, [visible, token]);

  if (!celebration || !visible) return null;

  const close = () => dismissCelebration(token);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden />
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5b4cdb] via-[#8b5cf6] to-[#f59e0b] px-6 py-8 text-center text-white shadow-[0_16px_40px_-18px_rgba(91,76,219,0.9)]">
        {PIECES.map((piece) => (
          <span
            key={piece.className}
            aria-hidden
            className={cn("age-celebration-piece pointer-events-none absolute", piece.className)}
            style={{ "--celebration-tilt": piece.tilt } as CSSProperties}
          />
        ))}
        <button
          type="button"
          onClick={close}
          aria-label={t("celebration.close")}
          className="absolute top-3 right-3 z-20 flex size-11 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-5" aria-hidden />
        </button>
        <PartyPopper className="mx-auto mb-3 size-8 text-amber-200" aria-hidden />
        <p role="status" className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          {celebrationMessage(celebration, name, t)}
        </p>
      </div>
    </div>
  );
}
