"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Headline } from "@/components/film/Headline";
import { editorialGalleries, type EditorialPage, type EditorialPhoto } from "@/lib/content/marwari-editorial";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * A magazine-style photography gallery (14 Nov 2026), built on the /cadets gallery pattern (UniformGallery,
 * TrainerUniformGallery): label, two-voice headline and lede on the page ground, figures with a serif italic caption, one
 * attribution line at the foot. Each page gets its own composition (`layout` in lib/content/marwari-editorial.ts) so no two
 * galleries repeat. Photographs keep their natural proportions except where a composition frames them on purpose (the
 * arcade's arches, the contact sheet, the speed band). Figures rise in as they enter; reduced motion shows them still.
 */
export function EditorialGallery({ page, className }: { page: EditorialPage; className?: string }) {
  const g = editorialGalleries[page];
  const headingId = `${g.id}-h`;
  const header = (
    <>
      <p className="label text-brass">{g.label}</p>
      <Headline id={headingId} inscription={g.inscription} voice={g.voice} size="3" className="mt-3" />
      <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">{g.lede}</p>
    </>
  );
  const credit = <p className="mt-12 max-w-2xl text-sm text-dust">{g.credit}</p>;

  if (g.layout === "ledger") {
    // the words stay in place on the left while the photographs pass on the right
    return (
      <section id={g.id} aria-labelledby={headingId} className={cn("bg-night py-20 md:py-28", className)}>
        <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-[6vw]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            {header}
            <ol className="mt-10 hidden border-t border-line lg:block">
              {g.photos.map((p, i) => (
                <li key={p.src} className="flex items-baseline gap-4 border-b border-line py-3">
                  <span className="font-mono text-xs text-brass">{ROMAN[i]}</span>
                  <span className="t-voice text-lg text-sand">{p.title}</span>
                </li>
              ))}
            </ol>
            {credit}
          </div>
          <div className="flex flex-col gap-14">
            {g.photos.map((p, i) => (
              <Figure key={p.src} photo={p} n={i} sizes="(min-width: 1024px) 50vw, 100vw" className={["w-full", "w-4/5 self-end", "w-3/4", "w-2/3 self-end", "w-full"][i] ?? "w-full"} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={g.id} aria-labelledby={headingId} className={cn("bg-night py-20 md:py-28", className)}>
      <div className="gutter">{header}</div>
      <div className="gutter mt-14">{compose(g.layout, g.photos)}</div>
      <div className="gutter">{credit}</div>
    </section>
  );
}

function compose(layout: string, photos: EditorialPhoto[]): ReactNode {
  const fig = (i: number, className: string, sizes: string, frame?: Frame) =>
    photos[i] ? <Figure key={photos[i].src} photo={photos[i]} n={i} className={className} sizes={sizes} frame={frame} /> : null;

  switch (layout) {
    case "folio":
      // home: a wide palace plate, a tall window answering it, then a door and a gate on the next line, a coda below
      return (
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-12">
          {fig(0, "md:col-span-7", "(min-width: 768px) 58vw, 100vw")}
          {fig(1, "md:col-span-4 md:col-start-9 md:mt-32", "(min-width: 768px) 33vw, 100vw")}
          {fig(2, "md:col-span-4", "(min-width: 768px) 33vw, 100vw")}
          {fig(3, "md:col-span-6 md:col-start-6 md:mt-40", "(min-width: 768px) 50vw, 100vw")}
          {fig(4, "md:col-span-3 md:col-start-9", "(min-width: 768px) 25vw, 100vw")}
        </div>
      );
    case "studbook": {
      // fleet: three stacked columns, the middle one dropped, like pages of a studbook laid out on a table
      const cols = [[0, 3, 6], [1, 4], [2, 5]];
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cols.map((c, k) => (
            <div key={k} className={cn("flex flex-col gap-10", k === 1 && "lg:mt-28", k === 2 && "lg:mt-10")}>
              {c.map((i) => fig(i, "", "(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"))}
            </div>
          ))}
        </div>
      );
    }
    case "anatomy":
      // science: the eye stands tall in the middle; the movement studies turn around it
      return (
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-12">
          {fig(0, "md:col-span-5 md:row-start-1", "(min-width: 768px) 42vw, 100vw")}
          {fig(1, "md:col-span-5 md:col-start-7 md:row-span-2 md:row-start-1 md:mt-20", "(min-width: 768px) 42vw, 100vw")}
          {fig(2, "md:col-span-4 md:col-start-2 md:row-start-2", "(min-width: 768px) 33vw, 100vw")}
          {fig(3, "md:col-span-4 md:row-start-3", "(min-width: 768px) 33vw, 100vw")}
          {fig(4, "md:col-span-5 md:col-start-6 md:row-start-3 md:mt-16", "(min-width: 768px) 42vw, 100vw")}
        </div>
      );
    case "band":
      // tournaments: one wide band of speed, then four strides in a row
      return (
        <div>
          {fig(0, "", "100vw", "band")}
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4 lg:items-start">
            {fig(1, "", "(min-width: 1024px) 23vw, 46vw")}
            {fig(2, "lg:mt-16", "(min-width: 1024px) 23vw, 46vw")}
            {fig(3, "", "(min-width: 1024px) 23vw, 46vw")}
            {fig(4, "lg:mt-16", "(min-width: 1024px) 23vw, 46vw")}
          </div>
        </div>
      );
    case "cascade": {
      // curriculum: three columns stepping down, lesson after lesson
      const cols = [[0, 3], [1, 4], [2, 5]];
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cols.map((c, k) => (
            <div key={k} className={cn("flex flex-col gap-10", k === 1 && "lg:mt-36", k === 2 && "lg:mt-16")}>
              {c.map((i) => fig(i, "", "(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"))}
            </div>
          ))}
        </div>
      );
    }
    case "pair":
      // parents: two pictures that belong together, then three quieter ones
      return (
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-12">
          {fig(0, "md:col-span-5", "(min-width: 768px) 42vw, 100vw")}
          {fig(1, "md:col-span-7 md:self-end", "(min-width: 768px) 58vw, 100vw")}
          {fig(2, "md:col-span-4 md:col-start-2", "(min-width: 768px) 33vw, 100vw")}
          {fig(3, "md:col-span-3 md:mt-20", "(min-width: 768px) 25vw, 100vw")}
          {fig(4, "md:col-span-4 md:self-center", "(min-width: 768px) 33vw, 100vw")}
        </div>
      );
    case "arcade":
      // schools: a colonnade of arches, every other one set lower
      return (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
          {photos.map((p, i) => (
            <Figure key={p.src} photo={p} n={i} frame="arch" sizes="(min-width: 1024px) 16vw, (min-width: 768px) 31vw, 46vw" className={cn(i % 2 === 1 && "mt-10 lg:mt-16")} />
          ))}
        </div>
      );
    case "contact":
      // why: a contact sheet of heads, in black and white; colour returns on hover
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((p, i) => (
            <Figure key={p.src} photo={p} n={i} frame="contact" sizes="(min-width: 768px) 31vw, 46vw" />
          ))}
        </div>
      );
    case "plate":
    default:
      // about: one large plate in the middle, details around it
      return (
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-12">
          {fig(0, "md:col-span-8 md:col-start-3", "(min-width: 768px) 66vw, 100vw")}
          {fig(1, "md:col-span-4", "(min-width: 768px) 33vw, 100vw")}
          {fig(2, "md:col-span-4 md:mt-24", "(min-width: 768px) 33vw, 100vw")}
          {fig(3, "md:col-span-4", "(min-width: 768px) 33vw, 100vw")}
          {fig(4, "md:col-span-4 md:col-start-5", "(min-width: 768px) 33vw, 100vw")}
        </div>
      );
  }
}

