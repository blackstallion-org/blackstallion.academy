"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/content/asset";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * The ear study (15 Nov 2026, owner): real footage of a black Marwari's ears, seen from the saddle, replaces the 3D head.
 *
 * Frames 33-108 of the supplied 10 s clip (public/video/Black_horse_ears_animating_…mp4) were cut to the head, which leaves the
 * Gemini mark in the bottom-right corner outside the picture, and saved as 76 stills (public/video/ears/ear-00…75.webp). That one
 * unbroken stretch of film holds every state, measured frame by frame:
 *   0 rest (tips curved in until they almost meet) → 25 left ear swivelled fully out → 35-39 left coming back, right starting
 *   → 48 both out → 57 right out, left forward → 66 both pricked (alert) → 75 rest again.
 * Frames 0 and 75 are the same pose (under a pixel apart), so the path is a circle. A canvas plays a playhead along it, forward
 * or back by the shorter way, toward a target set by the visitor: the ears only ever take poses the horse really took, in the
 * order it took them, so each ear turns on its own and nothing moves the whole picture. Between stills the two nearest frames
 * are blended, so the motion is smooth at any speed.
 *
 * Mouse: pointer to the left of the head turns the left ear toward it, to the right the right ear (the right-hand path pricks
 * both ears first, then turns the right one), above the head both ears prick; still for a moment and the ears relax to rest;
 * leave and the horse returns to rest with small real flicks now and then. Touch: the same, gentler, without blocking scroll.
 * Buttons choose a sound source (keyboard and touch). Reduced motion: no flicks and no tracking; a choice shows its frame at once.
 */

const FRAMES = 76;
const LOOP = 75; // frame 75 is frame 0 again
const frameUrl = (i: number) => asset(`/video/ears/ear-${String(i).padStart(2, "0")}.webp`);
/** The stills' size (head crop of the 1080p clip). */
const FW = 720;
const FH = 762;

type Source = "ahead" | "left" | "rider" | "split";
const SOURCES: { id: Source; label: string; line: string; at: number }[] = [
  { id: "ahead", label: "Ahead", at: 66, line: "Both ears pricked forward: something in front has its full attention." },
  { id: "left", label: "To the left", at: 25, line: "The left ear swivels out toward the instructor's voice; the right stays on the path ahead." },
  { id: "rider", label: "The rider", at: 48, line: "Both ears turn out and back, toward the rider in the saddle." },
  { id: "split", label: "Two at once", at: 57, line: "One ear forward, one turned out: it listens to two things at the same time." },
];
const REST_LINE = "At rest, a Marwari's ears curve inward until the tips almost meet.";
const FOLLOW_LINE = "The ear nearer your pointer turns toward it; above the head, both prick up.";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Signed shortest distance from a to b on the circle. */
const towards = (a: number, b: number) => ((((b - a) % LOOP) + LOOP * 1.5) % LOOP) - LOOP / 2;
const wrap = (p: number) => ((p % LOOP) + LOOP) % LOOP;

/** Where the ears should be for a point relative to the head (nx, ny in -1..1), at a strength 0..1. */
function poseFor(nx: number, ny: number, strength: number) {
  const side = clamp((Math.abs(nx) - 0.12) / 0.75, 0, 1) ** 0.85 * strength;
  const up = clamp((-ny - 0.2) / 0.6, 0, 1) * strength;
  if (side < 0.3 && up > 0) return wrap(LOOP - 9 * up); // pricked: the first half of the right-hand path
  if (nx < 0) return 25 * side; // the left ear swivels out
  return wrap(LOOP - 18 * side); // pricked, then the right ear swivels out
}

