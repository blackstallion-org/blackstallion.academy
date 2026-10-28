"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { BreathCue } from "@/lib/audio/breath";
import { unlockSoundFromGesture } from "@/lib/audio/engine";
import { media, type MediaKey } from "@/lib/content/media";
import { haptic } from "@/lib/sensory";
import { cn } from "@/lib/utils";

type Props = {
  left: MediaKey;
  right: MediaKey;
  leftLabel: string;
  rightLabel: string;
  /** Text alternatives for each side. Default to the still's own alt text from the media manifest. */
  leftAlt?: string;
  rightAlt?: string;
  className?: string;
  /** Reports the divider position (0–100) so captions can react. */
  onChange?: (pct: number) => void;
};

/** Pointer travel (px) before a touch counts as a horizontal drag (a vertical start belongs to page scroll). */
const INTENT_PX = 8;
const STEP = 5;
const NOTCH = 10;
/** Pointer speed (percent of the width per second) at which the breath is at its fullest. */
const FULL_SPEED = 160;

/**
 * Crisis & Cure drag-to-compare. Left of the handle shows the crisis, right of it the cure; drag, click, touch-drag or use the keys.
 *
 * Sensory feedback is a bonus, never a requirement: while the visitor drags, a very quiet synthesized stallion breath follows the
 * handle (WebAudio, only when the site's Sound toggle is on, faded in and out, see lib/audio/breath.ts) and a few-millisecond
 * haptic tick marks each notch (navigator.vibrate where it exists, see lib/sensory.ts). Both are silent under reduced motion.
 *
 * The track is `touch-action: pan-y`: a vertical swipe scrolls the page, a horizontal one moves the handle, and the mouse wheel is
 * never captured.
 */
