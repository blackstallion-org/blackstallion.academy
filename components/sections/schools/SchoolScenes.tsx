"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Headline } from "@/components/film/Headline";
import { Arrow, Cta, Label, ReelMark } from "@/components/film/Marks";
import { benchmark, formatINR, hubs, model, network, simulate, tierById, tiers, TUITION_PER_MONTH, type TierId } from "@/lib/content/schools";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { BlueprintPlan } from "./BlueprintPlan";
import { r3 } from "@/lib/round";
import { WebGLNoiseTransition } from "@/components/film/WebGLNoiseTransition";

/** Title card · T11 Pan-India Sovereign Hub Network Orbital Satellite Flyover Hero */
export function SchoolsTitle() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <section
      ref={ref}
      aria-labelledby="schools-title"
      className="tone-dark relative min-h-[100svh] h-[100svh] w-full overflow-hidden bg-black select-none isolate flex flex-col justify-between"
    >
      {/* Background Pan-India Satellite Flyover Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        poster="/video/bsah-pan-india-poster.jpg"
        aria-label="BSAH Sovereign Pan-India Hub Network orbital satellite flyover"
        className="absolute inset-0 h-full w-full object-cover object-center z-10 brightness-[0.88] contrast-[1.08]"
      >
        <source src="/video/bsah-pan-india-hub.mp4" type="video/mp4" />
        <source
          src="/video/bsah_sovereign_pan_india_hub_network_20s (1).mp4"
          type="video/mp4"
        />
      </video>

      {/* Cinematic Shadow Overlays for text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-15 bg-gradient-to-t from-black via-black/40 to-black/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-15 [background:radial-gradient(circle_at_70%_40%,transparent_30%,rgba(0,0,0,0.65)_100%)]"
      />

      {/* Top HUD Telemetry Bar */}
      <div className="relative z-25 w-full pt-20 sm:pt-24 px-6 sm:px-12 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
          </span>
          <span className="font-mono text-[0.65rem] sm:text-xs uppercase tracking-[0.25em] text-gold/90">
            ORBITAL TELEMETRY · PAN-INDIA SOVEREIGN NETWORK
          </span>
        </div>

        {/* Ambient Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-2 rounded-full border border-gold/40 bg-black/60 px-3.5 py-1.5 text-[0.65rem] font-mono uppercase tracking-[0.2em] text-[#faf7f0] backdrop-blur-md transition-all hover:border-gold hover:bg-gold/20 cursor-pointer"
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold" />
          <span>SOUND {isMuted ? "OFF" : "ON"}</span>
        </button>
      </div>

      {/* Bottom Editorial Content & High-Impact CTAs */}
      <div className="gutter relative z-25 flex flex-col justify-end pb-[10vh] max-w-4xl">
        <ReelMark n={10} act="ledger" />
        <Headline
          id="schools-title"
          as="h1"
          size="1"
          animate="mount"
          className="mt-6 text-[#faf7f0]"
          inscription="Your campus"
          voice="becomes a citadel."
        />
        <p className="t-story mt-6 max-w-2xl text-[#faf7f0]/85 drop-shadow-md">
          A turnkey equestrian hub, funded, built and run by BSAH at zero capital expenditure to the school board, returning 25–30% of tuition to your institution.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Cta href="/schools/mou" variant="solid">
            Request a draft MOU
          </Cta>
          <Cta href="#simulator">Run the numbers</Cta>
          <a
            href="#network"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-gold hover:text-white transition-colors"
          >
            <span>28 Hubs Mapped</span>
            <Arrow />
          </a>
        </div>
      </div>
    </section>
  );
}

