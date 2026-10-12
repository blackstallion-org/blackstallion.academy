"use client";

import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { media, mediaSrc, type MediaKey } from "@/lib/content/media";
import { openingDelay } from "@/lib/motion/cinematic";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

type PixelDissolveProps = {
  name: MediaKey;
  /** CSS object-position for the subject (defaults to the manifest focus). */
  position?: string;
  /** Seconds the coarse-to-sharp resolve takes. */
  duration?: number;
  className?: string;
};

/** Block sizes the picture steps through, coarse to fine (in canvas pixels). */
const STEPS = [64, 48, 36, 28, 22, 16, 12, 9, 7, 5, 4, 3, 2];

/**
 * Signature move for verification: the portrait arrives as coarse blocks, rows slip sideways like
 * a sorted scan, and it resolves step by step into the sharp photograph. Canvas 2D, no WebGL:
 * it draws only while resolving (requestAnimationFrame stops at the end), then hands over to the
 * real <img>. It sits behind the page's form and never takes focus or input.
 *
 * Falls back to the plain photograph under reduced motion, when canvas is unavailable, or when the
 * file cannot be loaded in time.
 */
export function PixelDissolve({ name, position, duration = 2.2, className }: PixelDissolveProps) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"pending" | "resolving" | "done">("pending");
  const focus = position ?? media[name].focus ?? "50% 50%";

  useEffect(() => {
    if (reduced) {
      const id = requestAnimationFrame(() => setPhase("done"));
      return () => cancelAnimationFrame(id);
    }
    const canvas = canvasRef.current;
    const src = mediaSrc(name);
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !src) {
      const id = requestAnimationFrame(() => setPhase("done"));
      return () => cancelAnimationFrame(id);
    }

    let raf = 0;
    let cancelled = false;
    let gaveUp = false;
    const img = new Image();
    img.decoding = "async";
    img.src = src;

    // Give up gracefully if the file is slow: show the photograph as soon as it arrives.
    const giveUp = window.setTimeout(() => {
      gaveUp = true;
      if (!cancelled) setPhase("done");
    }, 4000);

    const [fx, fy] = focus.split(" ").map((v) => parseFloat(v) / 100);
    const small = document.createElement("canvas");
    const sctx = small.getContext("2d");
    // Stable per-row offsets for the "sorted scan" slip.
    const seed = Array.from({ length: 512 }, (_, i) => Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453) - 0.5);

    const draw = (block: number, slip: number) => {
      if (!sctx) return;
      const W = canvas.width;
      const H = canvas.height;
      // Cover-fit the source into W x H around the focus point.
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = W / scale;
      const sh = H / scale;
      const sx = (img.naturalWidth - sw) * (Number.isFinite(fx) ? fx : 0.5);
      const sy = (img.naturalHeight - sh) * (Number.isFinite(fy) ? fy : 0.5);
      const cols = Math.max(1, Math.ceil(W / block));
      const rows = Math.max(1, Math.ceil(H / block));
      small.width = cols;
      small.height = rows;
      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#171513";
      ctx.fillRect(0, 0, W, H);
      for (let row = 0; row < rows; row++) {
        const dx = slip * seed[row % seed.length] * W * 0.35;
        ctx.drawImage(small, 0, row, cols, 1, dx, row * block, cols * block, block);
      }
    };

    const start = () => {
      if (cancelled || gaveUp) return;
      window.clearTimeout(giveUp);
      const rect = canvas.getBoundingClientRect();
      // Half resolution is plenty for blocks; the sharp <img> takes over at the end.
      canvas.width = Math.max(2, Math.round(rect.width / 2));
      canvas.height = Math.max(2, Math.round(rect.height / 2));
      setPhase("resolving");
      draw(STEPS[0], 1);
      const t0 = performance.now() + openingDelay(0.1) * 1000;
      const total = duration * 1000;
      const frame = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, Math.max(0, (now - t0) / total));
        // Linger on the coarse blocks, then sharpen quickly: ease-in-out on the step index.
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const block = STEPS[Math.min(STEPS.length - 1, Math.floor(e * STEPS.length))];
        const slip = Math.max(0, 1 - e * 1.6);
        draw(block, slip * slip);
        if (t < 1) raf = requestAnimationFrame(frame);
        else setPhase("done");
      };
      raf = requestAnimationFrame(frame);
    };

    img.onload = start;
    img.onerror = () => !cancelled && setPhase("done");
    if (img.complete && img.naturalWidth) start();

    return () => {
      cancelled = true;
      window.clearTimeout(giveUp);
      cancelAnimationFrame(raf);
    };
  }, [reduced, name, focus, duration]);

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-night", className)}>
      <div className={cn("absolute inset-0 transition-opacity duration-700", phase === "done" ? "opacity-100" : "opacity-0")}>
        <FilmImage name={name} priority grade="none" position={focus} />
      </div>
      {!reduced && (
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 h-full w-full [image-rendering:pixelated]",
            phase === "done" ? "opacity-0 transition-opacity duration-700" : "opacity-100",
          )}
        />
      )}
    </div>
  );
}
