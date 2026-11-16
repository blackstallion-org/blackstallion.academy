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
import { reelNo } from "@/lib/content/site";

/** Title card · T3 specimen plate. Signature: catalogue lines rule in around the horse like a museum mount. */
const catalogue: [string, string][] = [
  ["Plate", "02 · Marwari"],
  ["Species", "Equus ferus caballus"],
  ["Subject", "Stallion"],
  ["Coat", "Black, small star"],
  ["Catalogue", "BSAH-0912"],
];

function AnatomyTitleText() {
  return (
    <>
      <p className="label text-brass">Plate 02 · The Marwari</p>
      <Headline id="anatomy-h" as="h1" size="2" technique="lines" className="mt-5 whitespace-nowrap [&_.t-inscribe]:tracking-[0.32em]" inscription="The" voice="instrument." />
      {/* on wide screens the line steps right of the croup and tail, into the empty studio */}
      <p className="t-story mt-6 max-w-sm text-lg leading-relaxed text-sand lg:ml-[42%] lg:max-w-[16rem]">A black Marwari stallion, studied whole: the body a cadet learns to read.</p>
    </>
  );
}

/**
 * Title card · T3 specimen plate (17 Nov 2026, owner: "keep it full screen", no background effect; then "black horse image, not
 * the video"): the owner's studio photograph of the black Marwari (anatomyProfile) edge to edge at its own proportions, so the whole
 * horse shows and nothing is cropped, below the 64/80 px nav. The title takes the dark studio to the right on wide screens (held by
 * shade-r) and sits under the photograph on phones and tablets. Catalogue lines follow on the page ground.
 */
export function AnatomyTitle() {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="anatomy-h" data-parallax-skip className="editorial-scene">
      {/* 17 Nov 2026 (owner): one still of the black stallion (not the film), edge to edge, no feathered edges or backdrop. The box
          has the photograph's own proportions (1663 x 946) so the whole horse shows, ears to hooves, below the fixed bar. */}
      {/* 17 Nov 2026 (owner: "the ears are cropped", then "remove the fade"): the site-wide parallax (SiteParallax) enlarged the photo 10% and shifted it up,
          cutting the ears and the top edge; data-parallax-skip keeps it still, so the whole photograph shows, edge to edge, no band, no fade. */}
      <div className="tone-photo relative bg-night pt-16 md:pt-20">
        <div className="relative aspect-[1663/946] w-full overflow-hidden">
          <FilmImage name="anatomyProfile" priority sizes="100vw" grade="none" />
          <div aria-hidden className="shade-r absolute inset-0 hidden lg:block" />
          <motion.div
            className="gutter relative z-10 hidden h-full lg:grid lg:grid-cols-12"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            <div className="col-span-4 col-start-9 pt-[4%]">
              <AnatomyTitleText />
            </div>
          </motion.div>
        </div>
        <div className="gutter py-10 lg:hidden">
          <AnatomyTitleText />
        </div>
      </div>
      <div className="tone-light editorial-details gutter">
        <ReelMark n={reelNo("/anatomy")} act="legend" />
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
