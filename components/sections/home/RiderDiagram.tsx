"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { r3 } from "@/lib/round";

export type SystemId = "brain" | "spine" | "muscle" | "heart";

const vertebrae = Array.from({ length: 17 }, (_, i) => {
  const t = i / 16;
  const y = 112 + t * 172;
  // A gentle S-curve: cervical lordosis, thoracic kyphosis, lumbar lordosis.
  const x = r3(150 + Math.sin(t * Math.PI * 2) * 4);
  return { x, y, w: 9 + t * 6 };
});

/**
 * Abstract anatomical plate of a rider on the horse's back, drawn in brass hairline.
 * The active system glows gold. Used by the home Matrix and /science.
 */
export function RiderDiagram({ active, className }: { active: SystemId; className?: string }) {
  const on = (id: SystemId) => active === id;
  const stroke = (id: SystemId) => (on(id) ? "var(--color-gold)" : "rgb(184 115 51 / 0.35)");

  return (
    <svg viewBox="0 0 300 420" className={cn("h-full w-full", className)} role="img" aria-label={`Rider diagram, ${active} highlighted`}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(255 255 255 / 0.21)" />
          <stop offset="100%" stopColor="rgb(255 255 255 / 0.0)" />
        </radialGradient>
      </defs>

      {/* Grid ticks like an engineering plate */}
      <g
        stroke={on("brain") || on("spine") ? "rgb(212 175 55 / 0.32)" : "rgb(184 115 51 / 0.1)"}
        strokeWidth="0.5"
        style={{ transition: "stroke 700ms ease" }}
        data-hud={on("brain") || on("spine") ? "alignment-grid" : undefined}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`h${i}`} x1="0" x2="300" y1={i * 42} y2={i * 42} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`v${i}`} y1="0" y2="420" x1={i * 42 + 3} x2={i * 42 + 3} />
        ))}
      </g>

      {/* Horse: back, withers, neck */}
      <path d="M10 338 C70 318 120 310 150 312 C195 314 230 318 252 314 C268 300 276 270 284 236" fill="none" stroke="rgb(184 115 51 / 0.4)" strokeWidth="1.2" />
      <path d="M10 352 C80 334 200 332 262 330" fill="none" stroke="rgb(184 115 51 / 0.18)" strokeWidth="0.8" strokeDasharray="2 4" />

      {/* Brain */}
      <g filter={on("brain") ? "url(#glow)" : undefined}>
        {on("brain") && <circle cx="152" cy="74" r="46" fill="url(#halo)" />}
        <circle cx="152" cy="74" r="26" fill="none" stroke={stroke("brain")} strokeWidth="1.2" />
        <path d="M136 66 C142 58 150 62 152 70 C155 60 165 60 168 68 M140 80 C146 74 156 78 158 84 M150 70 C150 76 146 82 140 84" fill="none" stroke={stroke("brain")} strokeWidth="0.8" />
      </g>

      {/* Spine */}
      <g filter={on("spine") ? "url(#glow)" : undefined}>
        {vertebrae.map((v, i) => (
          <motion.rect
            key={i}
            x={v.x - v.w / 2}
            y={v.y - 3}
            width={v.w}
            height={6.5}
            rx={2}
            fill={on("spine") ? "rgb(255 255 255 / 0.15)" : "none"}
            stroke={stroke("spine")}
            strokeWidth="0.9"
            initial={false}
            animate={{ opacity: on("spine") ? [0.4, 1] : 1 }}
            transition={{ duration: 0.4, delay: on("spine") ? i * 0.025 : 0 }}
          />
        ))}
      </g>

      {/* Ribcage + heart */}
      <g filter={on("heart") ? "url(#glow)" : undefined}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} fill="none" stroke={stroke("heart")} strokeWidth="0.8">
            <path d={`M146 ${140 + i * 16} C ${120 - i * 2} ${146 + i * 16} ${118 - i} ${168 + i * 14} ${130} ${178 + i * 12}`} />
            <path d={`M154 ${140 + i * 16} C ${180 + i * 2} ${146 + i * 16} ${182 + i} ${168 + i * 14} ${170} ${178 + i * 12}`} />
          </g>
        ))}
        <motion.path
          d="M165 176 C160 168 150 170 152 180 C154 188 165 194 165 194 C165 194 176 188 178 180 C180 170 170 168 165 176 Z"
          fill={on("heart") ? "var(--color-blood)" : "none"}
          stroke={stroke("heart")}
          strokeWidth="0.9"
          animate={on("heart") ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={on("heart") ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : undefined}
          style={{ transformOrigin: "165px 182px" }}
        />
      </g>

      {/* Muscle: core band + seat + thigh */}
      <g filter={on("muscle") ? "url(#glow)" : undefined}>
        <ellipse cx="150" cy="258" rx="30" ry="26" fill={on("muscle") ? "rgb(255 255 255 / 0.1)" : "none"} stroke={stroke("muscle")} strokeWidth="0.9" strokeDasharray={on("muscle") ? "0" : "3 3"} />
        <path d="M128 288 C134 302 166 302 172 288" fill="none" stroke={stroke("muscle")} strokeWidth="1.1" />
        <path d="M156 296 L204 344 L196 400" fill="none" stroke={stroke("muscle")} strokeWidth={on("muscle") ? 2.4 : 1.2} strokeLinecap="round" />
        <path d="M196 400 L214 404" stroke={stroke("muscle")} strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Arms and reins */}
      <path d="M150 132 L176 196 L206 214" fill="none" stroke="rgb(184 115 51 / 0.4)" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M206 214 C236 222 262 232 286 240" fill="none" stroke="rgb(184 115 51 / 0.35)" strokeWidth="0.7" strokeDasharray="1.5 3" />
      <circle cx="206" cy="214" r="2" fill="var(--color-brass)" />

      {/* Axis line: head over shoulders over hips */}
      <line x1="150" y1="40" x2="150" y2="300" stroke={on("spine") ? "rgb(255 255 255 / 0.36)" : "rgb(184 115 51 / 0.15)"} strokeWidth="0.6" strokeDasharray="4 4" />
      <text x="158" y="38" className="font-mono" fontSize="7" fill="rgb(140 136 130)">
        AXIS 0.0°
      </text>
    </svg>
  );
}
