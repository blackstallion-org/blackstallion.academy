"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import type { MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

type Props = {
  left: MediaKey;
  right: MediaKey;
  leftLabel: string;
  rightLabel: string;
  className?: string;
  /** Reports the divider position (0–100) so captions can react. */
  onChange?: (pct: number) => void;
};

const subscribeNone = () => () => {};
function vibrationAvailable() {
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && typeof navigator.vibrate === "function";
  } catch {
    return false;
  }
}

/**
 * S05 before/after slider. Drag, click or use the arrow keys.
 * The crisis side is graded cold, the cure side warm.
 */
export function CompareSlider({ left, right, leftLabel, rightLabel, className, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = useMotionValue(50);
  const [value, setValue] = useState(50);
  const clip = useTransform(pct, (v) => `inset(0 0 0 ${v}%)`);
  const left_ = useTransform(pct, (v) => `${v}%`);

  // Optional haptics: off by default, only offered where the Vibration API exists, never under reduced motion.
  const canVibrate = useSyncExternalStore(subscribeNone, vibrationAvailable, () => false);
  const [haptics, setHaptics] = useState(false);
  const lastStep = useRef(5);

  const set = (v: number) => {
    const c = Math.max(0, Math.min(100, v));
    const step = Math.round(c / 10);
    if (haptics && step !== lastStep.current) {
      try {
        navigator.vibrate(6);
      } catch {
        /* unsupported or blocked: ignore */
      }
    }
    lastStep.current = step;
    pct.set(c);
    setValue(Math.round(c));
    onChange?.(c);
  };

  const fromPointer = (e: PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    set(((e.clientX - r.left) / r.width) * 100);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") set(value - 5);
    else if (e.key === "ArrowRight") set(value + 5);
    else if (e.key === "Home") set(0);
    else if (e.key === "End") set(100);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      className={cn("relative touch-pan-y select-none overflow-hidden", className)}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && fromPointer(e)}
    >
      <FilmImage name={left} grade="cold" sizes="100vw" />
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        <FilmImage name={right} sizes="100vw" />
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-0 shade-b opacity-70" />

      <span className="label pointer-events-none absolute left-4 top-4 text-frost md:left-6 md:top-6">{leftLabel}</span>
      <span className="label pointer-events-none absolute right-4 top-4 text-gold md:right-6 md:top-6">{rightLabel}</span>

      {canVibrate && (
        <button
          type="button"
          aria-pressed={haptics}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setHaptics((h) => !h)}
          className="label absolute bottom-4 left-4 z-10 border border-line bg-night/70 px-3 py-2 text-sand transition-colors hover:border-gold hover:text-gold md:bottom-6 md:left-6"
        >
          Haptics: {haptics ? "on" : "off"}
        </button>
      )}

      <motion.div className="absolute inset-y-0 w-px bg-gold/80" style={{ left: left_ }}>
        <button
          type="button"
          role="slider"
          aria-label={`Compare ${leftLabel} and ${rightLabel}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${value}% ${rightLabel}`}
          onKeyDown={onKey}
          className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold bg-night/70 text-gold backdrop-blur-sm"
        >
          <svg viewBox="0 0 24 12" className="h-3 w-7" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
            <path d="M6 1 1 6l5 5M18 1l5 5-5 5M1 6h22" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}
