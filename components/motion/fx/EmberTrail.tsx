"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { createGlowTrail, type GlowSettings } from "./glow-cursor-gl";

/**
 * A faint ember trail behind the mouse, for one dark scene only (adapted from React Bits "GlowCursor").
 * Colour comes from a CSS custom property (default the fixed brand antique gold), so nothing is hard-coded.
 * Mouse only: touch and pen never draw. Reduced motion keeps a short, still glow without fluid swirl.
 * The canvas is decorative (aria-hidden) and never takes pointer events.
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

function readColor(el: HTMLElement, variable: string): [number, number, number] {
  const value = getComputedStyle(el).getPropertyValue(variable).trim();
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx || !value) return [0.79, 0.65, 0.42];
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

export function EmberTrail({ colorVar = "--color-antique", intensity = 0.7, trailWidth = 2.5, linger = 1.1, glow = 0.8, className }: EmberTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const color = readColor(container, colorVar);
    const secondary = readColor(container, "--color-caramel");
    const settings: GlowSettings = { color, secondary, intensity, trailWidth, linger, glow, hotspot: 0.5, followSpeed: 0.55 };
    try {
      const dispose = createGlowTrail(container, canvas, () => settings, reduce);
      return () => dispose?.();
    } catch {
      return;
    }
  }, [colorVar, intensity, trailWidth, linger, glow]);

  return (
    <div ref={containerRef} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <canvas ref={canvasRef} className="block h-full w-full" style={{ mixBlendMode: "screen" }} />
    </div>
  );
}
