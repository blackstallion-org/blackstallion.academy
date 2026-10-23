"use client";

import { useEffect, useRef } from "react";
import { mediaSrc, type MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

/**
 * A photograph re-set as monospaced characters that ripple like water under the pointer
 * (our own take on the React Bits Pro "ASCII Ripple"; no licence or dependency needed).
 * Brightness picks the glyph from a ramp; each pointer move drops a ring that spreads, bends the
 * sampling coordinates and lifts the glyphs it passes. Colours come from the role tokens
 * (`--color-dust` → `--color-gold`), so it reads on light or dark scenes.
 * Decorative: aria-hidden; give the scene a text caption. Reduced motion: a still, unrippled frame.
 */
type AsciiRippleProps = {
  image: MediaKey;
  /** Character cell height in px. */
  cell?: number;
  ramp?: string;
  /** Contrast curve applied to brightness. */
  gamma?: number;
  /** CSS custom properties for resting and rippled glyphs. */
  dimVar?: string;
  hotVar?: string;
  className?: string;
};

type Ring = { x: number; y: number; t: number };

export function AsciiRipple({ image, cell = 11, ramp = " .·:-=+*%#@", gamma = 0.9, dimVar = "--color-dust", hotVar = "--color-gold", className }: AsciiRippleProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const src = mediaSrc(image);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx || !src) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sample = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!sample) return;

    let lum: Float32Array = new Float32Array(0);
    let cols = 0;
    let rows = 0;
    let cw = cell * 0.62;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let loaded = false;
    let raf = 0;
    let visible = true;
    let last = 0;
    const rings: Ring[] = [];
    let lastDrop = 0;
    const style = getComputedStyle(wrap);
    const dim = style.getPropertyValue(dimVar).trim() || "#a8957f";
    const hot = style.getPropertyValue(hotVar).trim() || "#c9a66b";
    const font = style.getPropertyValue("--font-mono").trim() || "monospace";
    const img = new Image();

    const build = () => {
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      if (!width || !height || !loaded) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${cell}px ${font}`;
      cw = ctx.measureText("M").width || cell * 0.62;
      cols = Math.ceil(width / cw);
      rows = Math.ceil(height / cell);
      // cover-fit the photo into cols × rows (cells are taller than wide)
      sample.canvas.width = cols;
      sample.canvas.height = rows;
      const boxAspect = (cols * cw) / (rows * cell);
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (imgAspect > boxAspect) sw = sh * boxAspect;
      else sh = sw / boxAspect;
      sample.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, cols, rows);
      const data = sample.getImageData(0, 0, cols, rows).data;
      lum = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) {
        lum[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
      }
      // Auto-levels: stretch the 2nd–98th percentile to the full ramp so dark film stills still read.
      const sorted = Array.from(lum).sort((a, b) => a - b);
      const lo = sorted[Math.floor(sorted.length * 0.02)] ?? 0;
      const hi = sorted[Math.floor(sorted.length * 0.98)] ?? 1;
      for (let i = 0; i < lum.length; i++) lum[i] = Math.pow(Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(0.01, hi - lo))), gamma);
      paint(performance.now());
    };

    const paint = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.textBaseline = "top";
      const n = ramp.length - 1;
      const speed = 260; // px/s
      const live = rings.filter((r) => now - r.t < 1600);
      rings.length = 0;
      rings.push(...live);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * cw + cw / 2;
          const py = y * cell + cell / 2;
          let dx = 0;
          let dy = 0;
          let lift = 0;
          for (const r of live) {
            const age = (now - r.t) / 1000;
            const d = Math.hypot(px - r.x, py - r.y);
            const front = d - age * speed;
            if (Math.abs(front) > 42) continue;
            const amp = Math.cos(front * 0.15) * Math.exp(-front * front / 600) * (1 - age / 1.6);
            dx += ((px - r.x) / (d || 1)) * amp * 2.2;
            dy += ((py - r.y) / (d || 1)) * amp * 2.2;
            lift += Math.max(0, amp);
          }
          const sx = Math.min(cols - 1, Math.max(0, Math.round(x + dx)));
          const sy = Math.min(rows - 1, Math.max(0, Math.round(y + dy)));
          const l = Math.min(1, lum[sy * cols + sx] + lift * 0.35);
          const ch = ramp[Math.round(l * n)];
          if (ch === " ") continue;
          ctx.fillStyle = lift > 0.25 ? hot : dim;
          ctx.globalAlpha = 0.35 + l * 0.65;
          ctx.fillText(ch, x * cw, y * cell);
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      raf = 0;
      if (now - last > 1000 / 30) {
        last = now;
        paint(now);
      }
      if (rings.length && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (reduce || !loaded) return;
      const now = performance.now();
      if (now - lastDrop < 70) return;
      lastDrop = now;
      const rect = wrap.getBoundingClientRect();
      rings.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: now });
      if (rings.length > 8) rings.shift();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    img.onload = () => {
      loaded = true;
      build();
    };
    img.src = src;
    const ro = new ResizeObserver(build);
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(wrap);
    wrap.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
    };
  }, [src, cell, ramp, gamma, dimVar, hotVar]);

  return (
    <div ref={wrapRef} aria-hidden className={cn("relative overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
