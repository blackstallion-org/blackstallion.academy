"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useId, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Hoof, Label, ReelMark, StatusDot } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { admissions, faq, fees, phoneSteps } from "@/lib/content/academy";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { inr, price, withGst } from "@/lib/content/pricing";
import { CinematicStoryReel, type ReelSlide } from "@/components/film/CinematicStoryReel";


/** Title card · T9 rail view. Signature: the wooden rail in the foreground slides down as the arena opens up. */
export function ParentsTitle() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const railY = useTransform(scrollYProgress, r(0, 1), ["0%", "60%"]);
  return (
    <section ref={ref} aria-labelledby="parents-h" className="editorial-scene">
<div className="tone-dark editorial-visual relative min-h-[100svh] overflow-hidden bg-night">
      <FilmImage name="parentsRail" priority scale={1} className="top-16 md:top-20" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
      {/* The rail runs along the foot of the frame, under the copy, and drops away as you scroll. */}
      <motion.div aria-hidden className="widget-hud absolute inset-x-0 bottom-[3vh] flex flex-col gap-5" style={{ y: railY }}>
        <span className="h-5 w-full bg-gradient-to-b from-[#6a4631] to-leather shadow-[0_10px_30px_rgb(73_49_38/0.35)]" />
        <span className="h-4 w-full bg-gradient-to-b from-[#6a4631] to-leather" />
      </motion.div>
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[calc(3vh+5.5rem)]">
        
        <Headline id="parents-h" as="h1" size="1" animate="mount" className="mt-6" inscription="The guardian" voice="sees every stride." />
        
      </div>
    </div>
<div className="tone-light editorial-details gutter"><ReelMark n={9} act="citadel" />
<ScrollRevealText className="t-story mt-6 max-w-xl text-sand">You can&rsquo;t be in the arena every day. You can see everything that happens there.</ScrollRevealText></div>
</section>
  );
}

/** §1 · S47 pinned phone. Signature: the phone's screen changes as each promise scrolls by. */
export function PinnedPhone() {
  return (
    <PinnedScene length={4} label="The parent app" reducedFallback={<PhoneFrame active={0} all />}>
      {(p) => <PhoneDriver progress={p} />}
    </PinnedScene>
  );
}

function PhoneDriver({ progress }: { progress: MotionValue<number> }) {
  const [i, setI] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setI(Math.min(phoneSteps.length - 1, Math.floor(v * phoneSteps.length * 0.999))));
  return <PhoneFrame active={i} />;
}

function Screen({ id }: { id: string }) {
  if (id === "cam")
    return (
      <div className="relative h-full">
        <FilmImage name="fleetStallcam" grade="none" />
        <div className="font-mono absolute inset-x-0 top-0 flex justify-between p-3 text-[0.6rem] text-[#D9D5CD]">
          <span>CHETAK IX · STALL 3</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFFFFF]" /> LIVE
          </span>
        </div>
      </div>
    );
  if (id === "gate")
    return (
      <div className="flex h-full flex-col justify-center gap-3 p-4">
        <p className="label text-dust">Now</p>
        <div className="rounded-2xl bg-umber p-4">
          <p className="label text-brass">BSAH · Gate</p>
          <p className="t-ui mt-1 text-sm text-bone">Bravo checked in at 15:52</p>
          <p className="t-ui text-xs text-dust">Zone 01A Hub · passport scanned</p>
        </div>
        <div className="rounded-2xl bg-umber/60 p-4 opacity-60">
          <p className="label text-brass">BSAH · Session</p>
          <p className="t-ui mt-1 text-sm text-bone">Mounted session started</p>
        </div>
      </div>
    );
  if (id === "reel")
    return (
      <div className="relative h-full">
        <FilmImage name="cadetRohan" />
        <svg viewBox="0 0 100 200" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M52 60 L52 100 M52 72 L42 92 M52 100 L44 130" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night p-3">
          <p className="t-ui text-xs text-bone">First canter without stirrups</p>
          <p className="font-mono text-[0.6rem] text-gold">0:10</p>
        </div>
      </div>
    );
  return (
    <div className="flex h-full flex-col justify-center p-5">
      <p className="label text-brass">Sovereign Passport</p>
      <p className="t-voice mt-2 text-2xl text-bone">Cadet Rider</p>
      <p className="font-mono mt-4 text-3xl text-gold">24 hrs</p>
      <div className="mt-3 h-1 w-full bg-line/20">
        <div className="h-full w-[80%] bg-gold" />
      </div>
      <p className="t-ui mt-2 text-xs text-dust">Next seal at 30 hrs</p>
    </div>
  );
}

