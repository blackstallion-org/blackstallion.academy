"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cancelFrame, frame, motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * Text set around a slowly turning ring, like the legend of a seal (adapted from React Bits "CircularText").
 * Letters are spread evenly around the circle; whatever is passed as children sits in the middle.
 * Hover slows it (a seal is examined, not spun). Reduced motion: still. The ring is one image to
 * assistive tech, labelled with its text.
 */
type SealRingProps = {
  text: string;
  /** Seconds per turn. */
  spin?: number;
  size?: number;
  fontSize?: number;
  /** Draws a hairline circle inside the letters. */
  ring?: boolean;
  /** Hide the ring from assistive tech when the same words appear as text nearby. */
  decorative?: boolean;
  children?: ReactNode;
  className?: string;
};

export function SealRing({ text, spin = 40, size = 168, fontSize = 11, ring = true, decorative = false, children, className }: SealRingProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rotation = useMotionValue(0);
  const speed = useSpring(1, { stiffness: 60, damping: 18 });
  const letters = Array.from(text);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || spin <= 0) return;
    const turn = ({ delta }: { delta: number }) => {
      const dt = Math.min(delta, 100) / 1000;
      rotation.set((rotation.get() + (360 / spin) * speed.get() * dt) % 360);
    };
    let running = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === running) return;
      running = entry.isIntersecting;
      if (running) frame.update(turn, true);
      else cancelFrame(turn);
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelFrame(turn);
    };
  }, [reduced, spin, rotation, speed]);

  return (
    <div
      ref={rootRef}
      className={cn("relative shrink-0 rounded-full", className)}
      style={{ width: size, height: size, fontSize }}
      onPointerEnter={() => speed.set(0.25)}
      onPointerLeave={() => speed.set(1)}
    >
      {ring ? <span aria-hidden className="absolute rounded-full border border-line" style={{ inset: fontSize * 1.9 }} /> : null}
      <motion.div className="absolute inset-0" {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": text.replace(/[·•*]/g, " ").replace(/\s+/g, " ").trim() })} style={{ rotate: rotation }}>
        {letters.map((letter, i) => (
          <span
            key={i}
            aria-hidden
            className="label absolute inset-0 block text-center tracking-normal"
            style={{ transform: `rotate(${(360 / letters.length) * i}deg)`, whiteSpace: "pre" }}
          >
            {letter}
          </span>
        ))}
      </motion.div>
      {children != null ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  );
}
