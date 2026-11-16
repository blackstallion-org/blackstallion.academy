"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { STUDY_CROPS, STUDY_FRAME, studyViews, type StudyHotspot, type StudyViewId } from "@/lib/content/anatomy-study";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/*
 * The stage is one box whose aspect ratio is the crop of the plate on show, so a hotspot placed in percent of that box
 * sits on the same anatomy at every width. The crop (and the hotspot maths that follows it) lives in CSS custom
 * properties: the tight crop below 1024 px, the wide one above, switched by a media query so the server render and the
 * first paint already have the right shape. Values come from lib/content/anatomy-study.ts.
 */
type Crop = { x: number; y: number; w: number; h: number };
const cropVars = ({ x, y, w, h }: Crop) =>
  `--cx:${x / STUDY_FRAME.width};--cy:${y / STUDY_FRAME.height};--cw:${w / STUDY_FRAME.width};--ch:${h / STUDY_FRAME.height};--ar:${w}/${h};--arn:${w / h};`;
const fade = (edge: string) => `linear-gradient(90deg,transparent,black ${edge},black calc(100% - ${edge}),transparent),linear-gradient(180deg,transparent,black 5%,black 96.5%,transparent)`;
const STAGE_CSS = [
  // Never taller than the screen below the bar: the width shrinks before the horse is cut off.
  `.hrs-stage{${cropVars(STUDY_CROPS.tight)}--fx:2%;width:min(100%,calc((100svh - 5rem) * var(--arn)));margin-inline:auto}`,
  `@media (min-width:1024px){.hrs-stage{${cropVars(STUDY_CROPS.wide)}--fx:9%}}`,
  `.hrs-box{aspect-ratio:var(--ar)}`,
  // The plate's parchment melts into the section instead of ending in a hard edge.
  `.hrs-mask{-webkit-mask-image:${fade("var(--fx)")};-webkit-mask-composite:source-in;mask-image:${fade("var(--fx)")};mask-composite:intersect}`,
  `.hrs-plate{position:absolute;left:calc(var(--cx) / var(--cw) * -100%);top:calc(var(--cy) / var(--ch) * -100%);width:calc(100% / var(--cw));height:calc(100% / var(--ch))}`,
  `.hrs-at{left:calc((var(--hx) - var(--cx)) / var(--cw) * 100%);top:calc((var(--hy) - var(--cy)) / var(--ch) * 100%)}`,
].join("\n");

const spotVars = (spot: StudyHotspot) => ({ "--hx": spot.x / 100, "--hy": spot.y / 100 }) as CSSProperties;

/** An anchored note renders here, unseen, until it has been measured and placed (before the first paint). */
const UNPLACED: CSSProperties = { left: 0, top: 0, visibility: "hidden" };

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/**
 * Where an open note sits, in px inside the stage box. Candidates: beside the point on either side or out at either
 * margin of the stage, at several heights around it, always inside the stage. A note never covers its own ring, stays
 * next to its point (one far away reads as unrelated), then covers as few other points as possible, then sits closest.
 */
function placeNote(box: DOMRect, note: { w: number; h: number }, dot: DOMRect, others: DOMRect[]) {
  const pad = 8;
  const gap = 20;
  const lift = 18;
  const reach = 64;
  // Other points keep their whole hit area clear; the open point only needs its visible ring clear.
  const centre = (r: DOMRect, share: number) => ({ x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, r: r.width * share + 2 });
  const own = centre(dot, 0.35);
  const points = others.map((r) => centre(r, 0.5));
  const maxLeft = box.width - note.w - pad;
  const maxTop = box.height - note.h - pad;
  const lefts = [own.x + gap, own.x - gap - note.w, maxLeft, pad];
  const highest = own.y + lift - note.h;
  const tops = [0, 0.25, 0.5, 0.75, 1].map((t) => own.y - lift + (highest - (own.y - lift)) * t).concat(pad, maxTop);
  let best = { left: 0, top: 0, score: Infinity };
  for (const wantLeft of lefts) {
    for (const wantTop of tops) {
      const left = clamp(wantLeft, pad, maxLeft);
      const top = clamp(wantTop, pad, maxTop);
      const near = (p: { x: number; y: number }) => {
        const dx = p.x - clamp(p.x, left, left + note.w);
        const dy = p.y - clamp(p.y, top, top + note.h);
        return Math.hypot(dx, dy);
      };
      const distance = near(own);
      const hits = points.filter((p) => near(p) < p.r).length;
      const score = (distance < own.r ? 20000 : 0) + (distance > reach ? 5000 : 0) + hits * 1000 + distance;
      if (score < best.score) best = { left, top, score };
    }
  }
  return best;
}

