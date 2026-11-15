"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Headline } from "@/components/film/Headline";
import { thresholds, type Threshold } from "@/lib/content/home-thresholds";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const ROMAN = ["I", "II", "III", "IV", "V"];

/**
 * Home · "Five doors." (14 Nov 2026). Five heritage photographs, shown big: two to a row on a wide screen at roughly half the
 * page width each (the second of every pair dropped, like facing pages), the fifth beside the closing line, one column on a
 * phone. Photographs keep their natural proportions and the photographers' marks; they are never cropped. Each settles from a
 * slight push-in as it enters; reduced motion shows them still.
 */
export function HomeThresholds({ className }: { className?: string }) {
  const g = thresholds;
  const reduced = useReducedMotion();
  const photo = (i: number, wrap: string, sizes: string) => <Plate key={g.photos[i].src} p={g.photos[i]} n={i} sizes={sizes} reduced={reduced} className={wrap} />;
  return (
    <section id="five-doors" aria-labelledby="five-doors-h" className={cn("bg-night py-[clamp(5rem,12vh,9rem)]", className)} data-parallax-skip>
      <div className="gutter mx-auto max-w-[1560px]">
        <p className="label text-brass">{g.label}</p>
        <Headline id="five-doors-h" inscription={g.inscription} voice={g.voice} size="3" className="mt-3" />
        <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">{g.lede}</p>

        <div className="mt-14 grid gap-x-[3vw] gap-y-16 md:mt-20 md:grid-cols-2 md:gap-y-24">
          {photo(0, "", "(min-width: 768px) 46vw, 100vw")}
          {photo(1, "md:mt-[18vh]", "(min-width: 768px) 46vw, 100vw")}
          {photo(2, "", "(min-width: 768px) 46vw, 100vw")}
          {photo(3, "md:mt-[18vh]", "(min-width: 768px) 46vw, 100vw")}
          {photo(4, "", "(min-width: 768px) 46vw, 100vw")}
          <div className="flex flex-col justify-end md:pb-6">
            <p className="t-voice max-w-[16ch] text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.1] text-bone">Stone, paint and open doors.</p>
            <p className="mt-8 max-w-md text-sm text-dust">{g.credit}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Plate({ p, n, sizes, reduced, className }: { p: Threshold; n: number; sizes: string; reduced: boolean; className?: string }) {
  const settle = reduced ? {} : { initial: { scale: 1.06 }, whileInView: { scale: 1 }, viewport: { once: true, amount: 0.25 }, transition: { duration: 2.2, ease: ease.citadel } };
  const rise = reduced ? {} : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 1.1, ease: ease.citadel } };
  return (
    <motion.figure {...rise} className={cn("mx-auto w-full", className)}>
      {/* the frame clips the push-in; the photograph itself is never cropped (natural proportions, width-led) */}
      <div className="overflow-hidden" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
        <motion.div className="h-full w-full" {...settle}>
          <Image src={p.src} alt={p.alt} width={p.width} height={p.height} sizes={sizes} className="h-full w-full object-cover" />
        </motion.div>
      </div>
      <figcaption className="mt-4 flex items-baseline gap-4">
        <span className="font-mono text-xs tracking-[0.2em] text-brass">{ROMAN[n]}</span>
        <span className="t-voice text-xl text-bone md:text-2xl">{p.title}</span>
      </figcaption>
    </motion.figure>
  );
}
