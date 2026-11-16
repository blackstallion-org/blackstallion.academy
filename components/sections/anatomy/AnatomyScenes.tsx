"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { EditorialHeadline as Headline } from "@/components/motion/EditorialMotion";
import { ReelMark } from "@/components/film/Marks";
import { EarStudy } from "./EarStudy";
import { r } from "@/components/film/range";
import { useReducedMotion } from "@/lib/motion/reduced";

/** Title card · T3 specimen plate. Signature: catalogue lines rule in around the horse like a museum mount. */
const catalogue: [string, string][] = [
  ["Plate", "02 · Marwari"],
  ["Species", "Equus ferus caballus"],
  ["Subject", "Stallion"],
  ["Coat", "Black, white blaze"],
  ["Catalogue", "BSAH-0912"],
];

/**
 * Title card · T3 specimen plate (rebuilt 16 Nov 2026, owner): the photorealistic black Marwari stands whole on its own
 * studio backdrop, never cropped by the fixed bar. The plate box has the still's exact proportions (so nothing is cut) and sits
 * below the 64/80 px nav; its side edges feather into a backdrop gradient sampled from the photograph. The title takes the
 * empty studio to the right on wide screens and sits under the horse on phones. Catalogue lines follow on the page ground.
 */
export function AnatomyTitle() {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="anatomy-h" className="editorial-scene">
      <div className="tone-photo relative overflow-hidden bg-night [background-image:radial-gradient(ellipse_78%_92%_at_36%_50%,color-mix(in_oklab,var(--color-ember)_86%,var(--color-copper)_14%)_0%,color-mix(in_oklab,var(--color-ember)_70%,var(--color-night))_45%,var(--color-night)_88%)]">
        <div className="gutter grid min-h-[100svh] content-center items-center gap-8 pb-14 pt-24 md:pt-28 lg:grid-cols-12 lg:gap-6 lg:pb-16">
          <motion.figure
            className="relative mx-auto w-full lg:col-span-8 lg:max-w-[calc((100svh-9rem)*1680/1080)]"
            initial={reduced ? false : { opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative aspect-[1680/1080] w-full [mask-composite:intersect] [mask-image:linear-gradient(90deg,transparent_0,black_8%,black_92%,transparent_100%),linear-gradient(180deg,transparent_0,black_2.5%,black_96.5%,transparent_100%)]">
              <FilmImage name="anatomyProfile" priority sizes="(min-width: 1024px) 66vw, 100vw" grade="none" />
            </div>
          </motion.figure>
          <div className="relative lg:col-span-4 lg:pl-4">
            <p className="label text-brass">Plate 02 · The Marwari</p>
            <Headline id="anatomy-h" as="h1" size="2" technique="lines" className="mt-5 whitespace-nowrap [&_.t-inscribe]:tracking-[0.32em]" inscription="The" voice="instrument." />
            <p className="t-story mt-6 max-w-sm text-lg leading-relaxed text-sand">A black Marwari stallion, studied whole: the body a cadet learns to read.</p>
          </div>
        </div>
      </div>
      <div className="tone-light editorial-details gutter">
        <ReelMark n={2} act="legend" />
        <ScrollRevealText className="t-story text-bone">Several hundred kilograms of muscle and nerve that notices your breathing before you do.</ScrollRevealText>
        <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
          {catalogue.map(([k, v]) => <div key={k} className="border-t border-line py-4">
            <dt className="label text-dust">{k}</dt>
            <dd className="mt-2 text-base text-sand">{v}</dd>
          </div>)}
        </dl>
        <p className="label text-dust">PLATE 02 · MARWARI · BLACK STALLION</p>
      </div>
    </section>
  );
}

/** §2 · S25 scale balance: a light rein against a heavy horse (no figures: 4 Nov 2026 audit). Signature: the beam levels as you scroll. */
export function ScaleBalance() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const tilt = useTransform(scrollYProgress, r(0.1, 0.95), [-14, 0]);
  const smooth = useSpring(tilt, { stiffness: 60, damping: 18 });
  const leftY = useTransform(smooth, (a) => -Math.sin((a * Math.PI) / 180) * 210);
  const rightY = useTransform(smooth, (a) => Math.sin((a * Math.PI) / 180) * 210);

  return (
    <section aria-labelledby="grams-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <p className="label text-brass">The reins</p>
          <Headline id="grams-h" className="mt-4" inscription="A light touch" voice="against a heavy horse." />
          <ScrollRevealText className="t-story mt-6 max-w-lg text-sand">
            The lightest touch on the rein can steer a stallion of several hundred kilograms. Pull hard and the horse braces against you. Children learn fast that force fails and clarity works.
          </ScrollRevealText>
        </div>
        <div ref={ref} className="relative mx-auto aspect-[5/3] w-full max-w-xl">
          <svg viewBox="0 0 500 300" className="h-full w-full" role="img" aria-label="A balance: a light touch on the rein on one side, a heavy horse on the other">
            <path d="M250 70 L250 270 M200 270 L300 270" stroke="var(--color-brass)" strokeWidth="2" />
            <path d="M236 70 L250 52 L264 70 Z" fill="var(--color-gold)" />
            <motion.g style={{ rotate: reduced ? 0 : smooth, originX: "250px", originY: "70px" }}>
              <line x1="40" y1="70" x2="460" y2="70" stroke="var(--color-gold)" strokeWidth="2.5" />
            </motion.g>
            <motion.g style={{ y: reduced ? 0 : leftY }}>
              <line x1="40" y1="70" x2="40" y2="150" stroke="var(--color-brass)" strokeWidth="1" />
              <path d="M0 150 Q40 175 80 150 Z" fill="none" stroke="var(--color-brass)" strokeWidth="1.5" />
              <text x="40" y="140" textAnchor="middle" className="font-mono" fontSize="16" fill="var(--color-gold)">
                LIGHT
              </text>
              <text x="40" y="196" textAnchor="middle" className="label" fontSize="10" fill="var(--color-sand)" letterSpacing="2">
                REIN
              </text>
            </motion.g>
            <motion.g style={{ y: reduced ? 0 : rightY }}>
              <line x1="460" y1="70" x2="460" y2="150" stroke="var(--color-brass)" strokeWidth="1" />
              <path d="M420 150 Q460 175 500 150 Z" fill="none" stroke="var(--color-brass)" strokeWidth="1.5" />
              <text x="460" y="140" textAnchor="middle" className="font-mono" fontSize="16" fill="var(--color-bone)">
                HEAVY
              </text>
              <text x="460" y="196" textAnchor="middle" className="label" fontSize="10" fill="var(--color-sand)" letterSpacing="2">
                STALLION
              </text>
            </motion.g>
          </svg>
        </div>
      </div>
    </section>
  );
}

/**
 * §3 · S26: the ears. 15 Nov 2026 (owner): real footage of a black Marwari's ears, seen from the saddle, replaces the 3D head.
 * EarStudy scrubs the film's own frames toward the chosen sound or the visitor's pointer, so each ear turns on its own.
 */
export function EarDial() {
  return (
    <section aria-labelledby="dial-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
        <EarStudy className="mx-auto w-full max-w-2xl" />
        <div>
          <p className="label text-brass">The ears</p>
          <Headline id="dial-h" className="mt-4" inscription="Each ear" voice="listens on its own." />
          <p className="t-story mt-6 max-w-lg text-sand">
            A horse turns the opening of each ear toward what it is attending to. One can follow the instructor&rsquo;s voice while the
            other stays with the rider. A cadet learns to read the ears before anything else.
          </p>
        </div>
      </div>
    </section>
  );
}
