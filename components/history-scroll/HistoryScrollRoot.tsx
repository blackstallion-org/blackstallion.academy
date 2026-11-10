"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/motion/reduced";
import { WORLDS, type Gait, type WorldId } from "@/lib/content/history/motion";

type Reading = { reading: boolean; setReading: (v: boolean) => void; world: WorldId };
const ReadingContext = createContext<Reading>({ reading: false, setReading: () => {}, world: "world" });
export const useReadingMode = () => useContext(ReadingContext);

/** Scroll energy, 0 at rest and rising with scroll speed; the gait loops and the atmosphere canvases read it. */
export const energy = { v: 0 };

const IDLE: Record<Gait, number> = { gallop: 0.35, canter: 0.35, walk: 0.4, rear: 1, still: 1 };

/** One cycle of a gait on the subject's inner wrapper, transform origin at the hooves. */
function gaitLoop(el: HTMLElement, gait: Gait, dir: number) {
  const tl = gsap.timeline({ repeat: -1, paused: true });
  if (gait === "gallop") {
    tl.to(el, { yPercent: -4.5, rotation: -1.6 * dir, duration: 0.2, ease: "sine.out" })
      .to(el, { yPercent: 0, rotation: 1.1 * dir, duration: 0.26, ease: "sine.in" })
      .to(el, { rotation: 0, duration: 0.08, ease: "none" });
  } else if (gait === "canter") {
    tl.to(el, { yPercent: -3, rotation: -1.1 * dir, duration: 0.3, ease: "sine.out" })
      .to(el, { yPercent: 0, rotation: 0.8 * dir, duration: 0.36, ease: "sine.in" })
      .to(el, { rotation: 0, duration: 0.12, ease: "none" });
  } else if (gait === "walk") {
    tl.to(el, { yPercent: -1.1, rotation: 0.5 * dir, duration: 0.55, ease: "sine.inOut" })
      .to(el, { yPercent: 0, rotation: -0.4 * dir, duration: 0.55, ease: "sine.inOut" });
  } else if (gait === "rear") {
    gsap.set(el, { transformOrigin: dir > 0 ? "30% 100%" : "70% 100%" });
    tl.to(el, { rotation: -3.5 * dir, yPercent: -1.5, duration: 1.4, ease: "sine.inOut" })
      .to(el, { rotation: 0, yPercent: 0, duration: 1.6, ease: "sine.inOut" });
  } else {
    tl.to(el, { scaleY: 1.008, duration: 1.8, ease: "sine.inOut" }).to(el, { scaleY: 1, duration: 1.8, ease: "sine.inOut" });
  }
  return tl;
}

/**
 * Wraps one history page. Owns the reading mode (static flow, every word visible) and the scroll-linked layer motion.
 * Motion is scoped to this page: one gsap.context, reverted on unmount, so other pages' triggers are untouched. Lenis is
 * the site's root instance (components/motion/SmoothScroll); SiteParallax already forwards its scroll to ScrollTrigger.
 */
export function HistoryScrollRoot({ children, grain, world }: { children: ReactNode; grain?: string; world: WorldId }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [reading, setReading] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced || reading) return;
    gsap.registerPlugin(ScrollTrigger);
    const W = WORLDS[world];
    const loops: { tl: gsap.core.Timeline; idle: number; on: boolean }[] = [];
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-hs-scene]").forEach((scene) => {
        const B = scene.querySelector<HTMLElement>('[data-hs-layer="B"]');
        const S = scene.querySelector<HTMLElement>('[data-hs-layer="S"]');
        const F = scene.querySelector<HTMLElement>('[data-hs-layer="F"]');
        const gaitEl = S?.querySelector<HTMLElement>(".hs-gait");
        const gait = (S?.dataset.hsGait as Gait | undefined) ?? undefined;
        const dir = Number(S?.dataset.hsDir ?? 1);
        const travel = Number(S?.dataset.hsTravel ?? 0);
        const loop = gaitEl && gait ? { tl: gaitLoop(gaitEl, gait, dir), idle: IDLE[gait], on: false } : undefined;
        if (loop) loops.push(loop);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: scene,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              if (!loop) return;
              loop.on = self.isActive;
              if (self.isActive) loop.tl.play();
              else loop.tl.pause();
            },
          },
        });
        if (B) tl.fromTo(B, { yPercent: -W.depth.B, scale: 1 + W.push }, { yPercent: W.depth.B, scale: 1 }, 0);
        if (S) {
          const art = S.parentElement ?? scene;
          tl.fromTo(
            S,
            { x: () => (-dir * travel * art.clientWidth) / 200, yPercent: -1 },
            { x: () => (dir * travel * art.clientWidth) / 200, yPercent: 1 },
            0,
          );
        }
        if (F) tl.fromTo(F, { yPercent: W.depth.F }, { yPercent: -W.depth.F }, 0);
      });

      // Scroll speed feeds the energy; it eases back to rest on its own when the visitor stops.
      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const target = Math.min(Math.abs(self.getVelocity()) / 1400, 2.2);
          if (target > energy.v) gsap.to(energy, { v: target, duration: 0.25, overwrite: true });
        },
      });
    }, root);

    const tick = () => {
      energy.v *= 0.95;
      if (energy.v < 0.002) energy.v = 0;
      for (const l of loops) if (l.on) l.tl.timeScale(l.idle + energy.v * (l.idle < 1 ? 1.1 : 0.4));
    };
    gsap.ticker.add(tick);

    let raf = 0;
    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    // Late images change section heights on narrow screens; refresh once each settles.
    const imgs = Array.from(root.querySelectorAll("img"));
    imgs.forEach((img) => !img.complete && img.addEventListener("load", refresh, { once: true }));
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      imgs.forEach((img) => img.removeEventListener("load", refresh));
      gsap.ticker.remove(tick);
      loops.forEach((l) => l.tl.kill());
      energy.v = 0;
      ctx.revert();
    };
  }, [reduced, reading, world]);

  // Switching reading mode changes the page height; keep the visitor at the scene they were on.
  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [reading]);

  const style = grain ? ({ "--hs-grain": `url("${grain}")` } as CSSProperties) : undefined;
  return (
    <ReadingContext.Provider value={{ reading, setReading, world }}>
      <div ref={ref} className="hs hs-paper" data-reading={reading ? "static" : "story"} style={style} data-parallax-skip>
        {children}
      </div>
    </ReadingContext.Provider>
  );
}

/** "Read the story": switches the page to static flow with all narrative visible. */
export function ReadingToggle() {
  const { reading, setReading } = useReadingMode();
  return (
    <button type="button" className="hs-button" aria-pressed={reading} onClick={() => setReading(!reading)}>
      {reading ? "Back to the scroll" : "Read the story"}
    </button>
  );
}
