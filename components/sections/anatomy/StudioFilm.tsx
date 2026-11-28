"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { asset } from "@/lib/content/asset";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * The specimen plate's living view (15 Nov 2026, owner): a studio film of a standing black Marwari replaces the 3D model.
 *
 * 26 Nov 2026 (owner): the plate film is now the owner's new black-stallion clip (marwari_stallion_loop_720p, 10 s), cropped to x 120–1184 of its
 * 1280 x 720 frame (1064 x 720, no sound), its last 0.6 s cross-faded into its first (9.46 s), hotspots re-measured in lib/content/anatomy.ts.
 * 28 Nov 2026: renamed stallion-plate-2611* (was stallion-loop*) so no browser or CDN can keep serving the old brown horse from cache.
 * The notes below describe the previous clip.
 *
 * public/video/stallion-plate-2611.mp4 (17 Nov 2026, owner: the 5-second loop goes back on the plate; the 10 s studio film moved to the
 * /anatomy hero): the owner's clip horse_natural_movement_no_tack, cropped to x 104–1240 of its 1344 x 768 frame to drop the dark side strips
 * (1136 x 768), no sound. The first 0.75 s is cut and
 * the last 0.75 s cross-fades into it, so the file ends on the frame before its own first frame and the loop never jumps (4.42 s).
 * The film sits in the middle of a black stage and its side edges fade into it. Points are placed in % of the film.
 *
 * Choosing a point moves the camera in: the film box is translated and scaled (it keeps playing), clamped so it always fills the
 * stage. The markers live in an unscaled layer whose translate moves on the same curve and clock, so they stay on the horse and
 * stay crisp. "Whole horse", Escape, the active point again or the empty stage go back. Reduced motion: a still frame and no zoom.
 * The buttons are above the markers and drop to the bottom corner when the chosen point would sit under them (ears, small stage).
 */

export type FilmPoint = { id: string; name: string; title: string; x: number; y: number };

const SRC = asset("/video/stallion-plate-2611.mp4");
const SRC_PHONE = asset("/video/stallion-plate-2611-mobile.mp4");
const POSTER = asset("/video/stallion-plate-2611-poster.webp");
/** The film is shown whole (1064 x 720), so its box has the film's own proportions. */
export const FILM_ASPECT = 1064 / 720;
const ASPECT = FILM_ASPECT;
const ZOOM = 2.2;
const MOVE = "transform 0.95s cubic-bezier(0.16, 1, 0.3, 1)";

