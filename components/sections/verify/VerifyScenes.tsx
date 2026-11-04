"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { SealStamp } from "@/components/motion/SealStamp";
import { TextAnimate } from "@/components/motion/TextAnimate";

import { TorchHorseStage } from "./TorchHorseStage";

/** Title card · T12 seal with 3D Classical Equestrian Statue. */
export function VerifyTitle() {
  return (
    <section aria-labelledby="verify-title" className="editorial-scene">
      <div className="tone-dark editorial-visual relative min-h-[100svh] overflow-hidden bg-night">
        {/* Interactive 3D Equestrian Statue Stage */}
        <div className="absolute inset-0 z-0">
          <TorchHorseStage />
        </div>

        {/* Bottom gradient to ground the title copy */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-night via-night/60 to-transparent" />

        <div className="gutter pointer-events-none relative z-20 flex min-h-[100svh] flex-col justify-end pb-[10vh]">
          <div className="flex items-end justify-between gap-6">
            <div className="pointer-events-auto">
              <Headline id="verify-title" as="h1" size="poster" animate="mount" className="mt-6" inscription="Every hour" voice="sealed in brass." />
            </div>
            <SealStamp label="SEALED" trigger="inView" className="pointer-events-auto hidden h-40 w-40 shrink-0 md:inline-grid" />
          </div>
        </div>
      </div>
      <div className="tone-light editorial-details gutter">
        <ReelMark n={12} act="ledger" />
        <ScrollRevealText className="t-story pointer-events-auto mt-6 max-w-xl text-sand">A public record of every cadet&rsquo;s rank and hours. Nothing private, nothing editable.</ScrollRevealText>
      </div>
    </section>
  );
}

/**
 * §2 · S57 chain, set as a numbered folio (30 Oct 2026: was three pill-link icons sliding in). Three columns under one rule; each
 * step's name arrives word by word, in order, so the record still "closes" left to right.
 */
const links = [
  { title: "Issued", text: "Every session is logged by the instructor the same day." },
  { title: "Sealed", text: "The chief instructor applies each rank seal; the record locks." },
  { title: "Verified", text: "Anyone with the code sees the record." },
];

export function Chain() {
  return (
    <section aria-labelledby="chain-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>How a record is made</Label>
      <h2 id="chain-h" className="mt-4 text-display-2 text-bone">
        <TextAnimate as="span" animation="slideUp" className="t-inscribe block">
          Issued. Sealed.
        </TextAnimate>
        <TextAnimate as="span" animation="blurIn" delay={0.4} className="t-voice block text-gold">
          Verified.
        </TextAnimate>
      </h2>
      <ol className="mt-14 grid border-t border-line md:grid-cols-3">
        {links.map((l, i) => (
          <li key={l.title} className="border-b border-line py-8 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0">
            <span className="font-display text-[clamp(2.5rem,4vw,3.5rem)] leading-none text-gold">{String(i + 1).padStart(2, "0")}</span>
            <TextAnimate as="p" animation="blurInUp" delay={i * 0.35} className="t-inscribe mt-6 text-2xl text-bone">
              {l.title}
            </TextAnimate>
            <p className="t-story mt-3 max-w-xs text-sand">{l.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** §4 · What a verifier sees: two ruled columns, no boxes. What is never shown is struck through once, in the page's one blood beat. */
const shown = ["Name", "Rank", "Riding hours", "Hub", "EFI registration", "Milestones"];
const hidden = ["Contact details", "Address", "Medical notes", "Payments"];

export function Privacy() {
  return (
    <section aria-labelledby="sees-h" className="gutter relative pb-[clamp(6rem,14vh,12rem)]">
      <Label>Privacy</Label>
      <Headline id="sees-h" className="mt-4" inscription="What a verifier" voice="sees." />
      <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="label border-b border-line pb-4 text-gold">Shown</p>
          <ol className="divide-y divide-line">
            {shown.map((x, i) => (
              <li key={x} className="grid grid-cols-[2.5rem_1fr] items-baseline py-4">
                <span className="font-mono text-xs text-dust">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-voice text-xl text-bone">{x}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="label border-b border-line pb-4 text-blood">Never shown</p>
          <ul className="divide-y divide-line">
            {hidden.map((x) => (
              <li key={x} className="grid grid-cols-[2.5rem_1fr] items-baseline py-4">
                <span aria-hidden className="font-mono text-xs text-dust">—</span>
                <span className="t-voice text-xl text-dust line-through decoration-1">{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
