"use client";

import { Intermission } from "@/components/film/Intermission";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { EditorialHeadline, EditorialScrollSync } from "@/components/motion/EditorialMotion";
import type { Act } from "@/lib/content/site";
import { whenNearViewport } from "@/lib/motion/near-viewport";
import styles from "./HomeTypography.module.css";

/** Homepage-only art direction; interactive components retain their own motion. */
export function HomeTypography({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const mm = gsap.matchMedia();
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" }, ({ conditions }) => {
        if (!conditions?.motion) return;
        const ctx = gsap.context(() => {}, root);
        const splits: SplitText[] = [];
        const cancels: Array<() => void> = [];
        // Each reveal is created as its node approaches the viewport (all of them are offscreen until then), so the
        // home page no longer splits and measures every block during hydration.
        const near = (node: Element, create: () => void) => cancels.push(whenNearViewport(node, () => {
          try { ctx.add(create); } catch { /* A failed reveal leaves the text as server-rendered. */ }
        }));
        root.querySelectorAll<HTMLElement>("[data-home-detail]:not([data-scroll-text-reveal])").forEach((node) => near(node, () => {
          gsap.from(node, { y: 18, opacity: 0, duration: 0.75, ease: "power3.out",
            scrollTrigger: { trigger: node, start: "top 94%", once: true } });
        }));
        root.querySelectorAll<HTMLElement>("[data-home-figure]").forEach((node, index) => near(node.parentElement ?? node, () => {
          gsap.from(node, { yPercent: 105, duration: 1.05, delay: (index % 3) * 0.09, ease: "power4.out",
            scrollTrigger: { trigger: node.parentElement, start: "top 92%", once: true } });
        }));
        root.querySelectorAll<HTMLElement>("[data-home-phrase]").forEach((node) => near(node, () => {
          let revealed = false;
          splits.push(SplitText.create(node, { type: "lines,words", mask: "lines", autoSplit: true, aria: "auto",
            onSplit(self) {
              if (revealed) return;
              return gsap.from(self.words, { yPercent: 105, opacity: 0, duration: 1, stagger: 0.05, ease: "power3.out",
                onComplete: () => { revealed = true; },
                scrollTrigger: { trigger: node, start: "top 92%", once: true } });
            },
          }));
        }));
        if (conditions.desktop) root.querySelectorAll<HTMLElement>("[data-home-drift]").forEach((node) => near(node, () => {
          gsap.fromTo(node, { y: 14 }, { y: -14, ease: "none",
            scrollTrigger: { trigger: node.closest("section"), start: "top bottom", end: "bottom top", scrub: 0.5 } });
        }));
        return () => { cancels.forEach((cancel) => cancel()); splits.forEach((split) => split.revert()); ctx.revert(); };
      });
    });
    return () => { disposed = true; mm.revert(); };
  }, []);
  return <div ref={ref} className={`home-page ${styles.home}`} data-home-typography>
    <EditorialScrollSync />
    <noscript><style>{`.home-page [data-home-figure] { transform: none !important; }`}</style></noscript>
    {children}
  </div>;
}

export function HomeHeadline(props: ComponentProps<typeof EditorialHeadline>) {
  const manifesto = props.id?.startsWith("doctrine-");
  const technique = ["ledger-h", "matrix-h", "crisis-h", "chronicle-h"].includes(props.id || "") || manifesto ? "words" : "lines";
  return <EditorialHeadline {...props} technique={technique}
    inscriptionClassName={props.id === "doors-h" ? "text-white" : props.inscriptionClassName}
    voiceClassName={props.id === "doors-h" ? "text-white" : props.voiceClassName}
    className={`${styles.heading} ${manifesto ? styles.manifesto : ""} ${props.id === "doctrine-answer" ? styles.answer : ""} ${props.className || ""}`} />;
}

/** Act break: the deck slide (30 Oct 2026, after the owner's references; was a leather band with an ember trail). */
export function HomeAct({ act, line }: { act: Act; line: string }) {
  return <Intermission act={act} line={line} />;
}
