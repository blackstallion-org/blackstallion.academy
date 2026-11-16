"use client";

import { useEffect, useRef } from "react";

/**
 * Drifting dust over a chapter: small warm motes on a 2D canvas, a few dozen at most, paused whenever the chapter is not
 * on screen or the tab is hidden, and never drawn under reduced motion. Only canvas drawing, so it never touches layout.
 * `rgb` is the mote colour as "r, g, b"; `density` scales the count.
 */
export function DriftCanvas({ className = "ms-drift", rgb = "243, 214, 160", density = 1 }: { className?: string; rgb?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number; ph: number };
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const count = Math.round((mobile ? 24 : 56) * density);
    let w = 0;
    let h = 0;
    let motes: Mote[] = [];
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let clock = 0;

    const seed = (): Mote => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.6,
      vx: 4 + Math.random() * 9,
      vy: -(1.5 + Math.random() * 5),
      a: 0.25 + Math.random() * 0.45,
      ph: Math.random() * Math.PI * 2,
    });

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: count }, seed);
    };

    const draw = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.x += (m.vx + Math.sin(clock * 0.7 + m.ph) * 5) * dt;
        m.y += m.vy * dt;
        if (m.x > w + 6) m.x = -6;
        if (m.y < -6) {
          m.y = h + 6;
          m.x = Math.random() * w;
        }
        const alpha = m.a * (0.6 + 0.4 * Math.sin(clock * 0.9 + m.ph));
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      kick();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", kick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
    };
  }, [rgb, density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
