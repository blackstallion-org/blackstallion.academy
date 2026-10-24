"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { SealStamp } from "@/components/motion/SealStamp";
import { ease } from "@/lib/motion/tokens";

import { TorchHorseStage } from "./TorchHorseStage";

/** Title card · T12 seal with 3D Classical Equestrian Statue. */
export function VerifyTitle() {
  return (
    <section aria-labelledby="verify-title" className="editorial-scene">
<div className="tone-dark editorial-visual relative min-h-[100svh] bg-[#0a0908] overflow-hidden">
      {/* Interactive 3D Equestrian Statue Stage */}
      <div className="absolute inset-0 z-0">
        <TorchHorseStage />
      </div>

      {/* Cinematic bottom gradient fade to ground the title copy */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />

      <div className="gutter relative z-20 flex min-h-[100svh] flex-col justify-end pb-[10vh] pointer-events-none">
        <div className="flex items-end justify-between gap-6">
          <div className="pointer-events-auto">
            
            <Headline id="verify-title" as="h1" size="poster" animate="mount" className="mt-6" inscription="Every hour" voice="sealed in brass." />
          </div>
          <SealStamp label="SEALED" trigger="inView" className="hidden h-40 w-40 shrink-0 md:inline-grid pointer-events-auto" />
        </div>
        
      </div>
    </div>
<div className="tone-light editorial-details gutter"><ReelMark n={12} act="ledger" />
<ScrollRevealText className="t-story mt-6 max-w-xl text-sand pointer-events-auto">A public record of every cadet&rsquo;s rank and hours. Nothing private, nothing editable.</ScrollRevealText></div>
</section>
  );
}

/** §2 · S57 chain. Signature: three links close one after another. */
export function Chain() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const links = [
    { title: "Issued", text: "Every session is logged by the instructor the same day." },
    { title: "Sealed", text: "The chief instructor applies each rank seal; the record locks." },
    { title: "Verified", text: "Anyone with the code sees the record." },
  ];
  return (
    <section aria-labelledby="chain-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>How a record is made</Label>
      <Headline id="chain-h" className="mt-4" inscription="Issued. Sealed." voice="Verified." />
      <div ref={ref} className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
        {links.map((l, i) => (
          <motion.div key={l.title} className="relative md:pr-10" initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, ease: ease.citadel, delay: i * 0.4 }}>
            <svg viewBox="0 0 120 60" className="h-14 w-28 text-gold" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <rect x="6" y="14" width="64" height="32" rx="16" />
              {i < 2 && <rect x="50" y="14" width="64" height="32" rx="16" opacity="0.35" />}
            </svg>
            <p className="t-voice mt-4 text-3xl text-bone">{l.title}</p>
            <p className="mt-2 max-w-xs text-sand">{l.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
