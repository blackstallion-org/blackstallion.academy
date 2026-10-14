"use client";

import { AnimatePresence, motion, useInView, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark, StatusDot } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { careLog, coatRegistry, feeds, fleet, FLEET_TOTAL, statusLabel, type Stallion } from "@/lib/content/fleet";
import { hubs } from "@/lib/content/schools";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { CinematicStoryReel, type ReelSlide } from "@/components/film/CinematicStoryReel";

const hubName = (slug: string) => hubs.find((h) => h.slug === slug)?.short ?? slug;

/** Title card · T7 lantern corridor. Signature: the lantern light swells as you scroll in. */
export function FleetTitle() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, r(0, 1), [1, 1.12]);
  return (
    <section ref={ref} aria-labelledby="fleet-h" className="relative min-h-[100svh] overflow-hidden">
      <FilmImage name="bgStable" priority scale={scale} grade="none" />
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
        <ReelMark n={6} act="citadel" />
        <Headline id="fleet-h" as="h1" size="1" animate="mount" className="mt-6 [text-shadow:0_3px_15px_rgba(0,0,0,0.7)]" inscription="Twenty-one stallions." voice="Every one has a name." />
        <p className="t-story mt-6 max-w-2xl text-bone [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">Indigenous Marwari and Kathiawari horses, microchipped, vet-checked daily and on camera around the clock.</p>
      </div>
    </section>
  );
}

