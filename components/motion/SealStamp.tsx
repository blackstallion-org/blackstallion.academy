"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useRef } from "react";
import { blaze, earLeft, earRight } from "@/components/brand/paths";
import { ease, inViewOnce, sealStamp } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type SealStampProps = {
  /** Text engraved on the top arc. Keep it to one word. */
  label?: string;
  /** "inView": stamps once when scrolled into view. "manual": stamps when `play` turns true. */
  trigger?: "inView" | "manual";
  play?: boolean;
  /** Optional sound, e.g. "/audio/seal_press.wav" (asset A16). Fails silently if missing or blocked. */
  sound?: string;
  onStamped?: () => void;
  className?: string;
};

/**
 * Signature move 3: the brass seal. Lands heavy (scale 1.15 → 1, 4° → 0),
 * the shadow "thumps" under it, a ring pulses out once.
 * Use it for every success: form sent, payment done, credential verified.
 */
export function SealStamp({
  label = "VERIFIED",
  trigger = "inView",
  play = false,
  sound,
  onStamped,
  className,
}: SealStampProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const soundPlayed = useRef(false);

  const state =
    trigger === "manual"
      ? { initial: "hidden" as const, animate: play ? ("visible" as const) : ("hidden" as const) }
      : { initial: "hidden" as const, whileInView: "visible" as const, viewport: inViewOnce };

  const handleStart = (definition: unknown) => {
    if (definition !== "visible" || !sound || soundPlayed.current || reduced) return;
    soundPlayed.current = true;
    window.setTimeout(() => {
      const audio = new Audio(sound);
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }, 320);
  };

  return (
    <motion.div className={cn("relative inline-grid h-32 w-32 place-items-center", className)} {...state}>
      {/* Shadow thump */}
      <motion.span
        aria-hidden
        className="absolute inset-x-[8%] bottom-[-6%] h-[18%] rounded-[50%] bg-black blur-md"
        variants={{
          hidden: { opacity: 0, scaleX: 0.4 },
          visible: {
            opacity: [0, 0.7, 0.45],
            scaleX: [0.4, 1.12, 1],
            transition: { duration: 0.55, ease: ease.citadel, times: [0, 0.6, 1] },
          },
        }}
      />
      {/* Ring pulse on contact */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full border border-gold"
        variants={{
          hidden: { opacity: 0, scale: 1 },
          visible: {
            opacity: [0, 0.8, 0],
            scale: [0.9, 1, 1.35],
            transition: { duration: 0.9, ease: ease.citadel, delay: 0.3 },
          },
        }}
      />
      <motion.svg
        viewBox="0 0 120 120"
        className="relative h-full w-full drop-shadow-[0_6px_14px_rgb(0_0_0/0.55)]"
        role="img"
        aria-label={`${label}, Black Stallion Academy seal`}
        variants={sealStamp}
        onAnimationStart={handleStart}
        onAnimationComplete={(definition) => {
          if (definition === "visible") onStamped?.();
        }}
      >
        <defs>
          <radialGradient id={`brass-${uid}`} cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="55%" stopColor="#C5A059" />
            <stop offset="100%" stopColor="#7D6230" />
          </radialGradient>
          <path id={`seal-top-${uid}`} d="M18 60 A42 42 0 0 1 102 60" />
          <path id={`seal-bottom-${uid}`} d="M14 60 A46 46 0 0 0 106 60" />
        </defs>

        {/* Beaded rim */}
        <g fill={`url(#brass-${uid})`}>
          {Array.from({ length: 40 }, (_, i) => {
            const a = (i / 40) * Math.PI * 2;
            return <circle key={i} cx={60 + Math.cos(a) * 56} cy={60 + Math.sin(a) * 56} r="2.4" />;
          })}
        </g>
        <circle cx="60" cy="60" r="53" fill={`url(#brass-${uid})`} />

        {/* Engraving (debossed into the brass) */}
        <g fill="none" stroke="#0A0B0E" strokeOpacity="0.55">
          <circle cx="60" cy="60" r="49" strokeWidth="1.2" />
          <circle cx="60" cy="60" r="33" strokeWidth="0.9" />
        </g>
        <g fill="#0A0B0E" fillOpacity="0.62" className="t-inscribe">
          <text fontSize="10" letterSpacing="3" textAnchor="middle">
            <textPath href={`#seal-top-${uid}`} startOffset="50%">
              {label}
            </textPath>
          </text>
          <text fontSize="7" letterSpacing="2.4" textAnchor="middle">
            <textPath href={`#seal-bottom-${uid}`} startOffset="50%" dominantBaseline="hanging">
              BSAH · STPCI
            </textPath>
          </text>
          <g transform="translate(40 38) scale(0.625)">
            <path d={earLeft} />
            <path d={earRight} />
            <path d={blaze} />
          </g>
        </g>
      </motion.svg>
    </motion.div>
  );
}
