"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { EditorialHeadline, EditorialScrollSync } from "@/components/motion/EditorialMotion";
import { LanceRule } from "@/components/film/Marks";
import { BreathCue } from "@/components/film/BreathCue";
import { acts, type Act } from "@/lib/content/site";
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
        try {
          ctx.add(() => {
            root.querySelectorAll<HTMLElement>("[data-home-detail]:not([data-scroll-text-reveal])").forEach((node) => {
              gsap.from(node, { y: 18, opacity: 0, duration: 0.75, ease: "power3.out",
                scrollTrigger: { trigger: node, start: "top 94%", once: true } });
            });
            root.querySelectorAll<HTMLElement>("[data-home-figure]").forEach((node, index) => {
              gsap.from(node, { yPercent: 105, duration: 1.05, delay: (index % 3) * 0.09, ease: "power4.out",
                scrollTrigger: { trigger: node.parentElement, start: "top 92%", once: true } });
            });
            root.querySelectorAll<HTMLElement>("[data-home-phrase]").forEach((node) => {
              let revealed = false;
              splits.push(SplitText.create(node, { type: "lines,words", mask: "lines", autoSplit: true, aria: "auto",
                onSplit(self) {
                  if (revealed) return;
                  return gsap.from(self.words, { yPercent: 105, opacity: 0, duration: 1, stagger: 0.05, ease: "power3.out",
                    onComplete: () => { revealed = true; },
                    scrollTrigger: { trigger: node, start: "top 92%", once: true } });
                },
              }));
            });
            if (conditions.desktop) root.querySelectorAll<HTMLElement>("[data-home-drift]").forEach((node) => {
              gsap.fromTo(node, { y: 14 }, { y: -14, ease: "none",
                scrollTrigger: { trigger: node.closest("section"), start: "top bottom", end: "bottom top", scrub: 0.5 } });
            });
          });
        } catch {
          splits.forEach((split) => split.revert());
          ctx.revert();
        }
        return () => { splits.forEach((split) => split.revert()); ctx.revert(); };
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

export function HomeAct({ act, line }: { act: Act; line: string }) {
  return <section aria-label={`${acts[act].name}: ${line}`} className={`tone-dark surface-leather gutter ${styles.act}`}>
    {act === "ledger" && <BreathCue />}
    <LanceRule label={`Act ${acts[act].numeral} · ${acts[act].name}`} />
    <div data-home-drift><h2 data-home-phrase className={styles.actTitle}>{line}</h2></div>
  </section>;
}
