"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Headline } from "@/components/film/Headline";
import { ReelMark } from "@/components/film/Marks";
import type { Act } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/motion/reduced";
import type { Room, RoomLayout } from "@/lib/content/history/alexander-exhibition";

type Intro = { folio: string; inscription: string; voice: string; lede: string; colophon: string };
type Related = { href: string; label: string; blurb: string };

/**
 * Reel 23, Alexander & Bucephalus, as a museum walk: twelve rooms, each one living mosaic (a looping video cut from the owner's GIF,
 * with its own frame timing) hung on the ivory wall beside a short wall card. Nothing sits on the pictures: no shade, no
 * fade, no zoom. Each plate is unveiled once by a curtain (a clip, not a scale), wall-card lines rise out of masks, and a
 * slim rail of numerals tracks the room you are in. Lenis smooths the scroll and already drives ScrollTrigger site-wide.
 * Reduced motion: no curtains, no rising text, no looping; each plate shows its first frame.
 */
export function AlexanderExhibition({ reel, intro, rooms, related }: { reel: { n: number; act: Act }; intro: Intro; rooms: Room[]; related: Related[] }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(-1);

  // Motion first, before paint, so no plate is seen uncovered and then covered.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-room]").forEach((room, i) => {
        ScrollTrigger.create({
          trigger: room,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActive(i),
        });
        if (reduced) return;
        const plate = room.querySelector<HTMLElement>("[data-plate]");
        const rises = room.querySelectorAll<HTMLElement>("[data-rise]");
        const tl = gsap.timeline({ scrollTrigger: { trigger: room, start: "top 78%", once: true } });
        if (plate) {
          tl.fromTo(
            plate,
            { clipPath: "inset(8% 10% 8% 10%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "expo.out", clearProps: "clipPath" },
            0,
          );
        }
        if (rises.length) tl.fromTo(rises, { yPercent: 105 }, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.09 }, 0.25);
      });
      ScrollTrigger.create({
        trigger: el.querySelector("[data-rooms]"),
        start: "top 60%",
        end: "bottom 40%",
        onLeaveBack: () => setActive(-1),
        onLeave: () => setActive(-2),
      });
    }, el);
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(refresh);
      ctx.revert();
    };
  }, [reduced]);

  return (
    <div ref={root} className="relative bg-night text-bone">
      <header className="gutter mx-auto max-w-[1500px] pb-[6svh] pt-[clamp(6.5rem,13vh,9.5rem)]">
        <ReelMark n={reel.n} act={reel.act} />
        <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-dust">{intro.folio}</p>
        <Headline as="h1" size="1" animate={reduced ? "none" : "mount"} inscription={intro.inscription} voice={intro.voice} className="mt-6" />
        <p className="t-story mt-6 max-w-[28rem] text-[1.1rem] italic text-sand">{intro.lede}</p>
      </header>

      <div data-rooms className="lg:pr-20">
        {rooms.map((room, i) => (
          <RoomScene key={room.id} room={room} total={rooms.length} eager={i === 0} still={reduced} />
        ))}
      </div>

      <RoomRail rooms={rooms} active={active} />

      <footer className="gutter mx-auto max-w-[1500px] border-t border-line pb-[12svh] pt-12 lg:pr-20">
        <div className="grid gap-10 md:grid-cols-12">
          <p className="t-story text-[0.98rem] leading-relaxed text-dust md:col-span-6">{intro.colophon}</p>
          <ul className="grid gap-5 md:col-span-5 md:col-start-8">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="group block focus-visible:outline-offset-4">
                  <span className="t-voice text-[1.35rem] text-bone transition-colors group-hover:text-gold">{r.label}</span>
                  <span className="t-story mt-1 block text-[0.95rem] text-dust">{r.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}

/* ---------- One room ---------- */

const GRID: Record<RoomLayout, { plate: string; card: string; section: string }> = {
  opening: { plate: "md:col-span-12", card: "md:col-span-12", section: "pb-[16svh]" },
  left: { plate: "md:col-span-7 md:row-start-1", card: "md:col-span-4 md:col-start-9 md:row-start-1 md:self-center", section: "py-[14svh]" },
  right: { plate: "md:col-span-7 md:col-start-6 md:row-start-1", card: "md:col-span-4 md:col-start-1 md:row-start-1 md:self-end md:pb-[4svh]", section: "py-[14svh]" },
  wide: { plate: "md:col-span-12", card: "md:col-span-12", section: "py-[16svh]" },
  quiet: { plate: "md:col-span-5 md:col-start-7 md:row-start-1", card: "md:col-span-4 md:col-start-2 md:row-start-1 md:self-end", section: "py-[20svh]" },
  coda: { plate: "md:col-span-8 md:col-start-3", card: "md:col-span-6 md:col-start-4 md:text-center", section: "py-[16svh]" },
};

function RoomScene({ room, total, eager, still }: { room: Room; total: number; eager: boolean; still: boolean }) {
  const g = GRID[room.layout];
  const banded = room.layout === "wide" || room.layout === "opening";
  return (
    <section
      id={room.id}
      data-room
      aria-labelledby={`${room.id}-title`}
      className={`gutter mx-auto flex max-w-[1500px] scroll-mt-20 items-center md:min-h-[100svh] ${g.section}`}
    >
      <div className="grid w-full grid-cols-1 gap-y-8 md:grid-cols-12 md:gap-x-10">
        <figure className={`-mx-[max(16px,4vw)] md:mx-0 ${g.plate}`}>
          <div data-plate className="relative aspect-[1104/618] w-full overflow-hidden bg-umber">
            <MosaicFilm room={room} eager={eager} still={still} />
          </div>
          <figcaption className="sr-only">{room.alt}</figcaption>
        </figure>
        {banded ? <BandCard room={room} total={total} className={g.card} /> : <WallCard room={room} total={total} className={g.card} />}
      </div>
    </section>
  );
}

/** Wraps a line so it can rise out of its own mask. */
function Rise({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-hidden pb-[0.12em]">
      <div data-rise className={className}>
        {children}
      </div>
    </div>
  );
}

function WallCard({ room, total, className }: { room: Room; total: number; className: string }) {
  return (
    <div className={className}>
      <Rise className={`flex items-baseline gap-4 ${room.layout === "coda" ? "md:justify-center" : ""}`}>
        <span className="t-voice text-[clamp(3rem,5vw,4.6rem)] leading-none text-gold">{room.numeral}</span>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-dust">of {toRoman(total)}</span>
      </Rise>
      <Rise className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-brass">{room.place}</Rise>
      <Rise>
        <h2 id={`${room.id}-title`} className="t-voice mt-3 text-[clamp(1.9rem,3vw,2.9rem)] leading-[1.05] text-bone">
          {room.title}
        </h2>
      </Rise>
      <div className={`mt-6 border-t border-line pt-5 ${room.layout === "coda" ? "md:mx-auto md:max-w-[30rem]" : "max-w-[27rem]"}`}>
        <Rise className="t-story text-[1.06rem] leading-[1.6] text-sand">{room.text}</Rise>
        {room.note && <Rise className="t-story mt-3 text-[0.92rem] italic leading-snug text-dust">{room.note}</Rise>}
        <Rise className="label mt-5 text-[0.6rem] text-brass">{room.source}</Rise>
      </div>
    </div>
  );
}

/** For full-width plates: the wall card laid out as a band under the picture. */
function BandCard({ room, total, className }: { room: Room; total: number; className: string }) {
  return (
    <div className={`grid gap-y-4 md:grid-cols-12 md:gap-x-10 ${className}`}>
      <Rise className="flex items-baseline gap-4 md:col-span-2">
        <span className="t-voice text-[clamp(3rem,5vw,4.6rem)] leading-none text-gold">{room.numeral}</span>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-dust">of {toRoman(total)}</span>
      </Rise>
      <div className="md:col-span-4">
        <Rise className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-brass">{room.place}</Rise>
        <Rise>
          <h2 id={`${room.id}-title`} className="t-voice mt-3 text-[clamp(1.9rem,3vw,2.9rem)] leading-[1.05] text-bone">
            {room.title}
          </h2>
        </Rise>
      </div>
      <div className="md:col-span-5 md:col-start-8 md:border-l md:border-line md:pl-8">
        <Rise className="t-story text-[1.06rem] leading-[1.6] text-sand">{room.text}</Rise>
        {room.note && <Rise className="t-story mt-3 text-[0.92rem] italic leading-snug text-dust">{room.note}</Rise>}
        <Rise className="label mt-5 text-[0.6rem] text-brass">{room.source}</Rise>
      </div>
    </div>
  );
}

/* ---------- The living mosaic ---------- */

/**
 * The poster (first frame) is there at once; the film's source is set only as the room comes near, the small cut on
 * phones and the 2× cut elsewhere, and it plays only while it is on screen.
 */
function MosaicFilm({ room, eager, still }: { room: Room; eager: boolean; still: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    let visible = false;
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || v.src) return;
        v.src = window.matchMedia("(max-width: 767px)").matches ? room.videoSmall : room.video;
        if (visible) v.play().catch(() => {});
        near.disconnect();
      },
      { rootMargin: "80% 0px" },
    );
    const seen = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (!v.src) return;
        if (visible) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 },
    );
    near.observe(v);
    seen.observe(v);
    return () => {
      near.disconnect();
      seen.disconnect();
    };
  }, [room, still]);

  if (still) {
    return <Image src={room.poster} alt={room.alt} fill sizes="(min-width: 768px) 70vw, 100vw" priority={eager} className="object-cover" />;
  }
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      poster={room.poster}
      muted
      loop
      playsInline
      preload={eager ? "auto" : "none"}
      aria-label={room.alt}
    />
  );
}

