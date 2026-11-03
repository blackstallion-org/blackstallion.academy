"use client";

import { useEffect, useRef } from "react";

/**
 * Drifting dust over a chapter: small warm motes on a 2D canvas, a few dozen at most, paused whenever the chapter is not
 * on screen. It is not mounted under reduced motion. Only transform-free canvas drawing, so it never touches layout.
 */
export function DriftCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number; ph: number };
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const count = mobile ? 24 : 56;
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
        ctx.fillStyle = `rgba(243, 214, 160, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!raf && visible) {
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

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="ms-drift" aria-hidden="true" />;
}
