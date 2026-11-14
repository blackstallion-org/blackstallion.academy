"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { royal, royalPlates } from "@/lib/content/royal";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type PlateId = keyof typeof royalPlates;

/**
 * One of the owner's royal Marwari photographs with a few words (14 Nov 2026), after the owner's "Rider Force" reference:
 * a large photograph, minimal type, a copperplate swash for the first letter of the title.
 * - "bleed": the photograph fills the width at cinema height; the words sit bottom-left on a gradient (no card on the photo).
 * - "split": the photograph on one side, the words on the paper beside it, the swash initial overlapping the edge.
 * The photograph settles from a slight push-in as it enters; reduced motion shows it still. The credit sits under the picture.
 */
export function RoyalPlate({ id, layout = "bleed", flip = false, className }: { id: PlateId; layout?: "bleed" | "split"; flip?: boolean; className?: string }) {
  const copy = royalPlates[id];
  const photo = royal[copy.photo];
  const reduced = useReducedMotion();
  const initial = copy.title.charAt(0);
  const rest = copy.title.slice(1);
  const headingId = `royal-${id}`;
  const settle = reduced ? {} : { initial: { scale: 1.08 }, whileInView: { scale: 1 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 2.6, ease: ease.citadel } };
  const rise = reduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.5 }, transition: { duration: 1.2, ease: ease.citadel, delay: 0.3 } };

  const title = (
    <h2 id={headingId} className="t-inscribe text-[clamp(1.6rem,3.4vw,3rem)] leading-[1.05] tracking-[0.04em]">
      <span aria-hidden className="t-flourish mr-[0.04em] inline-block align-[-0.12em] text-[2.1em] normal-case text-gold">{initial}</span>
      <span className="sr-only">{initial}</span>
      {rest}
    </h2>
  );

  if (layout === "split") {
    return (
      <section aria-labelledby={headingId} className={cn("gutter py-[clamp(4rem,12vh,9rem)]", className)}>
        <div className={cn("grid items-center gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-[6vw]", flip && "md:[&>figure]:order-2")}>
          <figure>
            <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/6]">
              <motion.div className="absolute inset-0" {...settle}>
                <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" style={{ objectPosition: photo.focus }} />
              </motion.div>
            </div>
            <figcaption className="label mt-3 text-[0.6rem] text-dust">Photograph · {photo.credit}</figcaption>
          </figure>
          <motion.div {...rise} className="max-w-md">
            <p className="label text-brass">{copy.label}</p>
            <div className="mt-5 text-bone">{title}</div>
            <p className="t-story mt-6 text-lede leading-relaxed text-sand">{copy.line}</p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className={cn("tone-photo relative isolate overflow-hidden bg-night", className)}>
      <div className="relative h-[clamp(520px,88svh,960px)]">
        <motion.div className="absolute inset-0" {...settle}>
          <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: photo.focus }} />
        </motion.div>
        {/* a deeper wash than shade-b: these are bright sunsets, and the words must read over sky and sun */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in srgb, var(--color-night) 90%, transparent) 0%, color-mix(in srgb, var(--color-night) 55%, transparent) 34%, transparent 66%), linear-gradient(to right, color-mix(in srgb, var(--color-night) 55%, transparent) 0%, transparent 48%)",
          }}
        />
        <motion.div {...rise} className="gutter absolute inset-x-0 bottom-0 pb-[clamp(2.5rem,8vh,5rem)]">
          <p className="label text-gold">{copy.label}</p>
          <div className="mt-3 max-w-xl text-bone">{title}</div>
          <p className="t-story mt-4 max-w-md text-lede text-sand">{copy.line}</p>
          {/* under the words, not in a corner: the photographers' own marks sit in the corners and must stay clear */}
          <p className="label mt-5 text-[0.55rem] text-sand/75">Photograph · {photo.credit}</p>
        </motion.div>
      </div>
    </section>
  );
}
