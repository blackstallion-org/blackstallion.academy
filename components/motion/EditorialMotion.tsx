"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Headline } from "@/components/film/Headline";
import styles from "./EditorialMotion.module.css";

/** Only mounted by the three approved routes. Lenis retains its existing RAF owner. */
export function EditorialScrollSync() {
  const lenis = useLenis();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const unsubscribe = lenis?.on("scroll", ScrollTrigger.update);
    let mounted = true;
    void document.fonts.ready.then(() => {
      if (mounted) ScrollTrigger.refresh();
    });
    return () => { mounted = false; unsubscribe?.(); };
  }, [lenis]);
  // The existing site loader otherwise obscures server-rendered content without JS.
  // This noscript rule is present only on the three opted-in routes.
  return <noscript><style>{`
    .bsah-loader { display: none !important; }
    main [style*="opacity:0"]:not([aria-hidden="true"]) { opacity: 1 !important; transform: none !important; }
    main :is(h1,h2,h3,h4,h5,h6) [style*="transform"] { transform: none !important; }
  `}</style></noscript>;
}

/** Semantic, server-visible copy; split only after fonts settle and restore on cleanup. */
export function EditorialHeadline({ technique = "lines", ...props }: ComponentProps<typeof Headline> & {
  technique?: "lines" | "words";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const mm = gsap.matchMedia();
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const splits: SplitText[] = [];
        try {
          root.querySelectorAll<HTMLElement>(".t-inscribe, .t-voice").forEach((line, index) => {
            let revealed = false;
            splits.push(SplitText.create(line, {
              type: "lines,words",
              mask: "lines", autoSplit: true, aria: "auto",
              onSplit(self) {
                if (revealed) return;
                const targets = technique === "words" ? self.words : self.lines;
                return gsap.from(targets, {
                  y: 28,
                  opacity: 0,
                  duration: 1.85,
                  stagger: 0.24,
                  delay: index * 0.18,
                  ease: "power3.out",
                  onComplete: () => { revealed = true; },
                  scrollTrigger: { trigger: root.firstElementChild, start: "top 92%", once: true },
                });
              },
            }));
          });
        } catch {
          splits.forEach((split) => split.revert());
        }
        return () => splits.forEach((split) => split.revert());
      });
    });
    return () => { cancelled = true; mm.revert(); };
  }, [technique, props.inscription, props.voice]);
  return <div ref={ref} className={styles.headline} data-editorial-headline={technique}>
    <Headline {...props} animate="none" />
  </div>;
}

/** A replacement only at opted-in call sites, without hidden SSR styles. Supporting text reveal 1.0-1.4s. */
export function EditorialReveal({ children, as: Tag = "div", className, delay = 0, y = 24 }: {
  children: ReactNode; as?: "div" | "p" | "li" | "span" | "section" | "figure";
  className?: string; delay?: number; y?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.from(ref.current, { y, opacity: 0, duration: 1.55, delay: Math.min(delay, 0.45), ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 94%", once: true } });
    });
    return () => mm.revert();
  }, [delay, y]);
  // The chosen semantic tag and its DOM ref always move together.
  return <Tag ref={(node: HTMLElement | null) => { ref.current = node; }} className={className}>{children}</Tag>;
}

/** Image wrappers own the transform; FilmImage's internal Motion transform stays untouched. */
export function EditorialImage({ children, className = "", depth = true }: {
  children: ReactNode; className?: string; depth?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" }, (context) => {
      if (!context.conditions?.motion) return;
      gsap.from(ref.current, { clipPath: "inset(8% 0% 8% 0%)", duration: 1.45, ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 94%", once: true } });
      if (depth && context.conditions.desktop) gsap.fromTo(imageRef.current, { scale: 1.07, yPercent: -2 }, {
        scale: 1.02, yPercent: 1, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
      });
    });
    return () => mm.revert();
  }, [depth]);
  return <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`} data-editorial-image>
    <div ref={imageRef} className="absolute inset-0">{children}</div>
  </div>;
}
