"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/content/asset";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motion/reduced";
import { saveDataMode } from "@/lib/motion/save-data";

const SRC = asset("/video/command-scrub.mp4");
const POSTER = asset("/media/command-scrub-poster.webp");

/** Where the heads rest: the middle frame, looking at the camera. */
const REST = 0.5;
/** Smoothing rate per second (frame-rate independent). Higher follows the cursor tighter; lower feels softer. */
const FOLLOW = 11;
/** Touch drag: the share of the section's width that sweeps the whole film. */
const DRAG_SPAN = 0.8;
/** A drag counts as horizontal after this many pixels, and only if it is more horizontal than vertical. */
const INTENT_PX = 6;
/** After a finger lifts, hold the pose this long, then ease back to the middle. */
const TOUCH_HOLD_MS = 900;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * The Command's guide (3 Nov 2026): the cowboy and his horse, scrubbed by the cursor. The film is paused for good; the cursor's
 * horizontal position inside the hero section sets its currentTime (left edge = first frame, centre = middle frame, right edge =
 * last frame), a requestAnimationFrame loop eases toward it, and leaving the section eases back to the middle frame. On touch
 * screens a horizontal drag scrubs and vertical swipes still scroll the page (touch-action: pan-y). The file is encoded all
 * intra-frame (every frame a keyframe) so each seek is exact and instant. The Gemini mark that came with the clip was removed
 * from the footage itself. Reduced motion: the film follows the pointer directly, with no easing and no return glide.
 */
export function CursorScrubVideo({ className, objectPosition = "50% 50%", fit = "cover" }: { className?: string; objectPosition?: string; fit?: "cover" | "contain" }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  useEffect(() => { reducedRef.current = reduced; }, [reduced]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!video || !stage) return;
    // Data Saver or 2G: never fetch the film; the poster (the middle frame) stays.
    if (saveDataMode()) { video.removeAttribute("src"); video.load(); return; }
    let disposed = false;
    let enabled = false;
    let detach: (() => void) | undefined;

    const enable = () => {
      if (disposed || enabled || !Number.isFinite(video.duration) || video.duration <= 0) return;
      enabled = true;
      const duration = video.duration;
      const area = stage.closest("section") ?? stage; // the whole hero is the interaction area
      let target = REST;
      let current = REST;
      let lastWritten = -1;
      let raf = 0;
      let last = 0;
      let holdTimer = 0;

      const seekTo = (progress: number) => {
        // Clamp inside the valid duration; the last frame sits just before `duration` so it stays seekable.
        const time = Math.min(Math.max(progress * duration, 0), Math.max(duration - 0.001, 0));
        if (Math.abs(time - lastWritten) < 1 / 96) return; // less than half a frame of change: nothing to show
        lastWritten = time;
        video.currentTime = time;
      };
      const frame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        const k = reducedRef.current ? 1 : 1 - Math.exp(-FOLLOW * dt);
        current += (target - current) * k;
        if (Math.abs(target - current) < 0.0004) current = target;
        seekTo(current);
        raf = current === target ? 0 : requestAnimationFrame(frame);
      };
      const kick = () => {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      const aim = (progress: number) => { target = clamp01(progress); kick(); };
      const rest = () => aim(REST);

      // Start at the middle frame, exactly.
      seekTo(REST);

      // Mouse and pen: the cursor's position inside the section is the playhead.
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const box = area.getBoundingClientRect();
        if (box.width > 0) aim((e.clientX - box.left) / box.width);
      };
      const onLeave = (e: PointerEvent) => { if (e.pointerType !== "touch") rest(); };

      // Touch: a horizontal drag scrubs relative to where it began; a vertical swipe is left to the browser.
      let touchId = -1;
      let startX = 0;
      let startY = 0;
      let startTarget = REST;
      let dragging = false;
      const onDown = (e: PointerEvent) => {
        if (e.pointerType !== "touch" || touchId !== -1) return;
        window.clearTimeout(holdTimer);
        touchId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        startTarget = target;
        dragging = false;
      };
      const onTouchMove = (e: PointerEvent) => {
        if (e.pointerId !== touchId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!dragging) {
          if (Math.abs(dx) < INTENT_PX || Math.abs(dx) < Math.abs(dy)) return;
          dragging = true;
          try { (area as Element).setPointerCapture(e.pointerId); } catch { /* the drag still works without capture */ }
        }
        const width = area.getBoundingClientRect().width;
        if (width > 0) aim(startTarget + dx / (width * DRAG_SPAN));
      };
      const onTouchEnd = (e: PointerEvent) => {
        if (e.pointerId !== touchId) return;
        touchId = -1;
        dragging = false;
        window.clearTimeout(holdTimer);
        holdTimer = window.setTimeout(rest, reducedRef.current ? 0 : TOUCH_HOLD_MS);
      };

      area.addEventListener("pointermove", onMove as EventListener);
      area.addEventListener("pointerleave", onLeave as EventListener);
      area.addEventListener("pointerdown", onDown as EventListener);
      area.addEventListener("pointermove", onTouchMove as EventListener);
      area.addEventListener("pointerup", onTouchEnd as EventListener);
      area.addEventListener("pointercancel", onTouchEnd as EventListener);
      area.classList.add("scrub-area");
      setReady(true);

      detach = () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(holdTimer);
        area.removeEventListener("pointermove", onMove as EventListener);
        area.removeEventListener("pointerleave", onLeave as EventListener);
        area.removeEventListener("pointerdown", onDown as EventListener);
        area.removeEventListener("pointermove", onTouchMove as EventListener);
        area.removeEventListener("pointerup", onTouchEnd as EventListener);
        area.removeEventListener("pointercancel", onTouchEnd as EventListener);
        area.classList.remove("scrub-area");
      };
    };

    // Interaction waits for the metadata (the duration); it may already have arrived before hydration.
    video.pause();
    if (video.readyState >= 1) enable();
    video.addEventListener("loadedmetadata", enable);
    return () => {
      disposed = true;
      video.removeEventListener("loadedmetadata", enable);
      detach?.();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label="The academy's guide, a cowboy leaning on a barrel beside his horse. Their heads turn to follow your cursor."
      data-scrub-ready={ready ? "true" : "false"}
      className={cn("pointer-events-none relative overflow-hidden bg-[#e8c1a5]", className)}
    >
      <video
        ref={videoRef}
        src={SRC}
        poster={POSTER}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        controls={false}
        tabIndex={-1}
        aria-hidden
        style={{ objectPosition }}
        className={cn("pointer-events-none absolute inset-0 h-full w-full select-none", fit === "contain" ? "object-contain" : "object-cover")}
      />
    </div>
  );
}
