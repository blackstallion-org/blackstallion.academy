"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { GoldDust } from "@/components/motion/GoldDust";

/**
 * Site-wide atmosphere: deep vignette, drifting dust, and a warm lamp that
 * follows the cursor (fine pointers only). Grain lives on <body> (.grain).
 */
export function Atmosphere() {
  const reduced = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 60, damping: 20, mass: 0.6 });
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setFinePointer(mq.matches);
    const id = requestAnimationFrame(sync);
    mq.addEventListener("change", sync);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      mq.removeEventListener("change", sync);
      window.removeEventListener("pointermove", move);
    };
  }, [x, y]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[55]">
      <div className="absolute inset-0 opacity-70">
        <GoldDust density={0.35} />
      </div>
      {finePointer && !reduced && (
        <motion.div
          className="absolute h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-soft-light"
          style={{
            left: sx,
            top: sy,
            background: "radial-gradient(circle, rgb(230 202 101 / 0.22) 0%, rgb(197 160 89 / 0.08) 35%, transparent 70%)",
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 45%, rgb(10 8 6 / 0.55) 80%, rgb(10 8 6 / 0.92) 100%)",
        }}
      />
    </div>
  );
}