export function EarStudy({ className }: { className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [source, setSource] = useState<Source | null>(null);
  const [following, setFollowing] = useState(false);
  const [ready, setReady] = useState(false);
  const engine = useRef<{ setTarget: (t: number, speed?: number) => void } | null>(null);
  /** The chosen source, readable from the animation loop. */
  const sourceRef = useRef<Source | null>(null);

  useEffect(() => {
    const host = stage.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!host || !cv || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let visible = false;
    let pos = 0;
    let target = 0;
    let maxSpeed = 30; // frames a second (the film runs at 24)
    let drawn = -1;
    let lastInput = 0; // when the visitor last moved the pointer or a finger (0 = not following)
    let nextFlick = performance.now() + 4000;
    let flickBack = 0;
    let last = performance.now();
    const imgs: (HTMLImageElement | null)[] = Array(FRAMES).fill(null);

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(host.clientWidth * dpr);
      const h = Math.round(host.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; drawn = -1; }
    };
    const nearestLoaded = (i: number) => {
      if (imgs[i]) return imgs[i];
      for (let d = 1; d < FRAMES; d++) {
        const a = imgs[i - d] ?? null;
        if (a) return a;
        const b = imgs[i + d] ?? null;
        if (b) return b;
      }
      return null;
    };
    const draw = () => {
      const p = wrap(pos);
      const i = Math.floor(p);
      const t = p - i;
      const a = nearestLoaded(i);
      if (!a) return;
      const b = t > 0.02 ? imgs[i + 1] : null;
      const s = Math.min(cv.width / FW, cv.height / FH);
      const w = FW * s;
      const h = FH * s;
      const x = (cv.width - w) / 2;
      const y = cv.height - h;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(a, x, y, w, h);
      if (b) { ctx.globalAlpha = t; ctx.drawImage(b, x, y, w, h); ctx.globalAlpha = 1; }
      drawn = p;
    };

    const tick = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!still) {
        // a still pointer lets the ears relax; with nobody there, an occasional small real flick keeps the horse alive
        if (lastInput && now - lastInput > 1800) { lastInput = 0; target = 0; maxSpeed = 10; setFollowing(false); }
        if (!lastInput && sourceRef.current === null) {
          if (flickBack && now > flickBack) { flickBack = 0; target = 0; maxSpeed = 16; }
          else if (!flickBack && now > nextFlick && Math.abs(towards(pos, 0)) < 0.5) {
            target = Math.random() < 0.5 ? 3 + Math.random() * 3 : wrap(LOOP - 3 - Math.random() * 4);
            maxSpeed = 18;
            flickBack = now + 700 + Math.random() * 500;
            nextFlick = now + 5000 + Math.random() * 4000;
          }
        }
        const d = towards(pos, target);
        if (Math.abs(d) > 0.002) {
          const v = clamp(Math.abs(d) * 5, 2, maxSpeed) * dt;
          pos = wrap(pos + Math.sign(d) * Math.min(Math.abs(d), v));
        } else pos = target;
      } else pos = target;
      size();
      if (Math.abs(wrap(pos) - drawn) > 0.001) draw();
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && visible && !disposed) { last = performance.now(); raf = requestAnimationFrame(tick); } };

    engine.current = {
      setTarget: (t, speed = 30) => { target = wrap(t); maxSpeed = speed; lastInput = 0; flickBack = 0; if (still) { pos = target; drawn = -1; } kick(); },
    };

    // stills: the rest pose first, then the rest of the path
    const load = (i: number) => new Promise<void>((resolve) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { imgs[i] = im; resolve(); };
      im.onerror = () => resolve();
      im.src = frameUrl(i);
    });
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      load(0).then(() => {
        if (disposed) return;
        imgs[LOOP] = imgs[LOOP] ?? imgs[0];
        setReady(true);
        drawn = -1;
        kick();
        const order = Array.from({ length: FRAMES - 1 }, (_, k) => k + 1);
        let next = 0;
        const worker = async () => { while (!disposed && next < order.length) { await load(order[next++]); drawn = -1; kick(); } };
        void Promise.all([worker(), worker(), worker(), worker()]);
      });
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { start(); kick(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { rootMargin: "300px" });
    io.observe(host);
    const ro = new ResizeObserver(() => { drawn = -1; kick(); });
    ro.observe(host);

    // the visitor's pointer anywhere over the section is a sound source; the head sits in the upper half of the stage
    const zone = host.closest("section") ?? host;
    const rel = (x: number, y: number) => {
      const r = host.getBoundingClientRect();
      return { nx: (x - (r.left + r.width / 2)) / (r.width / 2), ny: (y - (r.top + r.height * 0.4)) / (r.height / 2) };
    };
    const follow = (x: number, y: number, strength: number) => {
      if (still) return;
      // a chosen source holds until the visitor moves over the picture itself (not just anywhere in the section)
      if (sourceRef.current !== null) {
        const r = host.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
      }
      const { nx, ny } = rel(x, y);
      target = poseFor(nx, ny, strength);
      maxSpeed = 30;
      lastInput = performance.now();
      flickBack = 0;
      if (sourceRef.current !== null) { sourceRef.current = null; setSource(null); }
      setFollowing(true);
      kick();
    };
    const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse") follow(e.clientX, e.clientY, 1); };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || still || sourceRef.current !== null) return;
      lastInput = 0; target = 0; maxSpeed = 16; setFollowing(false); kick();
    };
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) follow(t.clientX, t.clientY, 0.6); };
    const onTouchEnd = () => { if (lastInput) lastInput = performance.now() - 800; };
    zone.addEventListener("pointermove", onMove as EventListener);
    zone.addEventListener("pointerleave", onLeave as EventListener);
    host.addEventListener("touchstart", onTouch, { passive: true });
    host.addEventListener("touchmove", onTouch, { passive: true });
    host.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      zone.removeEventListener("pointermove", onMove as EventListener);
      zone.removeEventListener("pointerleave", onLeave as EventListener);
      host.removeEventListener("touchstart", onTouch);
      host.removeEventListener("touchmove", onTouch);
      host.removeEventListener("touchend", onTouchEnd);
      engine.current = null;
    };
  }, []);

  const choose = (s: Source) => {
    setSource(s);
    setFollowing(false);
    sourceRef.current = s;
    engine.current?.setTarget(SOURCES.find((x) => x.id === s)!.at, 26);
  };

  const line = source ? SOURCES.find((s) => s.id === source)!.line : following ? FOLLOW_LINE : REST_LINE;
  return (
    <div className={cn("relative", className)}>
      <div
        ref={stage}
        className="relative aspect-[4/5] w-full overflow-hidden bg-black sm:aspect-[16/9]"
        // true black, as the owner asked: the theme's `black` token is charcoal, and the film's own ground is #000
        style={{ touchAction: "pan-y", backgroundColor: "#000" }}
      >
        {/* the rest pose as a plain picture: shown until the canvas has drawn, and if scripts never run */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frameUrl(0)}
          alt=""
          aria-hidden
          className={cn("absolute bottom-0 left-1/2 h-full max-w-none -translate-x-1/2 object-contain transition-opacity duration-500", ready && "opacity-0")}
          style={{ aspectRatio: `${FW} / ${FH}`, maxHeight: "100%", width: "auto" }}
        />
        <canvas
          ref={canvas}
          role="img"
          aria-label="Filmed from the saddle: a black Marwari's two inward-curving ears. Each ear turns on its own toward the chosen sound."
          className={cn("absolute inset-0 block h-full w-full transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")}
        />
      </div>
      <fieldset className="mt-5">
        <legend className="label text-dust">What is the horse listening to?</legend>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Sound source">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={source === s.id}
              data-sound="off"
              onClick={() => choose(s.id)}
              className={cn(
                "label min-h-11 border px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                source === s.id ? "border-gold bg-gold text-night" : "border-line text-sand hover:border-gold hover:text-bone",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="t-story mt-4 min-h-[3.5rem] text-sand" aria-live="polite">{line}</p>
        <p className="label mt-1 text-dust">{reduced ? "" : <><span className="hidden md:inline">Or move your pointer around the head.</span><span className="md:hidden">Or touch the picture.</span></>}</p>
      </fieldset>
    </div>
  );
}
