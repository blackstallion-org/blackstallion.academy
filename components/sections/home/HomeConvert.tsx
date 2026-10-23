"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

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

import { CrumpledPaperReveal } from "@/components/motion/CrumpledPaperReveal";
import { cn } from "@/lib/utils";

/** §10 Verifier · S10 seal verifier. Featuring tactile CrumpledPaperReveal on the Sovereign Commission. */
export function HomeVerifier() {
  const [doc, setDoc] = useState<"deed" | "letter">("deed");
  const [trigger, setTrigger] = useState<"hover" | "click" | "inView">("hover");
  const [fold, setFold] = useState<"thirds" | "half" | "none">("thirds");
  const [shape, setShape] = useState<number>(1);

  const imageSrc =
    doc === "deed"
      ? "/images/bsah-commission-deed.jpg"
      : "/images/archival-handwritten-letter.jpg";

  return (
    <section aria-labelledby="verify-h" className="tone-dark relative overflow-hidden bg-night py-[clamp(6rem,14vh,12rem)]">
      {/* Ambient background lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(184,142,74,0.06),transparent_70%)]"
      />

      <div className="gutter relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          {/* Left Column: Editorial & Verifier Form */}
          <div className="lg:col-span-6 flex flex-col">
            <Label reel={11}>The Seal · Tactile Dispatch</Label>
            <Headline
              id="verify-h"
              className="mt-4"
              inscription={verifier.inscription}
              voice={verifier.voice}
            />
            <ScrollRevealText data-home-detail className="mt-6 max-w-lg text-sand leading-relaxed">
              {verifier.body}
            </ScrollRevealText>

            {/* Cryptographic Verifier Box */}
            <div className="mt-8 rounded-xl border border-line/60 bg-black/40 p-6 backdrop-blur-md">
              <p className="label text-gold mb-3">On-Chain Cryptographic Registry</p>
              <Verifier />
            </div>

            {/* Interactive Paper Controls */}
            <div className="mt-8 flex flex-col gap-3 rounded-lg border border-line/40 bg-night/80 p-4">
              <div className="flex items-center justify-between border-b border-line/30 pb-2">
                <span className="font-mono text-xs tracking-wider uppercase text-dust">
                  Tactile Reveal Controls
                </span>
                <span className="font-mono text-[10px] uppercase text-gold/80 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  WebGL2 Physics
                </span>
              </div>

              {/* Document switcher */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-mono text-[11px] text-sand/70 w-20">Document:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDoc("deed")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer",
                      doc === "deed"
                        ? "bg-gold text-night font-bold"
                        : "border border-line/60 text-sand hover:text-bone hover:border-gold/50"
                    )}
                  >
                    Sovereign Deed
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoc("letter")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer",
                      doc === "letter"
                        ? "bg-gold text-night font-bold"
                        : "border border-line/60 text-sand hover:text-bone hover:border-gold/50"
                    )}
                  >
                    Archival Letter
                  </button>
                </div>
              </div>

              {/* Trigger switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-sand/70 w-20">Trigger:</span>
                <div className="flex items-center gap-1.5">
                  {(["hover", "click", "inView"] as const).map((tr) => (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => setTrigger(tr)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer capitalize",
                        trigger === tr
                          ? "bg-gold text-night font-bold"
                          : "border border-line/60 text-sand hover:text-bone hover:border-gold/50"
                      )}
                    >
                      {tr === "hover" ? "Hover / Tap" : tr === "click" ? "Click to Toggle" : "In View"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fold & Shape */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/20">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-sand/70">Fold:</span>
                  {(["thirds", "half", "none"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFold(f)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-mono capitalize cursor-pointer",
                        fold === f ? "text-gold font-bold underline" : "text-dust hover:text-sand"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-sand/70">Shape:</span>
                  {[1, 3, 7, 11].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShape(s)}
                      className={cn(
                        "h-6 w-6 rounded text-[11px] font-mono flex items-center justify-center cursor-pointer",
                        shape === s
                          ? "bg-gold/20 text-gold border border-gold font-bold"
                          : "text-dust hover:text-sand border border-line/40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Crumpled Paper Reveal Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            {/* Ambient pedestal glow */}
            <div
              aria-hidden
              className="absolute h-96 w-96 rounded-full bg-gold/5 blur-3xl pointer-events-none"
            />

            {/* Specimen Badge */}
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-gold/40" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold/90">
                Archival Specimen · {doc === "deed" ? "BSAH-2026-HYD-042" : "Charter Order"}
              </span>
              <span className="h-px w-8 bg-gold/40" />
            </div>

            {/* The 3D Crumpled Paper Stage */}
            <div className="relative flex items-center justify-center p-6 md:p-8">
              <CrumpledPaperReveal
                image={imageSrc}
                alt="BSAH Sovereign Commission Archival Document"
                ratio="4:5"
                fold={fold}
                trigger={trigger}
                shape={shape}
                paper="#F4F0E7"
                creases={65}
                finish="satin"
                light={75}
                ballSize={135}
                shadow="rgba(18, 14, 10, 0.58)"
                link="/verify/BSAH-2026-HYD-042"
                style={{ width: "100%", maxWidth: 360 }}
              />
            </div>

            {/* Instruction / Tactile Hint */}
            <div className="mt-4 text-center max-w-sm">
              <p className="font-mono text-[11px] tracking-wide text-sand/70">
                {trigger === "hover"
                  ? "Hover or touch to unfold the crumpled paper ball · Move cursor to cast raking light"
                  : trigger === "click"
                  ? "Click or tap the sheet to toggle between crumpled sphere and flat print"
                  : "Scroll sheet into viewport to trigger real-time cloth unfolding"}
              </p>
              <p className="mt-1 font-mono text-[10px] text-dust">
                Real-time WebGL2 cloth simulation with crease memory & procedural shadow passes
              </p>
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