/* ---------- Room rail ---------- */

function RoomRail({ rooms, active }: { rooms: Room[]; active: number }) {
  const inside = active >= 0;
  const room = inside ? rooms[active] : undefined;
  const prev = inside && active > 0 ? rooms[active - 1] : undefined;
  const next = inside && active < rooms.length - 1 ? rooms[active + 1] : undefined;

  return (
    <nav aria-label="Rooms" className={`transition-opacity duration-700 ${inside ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      {/* Desktop: a slim column of numerals at the right edge. */}
      <ol className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex">
        {rooms.map((r, i) => {
          const on = i === active;
          return (
            <li key={r.id}>
              <a
                href={`#${r.id}`}
                aria-current={on ? "location" : undefined}
                tabIndex={inside ? undefined : -1}
                className="group flex items-center gap-2 py-0.5 focus-visible:outline-offset-2"
              >
                <span className="sr-only">{r.title}</span>
                <span aria-hidden className={`h-px bg-brass transition-all duration-500 ${on ? "w-6" : "w-2.5 opacity-50 group-hover:w-4"}`} />
                <span aria-hidden className={`font-display w-8 text-right text-[0.78rem] tracking-[0.04em] transition-colors ${on ? "text-gold" : "text-dust group-hover:text-bone"}`}>
                  {r.numeral}
                </span>
              </a>
            </li>
          );
        })}
      </ol>

      {/* Phones and tablets: the current room, with the rooms either side. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night lg:hidden">
        <div className="gutter flex h-12 items-center justify-between gap-4">
          {prev ? (
            <a href={`#${prev.id}`} className="font-display flex min-h-11 min-w-11 items-center text-[0.85rem] text-dust" tabIndex={inside ? undefined : -1}>
              <span aria-hidden>←&nbsp;</span>
              <span className="sr-only">Previous room: </span>
              {prev.numeral}
            </a>
          ) : (
            <span className="min-w-11" />
          )}
          <p className="t-voice truncate text-[1rem] text-bone" aria-live="polite">
            {room && (
              <>
                <span className="text-gold">{room.numeral}</span> · {room.title}
              </>
            )}
          </p>
          {next ? (
            <a href={`#${next.id}`} className="font-display flex min-h-11 min-w-11 items-center justify-end text-[0.85rem] text-dust" tabIndex={inside ? undefined : -1}>
              <span className="sr-only">Next room: </span>
              {next.numeral}
              <span aria-hidden>&nbsp;→</span>
            </a>
          ) : (
            <span className="min-w-11" />
          )}
        </div>
      </div>
    </nav>
  );
}

const toRoman = (n: number) =>
  [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ].reduce<[string, number]>(([s, left], [v, l]) => {
    while (left >= (v as number)) {
      s += l as string;
      left -= v as number;
    }
    return [s, left];
  }, ["", n])[0];
