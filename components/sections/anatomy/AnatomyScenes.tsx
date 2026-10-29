"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { motion, useInView, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { EditorialImage } from "@/components/motion/EditorialMotion";
import { FilmImage } from "@/components/film/FilmImage";
import { EditorialHeadline as Headline } from "@/components/motion/EditorialMotion";
import { ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { useReducedMotion } from "@/lib/motion/reduced";
import { whenNearViewport } from "@/lib/motion/near-viewport";
import { asset } from "@/lib/content/asset";

/** Title card · T3 specimen plate. Signature: catalogue lines rule in around the horse like a museum mount. */
const catalogue: [string, string][] = [
  ["Plate", "02 · Marwari"],
  ["Species", "Equus ferus caballus"],
  ["Subject", "Stallion · 15.2 hh"],
  ["Coat", "Dark bay"],
  ["Catalogue", "BSAH-0912"],
];

/**
 * Title card · T3 specimen plate, laid out like a museum catalogue page: the title runs the full width,
 * the plate hangs beneath it (sized so title and plate share one screen) with its label card to the left.
 */
export function AnatomyTitle() {
  return (
    <section aria-labelledby="anatomy-h" className="editorial-scene">
      <div className="tone-dark relative min-h-[90svh] overflow-hidden bg-night [--anatomy-focus:62%_50%] lg:[--anatomy-focus:50%_50%]">
        <EditorialImage depth={false}><FilmImage name="anatomyProfile" priority sizes="100vw" position="var(--anatomy-focus)" grade="none" /></EditorialImage>
        <div className="gutter relative z-10 flex min-h-[90svh] flex-col justify-end pb-12 pt-28">
          <Headline id="anatomy-h" as="h1" size="1" technique="lines" className="max-w-[12ch]" inscription="The" voice="instrument." />
        </div>
      </div>
      <div className="tone-light editorial-details gutter">
        <ReelMark n={2} act="legend" />
        <ScrollRevealText className="t-story text-bone">Five hundred kilograms of muscle and nerve that notices your breathing before you do.</ScrollRevealText>
        <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
          {catalogue.map(([k, v]) => <div key={k} className="border-t border-line py-4">
            <dt className="label text-dust">{k}</dt>
            <dd className="mt-2 text-base text-sand">{v}</dd>
          </div>)}
        </dl>
        <p className="label text-dust">PLATE 02 · MARWARI · 15.2 HH</p>
      </div>
    </section>
  );
}

/** §2 · S25 scale balance: 10 g against 500 kg. Signature: the beam levels as you scroll. */
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
          <Headline id="grams-h" className="mt-4" inscription="Ten grams" voice="against half a tonne." />
          <ScrollRevealText className="t-story mt-6 max-w-lg text-sand">
            The lightest touch on the rein can turn a 500 kg stallion. Pull hard and the horse braces against you. Children learn fast that force fails and clarity works.
          </ScrollRevealText>
        </div>
        <div ref={ref} className="relative mx-auto aspect-[5/3] w-full max-w-xl">
          <svg viewBox="0 0 500 300" className="h-full w-full" role="img" aria-label="A balance: ten grams on one side levels five hundred kilograms on the other">
            <path d="M250 70 L250 270 M200 270 L300 270" stroke="var(--color-brass)" strokeWidth="2" />
            <path d="M236 70 L250 52 L264 70 Z" fill="var(--color-gold)" />
            <motion.g style={{ rotate: reduced ? 0 : smooth, originX: "250px", originY: "70px" }}>
              <line x1="40" y1="70" x2="460" y2="70" stroke="var(--color-gold)" strokeWidth="2.5" />
            </motion.g>
            <motion.g style={{ y: reduced ? 0 : leftY }}>
              <line x1="40" y1="70" x2="40" y2="150" stroke="var(--color-brass)" strokeWidth="1" />
              <path d="M0 150 Q40 175 80 150 Z" fill="none" stroke="var(--color-brass)" strokeWidth="1.5" />
              <text x="40" y="140" textAnchor="middle" className="font-mono" fontSize="16" fill="var(--color-gold)">
                10 g
              </text>
              <text x="40" y="196" textAnchor="middle" className="label" fontSize="10" fill="var(--color-sand)" letterSpacing="2">
                REIN
              </text>
            </motion.g>
            <motion.g style={{ y: reduced ? 0 : rightY }}>
              <line x1="460" y1="70" x2="460" y2="150" stroke="var(--color-brass)" strokeWidth="1" />
              <path d="M420 150 Q460 175 500 150 Z" fill="none" stroke="var(--color-brass)" strokeWidth="1.5" />
              <text x="460" y="140" textAnchor="middle" className="font-mono" fontSize="16" fill="var(--color-bone)">
                500 kg
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

/** §3 · S26: The Marwari lyre ears - independent 180° auricular mobility looping biomechanics film. */
export function EarDial() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.3 });

  // The 7 MB film starts downloading one screen before the plate is reached (it was fetched with the page).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    return whenNearViewport(video, () => { video.preload = "auto"; });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduced) {
      video.pause();
    } else if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [reduced, inView]);

  return (
    <section aria-labelledby="dial-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
        {/* Left Column: Looping Video Plate */}
        <div ref={containerRef} className="relative mx-auto w-full max-w-xl select-none">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/60 bg-night/80 shadow-2xl shadow-charcoal/15">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="none"
              poster={asset("/video/marwari-ear-poster.jpg")}
              aria-label="Marwari horse ear movement and independent 180-degree listening biomechanics film"
            >
              {/* The web encode (546 KB, 44 dB PSNR against the 7 MB master); the master stays as the fallback. */}
              <source src={asset("/video/marwari-ear-loop-web.mp4")} type="video/mp4" />
              <source src={asset("/video/marwari_horse_ear_biomechanics_loop.mp4")} type="video/mp4" />
            </video>

            {/* Subtle luxury vignette and depth shadow overlay */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20"
              aria-hidden="true"
            />

            {/* Top Corner Editorial Badge */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FAF7F0]/90">
                Independent 180° Mobility
              </span>
            </div>

            {/* Bottom Left Specimen Marker */}
            {/* Sits above the arc chip below 390 px wide frames, where the two shared one row and overlapped. */}
            <div className="absolute bottom-11 left-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-[#FAF7F0]/80 min-[390px]:bottom-4">
              <span className="h-px w-4 bg-brass" />
              <span>AURICULAR BIOMECHANICS</span>
            </div>

            {/* Bottom Right Lyre Arc Indicator */}
            <div className="absolute bottom-4 right-4 rounded border border-white/15 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-antique backdrop-blur-sm">
              <span>−90° ⟷ +90°</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Copy */}
        <div>
          <p className="label text-brass">The ears</p>
          <Headline id="dial-h" className="mt-4" inscription="One hundred and eighty" voice="degrees of attention." />
          <ScrollRevealText className="t-story mt-6 max-w-lg text-sand">
            Each ear turns on its own. One can follow the instructor&rsquo;s voice while the other listens to the rider&rsquo;s breathing.
          </ScrollRevealText>
        </div>
      </div>
    </section>
  );
}
