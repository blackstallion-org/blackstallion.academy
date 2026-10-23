"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Arrow, Label, ReelMark } from "@/components/film/Marks";
import { CountUp } from "@/components/motion/CountUp";
import { champions, standings, tournaments } from "@/lib/content/records";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { CinematicStoryReel, type ReelSlide } from "@/components/film/CinematicStoryReel";

/** Title card · T13 charge. Signature: speed streaks rake across the frame as the title lands. */
export function CircuitTitle() {
  return (
    <section aria-labelledby="circuit-title" className="editorial-scene">
<div className="tone-dark editorial-visual relative min-h-[100svh] overflow-hidden">
      <motion.div className="absolute inset-0" initial={{ x: "4%" }} animate={{ x: "0%" }} transition={{ duration: 2.4, ease: ease.citadel }}>
        <FilmImage name="bgCharge" priority bleed />
      </motion.div>
      <div aria-hidden className="widget-hud absolute inset-0 overflow-hidden">
        {Array.from({ length: 9 }, (_, i) => (
          <motion.span
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
            style={{ top: `${12 + i * 9}%`, width: `${30 + (i % 3) * 15}%` }}
            initial={{ left: "110%" }}
            animate={{ left: "-60%" }}
            transition={{ duration: 1.1 + (i % 4) * 0.25, delay: 0.2 + i * 0.08, ease: "easeIn", repeat: 0 }}
          />
        ))}
      </div>
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
        
        <Headline id="circuit-title" as="h1" size="poster" animate="mount" delay={0.4} className="mt-6" inscription="Lances down." voice="Zones on the circuit." />
        
      </div>
    </div>
<div className="tone-light editorial-details gutter"><ReelMark n={12} act="ledger" />
<ScrollRevealText className="t-story mt-6 max-w-2xl text-sand">The STPCI interscholastic circuit: tent pegging, barrel racing and mounted archery between India&rsquo;s schools.</ScrollRevealText></div>
</section>
  );
}