function PhoneFrame({ active, all = false }: { active: number; all?: boolean }) {
  const step = phoneSteps[active];
  return (
    <div className={cn("gutter grid h-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]", all && "py-24")}>
      <div>
        <Label>In your pocket</Label>
        <ol className="mt-8 flex flex-col">
          {phoneSteps.map((s, k) => (
            <li key={s.id} className={cn("border-l-2 py-4 pl-6 transition-colors duration-500", k === active || all ? "border-gold" : "border-line")}>
              <p className={cn("label", k === active || all ? "text-gold" : "text-dust")}>{s.label}</p>
              <p className={cn("t-voice mt-1 text-xl transition-colors md:text-2xl", k === active || all ? "text-bone" : "text-sand/40")}>{s.title}</p>
              {(k === active || all) && <p className="mt-2 max-w-md text-sand">{s.text}</p>}
            </li>
          ))}
        </ol>
      </div>
      {!all && (
        <div className="tone-dark relative mx-auto hidden h-[600px] w-[300px] rounded-[46px] border border-line bg-charcoal p-3 shadow-[0_40px_100px_-20px_rgb(73_49_38/0.55)] md:block">
          <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-night">
            <div aria-hidden className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <div className="t-ui absolute inset-x-0 top-12 z-10 flex items-center justify-between px-5 text-[0.65rem] text-dust">
              <span>BSAH Guardian</span>
              <StatusDot status="live" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step.id} className="absolute inset-x-0 bottom-0 top-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: ease.citadel }}>
                <Screen id={step.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

/** §1b · Cinematic Forward-Zoom Guardian Vantage Gallery */
export function ParentVantageGallery() {
  const slides: ReelSlide[] = [
    {
      id: "rail",
      imageKey: "parentsRail",
      subtitle: "REEL 01 · PAVILION VANTAGE",
      titleLine1: "ARENA",
      titleLine2: "RAIL",
      alt: "Parents at the arena rail watching cadets ride at dusk",
      caption: "Direct viewing deck along the arena perimeter. Watch your cadet establish cadence under the instructor's direct eye.",
      align: "left",
    },
    {
      id: "stallcam",
      imageKey: "fleetStallcam",
      subtitle: "REEL 02 · PLANNED · 24/7 NIGHT-VISION",
      titleLine1: "LIVE STALL",
      titleLine2: "OPTICS",
      alt: "Night-vision stall camera feed of Marwari resting in stall",
      caption: "Planned for the parent app (in development): night-vision optics into the stall, with resting cycles, feed times and quiet nocturnal wellness.",
      align: "right",
    },
    {
      id: "reel",
      imageKey: "cadetRohan",
      subtitle: "REEL 03 · PROGRESSION ARCHIVE",
      titleLine1: "TEN-SECOND",
      titleLine2: "REEL",
      alt: "Cadet in canter progression session with biomechanical markings",
      caption: "Every canter without stirrups and lead transition logged with biomechanical overlays and delivered to your portal.",
      align: "left",
    },
    {
      id: "passport",
      imageKey: "bgPassport",
      subtitle: "REEL 04 · SOVEREIGN LEDGER",
      titleLine1: "SEALED",
      titleLine2: "PASSPORT",
      alt: "Sealed leather passport and brass seal on dark wood",
      caption: "Full record of hours, discipline merits, and sealed rank stamps verified by former cavalry masters.",
      align: "right",
    },
    {
      id: "safety",
      imageKey: "safetyKit",
      subtitle: "REEL 05 · CE LEVEL-2 TACK",
      titleLine1: "MILITARY",
      titleLine2: "SAFETY",
      alt: "Riding helmet, gloves, vest and chaps on a wooden bench",
      caption: "CE Level-2 body protectors, Kevlar-reinforced gloves, and custom-fitted helmets inspected before every mount.",
      align: "left",
    },
  ];

  return (
    <CinematicStoryReel
      sectionId="vantage-gallery-h"
      sectionLabel="Guardian Perspective"
      sectionSubLabel="Five Windows Into Your Child's Day"
      slides={slides}
      exploreHref="/parents"
      exploreLabel="Guardian portal"
    />
  );
}

/** §2 · S48 hoofprint path. Signature: hoofprints walk the winding path to each step. */
export function HoofPath() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const xs = [8, 30, 52, 74, 92];
  const ys = [70, 30, 62, 26, 58];
  const d = xs.map((x, i) => `${i ? "S" : "M"}${i ? `${x - 10} ${ys[i]} ` : ""}${x} ${ys[i]}`).join(" ");
  return (
    <section aria-labelledby="path-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>Admissions</Label>
      <Headline id="path-h" className="mt-4" inscription="Five steps" voice="to the first canter." />
      <div ref={ref} className="relative mt-14 hidden md:block" style={{ aspectRatio: "100 / 34" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <motion.path d={d} fill="none" stroke="color-mix(in srgb, var(--color-brass) 40%, transparent)" strokeWidth="0.25" strokeDasharray="0.8 1.2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 2.4, ease: ease.citadel }} />
        </svg>
        {admissions.map((a, i) => (
          <motion.div
            key={a.title}
            className="absolute w-[17%] -translate-x-1/2"
            style={{ left: `${xs[i]}%`, top: `${ys[i]}%` }}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.4 }}
          >
            <Hoof className="-translate-y-1/2 text-gold" />
            <p className="font-mono mt-1 text-xs text-dust">0{i + 1}</p>
            <p className="t-voice text-xl text-bone">{a.title}</p>
            <p className="mt-1 text-sm text-sand">{a.text}</p>
          </motion.div>
        ))}
      </div>
      <ol className="mt-10 flex flex-col gap-6 md:hidden">
        {admissions.map((a, i) => (
          <li key={a.title} className="grid grid-cols-[2rem_1fr] gap-3">
            <Hoof className="mt-1 text-gold" />
            <span>
              <span className="font-mono text-xs text-dust">0{i + 1}</span>
              <span className="t-voice block text-xl text-bone">{a.title}</span>
              <span className="block text-sand">{a.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** §3 · S49 receipt. Signature: the receipt feeds up out of the dark like paper from a till. */
export function Receipt() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const firstMonthCore = withGst(price.core + price.kit);
  return (
    <section id="fees" aria-labelledby="fees-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <Label>Fees</Label>
          <Headline id="fees-h" className="mt-4" inscription="Fees," voice="plainly." />
          <p className="mt-6 max-w-sm text-sand">No hidden costs. Choose Core Cadets or Sovereign Elite; tuition is billed monthly and the onboarding kit is paid once. Online payment is being set up; no payment is taken on this website yet.</p>
        </div>
        <div ref={ref} className="overflow-hidden">
          <motion.div
            className="parchment mx-auto max-w-md px-7 pb-10 pt-8 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),95%_100%,90%_calc(100%-10px),85%_100%,80%_calc(100%-10px),75%_100%,70%_calc(100%-10px),65%_100%,60%_calc(100%-10px),55%_100%,50%_calc(100%-10px),45%_100%,40%_calc(100%-10px),35%_100%,30%_calc(100%-10px),25%_100%,20%_calc(100%-10px),15%_100%,10%_calc(100%-10px),5%_100%,0_calc(100%-10px))]"
            initial={{ y: "-70%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ duration: 1.6, ease: ease.citadel }}
          >
            <p className="t-inscribe text-center text-sm tracking-[0.2em] text-ink">Black Stallion Academy</p>
            <p className="font-mono mt-1 text-center text-[0.65rem] text-[#6b5130]">FEE SCHEDULE · 2026–27 · GSTIN ON INVOICE</p>
            <div className="my-5 border-t border-dashed border-[#8a6a2c]/60" />
            <ul className="flex flex-col gap-5">
              {fees.map((f) => (
                <li key={f.item}>
                  <p className="font-mono flex justify-between gap-4 text-sm text-ink">
                    <span>{f.item}</span>
                    <span>{inr(f.amount)}</span>
                  </p>
                  <p className="t-ui mt-1 text-xs text-[#5a4526]">{f.detail}</p>
                </li>
              ))}
            </ul>
            <div className="my-5 border-t border-dashed border-[#8a6a2c]/60" />
            <p className="font-mono flex justify-between text-sm font-semibold text-ink">
              <span>First month · Core, with kit & GST</span>
              <span>{inr(firstMonthCore)}</span>
            </p>
            <p className="font-mono mt-2 flex justify-between text-sm text-ink">
              <span>Each month after · Core</span>
              <span>{inr(withGst(price.core))}</span>
            </p>
            <p className="font-mono mt-2 flex justify-between text-sm text-ink">
              <span>Each month after · Sovereign Elite</span>
              <span>{inr(withGst(price.elite))}</span>
            </p>
            <p className="font-mono mt-6 text-center text-[0.6rem] text-[#6b5130]">ONLINE PAYMENT NOT YET LIVE · NO PAYMENT IS TAKEN ON THIS SITE</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** §4 · S50 standing orders (FAQ). Accessible disclosure buttons. */
export function StandingOrders() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <section aria-labelledby="faq-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div>
          <Label>Questions</Label>
          <Headline id="faq-h" className="mt-4" inscription="Standing" voice="orders." />
        </div>
        <ul className="border-t border-line">
          {faq.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${base}-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 py-5 text-left"
                  >
                    <span className="font-mono text-xs text-dust">{String(i + 1).padStart(2, "0")}</span>
                    <span className={cn("t-voice text-xl transition-colors md:text-2xl", isOpen ? "text-gold" : "text-bone hover:text-gold")}>{f.q}</span>
                    <span aria-hidden className={cn("font-mono text-gold transition-transform duration-300", isOpen && "rotate-45")}>
                      +
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`${base}-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: ease.citadel }} className="overflow-hidden">
                      <p className="max-w-2xl pb-6 pl-[3.25rem] text-sand">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
