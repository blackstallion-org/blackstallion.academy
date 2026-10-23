"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * Rows of words that drift sideways and speed up with the reader's scroll (adapted from React Bits "ScrollVelocity").
 * Rows alternate direction; every other row can be outlined. The repeated copies are aria-hidden, so a screen
 * reader hears each row once. Reduced motion: rows sit still.
 */
type VelocityMarqueeProps = {
  rows: string[];
  /** Base speed in px/s. */
  velocity?: number;
  /** Degrees of lean at full scroll speed. */
  skew?: number;
  separator?: ReactNode;
  outlineAlternate?: boolean;
  className?: string;
  rowClassName?: string;
};

const FADE = "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)";
const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function Row({ text, base, skew, separator, outline, reduced, className }: { text: string; base: number; skew: number; separator: ReactNode; outline: boolean; reduced: boolean; className?: string }) {
  const baseX = useMotionValue(0);
  const skewX = useMotionValue(0);
  const { scrollY } = useScroll();
  const smooth = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const copyRef = useRef<HTMLSpanElement>(null);
  const width = useWidth(copyRef);
  const x = useTransform(baseX, (v) => (width ? `${wrap(-width, 0, v)}px` : "0px"));
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    let move = direction.current * base * (delta / 1000);
    move += direction.current * move * f;
    baseX.set(baseX.get() + move);
    if (skew) {
      const surge = Math.tanh(Math.abs(smooth.get()) / 1600);
      const ease = 1 - Math.exp(-delta / 110);
      skewX.set(skewX.get() + (-Math.sign(move || base) * skew * surge - skewX.get()) * ease);
    }
  });

  return (
    <div className="overflow-hidden">
      <motion.div className={cn("flex whitespace-nowrap", className)} style={{ x, skewX, ...(outline ? { WebkitTextFillColor: "transparent", WebkitTextStroke: "max(1px, 0.02em) currentColor" } : {}) }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} ref={i === 0 ? copyRef : undefined} aria-hidden={i > 0 ? true : undefined} className="shrink-0">
            {text}
            {separator ? <span className="mx-[0.4em] inline-block" aria-hidden style={{ WebkitTextFillColor: "currentColor" }}>{separator}</span> : <>&nbsp;</>}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function VelocityMarquee({ rows, velocity = 40, skew = 6, separator = "·", outlineAlternate = true, className, rowClassName }: VelocityMarqueeProps) {
  const reduced = useReducedMotion();
  return (
    <div className={cn("w-full", className)} style={{ maskImage: FADE, WebkitMaskImage: FADE }}>
      {rows.map((text, i) => (
        <Row
          key={text}
          text={text}
          base={i % 2 ? -velocity : velocity}
          skew={skew}
          separator={separator}
          outline={outlineAlternate && i % 2 === 1}
          reduced={reduced}
          className={rowClassName}
        />
      ))}
    </div>
  );
}
