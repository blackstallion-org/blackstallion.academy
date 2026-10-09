"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { r } from "./range";

type MaskLineProps = {
  children: ReactNode;
  /** Chapter progress and the window [start, end] in which this line rises into place. */
  progress: MotionValue<number>;
  range: [number, number];
  /** Optional window in which it leaves again (rises out of the mask). */
  exit?: [number, number];
  className?: string;
};

/** One line of a headline, rising out of a mask as the chapter scrolls. */
export function MaskLine({ children, progress, range, exit, className }: MaskLineProps) {
  const reduced = useReducedMotion();
  const input = exit ? [range[0], range[1], exit[0], exit[1]] : [range[0], range[1]];
  const yOut = exit ? ["110%", "0%", "0%", "-110%"] : ["110%", "0%"];
  const y = useTransform(progress, r(...input), yOut);
  const opacity = useTransform(progress, r(...input), exit ? [0, 1, 1, 0] : [0, 1]);

  return (
    <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
      <motion.span className={cn("block will-change-transform", className)} style={reduced ? { opacity } : { y }}>
        {children}
      </motion.span>
    </span>
  );
}

/** Fades and lifts a block in a progress window. */
export function ProgressFade({
  children,
  progress,
  range,
  exit,
  className,
  lift = 30,
}: MaskLineProps & { lift?: number }) {
  const input = exit ? [range[0], range[1], exit[0], exit[1]] : [range[0], range[1]];
  const opacity = useTransform(progress, r(...input), exit ? [0, 1, 1, 0] : [0, 1]);
  const y = useTransform(progress, r(...input), exit ? [lift, 0, 0, -lift] : [lift, 0]);
  return (
    <motion.div className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}
