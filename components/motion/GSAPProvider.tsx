"use client";

import { useEffect } from "react";

/**
 * Registers GSAP plugins once on the client. Mount high in the tree (layout).
 * Works alongside the existing motion/react (Framer) setup — no conflicts.
 */
export function GSAPProvider() {
  useEffect(() => {
    async function boot() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { SplitText } = await import("gsap/SplitText");
      gsap.registerPlugin(ScrollTrigger, SplitText);

      // Keep GSAP ScrollTrigger in sync when Lenis smooth-scrolls
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop() {
          return window.scrollY;
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: "transform",
      });
      ScrollTrigger.defaults({ scroller: document.body });

      return () => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    }
    const cleanup = boot();
    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, []);

  return null;
}
