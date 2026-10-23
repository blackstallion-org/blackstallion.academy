"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import type { MediaKey } from "@/lib/content/media";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * A framed photograph that opens to full bleed as the reader scrolls (adapted from React Bits "ScrollExpand").
 * The stage is pinned with CSS sticky for `scrollDistance + holdDistance` screens; the frame is a clip-path
 * inset that eases to zero while the photo zooms back to 1. The title lifts away; `children` fade in on
 * the open frame, held by the `shade-b` gradient.
 * Reduced motion: no pinning, no zoom; the open frame and its content render as a normal section.
 */
type ExpandingFrameProps = {
  image: MediaKey;
  /** Shown over the closed frame (outside the clip), lifts away as it opens. */
  title?: ReactNode;
  /** Small cue under the closed frame. */
  hint?: string;
  children?: ReactNode;
  startWidth?: number;
  startHeight?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  label?: string;
  className?: string;
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

export function ExpandingFrame({
  image,
  title,
  hint,
  children,
  startWidth = 46,
  startHeight = 56,
  mediaZoom = 1.3,
  scrollDistance = 1.2,
  holdDistance = 0.4,
  label,
  className,
}: ExpandingFrameProps) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!track || !frame || !media) return;
    let raf = 0;
    let current = 0;
    let target = 0;

    const apply = (p: number) => {
      const e = smooth(0, 1, p);
      const w = startWidth + (100 - startWidth) * e;
      const h = startHeight + (100 - startHeight) * e;
      frame.style.clipPath = `inset(${(100 - h) / 2}% ${(100 - w) / 2}% ${(100 - h) / 2}% ${(100 - w) / 2}%)`;
      media.style.transform = `scale(${mediaZoom + (1 - mediaZoom) * e})`;
      if (titleRef.current) {
        const out = smooth(0.35, 0.85, p);
        titleRef.current.style.opacity = String(1 - out);
        titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0)`;
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - smooth(0, 0.12, p));
      if (scrimRef.current) scrimRef.current.style.opacity = String(smooth(0.5, 1, p));
      if (overlayRef.current) {
        const inn = smooth(0.7, 1, p);
        overlayRef.current.style.opacity = String(inn);
        overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
        overlayRef.current.style.visibility = inn < 0.01 ? "hidden" : "visible";
      }
    };
    const read = () => clamp(-track.getBoundingClientRect().top / (window.innerHeight * scrollDistance), 0, 1);
    const tick = () => {
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.0005) current = target;
      apply(current);
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = read();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    target = current = read();
    apply(current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, startWidth, startHeight, mediaZoom, scrollDistance]);

  if (reduced) {
    return (
      <section aria-label={label} className={cn("tone-dark relative bg-night", className)}>
        <div className="relative min-h-[100svh] overflow-hidden">
          <FilmImage name={image} grade="deep" sizes="100vw" />
          <div aria-hidden className="shade-b absolute inset-0" />
          <div aria-hidden className="shade-l absolute inset-0" />
          {title ? <div className="gutter relative pt-28">{title}</div> : null}
          <div className="gutter relative flex min-h-[60svh] flex-col justify-end pb-[10vh]">{children}</div>
        </div>
      </section>
    );
  }

  return (
    <section ref={trackRef} aria-label={label} className={cn("tone-dark relative bg-night", className)} style={{ height: `${(1 + scrollDistance + holdDistance) * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div
          ref={frameRef}
          className="absolute inset-0 will-change-[clip-path]"
          style={{ clipPath: `inset(${(100 - startHeight) / 2}% ${(100 - startWidth) / 2}%)` }}
        >
          <div ref={mediaRef} className="absolute inset-0 will-change-transform" style={{ transform: `scale(${mediaZoom})` }}>
            <FilmImage name={image} grade="deep" sizes="100vw" />
          </div>
          <div aria-hidden className="shade-b absolute inset-0" />
          <div ref={scrimRef} aria-hidden className="shade-l absolute inset-0" style={{ opacity: 0 }} />
          <div ref={overlayRef} className="gutter absolute inset-0 flex flex-col justify-end pb-[10vh]" style={{ opacity: 0, visibility: "hidden" }}>
            {children}
          </div>
        </div>
        {title ? (
          <div ref={titleRef} className="gutter pointer-events-none absolute inset-0 flex items-center justify-center text-center">
            {title}
          </div>
        ) : null}
        {hint ? (
          <p ref={hintRef} className="label absolute inset-x-0 bottom-6 text-center text-dust">
            {hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
