"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import dynamic from "next/dynamic";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { HomeHeadline as Headline } from "./HomeTypography";
import { Cta, Label } from "@/components/film/Marks";
import { CountUp } from "@/components/motion/CountUp";
import { Verifier } from "@/components/sections/verify/Verifier";
import { circuit, shield, verifier } from "@/lib/content/home";
import { standings } from "@/lib/content/records";
import { ease } from "@/lib/motion/tokens";

/** The riding-gear 3D stage is fetched only when the shield section nears the viewport (three.js, R3F and the 5 MB model stay out of the home bundle). */
const RidingGearStage = dynamic(() => import("@/components/sections/equipment/RidingGearStage").then((mod) => mod.RidingGearStage), { ssr: false });

/** §10 Verifier · S10 seal verifier. A slim bar: the passport-code check stays, the scroll curtain above it carries the picture. */
export function HomeVerifier() {
  return (
    <section aria-labelledby="verify-h" className="tone-dark relative overflow-hidden bg-night py-[clamp(4rem,9vh,7rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_20%_40%,rgba(184,142,74,0.07),transparent_70%)]"
      />
      <div className="gutter relative grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Label reel={12}>The Seal</Label>
          <Headline id="verify-h" className="mt-4" inscription={verifier.inscription} voice={verifier.voice} />
          <ScrollRevealText data-home-detail className="mt-5 max-w-lg text-sand leading-relaxed">
            {verifier.body}
          </ScrollRevealText>
        </div>
        <div className="lg:col-span-6">
          <div className="rounded-xl border border-line/60 bg-black/35 p-6 backdrop-blur-md sm:p-8">
            <p className="label mb-4 text-gold">Passport registry</p>
            <Verifier />
            <div className="mt-6">
              <Cta href="/verify">Open the registry</Cta>
            </div>
          </div>
        </div>
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
          <Label reel={13}>The Circuit</Label>
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
                  <span className="inline-block min-w-[3ch] text-xl tabular-nums text-gold md:text-2xl">{inView ? <CountUp value={s.points} /> : "0"}</span> pts · {s.gold} gold
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
  const stageRef = useRef<HTMLDivElement>(null);
  const stageNear = useInView(stageRef, { once: true, margin: "300px" });
  const stageOnScreen = useInView(stageRef, { margin: "80px" });

  return (
    <section aria-labelledby="shield-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div>
          <Label reel={10}>The Shield</Label>
          <Headline id="shield-h" className="mt-4" inscription={shield.inscription} voice={shield.voice} />
          <p className="mt-6 max-w-md text-sand leading-relaxed">
            Before a cadet rides, the kit is checked: a fitted helmet, tested tack and boots made for the stirrup. Turn it over and look closely.
          </p>
          <div className="mt-8">
            <Cta href="/equipment">See the full kit</Cta>
          </div>
        </div>
        <div ref={stageRef} className="tone-dark relative aspect-[5/4] overflow-hidden border border-line/40 bg-night">
          {stageNear ? <RidingGearStage active={stageOnScreen} /> : null}
          <p className="label pointer-events-none absolute left-5 top-5 text-brass">3D specimen · riding kit</p>
          <p className="label pointer-events-none absolute right-5 top-5 text-dust">Drag to rotate</p>
        </div>
      </div>
      <div ref={ref} className="mt-20 grid lg:grid-cols-3">
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
              <span data-home-figure
                className="t-voice block whitespace-nowrap text-[clamp(2.6rem,11vw,5.5rem)] leading-none text-gold lg:text-[clamp(2.6rem,4.6vw,5.5rem)]"
              >
                {c.big}
              </span>
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