/** §1 · S40 registry + drawer. Signature: opening a horse slides its studbook page in from the right. */
export function Registry() {
  const [filter, setFilter] = useState<"All" | "Marwari" | "Kathiawari">("All");
  const [open, setOpen] = useState<Stallion | null>(null);
  const list = fleet.filter((s) => filter === "All" || s.family === filter);

  return (
    <section aria-labelledby="registry-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Label>The registry</Label>
          <Headline id="registry-h" className="mt-4" inscription="The" voice="studbook." />
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="Filter by breed">
          {(["All", "Marwari", "Kathiawari"] as const).map((f) => (
            <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)} className={cn("label border px-4 py-2.5", filter === f ? "border-gold text-gold" : "border-line text-sand hover:text-bone")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-10 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <caption className="sr-only">Stallion registry (sample records)</caption>
          <thead>
            <tr className="border-b border-line">
              {["", "Name", "Breed", "Microchip (ISO 11784)", "Hub", "Status", ""].map((h, k) => (
                <th key={k} scope="col" className="label py-3 pr-4 font-semibold text-dust">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="group border-b border-line transition-colors hover:bg-umber/60">
                <td className="py-3 pr-4">
                  <div className="relative h-14 w-12 overflow-hidden">
                    <FilmImage name={s.image} sizes="48px" grade="none" />
                  </div>
                </td>
                <th scope="row" className="t-voice pr-4 text-2xl font-semibold text-bone">
                  {s.name}
                </th>
                <td className="t-ui pr-4 text-sm text-sand">{s.breed}</td>
                <td className="font-mono pr-4 text-xs text-gold">{s.chip}</td>
                <td className="t-ui pr-4 text-sm text-sand">{hubName(s.hub)}</td>
                <td className="label pr-4 text-sand">
                  <span className="flex items-center gap-2">
                    <StatusDot status={s.status} />
                    {statusLabel[s.status]}
                  </span>
                </td>
                <td className="text-right">
                  <button type="button" onClick={() => setOpen(s)} className="label border border-line px-3 py-2 text-gold hover:border-gold">
                    Open
                    <span className="sr-only"> {s.name}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="t-story mt-6 italic text-dust">{FLEET_TOTAL - fleet.length} more stallions in the registry · records shown are samples.</p>

      <AnimatePresence>{open && <Drawer s={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}

/** §1b · Cinematic Forward-Zoom Stallion Bloodline Showcase */
export function StallionGallery() {
  const slides: ReelSlide[] = [
    {
      id: "chetak",
      imageKey: "fleetChetak",
      subtitle: "REEL 01 · MARWARI · CHIP #0104",
      titleLine1: "CHETAK IX",
      titleLine2: "FLAGSHIP",
      alt: "Chetak IX flagship Marwari stallion with ancestral lyre ears",
      caption: "Ancestral inward-curving lyre ears, exceptional courage under the lance, and a calm, rhythmic sitting trot.",
      align: "left",
    },
    {
      id: "veer",
      imageKey: "fleetVeer",
      subtitle: "REEL 02 · KATHIAWARI · CHIP #0108",
      titleLine1: "VEER THE",
      titleLine2: "CHARGER",
      alt: "Veer chestnut gold Kathiawari stallion",
      caption: "Famous for the rapid lateral pace-gait (revaal) and swift turns around the peg. Renowned desert stamina.",
      align: "right",
    },
    {
      id: "kesar",
      imageKey: "fleetKesar",
      subtitle: "REEL 03 · MARWARI · CHIP #0112",
      titleLine1: "KESAR THE",
      titleLine2: "WARRIOR",
      alt: "Kesar skewbald Marwari stallion in parade tack",
      caption: "Rare dual-tone coat pattern with silver-trimmed parade tack. Lead stallion for squadron formation charges.",
      align: "left",
    },
    {
      id: "arbudh",
      imageKey: "fleetArbudh",
      subtitle: "REEL 04 · MARWARI · CHIP #0119",
      titleLine1: "ARBUDH THE",
      titleLine2: "PILLAR",
      alt: "Arbudh light bay Marwari with four white stockings",
      caption: "Four white stockings and balanced rhythm. Gentle mouth, patient with beginner squire mounts.",
      align: "right",
    },
  ];

  return (
    <CinematicStoryReel
      sectionId="stallion-gallery-h"
      sectionLabel="Studbook Visualizer"
      sectionSubLabel="21 Registered Fleet Stallions"
      slides={slides}
      exploreHref="/fleet"
      exploreLabel="Full registry"
    />
  );
}

function Drawer({ s, onClose }: { s: Stallion; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <>
      <motion.div className="fixed inset-0 z-[75] bg-charcoal/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`${s.name}, studbook page`}
        className="fixed inset-y-0 right-0 z-[76] w-full max-w-xl overflow-y-auto border-l border-line bg-umber"
        initial={{ x: "100%" }}
        animate={{ x: "0%" }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.7, ease: ease.citadel }}
        data-lenis-prevent
      >
        <div className="relative aspect-[4/5]">
          <FilmImage name={s.image} sizes="36rem" grade="none" />
          <button ref={closeRef} type="button" onClick={onClose} className="label absolute right-4 top-4 bg-night/70 px-3 py-2 text-bone hover:text-gold z-10">
            Close ✕
          </button>
          <div className="absolute inset-x-0 bottom-0 p-6 z-10">
            <p className="label text-brass [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">{s.character}</p>
            <p className="t-voice mt-1 text-5xl text-bone [text-shadow:0_2px_10px_rgba(0,0,0,0.85)]">{s.name}</p>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <p className="t-story italic text-gold">&ldquo;{s.quote}&rdquo;</p>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["Breed", s.breed],
              ["Hub", hubName(s.hub)],
              ["Age", `${s.age} years`],
              ["Height", `${s.hands} hands`],
              ["Coat", s.coat],
              ["Specialty", s.specialty],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label text-dust">{k}</dt>
                <dd className="t-ui mt-1 text-sand">{v}</dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="label text-dust">Microchip · ISO 11784/11785</dt>
              <dd className="font-mono mt-1 text-lg text-gold">{s.chip}</dd>
            </div>
          </dl>
          <p className="label mt-10 text-brass">Pedigree (sample)</p>
          <svg viewBox="0 0 400 180" className="mt-4 w-full" role="img" aria-label={`Pedigree: sire ${s.pedigree.sire}, dam ${s.pedigree.dam}`}>
            <g stroke="color-mix(in srgb, var(--color-brass) 40%, transparent)" fill="none">
              <path d="M110 90 H140 V40 H170 M140 90 V140 H170" />
              <path d="M290 40 H310 V18 H330 M310 40 V62 H330" />
            </g>
            <g className="t-ui" fontSize="12">
              <text x="0" y="94" fill="var(--color-gold)">{s.name}</text>
              <text x="176" y="44" fill="var(--color-bone)">{s.pedigree.sire}</text>
              <text x="176" y="144" fill="var(--color-bone)">{s.pedigree.dam}</text>
              <text x="336" y="22" fill="var(--color-sand)" fontSize="10">{s.pedigree.grandsire}</text>
              <text x="336" y="66" fill="var(--color-sand)" fontSize="10">{s.pedigree.granddam}</text>
            </g>
          </svg>
          <button type="button" disabled className="label mt-8 w-full border border-line py-3 text-dust">
            Watch stall-cam · parents only, in the app
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Clock() {
  const [t, setT] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Kolkata" }));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{t}</span>;
}

/** §2 · S41 CCTV grid. Signature: four live-looking feeds tick in IST with a pulsing REC dot. */
export function CctvGrid() {
  const positions = ["30% 40%", "70% 60%", "50% 30%", "45% 70%"];
  return (
    <section aria-labelledby="cctv-h" className="tone-dark relative bg-night py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-6 md:grid-cols-[1fr_minmax(0,26rem)] md:items-end">
        <div>
          <Label>Stall-cam</Label>
          <Headline id="cctv-h" className="mt-4" inscription="On camera" voice="all night." />
        </div>
        <p className="text-sand">Every stall has a camera. Parents can watch their child&rsquo;s assigned stallion rest, eat and sleep from the app.</p>
      </div>
      <div className="gutter mt-12 grid gap-2 sm:grid-cols-2">
        {feeds.map((f, i) => (
          <figure key={f.cam} className="relative aspect-video overflow-hidden bg-black">
            <FilmImage name="fleetStallcam" grade="none" position={positions[i]} scale={1.2 + i * 0.08} imgClassName="[filter:grayscale(1)_contrast(1.1)]" />
            <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgb(0_0_0/0.25)_0_1px,transparent_1px_3px)]" />
            <figcaption className="font-mono absolute inset-0 flex flex-col justify-between p-3 text-[0.68rem] uppercase tracking-[0.1em] text-[#D9D5CD]">
              <span className="flex justify-between">
                <span>
                  {f.cam} · {f.horse}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFFFFF]" aria-hidden /> REC
                </span>
              </span>
              <span className="flex justify-between">
                <span>
                  {f.place} · {f.status}
                </span>
                <span>
                  IST <Clock />
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** §3 · S42 care log. Signature: entries type in one after another like a duty officer's log. */
export function CareLog() {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <section aria-labelledby="log-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div>
          <Label>Daily</Label>
          <Headline id="log-h" className="mt-4" inscription="The stable" voice="log." />
          <p className="mt-6 max-w-sm text-sand">Horses are checked before cadets, every day. A sample day from the duty log.</p>
        </div>
        <ol ref={ref} className="font-mono border-t border-line text-sm">
          {careLog.map((l, i) => (
            <motion.li
              key={l.time}
              className="grid grid-cols-[4rem_1fr] gap-4 border-b border-line py-4 sm:grid-cols-[4.5rem_10rem_1fr_auto]"
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.18 }}
            >
              <span className="text-gold">{l.time}</span>
              <span className="text-bone">{l.item}</span>
              <span className="col-start-2 text-sand/80 sm:col-start-auto">{l.detail}</span>
              <span className={cn("col-start-2 sm:col-start-auto", l.result.includes("bruise") ? "text-blood" : "text-[#D9D5CD]")}>{l.result}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}


/** §2b · S42 the official colour registry. Six studbook coats as inked swatch plates. */
export function CoatRegistry() {
  return (
    <section aria-labelledby="coats-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Official Marwari studbook</Label>
      <Headline id="coats-h" className="mt-4" inscription="The colour" voice="registry." />
      <ul className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {coatRegistry.map((c) => (
          <li key={c.n} className="flex gap-5 bg-night p-6">
            <span
              aria-hidden
              className="mt-1 h-12 w-12 shrink-0 rounded-full border border-line"
              style={{ background: c.hex === "dual" ? "conic-gradient(#d9d5cd 0 50%, #2a1d15 50% 100%)" : c.hex }}
            />
            <span>
              <span className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-gold">{c.n}</span>
                <span className="t-voice text-xl text-bone">{c.name}</span>
              </span>
              <span className="label mt-1 block text-dust">
                {c.coat} · <span className="font-mono normal-case tracking-normal text-sand">{c.hex === "dual" ? "Dual-tone" : c.hex.toUpperCase()}</span>
              </span>
              <span className="mt-3 block text-sm text-sand">{c.line}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="t-ui mt-6 text-xs text-dust">Registry names as used in Marwar; shades indicative.</p>
    </section>
  );
}
