"use client";

import { useEffect, useRef } from "react";
import styles from "./Loader.module.css";

type Horse = { phase: number; speedMultiplier: number; standBlend: number; prefersReducedMotion: boolean; start(): void; stop(): void; destroy(): void; renderFrame(phase: number, blend: number, dt?: number): void; onNextCycleComplete(callback: () => void): void };
type HorseConstructor = new (options: { canvas: HTMLCanvasElement; cycleDuration: number }) => Horse;
declare global { interface Window { PixelHorseAnimation?: HorseConstructor } }
let engine: Promise<HorseConstructor> | undefined;

function loadEngine() {
  if (window.PixelHorseAnimation) return Promise.resolve(window.PixelHorseAnimation);
  if (!engine) engine = new Promise<HorseConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/animations/pixel-horse.js";
    script.onload = () => window.PixelHorseAnimation ? resolve(window.PixelHorseAnimation) : reject(new Error("Horse animation unavailable"));
    script.onerror = () => { engine = undefined; script.remove(); reject(new Error("Horse animation unavailable")); };
    document.head.appendChild(script);
  });
  return engine;
}

/** Keep the same continuous gallop through the overlay's exit fade. */
export function PixelHorse({ settling, onSettled }: { settling: boolean; onSettled: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const horseRef = useRef<Horse | null>(null);
  const callbackRef = useRef(onSettled);
  useEffect(() => { callbackRef.current = onSettled; }, [onSettled]);
  useEffect(() => {
    let disposed = false;
    loadEngine().then((Constructor) => {
      if (disposed || !canvasRef.current) return;
      horseRef.current = new Constructor({ canvas: canvasRef.current, cycleDuration: 510 });
      horseRef.current.start();
    }).catch(() => { /* Overlay has its own hard timeout; content never depends on Canvas. */ });
    return () => { disposed = true; horseRef.current?.destroy(); horseRef.current = null; };
  }, []);
  useEffect(() => {
    if (!settling) return;
    let disposed = false;
    const deadline = window.setTimeout(() => { if (!disposed) callbackRef.current(); }, 850);
    const horse = horseRef.current;
    if (horse && !horse.prefersReducedMotion && !document.hidden) horse.onNextCycleComplete(() => { if (!disposed) callbackRef.current(); });
    else callbackRef.current();
    return () => { disposed = true; window.clearTimeout(deadline); };
  }, [settling]);
  return <canvas ref={canvasRef} className={styles.horse} aria-hidden />;
}
