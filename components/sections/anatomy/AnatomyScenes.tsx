"use client";

import { motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { earLeft } from "@/components/brand/paths";
import { ease } from "@/lib/motion/tokens";
import { r3 } from "@/lib/round";

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
    <section aria-labelledby="anatomy-h" className="relative min-h-[100svh] overflow-hidden bg-night pb-8 pt-24">
      <div className="gutter">
        <ReelMark n={2} act="legend" />
        <Headline id="anatomy-h" as="h1" size="1" animate="mount" className="mt-6" inscription="The" voice="instrument." />
      </div>
      <div className="gutter mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-sm">
          <p className="t-story text-sand">Five hundred kilograms of muscle and nerve that notices your breathing before you do.</p>
          <dl className="font-mono mt-8 hidden border-t border-line text-xs lg:block">
            {catalogue.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-line py-2">
                <dt className="uppercase tracking-[0.12em] text-dust">{k}</dt>
                <dd className="text-sand">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <motion.figure
          className="w-full lg:w-[min(64vw,calc((100svh-25rem)*16/9))]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: ease.citadel, delay: 0.3 }}
        >
          <div className="relative aspect-[16/9] w-full">
            <FilmImage name="anatomyProfile" priority sizes="(min-width: 1024px) 64vw, 100vw" grade="none" />
            {/* Museum mount rulings */}
            {["top-0 inset-x-0 h-px", "bottom-0 inset-x-0 h-px", "left-0 inset-y-0 w-px", "right-0 inset-y-0 w-px"].map((c, i) => (
              <motion.span
                key={c}
                aria-hidden
                className={`absolute bg-line ${c}`}
                initial={{ scaleX: i < 2 ? 0 : 1, scaleY: i >= 2 ? 0 : 1 }}
                animate={{ scaleX: 1, scaleY: 1 }}
                transition={{ duration: 1.4, ease: ease.citadel, delay: 0.8 + i * 0.12 }}
                style={{ originX: 0, originY: 0 }}
              />
            ))}
          </div>
          <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-mono text-xs tracking-[0.12em] text-gold">PLATE 02 · EQUUS FERUS CABALLUS · MARWARI</span>
            <span className="font-mono text-xs text-dust lg:hidden">STALLION · 15.2 HH · DARK BAY · CAT. BSAH-0912</span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}

/** §2 · S25 scale balance: 10 g against 500 kg. Signature: the beam levels as you scroll. */
export function ScaleBalance() {
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
          <p className="t-story mt-6 max-w-lg text-sand">
            The lightest touch on the rein can turn a 500 kg stallion. Pull hard and the horse braces against you. Children learn fast that force fails and clarity works.
          </p>
        </div>
        <div ref={ref} className="relative mx-auto aspect-[5/3] w-full max-w-xl">
          <svg viewBox="0 0 500 300" className="h-full w-full" role="img" aria-label="A balance: ten grams on one side levels five hundred kilograms on the other">
            <path d="M250 70 L250 270 M200 270 L300 270" stroke="var(--color-brass)" strokeWidth="2" />
            <path d="M236 70 L250 52 L264 70 Z" fill="var(--color-gold)" />
            <motion.g style={{ rotate: smooth, originX: "250px", originY: "70px" }}>
              <line x1="40" y1="70" x2="460" y2="70" stroke="var(--color-gold)" strokeWidth="2.5" />
            </motion.g>
            <motion.g style={{ y: leftY }}>
              <line x1="40" y1="70" x2="40" y2="150" stroke="var(--color-brass)" strokeWidth="1" />
              <path d="M0 150 Q40 175 80 150 Z" fill="none" stroke="var(--color-brass)" strokeWidth="1.5" />
              <text x="40" y="140" textAnchor="middle" className="font-mono" fontSize="16" fill="var(--color-gold)">
                10 g
              </text>
              <text x="40" y="196" textAnchor="middle" className="label" fontSize="10" fill="rgb(217 213 205)" letterSpacing="2">
                REIN
              </text>
            </motion.g>
            <motion.g style={{ y: rightY }}>
              <line x1="460" y1="70" x2="460" y2="150" stroke="var(--color-brass)" strokeWidth="1" />
              <path d="M420 150 Q460 175 500 150 Z" fill="none" stroke="var(--color-brass)" strokeWidth="1.5" />
              <text x="460" y="140" textAnchor="middle" className="font-mono" fontSize="16" fill="var(--color-bone)">
                500 kg
              </text>
              <text x="460" y="196" textAnchor="middle" className="label" fontSize="10" fill="rgb(217 213 205)" letterSpacing="2">
                STALLION
              </text>
            </motion.g>
          </svg>
        </div>
      </div>
    </section>
  );
}