type Frame = "band" | "arch" | "contact";

function Figure({ photo, n, className, sizes, frame }: { photo: EditorialPhoto; n: number; className?: string; sizes: string; frame?: Frame }) {
  const reduced = useReducedMotion();
  // Always the same initial state (the reduced flag only turns true after hydration, so switching the props off would leave the
  // figure stuck at its starting opacity); under reduced motion the reveal is instant.
  const reveal = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: reduced ? { duration: 0 } : { duration: 1.1, ease: ease.citadel, delay: (n % 3) * 0.08 },
  };

  let picture: ReactNode;
  if (frame === "band" || frame === "arch" || frame === "contact") {
    const shape = frame === "band" ? "aspect-[4/3] md:aspect-[21/9]" : frame === "arch" ? "aspect-[3/4] rounded-t-[999px]" : "aspect-[3/4]";
    picture = (
      <div className={cn("relative overflow-hidden bg-umber", shape)}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className={cn("object-cover transition-[filter,transform] duration-700", frame === "contact" && "grayscale group-hover:grayscale-0", frame !== "band" && "group-hover:scale-[1.03]")}
          style={{ objectPosition: photo.focus ?? "50% 45%" }}
        />
      </div>
    );
  } else {
    picture = <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={sizes} className="h-auto w-full" />;
  }

  return (
    <motion.figure {...reveal} className={cn("group", className)}>
      {picture}
      <figcaption className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-[0.65rem] tracking-[0.12em] text-brass">{ROMAN[n]}</span>
        <span className="t-voice text-lg leading-snug text-bone md:text-xl">{photo.title}</span>
      </figcaption>
    </motion.figure>
  );
}
