"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * Projected-film grain with optional dust, hairs and vertical scratches (adapted from React Bits "Noise").
 * Sits over a positioned parent as a decorative layer. Under reduced motion it paints one still frame.
 * Colours are fixed greys/ink because the layer is blended (overlay / soft-light) onto whatever is beneath.
 */
type FilmNoiseProps = {
  opacity?: number;
  /** Grain tile scale. */
  size?: number;
  fps?: number;
  blendMode?: "normal" | "overlay" | "soft-light" | "multiply" | "screen";
  contrast?: number;
  /** 0–1: dust specks and the odd hair. */
  dust?: number;
  /** 0–1: chance of vertical scratches. */
  scratches?: number;
  /** 0–1: frame-to-frame brightness flicker. */
  flicker?: number;
  className?: string;
};

const TILE = 256;
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const generator = (seed: number) => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function paintTile(contrast: number) {
  const canvas = document.createElement("canvas");
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(TILE, TILE);
  const data = image.data;
  const random = generator(1013904223);
  const range = 0.5 + contrast * 1.1;
  for (let i = 0; i < data.length; i += 4) {
    const v = clamp(0.5 + (random() + random() - 1) * range, 0, 1) * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function drawSpeck(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, tone: string, alpha: number) {
  const lobes = 1 + Math.floor(Math.random() * 3);
  for (let k = 0; k < lobes; k++) {
    const ox = x + (Math.random() - 0.5) * radius * 1.4;
    const oy = y + (Math.random() - 0.5) * radius * 1.4;
    const size = radius * (0.55 + Math.random() * 0.5);
    const fill = ctx.createRadialGradient(ox, oy, 0, ox, oy, size);
    fill.addColorStop(0, `rgba(${tone}, ${alpha})`);
    fill.addColorStop(0.55, `rgba(${tone}, ${alpha * 0.85})`);
    fill.addColorStop(1, `rgba(${tone}, 0)`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(ox, oy, size, 0, TAU);
    ctx.fill();
  }
}

function drawHair(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const length = 14 + Math.random() * 46;
  const angle = Math.random() * TAU;
  const bend = (Math.random() - 0.5) * length * 0.9;
  const ex = x + Math.cos(angle) * length;
  const ey = y + Math.sin(angle) * length;
  ctx.strokeStyle = `rgba(16, 12, 9, ${0.4 + Math.random() * 0.35})`;
  ctx.lineWidth = 0.6 + Math.random() * 0.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo((x + ex) / 2 - Math.sin(angle) * bend, (y + ey) / 2 + Math.cos(angle) * bend, ex, ey);
  ctx.stroke();
}

type Scratch = { x: number; age: number; life: number; weight: number; light: boolean; phase: number };

export function FilmNoise({
  opacity = 0.18,
  size = 1,
  fps = 18,
  blendMode = "overlay",
  contrast = 0.6,
  dust = 0,
  scratches = 0,
  flicker = 0,
  className,
}: FilmNoiseProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const settings = useRef({ opacity, fps, dust, scratches, flicker, size });

  useEffect(() => {
    settings.current = {
      opacity: clamp(opacity, 0, 1),
      fps: clamp(fps, 0, 60),
      dust: clamp(dust, 0, 1),
      scratches: clamp(scratches, 0, 1),
      flicker: clamp(flicker, 0, 1),
      size: Math.max(0.5, size),
    };
  }, [opacity, fps, dust, scratches, flicker, size]);

  useEffect(() => {
    const grain = grainRef.current;
    if (!grain) return;
    let alive = true;
    let url = "";
    paintTile(clamp(contrast, 0, 1))?.toBlob((blob) => {
      if (!alive || !blob) return;
      url = URL.createObjectURL(blob);
      grain.style.backgroundImage = `url("${url}")`;
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [contrast]);

  useEffect(() => {
    const root = rootRef.current;
    const grain = grainRef.current;
    const canvas = dustRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !grain || !canvas || !ctx) return;
    const list: Scratch[] = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    let width = 1;
    let height = 1;

    const paint = (step: number) => {
      const s = settings.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (s.dust <= 0 && s.scratches <= 0 && list.length === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = (width * height) / 400000;
      if (s.dust > 0) {
        const specks = Math.round(s.dust * 42 * area * (0.6 + Math.random() * 0.8));
        for (let i = 0; i < specks; i++) {
          const light = Math.random() < 0.3;
          drawSpeck(ctx, Math.random() * width, Math.random() * height, 0.6 + Math.random() ** 2.5 * 3.4, light ? "255, 250, 240" : "18, 14, 10", 0.6 + Math.random() * 0.35);
        }
        if (Math.random() < s.dust * 0.7) drawHair(ctx, width, height);
      }
      if (step) {
        if (list.length < 3 && Math.random() < s.scratches * 0.06) {
          list.push({ x: Math.random() * width, age: 0, life: 0.6 + Math.random() * 2.6, weight: 0.6 + Math.random() * 0.8, light: Math.random() < 0.7, phase: Math.random() * TAU });
        }
        for (let i = list.length - 1; i >= 0; i--) {
          list[i].age += step;
          list[i].x += (Math.random() - 0.5) * 1.2;
          if (list[i].age >= list[i].life) list.splice(i, 1);
        }
      }
      for (const sc of list) {
        const fade = Math.min(1, sc.age / 0.15, (sc.life - sc.age) / 0.3);
        const alpha = (0.25 + Math.random() * 0.35) * fade;
        ctx.strokeStyle = sc.light ? `rgba(255, 252, 245, ${alpha})` : `rgba(14, 11, 8, ${alpha})`;
        ctx.lineWidth = sc.weight;
        ctx.beginPath();
        for (let y = 0; y <= height; y += 24) {
          const x = sc.x + Math.sin(y * 0.012 + sc.phase) * 1.4;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, root.clientWidth);
      height = Math.max(1, root.clientHeight);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      paint(0);
    };

    const tick = (now: number) => {
      raf = 0;
      const s = settings.current;
      if (now - last >= 1000 / Math.max(1, s.fps)) {
        const step = last ? Math.min(0.2, (now - last) / 1000) : 1 / Math.max(1, s.fps);
        last = now;
        const span = TILE * s.size;
        grain.style.backgroundPosition = `${(Math.random() * span).toFixed(1)}px ${(Math.random() * span).toFixed(1)}px`;
        grain.style.opacity = String(s.opacity * (1 - s.flicker * Math.random() * 0.7));
        paint(step);
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (reduced || raf || !visible) return;
      raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) wake();
    });
    io.observe(root);
    const onVis = () => wake();
    document.addEventListener("visibilitychange", onVis);
    resize();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  return (
    <div ref={rootRef} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        ref={grainRef}
        className="absolute inset-0"
        style={{ opacity, mixBlendMode: blendMode, backgroundSize: `${TILE * size}px ${TILE * size}px`, backgroundRepeat: "repeat" }}
      />
      <canvas ref={dustRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
