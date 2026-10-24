"use client";

import { useEffect, useRef } from "react";
import { whenNearViewport } from "@/lib/motion/near-viewport";
import { cn } from "@/lib/utils";
import type { GlowSettings } from "./glow-cursor-gl";

/**
 * A faint ember trail behind the mouse, for one dark scene only (adapted from React Bits "GlowCursor").
 * Colour comes from a CSS custom property (default the fixed brand antique gold), so nothing is hard-coded.
 * Mouse only: touch and pen never draw, and touch devices never load the effect.
 * Reduced motion: no trail at all (decorative motion that follows the pointer).
 * Cost control: the WebGL code is a separate chunk, loaded and started only when the scene comes within a screen of
 * the viewport; the canvas is created here and released (context lost, element removed) on unmount, so hidden routes
 * kept by the router do not hold WebGL contexts.
 * The layer is decorative (aria-hidden) and never takes pointer events.
 */
type EmberTrailProps = {
  /** CSS custom property holding the colour. */
  colorVar?: string;
  intensity?: number;
  trailWidth?: number;
  /** Seconds the trail lingers. */
  linger?: number;
  glow?: number;
  className?: string;
};

function readColor(el: HTMLElement, variable: string): [number, number, number] | null {
  const value = getComputedStyle(el).getPropertyValue(variable).trim();
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx || !value) return null;
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

export function EmberTrail({ colorVar = "--color-antique", intensity = 0.7, trailWidth = 2.5, linger = 1.1, glow = 0.8, className }: EmberTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;
    let canvas: HTMLCanvasElement | null = null;

    const stopWaiting = whenNearViewport(container, () => {
      void import("./glow-cursor-gl").then(({ createGlowTrail }) => {
        if (cancelled) return;
        const color = readColor(container, colorVar);
        const secondary = readColor(container, "--color-caramel") ?? color;
        if (!color || !secondary) return;
        const settings: GlowSettings = { color, secondary, intensity, trailWidth, linger, glow, hotspot: 0.5, followSpeed: 0.55 };
        canvas = document.createElement("canvas");
        canvas.className = "block h-full w-full";
        canvas.style.mixBlendMode = "screen";
        container.appendChild(canvas);
        try {
          dispose = createGlowTrail(container, canvas, () => settings, false);
        } catch {
          dispose = null;
        }
        if (!dispose) {
          canvas.remove();
          canvas = null;
        }
      }).catch(() => {});
    });

    return () => {
      cancelled = true;
      stopWaiting();
      dispose?.();
      if (canvas) {
        canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.remove();
      }
    };
  }, [colorVar, intensity, trailWidth, linger, glow]);

  return <div ref={containerRef} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} />;
}
