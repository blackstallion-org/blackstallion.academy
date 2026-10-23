"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SKIP_IMAGE = [
  "button", "a", "[role='button']", "[data-parallax-skip]", "[data-editorial-image]",
  "[data-home-drift]", "[data-home-figure]", "[aria-hidden='true']",
].join(",");

function hasClippedFrame(image: HTMLImageElement, section: HTMLElement) {
  let parent = image.parentElement;
  while (parent && parent !== section) {
    const style = getComputedStyle(parent);
    if ([style.overflowX, style.overflowY].some((value) => value === "hidden" || value === "clip")) return true;
    parent = parent.parentElement;
  }
  return false;
}

/** One ScrollTrigger per editorial section, with independently paced image layers. */
export function SiteParallax() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const unsubscribe = lenis?.on("scroll", ScrollTrigger.update);
    return () => { unsubscribe?.(); };
  }, [lenis]);

  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    let frame = 0;
    let disposed = false;
    const media = gsap.matchMedia();

    const mount = () => {
      if (disposed) return;
      media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" }, ({ conditions }) => {
        if (!conditions?.motion) return;
        const desktop = Boolean(conditions.desktop);
        const context = gsap.context(() => {
          main.querySelectorAll<HTMLElement>("section").forEach((section) => {
            if (section.closest("[data-parallax-skip]") || section.matches("[data-parallax-skip]")) return;
            const images = Array.from(section.querySelectorAll<HTMLImageElement>("img"))
              .filter((image) => image.closest("section") === section)
              .filter((image) => {
                if (image.closest(SKIP_IMAGE) || image.style.transform) return false;
                const box = image.getBoundingClientRect();
                return box.width >= 240 && box.height >= 180 && hasClippedFrame(image, section);
              });

            const heading = section.querySelector<HTMLElement>("h2, h3");
            const plainHeading = heading && !heading.querySelector(".t-inscribe, .t-voice") &&
              !heading.closest("[data-editorial-headline], [data-home-phrase], [data-parallax-skip]") &&
              !heading.style.transform ? heading : null;
            if (!images.length && !plainHeading) return;

            const timeline = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: section,
                start: "clamp(top bottom)",
                end: "clamp(bottom top)",
                scrub: desktop ? 0.6 : 0.35,
                invalidateOnRefresh: true,
              },
            });
            images.forEach((image, index) => {
              const depth = (desktop ? 3.5 : 1.6) + Math.min(index % 4, 3) * (desktop ? 1.5 : 0.5);
              timeline.fromTo(image,
                { yPercent: -depth, scale: desktop ? 1.1 : 1.055 },
                { yPercent: depth, scale: desktop ? 1.1 : 1.055, duration: 1 }, 0);
            });
            if (plainHeading) timeline.fromTo(plainHeading,
              { y: desktop ? 14 : 7 }, { y: desktop ? -14 : -7, duration: 1 }, 0);
          });
        }, main);
        return () => { context.revert(); };
      });
      void document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    };
    // The route tree renders before this frame; wait for its DOM without changing SSR output.
    frame = requestAnimationFrame(mount);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      media.revert();
    };
  }, [pathname]);

  return null;
}
