"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { daylight, loadGlb, lookAt, perspective, StallionRenderer, type GazeTarget } from "./stallion-gl";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/content/asset";

/** Where the camera dolly lands: the digital Sovereign Passport. */
export const PASSPORT_HREF = "/cadets#passport";
/** The commissioned sculpt, when supplied, is set with NEXT_PUBLIC_STALLION_MODEL (e.g. /models/marwari.glb). */
export const MODEL_URL = asset(process.env.NEXT_PUBLIC_STALLION_MODEL || "/models/marwari-proxy.glb");

type Status = "loading" | "ready" | "failed";

const MODEL_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_STALLION_MODEL);
const noSubscribe = () => () => {};
/**
 * The 3D centrepiece is on when the commissioned model is configured (NEXT_PUBLIC_STALLION_MODEL).
 * Until then the hero keeps its photograph and film; `?stallion=preview` shows the stand-in proxy for review.
 */
export function useStallionEnabled() {
  return useSyncExternalStore(
    noSubscribe,
    () => MODEL_CONFIGURED || new URLSearchParams(window.location.search).get("stallion") === "preview",
    () => MODEL_CONFIGURED,
  );
}

type Props = {
  className?: string;
  /** Called with the outcome so the hero can keep its photograph when WebGL is unavailable. */
  onStatus?: (s: Status) => void;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The hero centrepiece: an interactive Marwari stallion rendered with WebGL2.
 * Cursor gaze on fine pointers, device tilt on phones (permission asked on iOS), touch-drag otherwise,
 * ribcage breathing, light that follows the local time of day, and a click that dollies the camera
 * toward the head and opens the Sovereign Passport. Reduced motion: a still frame and a plain link.
 * The model is a stand-in proxy until the commissioned sculpt is supplied (see docs/BSAH_IMPLEMENTATION_CHECKLIST.md).
 */
export function StallionStage({ className, onStatus }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);
  const target = useRef<GazeTarget>({ yaw: 0, pitch: 0 });
  const dolly = useRef<{ start: number } | null>(null);
  const navigated = useRef(false);
  const reduced = useRef(false);

  const report = useCallback(
    (s: Status) => {
      setStatus(s);
      onStatus?.(s);
    },
    [onStatus],
  );

  const enterPassport = useCallback(() => {
    if (dolly.current || navigated.current) return; // no double transitions
    if (reduced.current || status !== "ready") {
      navigated.current = true;
      router.push(PASSPORT_HREF);
      return;
    }
    dolly.current = { start: performance.now() };
  }, [router, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let r: StallionRenderer;
    try {
      r = new StallionRenderer(canvas);
    } catch {
      queueMicrotask(() => report("failed"));
      return;
    }
    let alive = true;
    let raf = 0;
    let visible = true;
    const gaze: GazeTarget = { yaw: 0, pitch: 0 };
    const light = daylight(new Date().getHours() + new Date().getMinutes() / 60);
    const t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      r.gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const frame = (now: number) => {
      if (!alive) return;
      const t = (now - t0) / 1000;
      const aspect = canvas.width / canvas.height;
      // follow the target softly; a slow idle sway when nothing is steering
      const idle = reduced.current ? 0 : Math.sin(t * 0.35) * 0.06;
      gaze.yaw += (target.current.yaw + idle - gaze.yaw) * 0.06;
      gaze.pitch += (target.current.pitch - gaze.pitch) * 0.06;
      // camera: three-quarter view from the horse's left front; narrower screens step back
      const back = aspect < 0.9 ? 1.35 : 1;
      let eye = [4.4 * back, 1.6, 4.0 * back];
      let look = [0, 1.18, 0.1];
      if (dolly.current) {
        const k = ease(clamp((now - dolly.current.start) / 1300, 0, 1));
        const head = [0, 1.95, 1.45];
        eye = eye.map((v, i) => v + ([0.9, 2.05, 2.75][i] - v) * k);
        look = look.map((v, i) => v + (head[i] - v) * k);
        if (k >= 1 && !navigated.current) {
          navigated.current = true;
          router.push(PASSPORT_HREF);
        }
      }
      const breath = reduced.current ? 0 : 0.014 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 4.4));
      r.draw({ proj: perspective(aspect < 0.9 ? 0.62 : 0.5, aspect, 0.1, 50), view: lookAt(eye, look), cam: eye, breath, gaze, light });
      if (!reduced.current && visible) raf = requestAnimationFrame(frame);
    };

    loadGlb(MODEL_URL)
      .then((glb) => {
        if (!alive) return;
        r.upload(glb);
        resize();
        report("ready");
        raf = requestAnimationFrame(frame);
      })
      .catch(() => alive && report("failed"));

    // pointer gaze (fine pointers): the horse turns its head a few degrees toward the cursor
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.62;
      const cy = rect.top + rect.height * 0.3;
      target.current.yaw = clamp((e.clientX - cx) / window.innerWidth, -0.5, 0.5) * 0.9;
      target.current.pitch = clamp((e.clientY - cy) / window.innerHeight, -0.5, 0.5) * 0.45;
    };
    // touch drag on the canvas, a fallback when tilt is unavailable or declined
    const onTouch = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || e.buttons === 0) return;
      const rect = canvas.getBoundingClientRect();
      target.current.yaw = clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 0.9;
      target.current.pitch = clamp((e.clientY - rect.top) / rect.height - 0.4, -0.5, 0.5) * 0.45;
    };
    // device tilt
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.current.yaw = clamp(e.gamma / 45, -1, 1) * 0.42;
      target.current.pitch = clamp((e.beta - 45) / 45, -1, 1) * 0.2;
    };
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && DOE) {
      if (typeof DOE.requestPermission === "function") queueMicrotask(() => setNeedsMotionPermission(true));
      else window.addEventListener("deviceorientation", onTilt);
    }

    const io = new IntersectionObserver(([en]) => {
      const was = visible;
      visible = en.isIntersecting && document.visibilityState === "visible";
      if (visible && !was && !reduced.current && r.prims.length) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const onVis = () => {
      const was = visible;
      visible = document.visibilityState === "visible";
      if (visible && !was && !reduced.current && r.prims.length) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      resize();
      if (reduced.current && r.prims.length) requestAnimationFrame(frame);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointermove", onTouch, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    (canvas as unknown as { __tilt?: typeof onTilt }).__tilt = onTilt;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointermove", onTouch);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("deviceorientation", onTilt);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [report, router]);

  const askMotion = async () => {
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    try {
      const res = await DOE?.requestPermission?.();
      const tilt = (canvasRef.current as unknown as { __tilt?: (e: DeviceOrientationEvent) => void })?.__tilt;
      if (res === "granted" && tilt) window.addEventListener("deviceorientation", tilt);
    } catch {
      /* declined: touch-drag remains */
    }
    setNeedsMotionPermission(false);
  };

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A black Marwari stallion with inward-curving ears, breathing slowly and turning its head to follow you."
        onClick={enterPassport}
        className={cn(
          "h-full w-full cursor-pointer touch-pan-y transition-opacity duration-[1400ms]",
          status === "ready" ? "opacity-100" : "opacity-0",
        )}
      />
      {status === "loading" && (
        <p className="label pointer-events-none absolute bottom-[18%] right-[12%] text-dust" aria-live="polite">
          Saddling the stallion…
        </p>
      )}
      {status !== "failed" && (
        <div className="absolute bottom-[14%] right-4 flex flex-col items-end gap-2 sm:right-[6%]">
          <button type="button" onClick={enterPassport} className="label border border-line bg-night/70 px-3 py-2 text-sand hover:text-bone">
            Open the Sovereign Passport →
          </button>
          {needsMotionPermission && (
            <button type="button" onClick={askMotion} className="label border border-line bg-night/70 px-3 py-2 text-dust hover:text-bone">
              Enable tilt
            </button>
          )}
        </div>
      )}
    </div>
  );
}
