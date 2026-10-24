"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import styles from "./ScrambleText.module.css";
import { editorialFontVariables, type EditorialTypeface } from "@/lib/editorial-type";
import typeStyles from "./EditorialType.module.css";

/** An unhurried editorial word shimmer on interaction. Preserves word structure and readability. */
export function ScrambleText({ text, className = "", typeface = "elegant" }: { text: string; className?: string; typeface?: EditorialTypeface }) {
  const ref = useRef<HTMLButtonElement>(null);
  const active = useRef<{ timeline: gsap.core.Timeline; split: SplitText } | null>(null);

  const reset = useCallback(() => {
    active.current?.timeline.kill();
    active.current?.split.revert();
    active.current = null;
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { if (media.matches) reset(); };
    media.addEventListener("change", change);
    return () => { media.removeEventListener("change", change); reset(); };
  }, [reset, text]);

  const play = useCallback(() => {
    const root = ref.current;
    if (!root || active.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(SplitText);
    const color = getComputedStyle(root).color;
    const split = SplitText.create(root, { type: "words", aria: "auto" });
    const timeline = gsap.timeline({ onComplete: reset });
    active.current = { timeline, split };

    split.words.forEach((word, index) => {
      const delay = index * 0.12;
      const accent = "#c9a66b";
      timeline.to(word, {
        color: accent,
        y: -3,
        duration: 0.65,
        repeat: 1,
        yoyo: true,
        ease: "power2.out",
        onComplete: () => {
          if (word instanceof HTMLElement) {
            word.style.color = color;
            word.style.transform = "none";
          }
        },
      }, delay);
    });
  }, [reset]);

  return <button ref={ref} type="button" aria-label={text} title="Replay typography effect"
    data-typeface={typeface} className={`${styles.text} ${editorialFontVariables} ${typeStyles[typeface]} ${typeStyles.accent} ${className}`} onPointerEnter={(event) => { if (event.pointerType === "mouse") play(); }}
    onFocus={play} onClick={play}>{text}</button>;
}