export function CompareSlider({ left, right, leftLabel, rightLabel, leftAlt, rightAlt, className, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = useMotionValue(50);
  const [value, setValue] = useState(50);
  const [dragging, setDragging] = useState(false);
  const descId = useId();

  const clip = useTransform(pct, (v) => `inset(0 0 0 ${v}%)`);
  const handleLeft = useTransform(pct, (v) => `${v}%`);
  const leftOpacity = useTransform(pct, (v) => Math.max(0, Math.min(1, (v - 12) / 14)));
  const rightOpacity = useTransform(pct, (v) => Math.max(0, Math.min(1, (88 - v) / 14)));

  const cue = useRef<BreathCue | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; active: boolean } | null>(null);
  const track = useRef({ at: 0, pct: 50, speed: 0 });
  const lastTick = useRef({ step: 5, at: 0 });
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRelease = useRef<ReturnType<typeof setTimeout> | null>(null);

  const breath = () => (cue.current ??= new BreathCue());

  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current);
      if (keyRelease.current) clearTimeout(keyRelease.current);
      cue.current?.dispose();
      cue.current = null;
    },
    [],
  );

  const set = (v: number) => {
    const c = Math.max(0, Math.min(100, v));
    const step = Math.round(c / NOTCH);
    const now = performance.now();
    if (step !== lastTick.current.step && now - lastTick.current.at > 70) {
      haptic(step === 5 ? 12 : 6);
      lastTick.current.at = now;
    }
    lastTick.current.step = step;
    pct.set(c);
    setValue(Math.round(c));
    onChange?.(c);
  };

  /** Breath level for a pointer move: a steady floor while held, rising with how fast the hand travels. */
  const follow = (c: number) => {
    const now = performance.now();
    const m = track.current;
    const dt = Math.max(1, now - m.at);
    m.speed = m.speed * 0.8 + ((Math.abs(c - m.pct) / dt) * 1000) * 0.2;
    m.at = now;
    m.pct = c;
    cue.current?.drive(0.3 + 0.7 * Math.min(1, m.speed / FULL_SPEED));
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      track.current.speed = 0;
      cue.current?.drive(0.3);
    }, 160);
  };

  const fromPointer = (e: PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const c = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    set(c);
    follow(c);
  };

  const begin = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    d.active = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone: ignore */
    }
    setDragging(true);
    track.current = { at: performance.now(), pct: pct.get(), speed: 0 };
    if (e.isTrusted) breath().engage(0.3);
    fromPointer(e);
  };

  const end = (e: PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (idle.current) clearTimeout(idle.current);
    cue.current?.release();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false };
    if (e.isTrusted) {
      unlockSoundFromGesture();
      if (e.pointerType === "touch") breath().prime();
    }
    // A mouse or pen press is an explicit grab; a touch waits to see whether the finger is scrolling the page.
    if (e.pointerType !== "touch") begin(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.active) {
      fromPointer(e);
      return;
    }
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > INTENT_PX && Math.abs(dx) > Math.abs(dy)) begin(e);
    else if (Math.abs(dy) > INTENT_PX) {
      drag.current = null;
      cue.current?.release();
    }
  };

  const onKey = (e: KeyboardEvent) => {
    let next: number;
    if (e.key === "ArrowLeft") next = value - STEP;
    else if (e.key === "ArrowRight") next = value + STEP;
    else if (e.key === "PageDown") next = value - NOTCH;
    else if (e.key === "PageUp") next = value + NOTCH;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    set(next);
    // a key press is a gesture too: one slow breath, then quiet
    if (e.isTrusted) {
      unlockSoundFromGesture();
      if (breath().engage(0.45)) {
        if (keyRelease.current) clearTimeout(keyRelease.current);
        keyRelease.current = setTimeout(() => cue.current?.release(), 1100);
      }
    }
  };

  const leftText = leftAlt ?? media[left]?.alt ?? leftLabel;
  const rightText = rightAlt ?? media[right]?.alt ?? rightLabel;

  return (
    <div
      data-parallax-skip
      data-dragging={dragging || undefined}
      role="group"
      aria-label={`${leftLabel} and ${rightLabel}, drag to compare`}
      ref={ref}
      className={cn("tone-dark relative cursor-ew-resize touch-pan-y select-none overflow-hidden [&_img]:pointer-events-none", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      // A touch is implicitly captured by the child it landed on; retargeting capture to this track makes that child fire a bubbling
      // lostpointercapture, which must not end the drag. Only the track losing its own capture does.
      onLostPointerCapture={(e) => {
        if (e.target === e.currentTarget) end(e);
      }}
    >
      <div aria-hidden className="absolute inset-0">
        <FilmImage name={left} grade="cold" sizes="100vw" />
      </div>
      <motion.div aria-hidden className="absolute inset-0" style={{ clipPath: clip }}>
        <FilmImage name={right} grade="film" sizes="100vw" />
      </motion.div>

      {/* A held shade at the foot keeps the two labels legible on either photograph. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--color-night) 64%, transparent), transparent)" }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-4 pb-4 md:px-6 md:pb-6">
        <motion.span style={{ opacity: leftOpacity }} className="label flex items-center gap-3 text-frost">
          <span aria-hidden className="h-px w-6 bg-frost" />
          {leftLabel}
        </motion.span>
        {/* Ivory text with a gold rule: antique gold alone measured 3.9:1 on the golden-hour field, ivory is 7.8:1. */}
        <motion.span style={{ opacity: rightOpacity }} className="label flex items-center gap-3 text-right text-bone">
          {rightLabel}
          <span aria-hidden className="h-px w-6 bg-gold" />
        </motion.span>
      </div>

      <motion.div className="absolute inset-y-0 w-0" style={{ left: handleLeft }}>
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-gold shadow-[0_0_8px_color-mix(in_srgb,var(--color-night)_55%,transparent)]"
        />
        {/* The button is the visible grip, so the site's standard focus ring wraps it; the pseudo-element is a 44 px+ touch target. */}
        <button
          type="button"
          role="slider"
          aria-label={`Compare ${leftLabel} and ${rightLabel}`}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${value}% ${leftLabel}, ${100 - value}% ${rightLabel}`}
          aria-describedby={descId}
          onKeyDown={onKey}
          onBlur={() => cue.current?.release()}
          className={cn(
            "absolute left-0 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-pan-y place-items-center rounded-full border border-gold text-gold transition-transform duration-300 motion-reduce:transition-none",
            "bg-[color-mix(in_srgb,var(--color-night)_45%,transparent)] before:absolute before:-inset-x-2 before:-inset-y-5 before:content-['']",
            dragging && "scale-110",
          )}
        >
          <svg viewBox="0 0 24 12" className="h-2.5 w-5" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
            <path d="M6 1 1 6l5 5M18 1l5 5-5 5" />
          </svg>
        </button>
      </motion.div>

      <p id={descId} className="sr-only">
        Left of the handle: {leftLabel}. {leftText}. Right of the handle: {rightLabel}. {rightText}. Move the handle with the left and right
        arrow keys, Page Up and Page Down for larger steps, Home and End for either side.
      </p>
    </div>
  );
}
