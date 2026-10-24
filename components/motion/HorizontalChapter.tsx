"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./HorizontalChapter.module.css";
import { editorialFontVariables, type EditorialTypeface } from "@/lib/editorial-type";
import typeStyles from "./EditorialType.module.css";

type HorizontalChapterProps = {
  chapter: string;
  text: string;
  tone?: "light" | "dark";
  typeface?: EditorialTypeface;
};

/** One horizontal, scroll-scrubbed chapter break. The heading is readable without JS. */
export function HorizontalChapter({ chapter, text, tone = "dark", typeface = "elegant" }: HorizontalChapterProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLHeadingElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    gsap.registerPlugin(ScrollTrigger, SplitText);
    const unsubscribe = lenis?.on("scroll", ScrollTrigger.update);
    const media = gsap.matchMedia();
    let disposed = false;

    void document.fonts.ready.then(() => {
      if (disposed) return;
      media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        section.dataset.motion = "active";
        let split: SplitText | undefined;

        try {
          split = SplitText.create(track, { type: "chars,words", aria: "auto" });
          const scrollTween = gsap.to(track, {
            x: () => -track.scrollWidth,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              pin: true,
              start: "top top",
              end: () => `+=${Math.round(Math.max(section.clientWidth * 1.5, Math.min(track.scrollWidth, section.clientWidth * 3.5)))}`,
              scrub: 0.7,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });

          split.chars.forEach((char, index) => {
            gsap.fromTo(char,
              { yPercent: index % 2 === 0 ? -90 : 90, rotation: index % 2 === 0 ? -7 : 7, opacity: 0.15 },
              {
                yPercent: 0,
                rotation: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: char,
                  containerAnimation: scrollTween,
                  start: "left 98%",
                  end: "left 70%",
                  scrub: 0.5,
                },
              },
            );
          });
          ScrollTrigger.refresh();
        } catch {
          split?.revert();
          delete section.dataset.motion;
        }

        return () => {
          split?.revert();
          delete section.dataset.motion;
        };
      });
    });

    return () => {
      disposed = true;
      media.revert();
      unsubscribe?.();
    };
  }, [lenis, text, typeface]);

  return (
    <section ref={sectionRef} data-typeface={typeface} className={`${styles.section} ${tone === "light" ? styles.light : styles.dark} ${editorialFontVariables} ${typeStyles[typeface]}`} aria-label={chapter}>
      <div className={styles.meta} aria-hidden="true"><span>Black Stallion Academy</span><span>{chapter}</span></div>
      <div className={styles.frame}>
        <h2 ref={trackRef} className={styles.track}>{text}</h2>
      </div>
      <p className={styles.caption}>A moment between chapters</p>
    </section>
  );
}
