"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Headline } from "@/components/film/Headline";
import { useReducedMotion } from "@/lib/motion/reduced";

const EDGE = "14svh";
const MASKS = {
  both: `linear-gradient(to bottom, transparent 0, #000 ${EDGE}, #000 calc(100% - ${EDGE}), transparent 100%)`,
  top: `linear-gradient(to bottom, transparent 0, #000 ${EDGE})`,
  bottom: `linear-gradient(to bottom, #000 calc(100% - ${EDGE}), transparent 100%)`,
} as const;

/**
 * A full-screen animation that plays by itself (a muted, looping video, no scroll effect) with its text set as an editorial page at one side: a folio, the site's two-voice headline, an italic standfirst and a two-column paragraph
 * with a drop cap, kept clear of the fixed navigation at the top. It plays only while it is on screen. Reduced motion: no video; the first frame is a still.
 */
export function AutoPlayStill({
  video,
  poster,
  alt,
  folio,
  inscription,
  voice,
  standfirst,
  text,
  credit,
  side = "left",
  eager,
  fade = "both",
}: {
  video: string;
  poster: string;
  alt: string;
  /** The small running head above the headline, e.g. "No. 01 · The eye". */
  folio: string;
  /** Headline, line 1 (small capitals) and line 2 (italic, gold). */
  inscription: string;
  voice: string;
  /** One italic sentence under the headline. */
  standfirst: string;
  /** The reading paragraph, set in two columns with a drop cap. */
  text: string;
  /** The small credit line at the foot of the block. */
  credit: string;
  side?: "left" | "right";
  eager?: boolean;
  /** Which edges dissolve into the page's brown: the first section keeps its top edge, so it is "bottom"; the others are "both". */
  fade?: "top" | "bottom" | "both";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section aria-label={folio} className="relative h-[100svh] overflow-hidden" style={{ WebkitMaskImage: MASKS[fade], maskImage: MASKS[fade] }}>
      {reduced ? (
        <Image src={poster} alt={alt} fill sizes="100vw" priority={eager} className="object-cover" />
      ) : (
        <video ref={ref} className="absolute inset-0 h-full w-full object-cover" src={video} poster={poster} muted loop playsInline autoPlay preload={eager ? "auto" : "metadata"} aria-label={alt} />
      )}
      <div aria-hidden className={`absolute inset-0 ${side === "left" ? "bg-gradient-to-r" : "bg-gradient-to-l"} from-black/80 via-black/45 to-transparent`} />

      <div className={`gutter absolute inset-y-0 z-10 flex w-full flex-col justify-end pb-[clamp(3rem,9svh,6rem)] md:max-w-[52rem] ${side === "left" ? "left-0" : "right-0"}`}>
        <p className="t-inscribe text-[0.7rem] uppercase tracking-[0.3em] text-ivory/75">{folio}</p>
        <Headline as="h2" size="2" inscription={inscription} voice={voice} className="mt-4" inscriptionClassName="text-ivory" voiceClassName="text-caramel" />
        <p className="t-voice mt-6 max-w-[30rem] text-[clamp(1.15rem,1.7vw,1.45rem)] leading-snug text-ivory">{standfirst}</p>
        <div className="mt-6 border-t border-ivory/30 pt-5">
          <p className="t-story text-[1rem] leading-[1.6] text-ivory/90 first-letter:float-left first-letter:pr-2 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[0.78] first-letter:text-caramel md:columns-2 md:gap-8">{text}</p>
          <p className="t-inscribe mt-4 text-[0.62rem] uppercase tracking-[0.24em] text-ivory/60">{credit}</p>
        </div>
      </div>
    </section>
  );
}
