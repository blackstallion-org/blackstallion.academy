"use client";

import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Arrow, Cta, Label, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { formatINR, hubs, model, simulate, tierById, tiers, type TierId } from "@/lib/content/schools";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { BlueprintPlan } from "./BlueprintPlan";

/** Title card · T11 aerial zoom. Signature: the campus slowly comes closer as you begin to scroll. */
export function SchoolsTitle() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, r(0, 1), [1.02, 1.25]);
  return (
    <section ref={ref} aria-labelledby="schools-title" className="relative min-h-[100svh] overflow-hidden">
      <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 3, ease: ease.citadel }}>
        <FilmImage name="schoolAerial" priority scale={scale} />
      </motion.div>
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div aria-hidden className="absolute inset-0 shade-l opacity-70" />
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
        <ReelMark n={10} act="ledger" />
        <Headline id="schools-title" as="h1" size="1" animate="mount" className="mt-6" inscription="Your campus" voice="becomes a citadel." />
        <p className="t-story mt-6 max-w-2xl text-sand">
          A turnkey equestrian hub, designed, built and run by BSAH, that returns a share of every rupee of tuition to your school.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Cta href="/schools/mou" variant="solid">
            Request a draft MOU
          </Cta>
          <Cta href="#simulator">Run the numbers</Cta>
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
      <Headline id="model-h" className="mt-4" inscription="You build." voice="We run. You share." />
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
  const sim = simulate(cadets, share, tier.capexLakh);
  const months = sim.paybackMonths;
  const gauge = Math.min(1, months / 24);

  return (
    <>
      <section aria-labelledby="tiers-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
        <div className="gutter">
          <Label>Three tiers</Label>
          <Headline id="tiers-h" className="mt-4" inscription="Choose" voice="your arena." />
          <div className="mt-12 grid gap-px bg-brass/15 md:grid-cols-3" role="radiogroup" aria-label="Hub tier">
            {tiers.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tierId === t.id}
                onClick={() => setTierId(t.id)}
                className={cn("bg-night p-6 text-left transition-colors md:p-8", tierId === t.id ? "bg-ember/80" : "hover:bg-umber")}
              >
                <span className={cn("font-mono text-sm", tierId === t.id ? "text-gold" : "text-dust")}>{t.capexLabel}</span>
                <span className={cn("t-voice mt-2 block text-3xl", tierId === t.id ? "text-gold" : "text-bone")}>{t.name}</span>
                <span className="t-ui mt-2 block text-sm text-sand">
                  {t.acres} · {t.cadets} cadets
                </span>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {t.includes.map((x) => (
                    <li key={x} className="label border border-brass/25 px-2 py-1 text-[0.6rem] text-sand">
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
        <Headline id="sim-h" className="mt-4" inscription="The arena" voice="pays for itself." />
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
                  <button key={s} type="button" role="radio" aria-checked={share === s} onClick={() => setShare(s)} className={cn("font-mono border px-5 py-3", share === s ? "border-gold text-gold" : "border-brass/30 text-sand")}>
                    {s}%
                  </button>
                ))}
              </div>
            </div>
            <p className="t-ui text-sm text-dust">
              Tier: <span className="text-sand">{tier.name}</span> ({tier.capexLabel}) · change it above.
            </p>
            <dl className="grid grid-cols-2 gap-6 border-t border-brass/25 pt-8">
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
                <dt className="label text-dust">Capital</dt>
                <dd className="font-mono mt-2 text-xl text-sand">{tier.capexLabel}</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto aspect-[2/1.25] w-full max-w-lg" aria-live="polite">
            <svg viewBox="0 0 400 250" className="h-full w-full" aria-hidden>
              <path d="M40 210 A160 160 0 0 1 360 210" fill="none" stroke="rgb(197 160 89 / 0.2)" strokeWidth="14" />
              <motion.path d="M40 210 A160 160 0 0 1 360 210" fill="none" stroke="var(--color-gold)" strokeWidth="14" initial={false} animate={{ pathLength: Math.max(0.02, gauge) }} transition={{ duration: 0.8, ease: ease.citadel }} />
              {[0, 6, 12, 18, 24].map((m) => {
                const a = Math.PI - (m / 24) * Math.PI;
                return (
                  <text key={m} x={200 + Math.cos(a) * 185} y={214 - Math.sin(a) * 185} textAnchor="middle" className="font-mono" fontSize="11" fill="rgb(138 118 96)">
                    {m}
                  </text>
                );
              })}
            </svg>
            <div className="absolute inset-x-0 bottom-[8%] text-center">
              <p className="font-mono text-5xl text-gold">{months.toFixed(1)}</p>
              <p className="label mt-1 text-sand">months to pay back</p>
            </div>
          </div>
        </div>
        <p className="t-ui mt-10 max-w-3xl text-xs leading-relaxed text-dust">
          Estimate at ₹8,000 monthly tuition per cadet before GST, at full enrolment. Enrolment ramps up over the first terms; final terms are set in the MOU.
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

/** §4 · S55 map pins. An abstract sketch of Hyderabad: the Musi, the ring road, three hubs. */
export function HubMap() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section id="hubs" aria-labelledby="hubs-h" className="relative scroll-mt-20 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="plate relative aspect-square w-full overflow-hidden sm:aspect-[4/3]">
          <svg viewBox="0 0 100 75" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="50" cy="40" r="30" fill="none" stroke="rgb(197 160 89 / 0.25)" strokeWidth="0.4" strokeDasharray="1 1.2" />
            <path d="M8 46 C 25 42, 35 50, 50 46 S 75 38, 94 44" fill="none" stroke="rgb(159 179 200 / 0.35)" strokeWidth="0.8" />
            <text x="80" y="41" className="font-mono" fontSize="1.8" fill="rgb(159 179 200 / 0.6)">MUSI</text>
            <text x="62" y="12" className="font-mono" fontSize="1.8" fill="rgb(138 118 96)">OUTER RING ROAD</text>
            <text x="4" y="72" className="font-mono" fontSize="1.8" fill="rgb(138 118 96)">HYDERABAD · SKETCH, NOT TO SCALE</text>
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
          <Headline id="hubs-h" className="mt-4" inscription="Live" voice="in Hyderabad." />
          <ul className="mt-10 border-t border-brass/20">
            {hubs.map((h) => (
              <li key={h.slug}>
                <Link href={`/schools/${h.slug}`} onMouseEnter={() => setHover(h.slug)} onMouseLeave={() => setHover(null)} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-brass/20 py-5">
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
          <p className="t-ui mt-6 text-sm text-dust">Next: Bengaluru · Pune · Delhi NCR, 2027 (sample).</p>
        </div>
      </div>
    </section>
  );
}
