import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TextAnimate } from "@/components/motion/TextAnimate";

/**
 * The deck grammar (30 Oct 2026, after the owner's editorial references): a dark slide set on the ivory page with a margin of
 * ivory round it, a tag in the top corner, a folio number in the bottom corner, and one lockup.
 *
 * `DeckFrame` is the ivory margin plus the dark panel; `DeckLockup` is the title: upright capitals with a script word woven
 * through them, two small flank labels (the references' "EST. · 2024") and an optional line of small capitals beneath.
 */
export function DeckFrame({ children, className, panelClassName }: { children: ReactNode; className?: string; panelClassName?: string }) {
  return (
    <div className={cn("bg-night p-[clamp(8px,1.4vw,20px)]", className)}>
      <div className={cn("tone-dark relative overflow-hidden bg-night text-bone", panelClassName)}>{children}</div>
    </div>
  );
}

/** Corner furniture of a slide: tag top-right, folio bottom-right (and optional bottom-left). Sits inside a `relative` panel. */
export function DeckCorners({ tag, folio, foot }: { tag?: string; folio?: string; foot?: ReactNode }) {
  return (
    <>
      {tag ? <p className="label pointer-events-none absolute right-[clamp(20px,3vw,44px)] top-[clamp(20px,3vw,40px)] z-20 text-dust">{tag}</p> : null}
      {foot ? <div className="absolute bottom-[clamp(20px,3vw,40px)] left-[clamp(20px,3vw,44px)] z-20">{foot}</div> : null}
      {folio ? <p className="pointer-events-none absolute bottom-[clamp(20px,3vw,40px)] right-[clamp(20px,3vw,44px)] z-20 font-mono text-xs text-dust">{folio}</p> : null}
    </>
  );
}

export function DeckLockup({
  caps,
  script,
  left,
  right,
  sub,
  as = "p",
  id,
  className,
}: {
  caps: string;
  script: string;
  left?: string;
  right?: string;
  sub?: string;
  as?: "p" | "h1" | "h2";
  id?: string;
  className?: string;
}) {
  const Tag = as;
  return (
    <div className={cn("text-center", className)}>
      <Tag id={id} className="relative inline-block">
        <span className="relative inline-block">
          {left ? <span aria-hidden className="label absolute right-full top-[0.9em] mr-[0.6em] hidden whitespace-nowrap text-[0.62rem] text-sand sm:block">{left}</span> : null}
          <TextAnimate as="span" animation="slideUp" className="t-inscribe block text-[clamp(2.6rem,8.5vw,8rem)] leading-[0.92] tracking-[0.01em] text-bone">
            {caps}
          </TextAnimate>
          {right ? <span aria-hidden className="label absolute left-full top-[0.9em] ml-[0.6em] hidden whitespace-nowrap text-[0.62rem] text-sand sm:block">{right}</span> : null}
        </span>
        <TextAnimate
          as="span"
          animation="blurIn"
          delay={0.45}
          duration={1.6}
          className="t-script relative -mt-[0.32em] block text-[clamp(3.1rem,10vw,9.5rem)] leading-[1.05] text-bone"
        >
          {script}
        </TextAnimate>
      </Tag>
      {sub ? <p className="label mt-3 text-sand">{sub}</p> : null}
    </div>
  );
}
