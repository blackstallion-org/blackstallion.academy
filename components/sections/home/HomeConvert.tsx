"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { CountUp } from "@/components/motion/CountUp";
import { Verifier } from "@/components/sections/verify/Verifier";
import { circuit, shield, verifier } from "@/lib/content/home";
import { standings } from "@/lib/content/records";
import { ease } from "@/lib/motion/tokens";

/** §10 Verifier · S10 seal verifier. */
export function HomeVerifier() {
  return (
    <section aria-labelledby="verify-h" className="relative overflow-hidden py-[clamp(6rem,14vh,12rem)]">
      <FilmImage name="bgPassport" grade="deep" className="opacity-40" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-night via-night/85 to-night/60" />
      <div className="gutter relative">
        <Label reel={11}>The Seal</Label>
        <Headline id="verify-h" className="mt-4" inscription={verifier.inscription} voice={verifier.voice} />
        <p className="mt-6 max-w-lg text-sand">{verifier.body}</p>
        <Verifier className="mt-12" />
      </div>
    </section>
  );
}

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const diff = now === null ? null : Math.max(0, new Date(to).getTime() - now);
  const d = diff === null ? "--" : String(Math.floor(diff / 86_400_000)).padStart(2, "0");
  const h = diff === null ? "--" : String(Math.floor((diff / 3_600_000) % 24)).padStart(2, "0");
  return (
    <span className="font-mono text-gold" suppressHydrationWarning>
      {d}d {h}h
    </span>
  );
}

/** A small lance-bearing horse glyph that gallops along a lane. */
function Rider() {
  return (
    <svg viewBox="0 0 48 28" className="h-6 w-10 text-gold md:h-7 md:w-12" fill="currentColor" aria-hidden>
      <path d="M8 22c1-5 4-8 9-9l6-1c2-3 5-5 9-5l3-3 1 3 3 2-2 2h-3l-2 3 2 8-2 1-3-6-6 1-2 6-2-1 1-6c-3 0-5 2-6 5l-2 4-2-1 2-4c-2 1-3 2-4 3Z" />
      <path d="M22 7 46 2" stroke="currentColor" strokeWidth="1" />
      <circle cx="25" cy="6" r="2.2" />
    </svg>
  );
}

/** §11 Standings · S11 race lanes. Signature: riders gallop down their lanes to their points. */
export function HomeStandings() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const max = Math.max(...standings.map((s) => s.points));

  return (
    <section aria-labelledby="circuit-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="relative h-40 overflow-hidden md:h-56">
        <FilmImage name="bgCharge" position="50% 55%" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night via-transparent to-night" />
      </div>
      <div className="gutter -mt-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="relative">
          <Label reel={12}>The Circuit</Label>
          <Headline id="circuit-h" className="mt-4" inscription={circuit.inscription} voice={circuit.voice} />
        </div>
        <p className="label text-sand">
          {circuit.cup.name} · 14 Nov · {circuit.cup.place} · in <Countdown to={circuit.cup.date} />
        </p>
      </div>

      <div ref={ref} className="gutter mt-12">
        <p className="label mb-3 text-dust">STPCI standings 2026–27 · sample</p>
        <ol className="border-t border-line">
          {standings.map((s, i) => (
            <li key={s.hub} className="relative border-b border-line py-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-sm text-dust">0{s.pos}</span>
                  <span className="t-voice text-xl text-bone md:text-3xl">{s.hub}</span>
                </span>
                <span className="font-mono text-right text-sm text-sand">
                  <span className="text-xl text-gold md:text-2xl">{inView ? <CountUp value={s.points} /> : "0"}</span> pts · {s.gold} gold
                </span>
              </div>
              <div className="relative mt-4 h-8">
                <div aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                <motion.div
                  className="absolute top-0"
                  initial={{ left: "0%" }}
                  animate={inView ? { left: `calc(${(s.points / max) * 100}% - 3rem)` } : { left: "0%" }}
                  transition={{ duration: 2.2 + i * 0.25, ease: ease.citadel, delay: 0.2 + i * 0.15 }}
                >
                  <Rider />
                </motion.div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Cta href="/tournaments">The full circuit</Cta>
        </div>
      </div>
    </section>
  );
}

/** §12 Safety · S12 shield columns. Signature: lance rules draw between columns as the numerals land. */
export function HomeShield() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section aria-labelledby="shield-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label reel={9}>The Shield</Label>
      <Headline id="shield-h" className="mt-4" inscription={shield.inscription} voice={shield.voice} />
      <div ref={ref} className="mt-14 grid lg:grid-cols-3">
        {shield.columns.map((c, i) => (
          <div key={c.big} className="relative py-8 lg:px-10 lg:py-4 lg:first:pl-0">
            {i > 0 && (
              <motion.svg
                aria-hidden
                viewBox="0 0 10 400"
                preserveAspectRatio="none"
                className="absolute left-0 top-0 hidden h-full w-2.5 text-brass lg:block"
              >
                <motion.path
                  d="M5 0 L8 18 L5.5 22 L5.5 400 L4.5 400 L4.5 22 L2 18 Z"
                  fill="currentColor"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.4, ease: ease.citadel, delay: i * 0.2 }}
                />
              </motion.svg>
            )}
            {i > 0 && <div aria-hidden className="hairline mb-8 lg:hidden" />}
            {/* The figure rises out of a mask so it never crosses the line beneath it. */}
            <p className="overflow-hidden pb-[0.12em]">
              <motion.span
                className="t-voice block whitespace-nowrap text-[clamp(2.6rem,11vw,5.5rem)] leading-none text-gold lg:text-[clamp(2.6rem,4.6vw,5.5rem)]"
                initial={{ y: "110%" }}
                animate={inView ? { y: "0%" } : {}}
                transition={{ duration: 1.1, ease: ease.citadel, delay: 0.2 + i * 0.2 }}
              >
                {c.big}
              </motion.span>
            </p>
            <p className="mt-4 max-w-xs text-sand">{c.line}</p>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <Cta href="/safety">How we keep cadets safe</Cta>
      </div>
    </section>
  );
}
