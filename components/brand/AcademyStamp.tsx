"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { asset } from "@/lib/content/asset";
import { r3 } from "@/lib/round";
import { cn } from "@/lib/utils";

type AcademyStampProps = {
  /** The word across the band: what this impression attests. */
  label: string;
  /** Pressed (inked) or waiting (a faint dotted outline where the stamp will land). */
  pressed: boolean;
  /** Ink colour (any CSS colour); the stamp is drawn in currentColor. */
  ink?: string;
  className?: string;
  /** Accessible name; defaults to "<label>, Black Stallion Academy registry stamp". */
  title?: string;
};

/**
 * The academy's registry stamp (R23, 2 Nov 2026; official crest since 10 Nov 2026): a rubber-stamp roundel, not the brass seal. Two
 * rings, the academy's name on the arcs, the official BSAH crest inked as line art (public/brand/bsah-stamp-mark.webp, made from
 * bsah-logo.webp), a band carrying one word (SEALED, VERIFIED, SAMPLE) and the year. The ink is uneven (an SVG turbulence
 * mask), as a hand-pressed impression is. When `pressed` turns true it comes down once: lifted and turned, a short press, a little
 * squash, then the ink settles. While not pressed it shows only a dotted ring, so a page can say where a stamp will go without
 * claiming it has been given. Reduced motion: the impression appears without travel.
 */
export function AcademyStamp({ label, pressed, ink = "#8f2a1e", className, title }: AcademyStampProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const ticks = Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2);

  return (
    <div className={cn("relative inline-grid h-32 w-32 place-items-center", className)} style={{ color: ink }}>
      {/* where it will land */}
      <motion.svg
        aria-hidden
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full"
        initial={false}
        animate={{ opacity: pressed ? 0 : 0.55 }}
        transition={{ duration: reduced ? 0 : 0.3 }}
      >
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" />
      </motion.svg>

      <motion.svg
        viewBox="0 0 120 120"
        className="relative h-full w-full"
        role="img"
        aria-label={title ?? `${label}, Black Stallion Academy registry stamp`}
        aria-hidden={!pressed}
        initial={{ opacity: 0, scale: 1.32, rotate: -18, y: -14 }}
        animate={
          pressed
            ? reduced
              ? { opacity: 0.92, scale: 1, rotate: -9, y: 0 }
              : { opacity: [0, 1, 0.92], scale: [1.32, 0.96, 1], rotate: [-18, -8, -9], y: [-14, 1, 0] }
            : { opacity: 0, scale: 1.32, rotate: -18, y: -14 }
        }
        transition={reduced ? { duration: 0 } : { duration: 0.55, times: [0, 0.62, 1], ease: [0.2, 0.8, 0.25, 1] }}
      >
        <defs>
          {/* uneven ink: a turbulence field cuts small voids into the impression */}
          <filter id={`ink-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -4 3" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" result="inked" />
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="1" seed="3" result="warp" />
            <feDisplacementMap in="inked" in2="warp" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id={`crest-${uid}`} maskUnits="userSpaceOnUse" x="36" y="20" width="48" height="48">
            <image href={asset("/brand/bsah-stamp-mark.webp?v=2")} x="36" y="20" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
          </mask>
          <path id={`top-${uid}`} d="M17 60 A43 43 0 0 1 103 60" />
          <path id={`bottom-${uid}`} d="M13 60 A47 47 0 0 0 107 60" />
        </defs>
        <g filter={`url(#ink-${uid})`}>
          <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1.2" />
          {ticks.map((a, i) => (
            <circle key={i} cx={r3(60 + Math.cos(a) * 36.5)} cy={r3(60 + Math.sin(a) * 36.5)} r="0.7" fill="currentColor" />
          ))}
          <text fill="currentColor" fontSize="7" fontWeight="700" letterSpacing="0.9" fontFamily="var(--font-sans), sans-serif">
            <textPath href={`#top-${uid}`} startOffset="50%" textAnchor="middle">
              BLACK STALLION ACADEMY
            </textPath>
          </text>
          <text fill="currentColor" fontSize="6" fontWeight="700" letterSpacing="0.6" fontFamily="var(--font-sans), sans-serif">
            <textPath href={`#bottom-${uid}`} startOffset="50%" textAnchor="middle">
              ★ REGISTRY OF HORSEMANSHIP ★
            </textPath>
          </text>
          {/* the official crest, inked: its line art is a luminance mask, so it takes the stamp's ink colour */}
          <rect x="36" y="20" width="48" height="48" fill="currentColor" mask={`url(#crest-${uid})`} />
          {/* the band */}
          <rect x="24" y="68" width="72" height="14" fill="currentColor" />
          <text x="60" y="78.3" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="2.2" fill="#f4eee3" fontFamily="var(--font-sans), sans-serif">
            {label}
          </text>
          <text x="60" y="90" textAnchor="middle" fontSize="6" fontWeight="700" letterSpacing="2" fill="currentColor" fontFamily="var(--font-sans), sans-serif">
            MMXXVI
          </text>
        </g>
      </motion.svg>
    </div>
  );
}