/** §3 · S26 dial: turn the ear through 180°. Drag, or use the arrow keys. */
export function EarDial() {
  const [deg, setDeg] = useState(0);
  const angle = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const set = (d: number) => {
    const c = Math.max(-90, Math.min(90, Math.round(d)));
    angle.set(c);
    setDeg(c);
  };
  const fromPointer = (e: PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.62;
    const a = (Math.atan2(e.clientX - cx, cy - e.clientY) * 180) / Math.PI;
    set(a);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") set(deg - 10);
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") set(deg + 10);
    else return;
    e.preventDefault();
  };
  const smooth = useSpring(angle, { stiffness: 120, damping: 16 });

  return (
    <section aria-labelledby="dial-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
        <div
          ref={ref}
          className="relative mx-auto aspect-square w-full max-w-md touch-none select-none"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            fromPointer(e);
          }}
          onPointerMove={(e) => e.buttons === 1 && fromPointer(e)}
        >
          <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
            {/* Arc of 180° */}
            <path d="M60 248 A140 140 0 0 1 340 248" fill="none" stroke="rgb(184 115 51 / 0.25)" strokeWidth="1" />
            {Array.from({ length: 19 }, (_, i) => {
              const a = (-90 + i * 10) * (Math.PI / 180);
              const x1 = r3(200 + Math.sin(a) * 140);
              const y1 = r3(248 - Math.cos(a) * 140);
              const x2 = r3(200 + Math.sin(a) * (i % 3 === 0 ? 124 : 132));
              const y2 = r3(248 - Math.cos(a) * (i % 3 === 0 ? 124 : 132));
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-brass)" strokeWidth={i % 3 === 0 ? 1.4 : 0.8} />;
            })}
            <text x="44" y="272" className="font-mono" fontSize="11" fill="rgb(140 136 130)">
              −90°
            </text>
            <text x="322" y="272" className="font-mono" fontSize="11" fill="rgb(140 136 130)">
              +90°
            </text>
            <motion.g style={{ rotate: smooth, originX: "200px", originY: "248px" }}>
              <g transform="translate(152 120) scale(2.4)">
                <path d={earLeft} fill="var(--color-gold)" opacity="0.92" transform="translate(-6 0)" />
              </g>
              <line x1="200" y1="248" x2="200" y2="96" stroke="var(--color-gold)" strokeWidth="0.8" strokeDasharray="3 4" />
            </motion.g>
            <circle cx="200" cy="248" r="5" fill="var(--color-gold)" />
          </svg>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-3"
          >
            <span className="font-mono text-4xl text-gold" aria-hidden>
              {deg > 0 ? "+" : ""}
              {deg}°
            </span>
            <button
              type="button"
              role="slider"
              aria-label="Ear rotation"
              aria-valuemin={-90}
              aria-valuemax={90}
              aria-valuenow={deg}
              aria-valuetext={`${deg} degrees`}
              onKeyDown={onKey}
              className="label border border-line px-3 py-2 text-sand hover:border-gold"
            >
              Drag the ear · or use arrow keys
            </button>
          </motion.div>
        </div>
        <div>
          <p className="label text-brass">The ears</p>
          <Headline id="dial-h" className="mt-4" inscription="One hundred and eighty" voice="degrees of attention." />
          <p className="t-story mt-6 max-w-lg text-sand">
            Each ear turns on its own. One can follow the instructor&rsquo;s voice while the other listens to the rider&rsquo;s breathing.
          </p>
        </div>
      </div>
    </section>
  );
}