/** §1 · S11 race lanes (full). */
export function StandingsLanes() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const max = Math.max(...standings.map((s) => s.points));
  return (
    <section aria-labelledby="standings-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Season 2026–27 · sample</Label>
      <Headline id="standings-h" className="mt-4" inscription="STPCI" voice="standings." />
      <div ref={ref} tabIndex={0} role="region" aria-label="Tournament standings table" className="relative mt-12 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">STPCI league standings (sample, from the client brief)</caption>
          <thead>
            <tr className="border-b border-line">
              {["Pos", "Hub", "Lane", "Points", "Gold", "Governor's Cup"].map((h) => (
                <th key={h} scope="col" className="label py-3 pr-4 font-semibold text-dust">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.hub} className="border-b border-line">
                <td className="font-mono py-6 pr-4 text-lg text-gold">0{s.pos}</td>
                <th scope="row" className="t-voice pr-4 text-2xl font-semibold text-bone">
                  {s.hub}
                </th>
                <td className="w-[30%] pr-6">
                  <div className="relative h-2 bg-line">
                    <motion.div className="absolute inset-y-0 left-0 bg-gold" initial={{ width: 0 }} animate={inView ? { width: `${(s.points / max) * 100}%` } : {}} transition={{ duration: 1.8, ease: ease.citadel, delay: i * 0.2 }} />
                  </div>
                </td>
                <td className="font-mono pr-4 text-xl text-bone">{inView ? <CountUp value={s.points} /> : 0}</td>
                <td className="font-mono pr-4 text-gold">{s.gold}</td>
                <td className="t-ui text-sm text-sand">{s.cup}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";

/** One flip-board cell: letters cycle and settle on the real text. */
function Flip({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const total = 14;
    let id = window.setTimeout(function tick() {
      frame++;
      setShown(
        text
          .split("")
          .map((ch, i) => (ch === " " || frame > total - (text.length - i) * 0.2 ? ch : ALPHA[Math.floor(Math.random() * ALPHA.length)]))
          .join(""),
      );
      if (frame < total + 4) id = window.setTimeout(tick, 45);
      else setShown(text);
    }, delay);
    return () => window.clearTimeout(id);
  }, [inView, text, delay]);
  return (
    <span ref={ref} aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

/** §2 · S58 departure board. Signature: the letters flip like a station board before settling. */
export function FixtureBoard() {
  return (
    <section aria-labelledby="fixtures-h" className="tone-dark surface-leather relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>Fixtures</Label>
        <Headline id="fixtures-h" className="mt-4" inscription="Next" voice="on the circuit." />
        <ol className="font-mono mt-12 border border-line bg-black/40">
          <li className="hidden grid-cols-[9rem_1fr_1fr_8rem] gap-4 border-b border-line px-5 py-3 text-[0.65rem] uppercase tracking-[0.18em] text-dust md:grid">
            <span>Date</span>
            <span>Fixture</span>
            <span>Venue</span>
            <span>Status</span>
          </li>
          {tournaments.map((t, i) => (
            <li key={t.slug}>
              <Link href={`/tournaments/${t.slug}`} className="group grid gap-2 border-b border-line px-5 py-5 uppercase tracking-[0.08em] transition-colors hover:bg-umber/70 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)_10rem] md:gap-4">
                <span className="text-gold">
                  <Flip text={t.dateLabel} delay={i * 200} />
                </span>
                <span className="text-bone">
                  <Flip text={t.name.toUpperCase()} delay={i * 200 + 100} />
                </span>
                <span className="text-sand">{t.venue.toUpperCase()}</span>
                <span className={cn("whitespace-nowrap", t.status === "open" ? "text-[#D9D5CD]" : "text-dust")}>
                  {t.status === "open" ? "ENTRIES OPEN" : "SOON"} <Arrow className="ml-1 inline h-2 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** §3 · S59 course diagram. Signature: the rider marker gallops down the lane to the peg. */
export function CourseDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <section aria-labelledby="course-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
          <Label>The discipline</Label>
          <Headline id="course-h" className="mt-4" inscription="The art of" voice="the peg." />
          <ScrollRevealText className="t-story mt-6 text-sand">
            Tent pegging is an old cavalry skill. Riders galloped at an enemy camp and lifted its wooden tent pegs on the point of a lance, bringing the tents down on the sleepers. Today it is a sport of nerve and timing.
          </ScrollRevealText>
        </div>
        <div ref={ref} className="plate relative p-4 md:p-6">
          <svg viewBox="0 0 600 220" className="w-full" role="img" aria-label="Tent pegging course: 100 metre run-up, peg about 6 centimetres wide, 9-foot lance, gallop around 35 km/h">
            <rect x="20" y="90" width="560" height="40" fill="color-mix(in srgb, var(--color-brass) 8%, transparent)" stroke="color-mix(in srgb, var(--color-brass) 40%, transparent)" />
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <line x1={20 + i * 50} x2={20 + i * 50} y1="130" y2="140" stroke="color-mix(in srgb, var(--color-brass) 40%, transparent)" />
                <text x={20 + i * 50} y="156" textAnchor="middle" fontSize="10" className="font-mono" fill="var(--color-dust)">
                  {i * 10}
                </text>
              </g>
            ))}
            <text x="300" y="176" textAnchor="middle" fontSize="11" className="label" fill="var(--color-sand)" letterSpacing="2">
              100 M RUN-UP
            </text>
            <rect x="514" y="104" width="8" height="12" fill="var(--color-gold)" />
            <line x1="518" x2="518" y1="60" y2="100" stroke="var(--color-gold)" strokeDasharray="2 3" />
            <text x="518" y="52" textAnchor="middle" fontSize="11" className="font-mono" fill="var(--color-gold)">
              PEG ≈ 6 CM
            </text>
            <line x1="540" x2="540" y1="80" y2="140" stroke="var(--color-blood)" strokeWidth="2" />
            <text x="548" y="76" fontSize="10" className="label" fill="var(--color-blood)" letterSpacing="1.5">
              LINE
            </text>
            <motion.g initial={{ x: 0 }} animate={inView ? { x: 470 } : {}} transition={{ duration: 2.6, ease: [0.45, 0, 0.9, 0.6], delay: 0.4 }}>
              <circle cx="40" cy="110" r="8" fill="var(--color-bone)" />
              <line x1="40" y1="110" x2="78" y2="118" stroke="var(--color-bone)" strokeWidth="2" />
              <text x="40" y="78" textAnchor="middle" fontSize="10" className="font-mono" fill="var(--color-sand)">
                ≈35 KM/H
              </text>
            </motion.g>
            <text x="24" y="30" fontSize="10" className="font-mono" fill="var(--color-dust)">
              LANCE · 9 FT
            </text>
          </svg>
          <p className="t-ui mt-3 text-xs text-dust">Carry the peg past the line for full points. Distances indicative.</p>
        </div>
      </div>
    </section>
  );
}

/** §3b · Cinematic Forward-Zoom Tournament Circuit Action Showcase */
export function TournamentActionGallery() {
  const slides: ReelSlide[] = [
    {
      id: "charge",
      imageKey: "bgCharge",
      subtitle: "REEL 01 · 35 KM/H · TENT-PEGGING",
      titleLine1: "LANCES",
      titleLine2: "DOWN",
      alt: "Cavalry line charge down the 100-metre course with lowered steel-point lances",
      caption: "Thunder down the lane at 35 km/h. Hand-eye calibration to strike a 6 cm wooden peg.",
      align: "left",
    },
    {
      id: "crowd",
      imageKey: "tournCrowd",
      subtitle: "REEL 02 · INTER-SCHOOL DERBY",
      titleLine1: "GRANDSTAND",
      titleLine2: "TURN",
      alt: "School student bodies, coaches, and trustees lining the sand rail",
      caption: "School student bodies, coaches, and trustees lining the sand rail as regional hubs compete.",
      align: "right",
    },
    {
      id: "podium",
      imageKey: "tournPodium",
      subtitle: "REEL 03 · GOVERNOR'S LAURELS",
      titleLine1: "CHAMPIONSHIP",
      titleLine2: "PODIUM",
      alt: "Top-scoring cadet lancers receive medals on the podium",
      caption: "Top-scoring cadet lancers receive medals and perpetual laurels after three rigorous circuit days.",
      align: "left",
    },
    {
      id: "trophy",
      imageKey: "tournCup",
      subtitle: "REEL 04 · SOVEREIGN CHALLENGE",
      titleLine1: "PERPETUAL",
      titleLine2: "TROPHY",
      alt: "Solid silver and oxidized brass trophy featuring crossed Rajput cavalry lances",
      caption: "Hand-chased solid silver and brass trophy awarded annually to highest aggregate discipline points.",
      align: "right",
    },
  ];

  return (
    <CinematicStoryReel
      sectionId="circuit-gallery-h"
      sectionLabel="Circuit Action Archive"
      sectionSubLabel="STPCI Interscholastic League"
      slides={slides}
      exploreHref="/tournaments"
      exploreLabel="Circuit schedule"
    />
  );
}

/** §4 · podium: hall of champions. */
export function Podium() {
  return (
    <section aria-labelledby="podium-h" className="relative overflow-hidden py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="relative">
          <div className="relative aspect-[16/10] overflow-hidden">
            <FilmImage name="tournPodium" sizes="(min-width: 1024px) 60vw, 100vw" />
          </div>
          {/* The cup, as a detail plate pinned to the corner of the scene. */}
          <div className="absolute -bottom-8 right-4 h-44 w-32 overflow-hidden border border-line shadow-[0_24px_60px_rgb(0_0_0/0.7)] md:-bottom-10 md:right-8 md:h-56 md:w-40">
            <FilmImage name="tournCup" sizes="10rem" />
          </div>
        </div>
        <div>
          <Label>Hall of champions · 2025–26 · sample</Label>
          <Headline id="podium-h" className="mt-4" inscription="On the" voice="podium." />
          <ol className="mt-10 flex flex-col">
            {champions.map((c, i) => (
              <li key={c.title} className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-line py-5">
                <span className="t-inscribe text-3xl text-gold">{i + 1}</span>
                <span>
                  <span className="label block text-dust">{c.title}</span>
                  <span className="t-voice mt-1 block text-xl text-bone">{c.who}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
