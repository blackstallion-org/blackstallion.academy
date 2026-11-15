"use client";

import Image from "next/image";
import { ModelPlate } from "@/components/3d/ModelPlate";
import { asset } from "@/lib/content/asset";
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

/**
 * Title card (14 Nov 2026, owner): the council's bronze medal is the hero, large and centred on the dark ground with a warm rim
 * light behind it; the charge photograph and the speed streaks are gone. The medal sways slowly (the flat seal is its fallback).
 */
export function CircuitTitle() {
  return (
    <section aria-labelledby="circuit-title" className="relative overflow-hidden bg-night">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 42% 46% at 50% 44%, color-mix(in srgb, var(--color-gold) 20%, transparent), transparent 72%)" }}
      />
      <div className="gutter relative flex min-h-[100svh] flex-col items-center justify-center gap-6 pb-[7vh] pt-28 text-center md:gap-8 md:pt-32">
        <motion.figure
          className="relative"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: ease.citadel }}
        >
          <ModelPlate
            src={asset("/models/stpci-medal.glb")}
            label="The School Tent Pegging Council of India's bronze medal, turning slowly"
            mode="sway"
            fill={0.96}
            className="h-[min(46svh,82vw)] w-[min(46svh,82vw)]"
            fallback={<Image src="/brand/stpci-medal.webp" alt="" width={720} height={745} priority className="h-full w-full object-contain" />}
          />
        </motion.figure>
        <Headline id="circuit-title" as="h1" size="2" animate="mount" delay={0.5} className="text-center" inscription="Lances down." voice="Zones on the circuit." />
        <p className="label text-dust">Sanctioned by the School Tent Pegging Council of India</p>
      </div>
      <div className="editorial-details gutter flex flex-wrap items-center justify-between gap-x-12 gap-y-8 pb-16">
        <div className="min-w-0 max-w-2xl">
          <ReelMark n={15} act="ledger" />
          <ScrollRevealText className="t-story mt-6 text-sand">The STPCI interscholastic circuit: tent pegging, barrel racing and mounted archery between India&rsquo;s schools.</ScrollRevealText>
        </div>
      </div>
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
/** §3b · Cinematic Forward-Zoom Tournament Circuit Action Showcase */
export function TournamentActionGallery() {
  const slides: ReelSlide[] = [
    {
      id: "charge",
      imageKey: "bgCharge",
      subtitle: "REEL 01 · TENT-PEGGING",
      titleLine1: "LANCES",
      titleLine2: "DOWN",
      alt: "Cavalry line charge down the course with lowered steel-point lances",
      caption: "Thunder down the lane at the gallop. Hand-eye calibration to strike a wooden peg a few centimetres wide.",
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
          {/* R17 (2 Nov 2026): the trophy plate that sat over this photograph is gone; the podium stands on its own. */}
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
