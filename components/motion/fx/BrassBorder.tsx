"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType, type FC, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * A primary call to action whose hairline border carries one travelling point of light
 * (adapted from React Bits "StarBorder"). The light is the role token `--color-gold`, so it is
 * chestnut on ivory pages and antique gold inside `.tone-dark`. Hover or keyboard focus sends it
 * once around the border; a press sends light both ways from the press point.
 * Reduced motion: the light rests at the top-left corner and never travels.
 * Square corners, no fill glow: this is a brass inlay, not a neon button.
 */
type BrassBorderProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  /** Seconds per lap. */
  duration?: number;
  /** Share of the border covered by the trail. */
  trailLength?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const BLEED = 24;
const LAP = 0.9;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const wrap = (v: number, t: number) => ((v % t) + t) % t;
const easeLap = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (2 - 2 * t) ** 3 / 2);

/** Point at distance d along a w×h rectangle perimeter, clockwise from the top-left corner. */
function pointAt(w: number, h: number, d: number): [number, number] {
  const total = 2 * (w + h);
  let s = wrap(d, total);
  if (s <= w) return [s, 0];
  s -= w;
  if (s <= h) return [w, s];
  s -= h;
  if (s <= w) return [w - s, h];
  s -= w;
  return [0, h - s];
}

function project(w: number, h: number, x: number, y: number) {
  const opts: [number, number][] = [
    [Math.abs(y), clamp(x, 0, w)],
    [Math.abs(x - w), w + clamp(y, 0, h)],
    [Math.abs(y - h), w + h + (w - clamp(x, 0, w))],
    [Math.abs(x), 2 * w + h + (h - clamp(y, 0, h))],
  ];
  return opts.sort((a, b) => a[0] - b[0])[0][1];
}

function toRgb(color: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [201, 166, 107];
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  const v = String(ctx.fillStyle);
  if (v.startsWith("#")) {
    const n = parseInt(v.slice(1, 7), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const p = v.match(/[\d.]+/g)?.map(Number) ?? [201, 166, 107];
  return [p[0], p[1], p[2]];
}

export function BrassBorder<T extends ElementType = "button">({ as, children, className, duration = 5, trailLength = 0.22, ...rest }: BrassBorderProps<T>) {
  const Component = (as ?? "button") as unknown as FC<Record<string, unknown> & { ref?: Ref<HTMLElement> }>;
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rgb = toRgb(getComputedStyle(root).getPropertyValue("--color-gold").trim() || "#c9a66b");
    const st = { w: 0, h: 0, dpr: 1, phase: 0, lap: -1, flash: 0, visible: true, hover: false };
    const pulses: { origin: number; age: number }[] = [];
    let raf = 0;
    let last = performance.now();

    const measure = () => {
      st.w = root.offsetWidth;
      st.h = root.offsetHeight;
      st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round((st.w + BLEED * 2) * st.dpr);
      canvas.height = Math.round((st.h + BLEED * 2) * st.dpr);
      rgb = toRgb(getComputedStyle(root).getPropertyValue("--color-gold").trim() || "#c9a66b");
      wake();
    };
    const rgba = (a: number) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamp(a, 0, 1).toFixed(3)})`;

    const trail = (w: number, h: number, head: number, length: number, sign: number, intensity: number) => {
      if (length < 0.5 || intensity <= 0) return;
      const steps = clamp(Math.ceil(length / 2), 2, 80);
      let [px, py] = pointAt(w, h, head);
      for (let i = 1; i <= steps; i++) {
        const [x, y] = pointAt(w, h, head - sign * length * (i / steps));
        const u = 1 - (i - 0.5) / steps;
        const fade = u * u * intensity;
        ctx.lineWidth = 5;
        ctx.strokeStyle = rgba(fade * 0.12);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(fade);
        ctx.stroke();
        px = x;
        py = y;
      }
    };
    const head = (x: number, y: number, intensity: number) => {
      const reach = 18;
      const g = ctx.createRadialGradient(x, y, 0, x, y, reach);
      g.addColorStop(0, rgba(0.35 * intensity));
      g.addColorStop(0.3, rgba(0.1 * intensity));
      g.addColorStop(1, rgba(0));
      ctx.fillStyle = g;
      ctx.fillRect(x - reach, y - reach, reach * 2, reach * 2);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const w = Math.max(1, st.w - 1);
      const h = Math.max(1, st.h - 1);
      const total = 2 * (w + h);
      const cruise = reduce ? 0 : total / duration;
      let extra = 0;
      if (st.lap >= 0) {
        const before = easeLap(Math.min(1, st.lap / LAP));
        st.lap += dt;
        extra = (easeLap(Math.min(1, st.lap / LAP)) - before) * total;
        if (st.lap >= LAP) st.lap = -1;
      }
      const motion = cruise + extra / dt;
      st.phase = wrap(st.phase + cruise * dt + extra, total);
      st.flash *= Math.exp(-dt / 0.22);
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].age += dt;
        if (pulses[i].age >= 0.65) pulses.splice(i, 1);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(st.dpr, 0, 0, st.dpr, (BLEED + 0.5) * st.dpr, (BLEED + 0.5) * st.dpr);
      ctx.lineCap = "butt";
      if (st.flash > 0.01) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = rgba(st.flash * 0.3);
        ctx.strokeRect(0, 0, w, h);
      }
      const length = reduce ? 0 : Math.min(motion * trailLength * duration, total * 0.6);
      trail(w, h, st.phase, length, 1, 1);
      for (const p of pulses) {
        const fade = (1 - p.age / 0.65) ** 2;
        const travel = (total / 2) * (1 - (1 - Math.min(1, p.age / 0.5)) ** 2);
        for (const way of [1, -1]) {
          const front = p.origin + way * travel;
          trail(w, h, front, Math.min(travel, total * 0.16), way, fade);
          head(...pointAt(w, h, front), fade * 0.8);
        }
      }
      head(...pointAt(w, h, st.phase), 1 + st.flash * 0.5);

      const busy = !reduce || st.lap >= 0 || st.flash > 0.01 || pulses.length > 0;
      if (st.visible && busy && !document.hidden) raf = requestAnimationFrame(frame);
    };
    function wake() {
      if (raf || !st.visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const lap = () => {
      if (!reduce && st.lap < 0) st.lap = 0;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pulses.push({ origin: project(st.w - 1, st.h - 1, e.clientX - rect.left, e.clientY - rect.top), age: 0 });
      st.flash = 1;
      wake();
    };
    const onFocus = () => {
      if (root.matches(":focus-visible")) lap();
    };
    const onVis = () => wake();

    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      st.visible = entries.some((en) => en.isIntersecting);
      if (st.visible) wake();
    });
    io.observe(root);
    root.addEventListener("pointerenter", lap);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointerenter", lap);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [duration, trailLength]);

  return (
    <Component
      ref={rootRef}
      className={cn(
        "label relative isolate inline-flex items-center justify-center gap-3 border border-line px-7 py-4 text-bone transition-colors duration-200 hover:text-gold",
        className,
      )}
      {...((as ?? "button") === "button" && !("type" in rest) ? { type: "button" } : null)}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{ top: -BLEED, left: -BLEED, width: `calc(100% + ${BLEED * 2}px)`, height: `calc(100% + ${BLEED * 2}px)` }}
      />
      {children}
    </Component>
  );
}
