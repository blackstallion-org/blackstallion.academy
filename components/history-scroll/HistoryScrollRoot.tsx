"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/motion/reduced";

type Reading = { reading: boolean; setReading: (v: boolean) => void };
const ReadingContext = createContext<Reading>({ reading: false, setReading: () => {} });
export const useReadingMode = () => useContext(ReadingContext);

/** Parallax amplitudes, in percent of each layer's own height (docs/history-scrolls/PLAN.md). */
const DEPTH = { B: [-2, 2], S: [-0.5, 0.5], F: [3, -3] } as const;

/**
 * Wraps one history page. Owns the reading mode (static flow, every word visible) and the scroll-linked layer motion.
 * Motion is scoped to this page: one gsap.context, reverted on unmount, so other pages' triggers are untouched. Lenis is
 * the site's root instance (components/motion/SmoothScroll); SiteParallax already forwards its scroll to ScrollTrigger.
 */
export function HistoryScrollRoot({ children, grain }: { children: ReactNode; grain?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [reading, setReading] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced || reading) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-hs-scene]").forEach((scene) => {
        const layers = (["B", "S", "F"] as const)
          .map((k) => [k, scene.querySelector<HTMLElement>(`[data-hs-layer="${k}"]`)] as const)
          .filter((x): x is readonly ["B" | "S" | "F", HTMLElement] => Boolean(x[1]));
        if (!layers.length) return;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        });
        layers.forEach(([k, el]) => tl.fromTo(el, { yPercent: DEPTH[k][0] }, { yPercent: DEPTH[k][1] }, 0));
      });
    }, root);

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
      ctx.revert();
    };
  }, [reduced, reading]);

  // Switching reading mode changes the page height; keep the visitor at the scene they were on.
  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [reading]);

  const style = grain ? ({ "--hs-grain": `url("${grain}")` } as CSSProperties) : undefined;
  return (
    <ReadingContext.Provider value={{ reading, setReading }}>
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
