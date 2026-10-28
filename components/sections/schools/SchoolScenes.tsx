"use client";

import { asset } from "@/lib/content/asset";
import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Arrow, Cta, Label, ReelMark } from "@/components/film/Marks";
import { schoolsTeaser } from "@/lib/content/home";
import { benchmark, formatINR, hubs, model, network, simulate, tierById, tiers, TUITION_PER_MONTH, type TierId } from "@/lib/content/schools";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { BlueprintPlan } from "./BlueprintPlan";
import { r3 } from "@/lib/round";
import { StaticImageReel, type StaticImageReelItem } from "@/components/sections/shared/StaticImageReel";
import { ScenePoster } from "./ScenePoster";
import { IndiaSculpture } from "./india-map/IndiaSculpture";
import { mapCopy } from "@/lib/content/india-map";
import { useNearViewport } from "@/lib/motion/use-near-viewport";

// The Hyderabad diorama loads in a chunk of its own, three screens ahead of its section, and shows a still of its opening view until
// the live scene has drawn. (The India model on the first screen loads its three.js code the same way, from inside its own component.)
const Hyderabad3DMap = dynamic(() => import("./Hyderabad3DMap").then((m) => m.Hyderabad3DMap), { ssr: false });

/** Title card · T11 Pan-India Sovereign Hub Network: the lit relief model of India (components/sections/schools/india-map) is the first screen. */
export function SchoolsTitle() {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} aria-labelledby="schools-title" className="editorial-scene">
      <div className="tone-dark relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-black isolate">
        <IndiaSculpture />
      </div>
      <div className="tone-light editorial-details gutter">
        <ReelMark n={11} act="ledger" />
        <Headline id="schools-title" as="h1" size="1" animate="mount" inscription="Your campus" voice="becomes a citadel." />
        <ScrollRevealText className="t-story text-sand">A turnkey equestrian hub, funded, built and run by BSAH at zero capital expenditure to the school board, returning 25–30% of tuition to your institution.</ScrollRevealText>
        <div className="flex flex-wrap items-center gap-4">
          <Cta href="/schools/mou" variant="solid">Request a draft MOU</Cta>
          <Cta href="#simulator">Run the numbers</Cta>
          <a href="#network" className="label inline-flex items-center gap-2 text-gold"><span>{network.length} circuits mapped</span><Arrow /></a>
        </div>
        <p className="label text-brass">Pan-India sovereign network · {network.length} target circuits · lit 3D relief</p>
        <p className="t-ui max-w-3xl text-xs leading-relaxed text-dust">{mapCopy.sources}</p>
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
      <section aria-labelledby="tiers-h" className="relative overflow-hidden py-[clamp(6rem,14vh,12rem)]">
        <div className="relative h-[55svh] min-h-[300px] mb-12"><FilmImage name="bgPavilion" grade="deep" className="opacity-100" /></div>

        <div className="gutter relative grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-center">
          <div>
            <Label reel={11}>For school boards</Label>
            <Headline id="tiers-h" className="mt-4" inscription={schoolsTeaser.inscription} voice={schoolsTeaser.voice} />
            <p className="mt-6 max-w-md text-sand">{schoolsTeaser.body}</p>

            <div className="mt-10 flex flex-col border-t border-line" role="radiogroup" aria-label="Hub tier">
              {tiers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tierId === t.id}
                  onClick={() => setTierId(t.id)}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-line py-4 text-left transition-colors cursor-pointer"
                >
                  <span>
                    <span className={cn("t-voice block text-2xl transition-colors", tierId === t.id ? "text-gold" : "text-sand group-hover:text-bone")}>{t.name}</span>
                    <span className="t-ui mt-1 block text-sm text-dust">
                      {t.stables} stables · {t.acres} · {t.cadets} cadets
                    </span>
                  </span>
                  <span className={cn("font-mono text-sm", tierId === t.id ? "text-gold" : "text-dust")}>{t.capexLabel}</span>
                </button>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Cta href="/schools/mou" variant="solid">
                Request a draft MOU
              </Cta>
              <Cta href="#simulator">
                Run the numbers
              </Cta>
            </div>
          </div>

          <div className="plate relative aspect-[800/460] w-full p-2">
            <BlueprintPlan tier={tier} />
            <p className="font-mono absolute bottom-3 right-4 text-[0.6rem] text-dust">DRAWING {tier.id.toUpperCase()} · NOT TO SCALE</p>
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

/** §3b · Six existing Higgsfield architectural studies, kept static and fully framed. */
export function SchoolArenaShowcase() {
  const arenaImages: StaticImageReelItem[] = [
    {
      image: "schoolAerial",
      title: "Campus Master Plan",
      copy: "Turnkey 1.5–3.0 acre layout, funded, built and operated by BSAH.",
      cta: "Campus specifications",
      href: "/schools/mou",
    },
    {
      image: "schoolArenaNight",
      title: "Regulation Silica Arena",
      copy: "Laser-graded geotextile sand for calm, floodlit evening sessions.",
      cta: "Arena specifications",
      href: "/schools/access",
    },
    {
      image: "tournCrowd",
      title: "National Circuit Hub",
      copy: "A competition-ready arena with spectator railings and a scoring pavilion.",
      cta: "Circuit calendar",
      href: "/tournaments",
    },
    {
      image: "bgStable",
      title: "Biometric Equine Stalls",
      copy: "Timber stabling, automated watering and round-the-clock care for the horses.",
      cta: "Studbook registry",
      href: "/fleet",
    },
    { image: "bgPavilion", title: "Arrival pavilion", copy: "A clear threshold from campus life to the riding ground." },
    { image: "currFormation", title: "Training ground", copy: "A considered arena where each group has room to learn." },
  ];

  return (
    <StaticImageReel
      id="arena-showcase"
      label="REEL 09 · CAMPUS ARCHITECTURAL REEL"
      title="Campus, in six views."
      intro="Six existing Higgsfield studies, shown as undistorted stills with their captions kept clear of the image."
      items={arenaImages}
    />
  );
}

