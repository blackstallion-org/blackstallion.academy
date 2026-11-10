"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { WORLDS } from "@/lib/content/history/motion";
import { energy, useReadingMode } from "./HistoryScrollRoot";

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; max: number; c: number; kind: 0 | 1 | 2; puff?: boolean };

const MAX = 64;

/** A soft round sprite per colour, so particles cost one drawImage each (no per-frame gradients or shadow blur). */
function sprites(colors: string[]) {
  return colors.map((c) => {
    const s = document.createElement("canvas");
    s.width = s.height = 64;
    const g = s.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, c);
    grad.addColorStop(0.35, c);
    grad.addColorStop(1, "transparent");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return s;
  });
}

/**
 * The page's weather between the subject and the foreground: dust over Marwar, wind on the steppe, embers at Jhansi,
 * haze for Alexander. Draws only while its scene is on screen; galloping subjects also kick dust at the hooves.
 */
export function Atmosphere({ dir }: { dir?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const { reading, world } = useReadingMode();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduced || reading) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = WORLDS[world];
    const sp = sprites(W.colors);
    const art = canvas.closest(".hs-art");
    const ps: P[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    let cloud = Math.random();
    let seeded = false;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (seed: boolean): P => {
      const c = Math.floor(Math.random() * sp.length);
      const base = { c, life: 0, kind: 0 as const };
      switch (W.atmo) {
        case "wind":
          return Math.random() < 0.6
            ? { ...base, kind: 1, x: seed ? Math.random() * w : -60, y: Math.random() * h, vx: 3 + Math.random() * 4, vy: (Math.random() - 0.5) * 0.4, r: 20 + Math.random() * 50, a: 0.12 + Math.random() * 0.18, max: 400 }
            : { ...base, x: seed ? Math.random() * w : -10, y: Math.random() * h, vx: 1.2 + Math.random() * 1.6, vy: (Math.random() - 0.6) * 0.5, r: 1.5 + Math.random() * 2.5, a: 0.5 + Math.random() * 0.4, max: 600 };
        case "embers":
          return Math.random() < 0.25
            ? { ...base, kind: 2, c: 0, x: Math.random() * w, y: seed ? Math.random() * h : h + 80, vx: 0.2 + Math.random() * 0.3, vy: -(0.25 + Math.random() * 0.35), r: 60 + Math.random() * 90, a: 0.07 + Math.random() * 0.06, max: 900 }
            : { ...base, x: Math.random() * w, y: seed ? Math.random() * h : h + 10, vx: (Math.random() - 0.3) * 0.6, vy: -(0.6 + Math.random() * 1.2), r: 1.5 + Math.random() * 2.5, a: 0.6 + Math.random() * 0.4, max: 500 };
        case "haze":
          return { ...base, x: Math.random() * w, y: seed ? Math.random() * h : h * (0.2 + Math.random() * 0.8), vx: (Math.random() - 0.4) * 0.3, vy: -(0.05 + Math.random() * 0.15), r: Math.random() < 0.2 ? 30 + Math.random() * 50 : 2 + Math.random() * 4, a: 0.15 + Math.random() * 0.3, max: 700 };
        default:
          return { ...base, x: seed ? Math.random() * w : -10, y: h * (0.25 + Math.random() * 0.75), vx: 0.2 + Math.random() * 0.5, vy: (Math.random() - 0.55) * 0.3, r: Math.random() < 0.15 ? 18 + Math.random() * 30 : 1.5 + Math.random() * 3, a: 0.25 + Math.random() * 0.45, max: 700 };
      }
    };

    // Dust exactly where a hoof lands: the puppet reports each contact (components/history-scroll/puppet/Puppet.tsx).
    const onHoof = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      const cr = canvas.getBoundingClientRect();
      const d = dir ?? 1;
      for (let k = 0; k < 3; k++)
        ps.push({ x: x - cr.left + (Math.random() - 0.5) * 10, y: y - cr.top - 2, vx: -d * (0.4 + Math.random() * 1.1), vy: -(0.15 + Math.random() * 0.45), r: 6 + Math.random() * 10, a: 0.3, life: 0, max: 60 + Math.random() * 30, c: 1 % sp.length, kind: 2, puff: true });
    };
    art?.addEventListener("hs-hoof", onHoof);
    let light = Math.random() * 100;

    const frame = () => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      const e = 1 + energy.v * 2.2;
      ctx.clearRect(0, 0, w, h);

      if (W.atmo === "wind") {
        // A cloud shadow sweeping across the plain.
        cloud = (cloud + 0.0006 * e) % 1.4;
        const cx = (cloud - 0.2) * w;
        const g = ctx.createRadialGradient(cx, h * 0.6, 0, cx, h * 0.6, w * 0.35);
        g.addColorStop(0, "rgba(24,35,41,0.13)");
        g.addColorStop(1, "rgba(24,35,41,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // A slow, warm patch of light drifting across the scene: the sun through moving cloud.
      light += 0.004 * e;
      const lx = (0.5 + Math.sin(light * 0.7) * 0.35) * w;
      const ly = (0.35 + Math.sin(light * 0.45 + 1) * 0.15) * h;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.45);
      lg.addColorStop(0, `rgba(255,236,200,${(0.05 + Math.sin(light * 1.3) * 0.02).toFixed(3)})`);
      lg.addColorStop(1, "rgba(255,236,200,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, w, h);

      let ambient = 0;
      for (const p of ps) if (!p.puff) ambient++;
      for (; ambient < MAX; ambient++) ps.push(spawn(!seeded));
      seeded = true;

      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += e;
        p.x += (p.vx + W.wind * (p.kind === 1 ? 1 : 0.4)) * e;
        p.y += p.vy * e;
        if (W.atmo === "embers" && p.kind === 0) p.x += Math.sin((p.life + i * 37) / 40) * 0.4;
        const fade = Math.min(1, p.life / 40, (p.max - p.life) / 60);
        if (p.life > p.max || p.x > w + 120 || p.y < -120 || fade <= 0) {
          ps.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.a * fade;
        if (p.kind === 1) {
          // A wind streak: a thin stretched sprite.
          ctx.drawImage(sp[p.c], p.x, p.y, p.r * 2, 2);
        } else {
          const r = p.puff ? p.r * (1 + p.life / 50) : p.r;
          ctx.drawImage(sp[p.c], p.x - r, p.y - r, r * 2, r * 2);
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (visible && !raf) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      art?.removeEventListener("hs-hoof", onHoof);
      ctx.clearRect(0, 0, w, h);
    };
  }, [reduced, reading, world, dir]);

  if (reduced || reading) return null;
  return <canvas ref={ref} className="hs-layer hs-layer-atmo" aria-hidden />;
}