export function StudioFilm({
  points,
  activeId,
  onSelect,
  detail,
  className,
}: {
  points: FilmPoint[];
  /** "overview" for the whole horse, or a point id. */
  activeId: string;
  onSelect: (id: string) => void;
  detail?: ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [src, setSrc] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
      setWide(window.innerWidth >= 1024);
    });
    ro.observe(el);
    // the phone file is a third of the size; chosen once, at mount
    setSrc(window.matchMedia("(max-width: 767px)").matches ? SRC_PHONE : SRC);
    const sync = () => setFullscreen(document.fullscreenElement === el);
    document.addEventListener("fullscreenchange", sync);
    return () => { ro.disconnect(); document.removeEventListener("fullscreenchange", sync); };
  }, []);

  // play only while on screen (and never under reduced motion)
  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    if (reduced) { v.pause(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !paused) v.play().catch(() => setPaused(true));
      else v.pause();
    }, { rootMargin: "100px" });
    io.observe(v);
    return () => io.disconnect();
  }, [src, reduced, paused]);

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) { setPaused(false); v.play().catch(() => setPaused(true)); }
    else { setPaused(true); v.pause(); }
  };
  const toggleFullscreen = useCallback(() => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  }, []);

  // the film box at rest: full stage height, the film's own shape, centred (on a phone the stage has the same shape, so it fills it)
  const { w: W, h: H } = size;
  let fh = H;
  let fw = H * ASPECT;
  if (fw > W) { fw = W; fh = W / ASPECT; }
  const left0 = (W - fw) / 2;
  const top0 = (H - fh) / 2;

  const active = points.find((p) => p.id === activeId);
  const zoomed = !!active && !reduced && W > 0;
  const s = zoomed ? ZOOM : 1;
  let tx = 0;
  let ty = 0;
  if (zoomed && active) {
    // aim the point at the middle of the free part of the stage (left of the detail panel on wide screens)
    const aimX = detail !== undefined && wide && !fullscreen ? W * 0.36 : W / 2;
    const fx = (active.x / 100) * fw;
    const fy = (active.y / 100) * fh;
    tx = aimX - left0 - s * fx;
    ty = H * 0.48 - top0 - s * fy;
    const fit = (t: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, t)));
    tx = fit(tx, W - left0 - s * fw, -left0);
    ty = fit(ty, H - top0 - s * fh, -top0);
  }
  // The buttons sit in the top-right corner. On a small stage a point near the top of the horse (the ears) lands under them
  // when the camera is in, so they move to the bottom-right for that view.
  const activeX = active ? left0 + tx + s * (active.x / 100) * fw : 0;
  const activeY = active ? top0 + ty + s * (active.y / 100) * fh : 0;
  const controlsW = W >= 600 ? 420 : 280; // three buttons from sm up, two on a phone
  const controlsLow = zoomed && activeY < 96 && activeX > W - controlsW;
  /** A point that is not the chosen one and would show from behind the buttons while the camera is in. */
  const underControls = (x: number, y: number) => zoomed && x > W - controlsW && (controlsLow ? y > H - 88 : y < 88);
  const feather = fw < W - 1 && !zoomed;
  const mask = feather ? "linear-gradient(90deg, transparent 0, black 7%, black 93%, transparent 100%)" : "none";
  const transition = reduced ? "none" : MOVE;

  return (
    <div
      ref={box}
      onKeyDown={(e) => { if (e.key === "Escape" && activeId !== "overview") onSelect("overview"); }}
      onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.stage) if (activeId !== "overview") onSelect("overview"); }}
      data-fullscreen={fullscreen ? "" : undefined}
      className={cn("group/plate relative h-full w-full select-none overflow-hidden bg-black", className)}
    >
      {/* the film box: translated and scaled together with its video */}
      <div
        data-stage=""
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: fw,
          height: fh,
          transform: `translate(${left0 + tx}px, ${top0 + ty}px) scale(${s})`,
          transformOrigin: "0 0",
          transition,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        {src && (
          <video
            ref={video}
            src={src}
            poster={POSTER}
            muted
            loop={!reduced}
            playsInline
            preload={reduced ? "none" : "auto"}
            aria-label="Studio film of a black Marwari stallion standing in profile, facing left"
            className="pointer-events-none block h-full w-full object-cover"
          />
        )}
        {!src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={POSTER} alt="" className="block h-full w-full object-cover" />
        )}
      </div>

      {/* markers: unscaled, moved on the same curve as the film so they stay on the horse */}
      {W > 0 && (
        <ul aria-label="Points on the horse" className="pointer-events-none absolute inset-0 z-[25]">
          {points.map((p) => {
            const x = left0 + tx + s * (p.x / 100) * fw;
            const y = top0 + ty + s * (p.y / 100) * fh;
            const on = p.id === activeId;
            const hidden = x < 0 || x > W || y < 0 || y > H || (!on && underControls(x, y));
            return (
              <li key={p.id} className="absolute left-0 top-0" style={{ transform: `translate(${x}px, ${y}px)`, transition, visibility: hidden ? "hidden" : undefined }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelect(on ? "overview" : p.id); }}
                  aria-pressed={on}
                  aria-label={`${p.name}: ${p.title}`}
                  className="group pointer-events-auto absolute -ml-5 -mt-5 grid h-10 w-10 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <span className={cn("absolute h-4 w-4 rounded-full border border-gold animate-pulse-ring", on ? "opacity-100" : "opacity-60")} style={{ animationDuration: "1.4s" }} />
                  {on && <span aria-hidden className="absolute h-8 w-8 rounded-full border border-gold/80" />}
                  <span className={cn("relative h-2.5 w-2.5 rounded-full transition-colors", on ? "bg-gold" : "bg-bone/80 group-hover:bg-gold")} />
                  <span
                    className={cn(
                      "label pointer-events-none absolute top-9 whitespace-nowrap text-[0.62rem] transition-opacity [text-shadow:0_0_6px_black,0_0_2px_black]",
                      on ? "text-gold opacity-100" : "text-bone opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 md:opacity-75",
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* plate markings */}
      <div aria-hidden className="pointer-events-none absolute inset-3 z-10 border border-line/40" />
      <p className={cn("label pointer-events-none absolute bottom-4 left-5 z-10 hidden text-[0.6rem] text-sand/80 transition-opacity sm:block", zoomed && "opacity-0")}>
        Studio film · Black Marwari stallion
      </p>
      <p className={cn("label pointer-events-none absolute bottom-4 right-5 z-10 hidden text-[0.6rem] text-sand/60 transition-opacity sm:block", (zoomed || detail === undefined) ? "sm:hidden" : "")}>
        Choose a point to look closer
      </p>

      {/* controls */}
      <div className={cn("absolute right-4 z-30 flex flex-wrap items-center justify-end gap-2", controlsLow ? "bottom-4" : "top-4")}>
        {zoomed && (
          <button type="button" onClick={() => onSelect("overview")} className="label min-h-11 rounded-full border border-gold/60 bg-black/60 px-4 text-[0.62rem] text-gold backdrop-blur-sm transition-colors hover:bg-gold hover:text-night focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            Whole horse
          </button>
        )}
        {!reduced && (
          <button type="button" onClick={togglePlay} aria-pressed={paused} className="label min-h-11 rounded-full border border-line bg-black/60 px-4 text-[0.62rem] text-sand backdrop-blur-sm transition-colors hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            {paused ? "Play film" : "Pause film"}
          </button>
        )}
        <button type="button" onClick={toggleFullscreen} aria-pressed={fullscreen} className="label hidden min-h-11 rounded-full border border-line bg-black/60 px-4 text-[0.62rem] text-sand backdrop-blur-sm transition-colors hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:inline-flex sm:items-center">
          {fullscreen ? "Exit full screen" : "Full screen"}
        </button>
      </div>

      {/* detail slot: a side panel from lg up, a bottom sheet in full screen on small screens; below lg the caller shows it under the plate */}
      {detail !== undefined && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 hidden max-h-[48%] flex-col justify-end group-data-[fullscreen]/plate:flex lg:inset-x-auto lg:bottom-4 lg:right-4 lg:flex lg:max-h-[calc(100%-5.5rem)] lg:w-[21rem] xl:w-[23rem]">
          {detail}
        </div>
      )}
    </div>
  );
}