/** §1 · S53 flow. Signature: connectors draw from node to node. */
export function ModelFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <section aria-labelledby="model-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>The model</Label>
      <Headline id="model-h" className="mt-4" inscription="Zero CapEx." voice="We build. You earn." />
      <div ref={ref} className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-0">
        <svg aria-hidden viewBox="0 0 1000 20" preserveAspectRatio="none" className="absolute left-[16%] right-[16%] top-8 hidden h-5 w-[68%] md:block">
          <motion.path d="M0 10 H1000" stroke="var(--color-gold)" strokeWidth="1.5" strokeDasharray="6 8" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.8, ease: ease.citadel, delay: 0.3 }} />
        </svg>
        {model.map((m, i) => (
          <motion.div key={m.n} className="relative flex flex-col items-start md:items-center md:px-6 md:text-center" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: i * 0.35 }}>
            <span className="t-inscribe relative z-10 grid h-16 w-16 place-items-center rounded-full border border-gold bg-night text-xl text-gold">{m.n}</span>
            <p className="t-voice mt-6 text-2xl text-bone">{m.title}</p>
            <p className="mt-2 max-w-xs text-sand">{m.line}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/** §2 · S09 full blueprint configurator + §3 · S54 instrument panel, sharing the chosen tier. */
export function ConfiguratorAndSimulator() {
  const [tierId, setTierId] = useState<TierId>("standard");
  const [cadets, setCadets] = useState(150);
  const [share, setShare] = useState(25);
  const tier = tierById(tierId);
  const sim = simulate(cadets, share);
  const maxShare = simulate(500, 30).schoolYear;
  const gauge = Math.min(1, sim.schoolYear / maxShare);

  return (
    <>
      <section aria-labelledby="tiers-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
        <div className="gutter">
          <Label>Three tiers</Label>
          <Headline id="tiers-h" className="mt-4" inscription="Choose" voice="your arena." />
          <div className="mt-12 grid gap-px bg-line md:grid-cols-3" role="radiogroup" aria-label="Hub tier">
            {tiers.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tierId === t.id}
                onClick={() => setTierId(t.id)}
                className={cn("bg-night p-6 text-left transition-colors md:p-8", tierId === t.id ? "bg-ember/80" : "hover:bg-umber")}
              >
                <span className={cn("font-mono text-sm", tierId === t.id ? "text-gold" : "text-dust")}>BSAH funds · {t.capexLabel}</span>
                <span className={cn("t-voice mt-2 block text-3xl", tierId === t.id ? "text-gold" : "text-bone")}>{t.name}</span>
                <span className="t-ui mt-2 block text-sm text-sand">
                  {t.acres} · {t.cadets} cadets
                </span>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {t.includes.map((x) => (
                    <li key={x} className="label border border-line px-2 py-1 text-[0.6rem] text-sand">
                      {x}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <div className="plate relative mt-8 aspect-[800/460] w-full p-2 md:p-4">
            <BlueprintPlan tier={tier} />
            <p className="font-mono absolute bottom-3 right-4 text-[0.6rem] text-dust">DRAWING {tier.id.toUpperCase()} · INDICATIVE · NOT TO SCALE</p>
          </div>
        </div>
      </section>

      <section id="simulator" aria-labelledby="sim-h" className="gutter relative scroll-mt-20 py-[clamp(6rem,14vh,12rem)]">
        <Label>Return simulator</Label>
        <Headline id="sim-h" className="mt-4" inscription="The arena pays you" voice="from month one." />
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-col gap-10">
            <div>
              <label htmlFor="sim-cadets" className="label flex justify-between text-dust">
                <span>Enrolled cadets</span>
                <span className="font-mono text-lg text-gold">{cadets}</span>
              </label>
              <input id="sim-cadets" type="range" min={100} max={500} step={10} value={cadets} onChange={(e) => setCadets(Number(e.target.value))} className="range-brass mt-4 w-full" />
            </div>
            <div>
              <p className="label text-dust">School revenue share</p>
              <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Revenue share">
                {[25, 30].map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={share === s} onClick={() => setShare(s)} className={cn("font-mono border px-5 py-3", share === s ? "border-gold text-gold" : "border-line text-sand")}>
                    {s}%
                  </button>
                ))}
              </div>
            </div>
            <p className="t-ui text-sm text-dust">
              Tier: <span className="text-sand">{tier.name}</span> (BSAH invests {tier.capexLabel}) · change it above.
            </p>
            <dl className="grid grid-cols-2 gap-6 border-t border-line pt-8">
              <div>
                <dt className="label text-dust">Annual tuition</dt>
                <dd className="font-mono mt-2 text-2xl text-bone">{formatINR(sim.annualTuition)}</dd>
              </div>
              <div>
                <dt className="label text-dust">To the school / year</dt>
                <dd className="font-mono mt-2 text-2xl text-gold">{formatINR(sim.schoolYear)}</dd>
              </div>
              <div>
                <dt className="label text-dust">To the school / month</dt>
                <dd className="font-mono mt-2 text-xl text-sand">{formatINR(sim.schoolMonth)}</dd>
              </div>
              <div>
                <dt className="label text-dust">Your capital</dt>
                <dd className="font-mono mt-2 text-xl text-sand">₹0 · BSAH-funded</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto aspect-[2/1.25] w-full max-w-lg" aria-live="polite">
            <svg viewBox="0 0 400 250" className="h-full w-full" aria-hidden>
              <path d="M40 210 A160 160 0 0 1 360 210" fill="none" stroke="color-mix(in srgb, var(--color-brass) 20%, transparent)" strokeWidth="14" />
              <motion.path d="M40 210 A160 160 0 0 1 360 210" fill="none" stroke="var(--color-gold)" strokeWidth="14" initial={false} animate={{ pathLength: Math.max(0.02, gauge) }} transition={{ duration: 0.8, ease: ease.citadel }} />
              {[0, 25, 50, 75, 100].map((m) => {
                const a = Math.PI - (m / 100) * Math.PI;
                return (
                  <text key={m} x={r3(200 + Math.cos(a) * 185)} y={r3(214 - Math.sin(a) * 185)} textAnchor="middle" className="font-mono" fontSize="11" fill="var(--color-dust)">
                    {m === 0 ? "0" : ""}
                  </text>
                );
              })}
            </svg>
            <div className="absolute inset-x-0 bottom-[8%] text-center">
              <p className="font-mono text-5xl text-gold">{formatINR(sim.schoolYear)}</p>
              <p className="label mt-1 text-sand">to the school, per year</p>
            </div>
          </div>
        </div>
        <p className="t-ui mt-10 max-w-3xl text-xs leading-relaxed text-dust">
          Estimate at ₹{TUITION_PER_MONTH.toLocaleString("en-IN")} monthly Core tuition per cadet before GST, at full enrolment. The school carries no construction capital; enrolment ramps up over the first terms and final terms are set in the MOU.
        </p>
        <div className="mt-8">
          <Cta href="/schools/mou" variant="solid">
            Unlock the full model &amp; draft MOU
          </Cta>
        </div>
      </section>
    </>
  );
}

/** §3b · WebGL 4D Simplex Noise School Arena Architectural Showcase */
export function SchoolArenaShowcase() {
  const slides = [
    {
      image: "schoolAerial",
      badge: "Zero CapEx Campus",
      tag: "Master Plan",
      title: "Campus Master Plan",
      subtitle: "Turnkey 3-acre layout financed, built, and operated at zero capital expenditure.",
      caption: "Turnkey 1.5–3.0 Acre Arena & Pavilion",
    },
    {
      image: "schoolArenaNight",
      badge: "Regulation Arena",
      tag: "All-Weather Silica",
      title: "Regulation Silica Arena",
      subtitle: "Laser-graded geotextile sand engineered for evening floodlit sessions.",
      caption: "60m × 20m Standard Dressage Ring",
    },
    {
      image: "tournCrowd",
      badge: "Circuit Host",
      tag: "National Circuit",
      title: "National Circuit Hub",
      subtitle: "Official host venue for regional equestrian championships.",
      caption: "Spectator Railings & Scoring Pavilion",
    },
    {
      image: "bgStable",
      badge: "Biometric Care",
      tag: "Equine Quarters",
      title: "Biometric Equine Stalls",
      subtitle: "Handcrafted timber stabling with automated watering and 24/7 care.",
      caption: "Stabling for 16 Marwari Stallions",
    },
  ];

  return (
    <section aria-labelledby="arena-showcase-h" className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden bg-night tone-dark border-y border-line/40">
      <h2 id="arena-showcase-h" className="sr-only">Architectural visualizer — The campus arena, in liquid detail.</h2>
      <WebGLNoiseTransition
        slides={slides}
        fullScreen
        showTabs
        showControls
        showDots
        showEffectToggle
        initialEffect="slice"
        autoplayInterval={7000}
      />
    </section>
  );
}

/** §4 · S55 map pins. An abstract sketch of Hyderabad: the Musi, the ring road, three hubs. */
export function HubMap() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section id="hubs" aria-labelledby="hubs-h" className="relative scroll-mt-20 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="plate relative aspect-square w-full overflow-hidden sm:aspect-[4/3]">
          <svg viewBox="0 0 100 75" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="50" cy="40" r="30" fill="none" stroke="color-mix(in srgb, var(--color-brass) 25%, transparent)" strokeWidth="0.4" strokeDasharray="1 1.2" />
            <path d="M8 46 C 25 42, 35 50, 50 46 S 75 38, 94 44" fill="none" stroke="color-mix(in srgb, var(--color-dust) 35%, transparent)" strokeWidth="0.8" />
            <text x="80" y="41" className="font-mono" fontSize="1.8" fill="color-mix(in srgb, var(--color-dust) 60%, transparent)">MUSI</text>
            <text x="62" y="12" className="font-mono" fontSize="1.8" fill="var(--color-dust)">OUTER RING ROAD</text>
            <text x="4" y="72" className="font-mono" fontSize="1.8" fill="var(--color-dust)">HYDERABAD · SKETCH, NOT TO SCALE</text>
          </svg>
          {hubs.map((h) => (
            <Link
              key={h.slug}
              href={`/schools/${h.slug}`}
              onMouseEnter={() => setHover(h.slug)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(h.slug)}
              onBlur={() => setHover(null)}
              className="group absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${h.pin.x}%`, top: `${h.pin.y}%` }}
              aria-label={`${h.name}, ${tierById(h.tier).name}`}
            >
              <svg viewBox="0 0 20 28" className={cn("h-8 w-6 transition-transform", hover === h.slug && "-translate-y-1")} aria-hidden>
                <path d="M10 27 C10 27 2 16 2 10 a8 8 0 0 1 16 0 C18 16 10 27 10 27 Z" fill="var(--color-gold)" />
                <circle cx="10" cy="10" r="3" fill="var(--color-night)" />
              </svg>
              <span className={cn("label absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap bg-night/80 px-2 py-1 text-[0.6rem] transition-colors", hover === h.slug ? "text-gold" : "text-sand")}>{h.short}</span>
            </Link>
          ))}
        </div>
        <div>
          <Label>Hubs</Label>
          <Headline id="hubs-h" className="mt-4" inscription="Zone 01," voice="live in Hyderabad." />
          <ul className="mt-10 border-t border-line">
            {hubs.map((h) => (
              <li key={h.slug}>
                <Link href={`/schools/${h.slug}`} onMouseEnter={() => setHover(h.slug)} onMouseLeave={() => setHover(null)} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-5">
                  <span>
                    <span className={cn("t-voice block text-xl transition-colors md:text-2xl", hover === h.slug ? "text-gold" : "text-bone")}>{h.name}</span>
                    <span className="t-ui mt-1 block text-sm text-dust">
                      {tierById(h.tier).name} · {h.stallions} stallions
                    </span>
                  </span>
                  <Arrow className="text-gold transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="t-ui mt-6 text-sm text-dust">Zones 02–06 — NCR, Mumbai–Pune, Bengaluru, the northern boarding corridor and the east — open for campus surveys (sample status).</p>
        </div>
      </div>
    </section>
  );
}


/** §4b · S57 the Pan-India network. Six sovereign circuits; target corridors, not signed partners. */
export function PanIndiaNetwork() {
  return (
    <section aria-labelledby="network-h" className="relative bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>The Sovereign Pan-India Regional Hub Network</Label>
        <Headline id="network-h" className="mt-4" inscription="Six circuits," voice="one national standard." />
        <div className="mt-8 max-w-3xl">
          <p className="t-story text-sand">{benchmark.lines[0]}</p>
          <p className="t-story mt-4 text-sand">{benchmark.lines[1]}</p>
        </div>
        <div className="mt-14 grid gap-px bg-line md:grid-cols-2 xl:grid-cols-3">
          {network.map((z) => (
            <div key={z.code} className="bg-night p-6 md:p-8">
              <p className="font-mono text-sm text-copper">ZONE {z.code}</p>
              <h3 className="t-voice mt-2 text-2xl text-bone">{z.name}</h3>
              <ul className="mt-6 flex flex-col gap-4 border-t border-line pt-5">
                {z.subzones.map((sz) => (
                  <li key={sz.code}>
                    <p className="label text-gold">
                      {sz.code} <span className="ml-1 text-sand">{sz.name}</span>
                    </p>
                    <p className="t-ui mt-1 text-sm text-dust">{sz.demographic}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="t-ui mt-6 text-xs text-dust">Target educational corridors for the national rollout. Hub statuses are published only for operating zones; no partnership is implied for any institution within a corridor.</p>
      </div>
    </section>
  );
}