/** §4 · S55 3D Hyderabad Architectural Diorama Map. The 3 flagship hubs: 01A Narsingi, 01B Begumpet, 01C Gachibowli. */
export function HubMap() {
  const [activeHubId, setActiveHubId] = useState<"01A" | "01B" | "01C">("01A");
  const [hover, setHover] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const diorama = useNearViewport(frameRef);
  const dioramaSoon = useNearViewport(frameRef, "300% 0px");
  const [dioramaReady, setDioramaReady] = useState(false);
  useEffect(() => {
    if (dioramaSoon) void import("./Hyderabad3DMap").catch(() => {});
  }, [dioramaSoon]);

  const slugToIdMap: Record<string, "01A" | "01B" | "01C"> = {
    "zone-01a-financial-district": "01A",
    "zone-01c-gachibowli": "01C",
    "zone-01b-begumpet": "01B",
  };

  const idToSlugMap: Record<"01A" | "01B" | "01C", string> = {
    "01A": "zone-01a-financial-district",
    "01C": "zone-01c-gachibowli",
    "01B": "zone-01b-begumpet",
  };

  const handleSelectFrom3D = (hubId: "01A" | "01B" | "01C") => {
    setActiveHubId(hubId);
    setHover(idToSlugMap[hubId]);
  };

  return (
    <section id="hubs" aria-labelledby="hubs-h" className="relative scroll-mt-20 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-center">
        {/* 3D Hyderabad Architectural Diorama Map Viewport */}
        <div ref={frameRef} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line/60 shadow-xl min-h-[500px] lg:min-h-[620px]">
          <ScenePoster src={asset("/images/schools/hyderabad-diorama-poster.webp")} ready={dioramaReady} sizes="(min-width: 1024px) 60vw, 100vw" />
          {diorama && (
            <Hyderabad3DMap
              activeHubId={activeHubId}
              onSelectHub={handleSelectFrom3D}
              className="w-full h-full"
              onReady={() => setDioramaReady(true)}
            />
          )}
        </div>

        {/* Right Editorial Hub List & Navigation */}
        <div>
          <Label>Hubs</Label>
          <Headline id="hubs-h" className="mt-4" inscription="Zone 01," voice="live in Hyderabad." />
          <ul className="mt-10 border-t border-line">
            {hubs.map((h) => {
              const hubCode = slugToIdMap[h.slug];
              const isActive = activeHubId === hubCode || hover === h.slug;
              return (
                <li key={h.slug}>
                  <Link
                    href={`/schools/${h.slug}`}
                    onMouseEnter={() => {
                      setHover(h.slug);
                      if (hubCode) setActiveHubId(hubCode);
                    }}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      if (hubCode) setActiveHubId(hubCode);
                    }}
                    className={cn(
                      "group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-5 px-3 -mx-3 rounded-xl transition-all duration-300",
                      isActive ? "bg-umber/40 border-gold/40" : "hover:bg-umber/20"
                    )}
                  >
                    <span>
                      <span className="font-mono text-xs uppercase tracking-wider text-copper">
                        {hubCode || "HUB"}
                      </span>
                      <span className={cn("t-voice block text-xl transition-colors md:text-2xl mt-0.5", isActive ? "text-gold" : "text-bone")}>
                        {h.name}
                      </span>
                      <span className="t-ui mt-1 block text-sm text-dust">
                        {tierById(h.tier).name} · {h.stallions} stallions
                      </span>
                    </span>
                    <Arrow className={cn("text-gold transition-transform", isActive ? "translate-x-1" : "group-hover:translate-x-1")} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="t-ui mt-6 text-sm text-dust">
            Zones 02–06 — NCR, Mumbai–Pune, Bengaluru, the northern boarding corridor and the east — open for campus surveys (sample planning figures, not operational campuses).
          </p>
        </div>
      </div>
    </section>
  );
}


/** §4b · S57 the Pan-India network. Six sovereign circuits; target corridors, not signed partners. */
export function PanIndiaNetwork() {
  return (
    <section id="network" aria-labelledby="network-h" className="relative scroll-mt-20 bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>The Sovereign Pan-India Regional Hub Network</Label>
        <Headline id="network-h" className="mt-4" inscription="Six circuits," voice="one national standard." />
        <div className="mt-8 max-w-3xl">
          <ScrollRevealText className="t-story text-sand">{benchmark.lines[0]}</ScrollRevealText>
          <ScrollRevealText className="t-story mt-4 text-sand">{benchmark.lines[1]}</ScrollRevealText>
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
