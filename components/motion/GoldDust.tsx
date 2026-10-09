"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type GoldDustProps = {
  /** Particles per 10,000 px² of canvas. Capped at 60 on small screens, 120 on large. */
  density?: number;
  className?: string;
};

type Mote = { x: number; y: number; r: number; vy: number; sway: number; phase: number; alpha: number; hue: 0 | 1 };

const BRASS = "197,160,89";
const PARCHMENT = "230,202,101";

/**
 * Ambient gold dust (Web Elevation addendum, item 1): slow motes drifting up
 * through warm light. Pauses when off-screen or the tab is hidden.
 * Reduced motion: one still frame.
 */
export function GoldDust({ density = 0.9, className }: GoldDustProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let motes: Mote[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let visible = true;

    const seed = (): Mote => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.4 + Math.random() * 1.4,
      vy: 0.06 + Math.random() * 0.22,
      sway: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.55,
      hue: Math.random() > 0.7 ? 1 : 0,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cap = width < 768 ? 60 : 120;
      const count = Math.min(cap, Math.round(((width * height) / 10000) * density));
      motes = Array.from({ length: count }, seed);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const m of motes) {
        if (!reduced) {
          m.y -= m.vy;
          m.x += Math.sin(t / 2400 + m.phase) * m.sway * 0.15;
          if (m.y < -4) {
            m.y = height + 4;
            m.x = Math.random() * width;
          }
        }
        const twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(t / 900 + m.phase * 3);
        const a = m.alpha * twinkle;
        const rgb = m.hue ? PARCHMENT : BRASS;
        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        glow.addColorStop(0, `rgba(${rgb},${a})`);
        glow.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();
    draw(0);

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
