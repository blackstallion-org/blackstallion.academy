"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { SealStamp } from "@/components/motion/SealStamp";
import { ease } from "@/lib/motion/tokens";

/** Title card · T12 seal. Signature: a brass seal stamps down over the title. */
export function VerifyTitle() {
  return (
    <section aria-labelledby="verify-title" className="relative min-h-[92svh] overflow-hidden">
      <FilmImage name="bgPassport" priority grade="deep" />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div className="gutter relative flex min-h-[92svh] flex-col justify-end pb-[10vh]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <ReelMark n={11} act="ledger" />
            <Headline id="verify-title" as="h1" size="poster" animate="mount" className="mt-6" inscription="Every hour" voice="sealed in brass." />
          </div>
          <SealStamp label="SEALED" trigger="inView" className="hidden h-40 w-40 shrink-0 md:inline-grid" />
        </div>
        <p className="t-story mt-6 max-w-xl text-sand">A public record of every cadet&rsquo;s rank and hours. Nothing private, nothing editable.</p>
      </div>
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
