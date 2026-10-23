"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whenNearViewport } from "@/lib/motion/near-viewport";
import styles from "./ScrollRevealText.module.css";

/** Paragraphs whose reveal has been created at least once (see the effect below). */
const armed = new WeakSet<Element>();

type Props = ComponentPropsWithoutRef<"p"> & {
  start?: number;
  end?: number;
  dimOpacity?: number;
  revealBy?: "words" | "characters";
  smoothness?: number;
};

/** Existing paragraph styles and semantics stay intact; only inline opacity changes. */
export function ScrollRevealText({ children, className, start = 92, end = 65, dimOpacity = 0.35, revealBy = "words", smoothness = 0.55, ...props }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  let unit = 0;
  const split = (content: ReactNode): ReactNode => Children.map(content, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      const tokens = revealBy === "characters" ? Array.from(String(child)) : String(child).split(/(\s+)/);
      return tokens.map((token) => /^\s*$/.test(token) ? token : <span key={`unit-${unit++}`} data-text-reveal-unit>{token}</span>);
    }
    if (isValidElement<{ children?: ReactNode }>(child) && typeof child.type === "string" && child.props.children !== undefined) {
      return cloneElement(child, undefined, split(child.props.children));
    }
    return child;
  });

  useEffect(() => {
    const paragraph = ref.current;
    if (!paragraph) return;
    const media = gsap.matchMedia();
    // The scrubbed tween is created as the paragraph approaches the viewport (it is fully opaque until then, as before).
    // Once a paragraph has been set up, a re-render (new children) rebuilds it synchronously, as it always did.
    const setup = () => {
      armed.add(paragraph);
      gsap.registerPlugin(ScrollTrigger);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const units = paragraph.querySelectorAll<HTMLElement>("[data-text-reveal-unit]");
        const context = gsap.context(() => {
          gsap.fromTo(units, { opacity: Math.max(0, Math.min(1, dimOpacity)) }, {
            opacity: 1, ease: "none", stagger: 0.12, duration: 0.22,
            scrollTrigger: { trigger: paragraph, start: `clamp(top ${Math.max(0, Math.min(100, start))}%)`, end: `clamp(bottom ${Math.max(0, Math.min(100, end))}%)`, scrub: smoothness },
          });
        }, paragraph);
        return () => context.revert();
      });
    };
    let cancel = () => {};
    if (armed.has(paragraph)) setup();
    else cancel = whenNearViewport(paragraph, setup);
    return () => { cancel(); media.revert(); };
  }, [children, start, end, dimOpacity, revealBy, smoothness]);

  return <p {...props} className={`${className || ""} ${styles.paragraph}`} ref={ref} data-scroll-text-reveal={revealBy}>{split(children)}</p>;
}
