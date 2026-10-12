"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { PixelDissolve } from "@/components/cinematic/PixelDissolve";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { Verifier } from "@/components/sections/verify/Verifier";
import { ease } from "@/lib/motion/tokens";

/**
 * Title card · cinematic opening 5 of 5 (docs/cinematic-redesign): pixel dissolve.
 * The portrait resolves from coarse blocks behind the page while the real verifier is usable at once:
 * the form is in the opening itself, never delayed behind the effect.
 */
export function VerifyTitle() {
  return (
    <section aria-labelledby="verify-title" className="tone-dark relative min-h-[100svh] overflow-hidden bg-night">
      <PixelDissolve name="verifyPortrait" />
      <div aria-hidden className="absolute inset-0 bg-night/60 lg:hidden" />
      <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-r from-night via-night/80 to-transparent lg:block lg:w-[70%]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night to-transparent" />
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[max(8vh,env(safe-area-inset-bottom))] pt-28">
        <div className="max-w-xl">
          <ReelMark n={11} act="ledger" />
          <Headline id="verify-title" as="h1" size="1" animate="mount" delay={0.5} className="mt-6" inscription="Every hour" voice="sealed in brass." />
          <p className="t-story mt-5 text-sand">A public record of every cadet&rsquo;s rank and hours. Nothing private, nothing editable.</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: ease.citadel, delay: 0.35 }}>
            <Verifier showSamples stacked className="mt-10" />
          </motion.div>
        </div>
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
