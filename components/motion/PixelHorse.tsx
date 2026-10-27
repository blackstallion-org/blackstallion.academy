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

/**
 * Keep the same continuous gallop through the overlay's exit fade. Where the browser can draw on an OffscreenCanvas in a
 * worker, the horse runs on its own thread (public/animations/pixel-horse.worker.js) and stays smooth while the main thread is
 * busy hydrating on a slow phone or connection; elsewhere the same engine runs on the main thread, as before. The canvas is
 * created here, not in JSX, because a canvas can be handed to a worker only once and React may mount the effect twice.
 */
export function PixelHorse({ settling, onSettled }: { settling: boolean; onSettled: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const horseRef = useRef<Horse | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const callbackRef = useRef(onSettled);
  useEffect(() => { callbackRef.current = onSettled; }, [onSettled]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const canvas = document.createElement("canvas");
    canvas.className = styles.horse;
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    let observer: ResizeObserver | undefined;
    let onVisibility: (() => void) | undefined;
    if (typeof Worker !== "undefined" && "transferControlToOffscreen" in canvas) {
      try {
        const rect = canvas.getBoundingClientRect();
        const worker = new Worker("/animations/pixel-horse.worker.js");
        workerRef.current = worker;
        worker.onmessage = (event) => { if (!disposed && event.data?.type === "cycle") callbackRef.current(); };
        worker.onerror = () => { if (!disposed) callbackRef.current(); };
        const offscreen = canvas.transferControlToOffscreen();
        worker.postMessage({ type: "init", canvas: offscreen, w: rect.width || 190, h: rect.height || 124, dpr: dpr(), cycleDuration: 510 }, [offscreen]);
        observer = new ResizeObserver(([entry]) => {
          const { width, height } = entry.contentRect;
          if (width && height) worker.postMessage({ type: "resize", w: width, h: height, dpr: dpr() });
        });
        observer.observe(canvas);
        onVisibility = () => worker.postMessage({ type: document.hidden ? "pause" : "resume" });
        document.addEventListener("visibilitychange", onVisibility);
      } catch {
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    }
    if (!workerRef.current) {
      loadEngine().then((Constructor) => {
        if (disposed) return;
        horseRef.current = new Constructor({ canvas, cycleDuration: 510 });
        horseRef.current.start();
      }).catch(() => { /* Overlay has its own hard timeout; content never depends on Canvas. */ });
    }
    return () => {
      disposed = true;
      observer?.disconnect();
      if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
      workerRef.current?.postMessage({ type: "destroy" });
      workerRef.current = null;
      horseRef.current?.destroy();
      horseRef.current = null;
      canvas.remove();
    };
  }, []);
  useEffect(() => {
    if (!settling) return;
    let disposed = false;
    const deadline = window.setTimeout(() => { if (!disposed) callbackRef.current(); }, 850);
    const worker = workerRef.current;
    const horse = horseRef.current;
    if (worker && !document.hidden) worker.postMessage({ type: "settle" });
    else if (horse && !horse.prefersReducedMotion && !document.hidden) horse.onNextCycleComplete(() => { if (!disposed) callbackRef.current(); });
    else callbackRef.current();
    return () => { disposed = true; window.clearTimeout(deadline); };
  }, [settling]);
  return <div ref={hostRef} style={{ display: "contents" }} aria-hidden />;
}
