"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { AnimatePresence, motion, useInView, useScroll, useTransform } from "motion/react";
import { useId, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Hoof, Label } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { admissions, faq, fees } from "@/lib/content/academy";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { inr, total } from "@/lib/content/pricing";
import { CinematicStoryReel, type ReelSlide } from "@/components/film/CinematicStoryReel";


/** Title card · T9 rail view. Signature: the wooden rail in the foreground slides down as the arena opens up. */
export function ParentsTitle() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const railY = useTransform(scrollYProgress, r(0, 1), ["0%", "60%"]);
  return (
    <section ref={ref} aria-labelledby="parents-h" className="editorial-scene">
<div className="tone-photo editorial-visual relative min-h-[100svh] overflow-hidden bg-night">
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
<div className="tone-light editorial-details gutter">
<ScrollRevealText className="t-story max-w-xl text-sand">The BSAH Guardian App keeps you beside your child&rsquo;s training: progress, attendance, milestones and session notes, shared the same day, and a direct line to the academy.</ScrollRevealText></div>
</section>
  );
}

/** §1b · Cinematic Forward-Zoom Guardian Vantage Gallery */
export function ParentVantageGallery() {
  const slides: ReelSlide[] = [
    {
      id: "rail",
      // 17 Nov 2026: the pavilion still, so the gallery no longer opens on the hero's own photograph (the phone section between them was removed).
      imageKey: "bgPavilion",
      subtitle: "REEL 01 · PAVILION VANTAGE",
      titleLine1: "ARENA",
      titleLine2: "RAIL",
      alt: "Families watch a riding lesson from a shaded pavilion beside a school arena",
      shade: true,
      caption: "Direct viewing deck along the arena perimeter. Watch your cadet establish cadence under the instructor's direct eye.",
      align: "left",
    },
    {
      id: "instruction",
      imageKey: "safetyInstructor",
      subtitle: "REEL 02 · THE SESSION, WRITTEN UP",
      titleLine1: "SAME-DAY",
      titleLine2: "NOTES",
      alt: "A former cavalry instructor fastening a cadet's helmet",
      caption: "Every session, safety observation and progress note is documented by the instructor and shared with you in the BSAH app the same day.",
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
      subtitle: "REEL 05 · KIT BEFORE THE SADDLE",
      titleLine1: "HELMET",
      titleLine2: "FIRST",
      alt: "A riding helmet and leather riding gloves on a wooden bench under a lantern",
      caption: "A certified, properly fitted helmet and riding gloves, checked by an instructor before every mount.",
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
  return (
    <section id="fees" aria-labelledby="fees-h" className="relative overflow-hidden bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <Label>Fees</Label>
          <Headline id="fees-h" className="mt-4" inscription="Fees," voice="plainly." />
          <p className="mt-6 max-w-sm text-sand">No hidden costs. One plan, Core Cadets, billed monthly; the onboarding kit is paid once. Online payment is being set up; no payment is taken on this website yet.</p>
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
              <span>First month · with kit & 18% GST</span>
              <span>{inr(total.firstMonth)}</span>
            </p>
            <p className="font-mono mt-2 flex justify-between text-sm text-ink">
              <span>Each month after · with 18% GST</span>
              <span>{inr(total.monthly)}</span>
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
