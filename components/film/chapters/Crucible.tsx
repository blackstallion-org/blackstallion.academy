"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { Chapter } from "../Chapter";
import { FilmImage } from "../FilmImage";
import { MaskLine, ProgressFade } from "../MaskLine";
import { hotspots } from "@/lib/content/film";
import { cn } from "@/lib/utils";
import { r } from "../range";

const film = [0.7, 0, 0.2, 1] as const;

/** Where each reticle sits over the frame (percent of the viewport). Tune once the final image lands. */
const reticles: Record<string, { x: number; y: number }> = {
  ears: { x: 64, y: 24 },
  spine: { x: 54, y: 52 },
  reins: { x: 70, y: 66 },
};

/**
 * Chapter II. The eye follows you (pointer on desktop, tilt on phones); scroll moves
 * through three anatomical readings. Signature moment: a brass reticle locks on and
 * draws its coordinate line to the X-ray readout.
 * The interactive 3D stallion replaces the photograph when the GLB arrives.
 */
export function Crucible() {
  return (
    <Chapter id="crucible" label="Chapter II: The Neuro-Equine Crucible" length={4}>
      {(p) => <CrucibleFrame p={p} />}
    </Chapter>
  );
}

function useGaze() {
  const reduced = useReducedMotion();
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const x = useSpring(gx, { stiffness: 40, damping: 18 });
  const y = useSpring(gy, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      gx.set((e.clientX / window.innerWidth - 0.5) * 2);
      gy.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    const onLeave = () => {
      gx.set(0);
      gy.set(0);
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      gx.set(Math.max(-1, Math.min(1, e.gamma / 25)));
      gy.set(Math.max(-1, Math.min(1, (e.beta - 45) / 25)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [gx, gy, reduced]);
  return { x, y };
}

function CrucibleFrame({ p }: { p: MotionValue<number> }) {
  const gaze = useGaze();
  const imgX = useTransform(gaze.x, [-1, 1], ["2.5%", "-2.5%"]);
  const imgY = useTransform(gaze.y, [-1, 1], ["2%", "-2%"]);
  const scale = useTransform(p, r(0, 1), [1.08, 1.22]);
  const reveal = useTransform(p, r(0, 0.12), ["inset(50% 0% 50% 0%)", "inset(0% 0% 0% 0%)"]);
  const [active, setActive] = useState(0);

  useEffect(
    () =>
      p.on("change", (v) => {
        const idx = Math.min(hotspots.length - 1, Math.max(0, Math.floor(((v - 0.16) / 0.8) * hotspots.length)));
        setActive(idx);
      }),
    [p],
  );

  const spot = hotspots[active];
  const ret = reticles[spot.id];

  return (
    <div className="relative h-full w-full bg-night">
      <FilmImage name="gallop" scale={scale} x={imgX} y={imgY} clipPath={reveal} position="35% 50%" />
      <div className="absolute inset-0 bg-gradient-to-r from-night/90 via-night/45 to-night/20" />

      {/* Reticle + coordinate line */}
      <AnimatePresence mode="wait">
        <motion.svg
          key={spot.id}
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <motion.line
            x1={ret.x}
            y1={ret.y}
            x2={ret.x}
            y2={88}
            stroke="var(--color-gold)"
            strokeWidth={0.08}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: film, delay: 0.3 }}
          />
        </motion.svg>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div
          key={`ret-${spot.id}`}
          className="pointer-events-none absolute hidden lg:block"
          style={{ left: `${ret.x}%`, top: `${ret.y}%` }}
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.9, ease: film }}
          aria-hidden
        >
          <span className="absolute -left-10 -top-10 h-20 w-20 rounded-full border border-gold/80" />
          <span className="absolute -left-14 -top-14 h-28 w-28 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-sand/40" />
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_18px_4px_rgb(230_202_101/0.6)]" />
          <span className="label absolute left-16 -top-3 whitespace-nowrap text-[0.66rem] text-gold">
            {spot.name} · {ret.x}.{ret.y}
          </span>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-between px-5 pb-16 pt-24 sm:px-10 sm:pt-28 lg:pl-[8vw]">
        <div>
          <ProgressFade progress={p} range={[0.02, 0.08]}>
            <p className="label mb-6 text-gold">
              Chapter II <span className="mx-3 text-sand/50">/</span> The Neuro-Equine Crucible
            </p>
          </ProgressFade>
          <h2 className="font-display text-display-2 tracking-display opsz-display">
            <MaskLine progress={p} range={[0.03, 0.12]}>
              Five hundred kilograms
            </MaskLine>
            <MaskLine progress={p} range={[0.06, 0.15]} className="italic text-sand">
              feel your heart first.
            </MaskLine>
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,240px)_minmax(0,560px)] lg:items-end lg:gap-16">
          <ol className="flex gap-6 lg:flex-col lg:gap-4">
            {hotspots.map((h, i) => (
              <li key={h.id}>
                <span
                  className={cn(
                    "label flex items-center gap-3 transition-colors duration-500",
                    i === active ? "text-gold" : "text-sand/50",
                  )}
                >
                  <span className={cn("h-px transition-all duration-700", i === active ? "w-8 bg-gold" : "w-3 bg-sand/40")} />
                  {h.name}
                </span>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease: film }}
              className="border-l border-gold/50 bg-night/35 py-2 pl-6 backdrop-blur-[3px]"
            >
              <p className="font-display text-display-3 italic text-bone">{spot.title}</p>
              <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {spot.layers.map(([k, v]) => (
                  <div key={k}>
                    <dt className="label text-[0.66rem] text-brass">{k}</dt>
                    <dd className="mt-1 text-[0.98rem] leading-snug text-sand">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
