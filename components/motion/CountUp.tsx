"use client";

import { animate, useInView } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useEffect, useMemo, useRef } from "react";
import { dur, ease } from "@/lib/motion/tokens";

type CountUpProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Indian digit grouping (12,34,567) by default. */
  locale?: string;
  className?: string;
};

/** Counts from 0 to `value` once, when it scrolls into view. Mono numbers only. */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", locale = "en-IN", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const format = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [locale, decimals],
  );
  const final = `${prefix}${format.format(value)}${suffix}`;

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduced) return;
    const controls = animate(0, value, {
      duration: dur.reveal * 1.6,
      ease: ease.citadel,
      onUpdate: (v) => {
        node.textContent = `${prefix}${format.format(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduced, value, prefix, suffix, format]);

  // The server renders the final value, so crawlers and no-JS readers see the real number.
  return (
    <span ref={ref} className={className}>
      {final}
    </span>
  );
}
