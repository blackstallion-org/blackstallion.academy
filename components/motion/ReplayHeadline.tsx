"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./ReplayHeadline.module.css";
import { editorialFontVariables, type EditorialTypeface } from "@/lib/editorial-type";
import typeStyles from "./EditorialType.module.css";

export type SplitVariation = "words" | "lines";
type Props = { id: string; label: string; text: string; tone?: "light" | "dark"; defaultMode?: SplitVariation; typeface?: EditorialTypeface };

/** An unhurried, calm editorial reveal. Complete lines and words only. */
export function ReplayHeadline({ id, label, text, tone = "light", defaultMode = "lines", typeface = "elegant" }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    if (!section || !heading) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const media = gsap.matchMedia();
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      media.add("(prefers-reduced-motion: no-preference)", () => {
        let played = false;
        let mode = defaultMode;
        try {
          const key = `bsah:headline:${id}`;
          const last = sessionStorage.getItem(key);
          const choices = (["words", "lines"] as SplitVariation[]).filter((choice) => choice !== last);
          mode = choices[Math.floor(Math.random() * choices.length)] || defaultMode;
          sessionStorage.setItem(key, mode);
        } catch { /* The supplied default works when storage is unavailable. */ }
        const split = SplitText.create(heading, {
          type: "lines,words", autoSplit: true, aria: "auto",
          onSplit(self) {
            if (played) return;
            const targets = mode === "words" ? self.words : self.lines;
            return gsap.from(targets, {
              y: 28,
              opacity: 0,
              duration: 1.85,
              ease: "power3.out",
              stagger: 0.24,
              onComplete: () => { played = true; },
              scrollTrigger: { trigger: section, start: "top 80%", once: true },
            });
          },
        });
        return () => split.revert();
      });
    });
    return () => { disposed = true; media.revert(); };
  }, [id, text, defaultMode, typeface]);
  return <section id={id} ref={sectionRef} data-parallax-skip
    data-typeface={typeface} className={`${styles.section} ${tone === "dark" ? styles.dark : styles.light} ${editorialFontVariables} ${typeStyles[typeface]}`} aria-labelledby={`${id}-heading`}>
    <p className={styles.label}>{label}</p>
    <h2 id={`${id}-heading`} ref={headingRef} className={styles.headline}>{text}</h2>
  </section>;
}