const ANCHOR_QUERY = "(min-width: 1024px)";
/**
 * Phones and tablets dock the note under the stage; from 1024 px (the wide crop) it is anchored beside its point. Below
 * that the stage is too small for a note to sit next to a point without covering its neighbours (measured at 640 and
 * 768 px). Closed on the server, so no mismatch.
 */
function useAnchoredNotes(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(ANCHOR_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(ANCHOR_QUERY).matches,
    () => true,
  );
}

/**
 * "One conversation. Two bodies." A static, horse-first study plate: one Marwari and cadet in coat, muscle and skeleton
 * views that cross-fade, with points on the horse that open a short note only when chosen. Replaces the iframe exhibit
 * (walk/trot/canter, x-ray blend, learning paths and panels removed at the owner's request, 16 Nov 2026).
 */
export function HorseRiderStudy() {
  const uid = useId();
  const headingId = `${uid}-h`;
  const panelId = `${uid}-panel`;
  const noteId = `${uid}-note`;
  const reduce = useReducedMotion();
  const anchored = useAnchoredNotes();

  const [viewId, setViewId] = useState<StudyViewId>(studyViews[0].id);
  const [openId, setOpenId] = useState<string | null>(null);
  const openRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dotRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    openRef.current = openId;
  }, [openId]);

  // Place an anchored note before it is painted, and again when the window changes size. The position is written to the
  // element directly; React keeps rendering the same unplaced style, so it never overwrites it.
  useLayoutEffect(() => {
    if (!openId || !anchored) return;
    const run = () => {
      const layer = layerRef.current;
      const el = noteRef.current;
      const dot = dotRefs.current.get(openId);
      if (!layer || !el || !dot) return;
      const box = layer.getBoundingClientRect();
      const point = dot.getBoundingClientRect();
      const others = [...dotRefs.current].filter(([id]) => id !== openId).map(([, b]) => b.getBoundingClientRect());
      // Try the note at its full width and narrower (taller), and keep whichever sits better; ties keep it wide.
      el.style.width = "";
      const full = el.offsetWidth;
      let pick: { left: number; top: number; score: number; w: number } | null = null;
      for (const w of [full, Math.round(full * 0.84), Math.round(full * 0.68)]) {
        el.style.width = `${w}px`;
        const p = placeNote(box, { w, h: el.offsetHeight }, point, others);
        if (!pick || p.score < pick.score) pick = { ...p, w };
      }
      if (!pick) return;
      el.style.width = `${pick.w}px`;
      el.style.left = `${pick.left}px`;
      el.style.top = `${pick.top}px`;
      el.style.visibility = "visible";
    };
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [openId, anchored]);

  const view = studyViews.find((v) => v.id === viewId) ?? studyViews[0];
  const openSpot = view.hotspots.find((h) => h.id === openId) ?? null;

  const close = useCallback((refocus: boolean) => {
    const id = openRef.current;
    setOpenId(null);
    if (refocus && id) dotRefs.current.get(id)?.focus({ preventScroll: true });
  }, []);

  // While a note is open: Escape closes it (focus back on its point); a press anywhere outside the stage closes it quietly.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!stageRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [openId, close]);

  const selectView = (id: StudyViewId) => {
    setViewId(id);
    setOpenId(null);
  };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = studyViews.findIndex((v) => v.id === viewId);
    const last = studyViews.length - 1;
    const next =
      e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    selectView(studyViews[next].id);
    tabRefs.current[next]?.focus();
  };

  // On phones the note docks under the stage; bring it on screen if the stage filled the view.
  const revealDocked = useCallback(
    (el: HTMLDivElement | null) => {
      el?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    },
    [reduce],
  );

  const fadeSlow = { duration: reduce ? 0 : 0.9, ease: ease.citadel };
  const fadeQuick = { duration: reduce ? 0 : 0.35, ease: ease.citadel };

  const note = (spot: StudyHotspot, docked: boolean) => (
    <motion.div
      key={spot.id}
      id={noteId}
      ref={docked ? revealDocked : noteRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fadeQuick}
      className={cn(
        // Opaque, so the printed labels on the plate never show through the note.
        "plate pointer-events-auto relative bg-ember p-4 pr-11 sm:p-5 sm:pr-12",
        // Wider on desktop so a note stays short and clears the neighbouring points.
        docked ? "mt-4 scroll-mb-6" : "absolute z-10 w-[19rem] max-w-[calc(100%-1rem)] lg:w-[22.5rem]",
      )}
      style={docked ? undefined : UNPLACED}
    >
      <p className="t-voice text-[1.3rem] leading-tight text-bone">{spot.title}</p>
      <p className="mt-2 text-[0.97rem] leading-[1.55] text-sand">{spot.note}</p>
      <button
        type="button"
        aria-label="Close note"
        onClick={() => close(true)}
        className="absolute right-2 top-2 grid size-9 place-items-center text-dust transition-colors duration-300 hover:text-gold"
      >
        <svg viewBox="0 0 12 12" className="size-3" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M1 1l10 10M11 1L1 11" />
        </svg>
      </button>
    </motion.div>
  );

  return (
    <section
      id="horse-rider-study"
      aria-labelledby={headingId}
      data-parallax-skip
      className="relative bg-umber pb-16 pt-24 md:pb-24 md:pt-28"
    >
      <style>{STAGE_CSS}</style>
      <div className="gutter">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <div>
              <Label>Horse and rider</Label>
              <Headline
                id={headingId}
                size="3"
                className="mt-3 text-[clamp(1.9rem,3.4vw,3.1rem)] leading-[1.02]"
                inscription="One conversation."
                voice="two bodies."
              />
            </div>
            <div className="flex flex-col items-start gap-2.5 sm:items-end">
              <div role="tablist" aria-label="Layer" onKeyDown={onTabKey} className="inline-flex border border-line">
                {studyViews.map((v, i) => {
                  const selected = v.id === viewId;
                  return (
                    <button
                      key={v.id}
                      ref={(el) => {
                        tabRefs.current[i] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`${uid}-tab-${v.id}`}
                      aria-selected={selected}
                      aria-controls={panelId}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectView(v.id)}
                      className={cn(
                        "label min-h-11 px-4 transition-colors duration-500 sm:px-6",
                        selected ? "bg-gold text-ember" : "text-sand hover:text-gold",
                      )}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
              <p className="t-ui text-sm text-dust">Choose a point on the horse.</p>
            </div>
          </div>

          <div
            ref={stageRef}
            role="tabpanel"
            id={panelId}
            aria-labelledby={`${uid}-tab-${view.id}`}
            className="hrs-stage relative mt-6 md:mt-8"
          >
            {/* The plates. A click on the picture itself (not a point) closes the open note without pulling focus back to the point. */}
            <div className="hrs-box hrs-mask relative overflow-hidden" onClick={() => openRef.current && close(false)}>
              {studyViews.map((v) => {
                const active = v.id === view.id;
                return (
                  <motion.div
                    key={v.id}
                    aria-hidden={!active}
                    initial={false}
                    animate={{ opacity: active ? 1 : 0 }}
                    transition={fadeSlow}
                    className="hrs-plate select-none"
                  >
                    <Image
                      src={v.src}
                      alt={v.alt}
                      fill
                      quality={90}
                      sizes="(min-width: 1024px) 115vw, 165vw"
                      draggable={false}
                      className="object-contain"
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* The points, over the plates in the same box (unmasked, so a note near the edge stays crisp). */}
            <div ref={layerRef} className="hrs-box pointer-events-none absolute inset-x-0 top-0">
              <AnimatePresence initial={false}>
                <motion.div
                  key={view.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { ...fadeSlow, delay: reduce ? 0 : 0.3 } }}
                  className="absolute inset-0"
                >
                  {view.hotspots.map((spot) => {
                    const open = spot.id === openId;
                    return (
                      <Fragment key={spot.id}>
                        <button
                          ref={(el) => {
                            if (el) dotRefs.current.set(spot.id, el);
                            else dotRefs.current.delete(spot.id);
                          }}
                          type="button"
                          aria-label={spot.title}
                          aria-expanded={open}
                          aria-controls={open ? noteId : undefined}
                          onClick={() => setOpenId((cur) => (cur === spot.id ? null : spot.id))}
                          style={spotVars(spot)}
                          className="hrs-at group pointer-events-auto absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-gold sm:size-10"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute size-5 rounded-full border border-ember/85 transition-[transform,background-color] duration-500 ease-[var(--ease-citadel)] group-hover:scale-110 sm:size-7",
                              open ? "scale-125 bg-gold/45" : "bg-gold/20",
                            )}
                          />
                          <span
                            aria-hidden
                            className={cn(
                              "relative size-2 rounded-full shadow-[0_0_0_2px_var(--color-ember)] transition-colors duration-300 sm:size-2.5",
                              open ? "bg-bone" : "bg-gold",
                            )}
                          />
                        </button>
                        {open && anchored && note(spot, false)}
                      </Fragment>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {openSpot && !anchored && note(openSpot, true)}
          </div>

          {/* Read the opened note aloud; the point keeps focus. */}
          <p className="sr-only" aria-live="polite">
            {openSpot ? `${openSpot.title}. ${openSpot.note}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
