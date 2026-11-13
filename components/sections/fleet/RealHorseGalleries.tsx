"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { Headline } from "@/components/film/Headline";
import { cn } from "@/lib/utils";
import type { RealHorse, RealPhoto } from "@/lib/content/real-horses";

type Box = { photos: RealPhoto[]; index: number; title: string; from: HTMLElement } | null;

/**
 * /fleet · Real horses. One gallery per verified individual horse (lead photograph, then its views), a "More horses"
 * selector to move between them, a separate collection of single photographs, and one shared lightbox
 * (previous/next buttons, arrow keys, Escape, swipe on touch, focus kept inside while open and returned on close).
 */
export function RealHorseGalleries({ horses, collection, note }: { horses: RealHorse[]; collection: RealPhoto[]; note: string }) {
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<Box>(null);
  const stage = useRef<HTMLDivElement>(null);
  const horse = horses[active];

  // Deep links: /fleet#horse-study-03 opens that horse's gallery.
  useEffect(() => {
    const pick = () => {
      const i = horses.findIndex((h) => `#${h.slug}` === window.location.hash);
      if (i >= 0) setActive(i);
    };
    pick();
    window.addEventListener("hashchange", pick);
    return () => window.removeEventListener("hashchange", pick);
  }, [horses]);

  const choose = (i: number) => {
    setActive(i);
    history.replaceState(null, "", `#${horses[i].slug}`);
    requestAnimationFrame(() => stage.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const open = (photos: RealPhoto[], index: number, title: string, el: HTMLElement) => {
    setBox({ photos, index, title, from: el });
  };

  return (
    <section id="real-horses" aria-labelledby="real-horses-h" className="bg-night py-20 md:py-28">
      <div className="gutter">
        <p className="label text-brass">Real photographs</p>
        <Headline id="real-horses-h" inscription="EIGHT HORSES," voice="each from every side we have." size="3" className="mt-3" />
        <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">{note}</p>

        {/* More horses: the overview, and the way between galleries */}
        <nav aria-label="More horses" className="mt-12">
          <p className="label text-dust">More horses</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {horses.map((h, i) => (
              <li key={h.slug}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  aria-pressed={i === active}
                  aria-controls="real-horse-stage"
                  className={cn(
                    "group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
                  )}
                >
                  <span className={cn("relative block aspect-square overflow-hidden border", i === active ? "border-gold" : "border-transparent")}>
                    <Image src={h.photos[0].src} alt="" fill sizes="(min-width: 1024px) 11vw, (min-width: 640px) 23vw, 46vw" className="object-cover object-[50%_25%] transition-transform duration-700 group-hover:scale-[1.04]" />
                  </span>
                  <span className={cn("label mt-2 block", i === active ? "text-gold" : "text-bone")}>{h.title}</span>
                  <span className="t-ui block text-xs text-dust">{h.photos.length} views · {h.setting}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* The selected horse */}
        <div ref={stage} id="real-horse-stage" aria-live="polite" className="mt-16 scroll-mt-28 border-t border-line pt-12">
          <div id={horse.slug} className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
            <figure>
              <button type="button" onClick={(e) => open(horse.photos, 0, horse.title, e.currentTarget)} className="group relative block w-full overflow-hidden bg-umber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold" aria-label={`Open ${horse.title}, ${horse.photos[0].label}, full size`}>
                <span className="relative block" style={{ aspectRatio: `${horse.photos[0].width} / ${horse.photos[0].height}` }}>
                  <Image key={horse.photos[0].src} src={horse.photos[0].src} alt={horse.photos[0].alt} fill sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" />
                </span>
              </button>
              <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="label text-brass">{horse.photos[0].label}</span>
                <span className="t-ui text-sm text-sand">{horse.photos[0].caption}</span>
              </figcaption>
            </figure>
            <div>
              <p className="label text-brass">{horse.setting}</p>
              <h3 className="t-voice mt-2 text-display-3 text-bone">{horse.title}</h3>
              <p className="t-story mt-4 text-sand">{horse.note}</p>
              <ul className="mt-8 grid grid-cols-2 gap-4" aria-label={`${horse.title}: all views`}>
                {horse.photos.map((p, i) => (
                  <li key={p.src}>
                    <button type="button" onClick={(e) => open(horse.photos, i, horse.title, e.currentTarget)} className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold" aria-label={`Open ${p.label}`}>
                      <span className="relative block aspect-[4/5] overflow-hidden bg-umber">
                        <Image src={p.src} alt="" fill sizes="(min-width: 1024px) 18vw, 46vw" className="object-cover object-[50%_25%] transition-transform duration-700 group-hover:scale-[1.04]" />
                      </span>
                      <span className="label mt-2 block text-bone">{p.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => choose((active - 1 + horses.length) % horses.length)} className="label inline-flex min-h-11 items-center rounded-full border border-brass/60 px-5 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  ← Previous horse
                </button>
                <button type="button" onClick={() => choose((active + 1) % horses.length)} className="label inline-flex min-h-11 items-center rounded-full border border-brass/60 px-5 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  Next horse →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Single photographs: kept apart because each could not be matched to a second photo of the same horse */}
        <div className="mt-24 border-t border-line pt-12">
          <p className="label text-brass">Single photographs</p>
          <h3 className="t-voice mt-2 text-display-3 text-bone">More horses, one photograph each.</h3>
          <p className="t-story mt-4 max-w-2xl text-sand">Not grouped by horse: each of these is the only photograph we can place of that animal, so none of them is a gallery.</p>
          <ul className="mt-10 columns-2 gap-4 md:columns-3 lg:columns-4">
            {collection.map((p, i) => (
              <li key={p.src} className="mb-4 break-inside-avoid">
                <button type="button" onClick={(e) => open(collection, i, "Single photographs", e.currentTarget)} className="group block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold" aria-label={`Open photograph: ${p.alt}`}>
                  <span className="relative block overflow-hidden bg-umber" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
                    <Image src={p.src} alt="" fill sizes="(min-width: 1024px) 23vw, (min-width: 768px) 31vw, 46vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {box && (
        <Lightbox
          box={box}
          returnTo={box.from}
          onIndex={(index) => setBox((b) => (b ? { ...b, index } : b))}
          onClose={() => setBox(null)}
        />
      )}
    </section>
  );
}

function Lightbox({ box, returnTo, onIndex, onClose }: { box: NonNullable<Box>; returnTo: HTMLElement | null; onIndex: (i: number) => void; onClose: () => void }) {
  const lenis = useLenis();
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touch = useRef<number | null>(null);
  const n = box.photos.length;
  const photo = box.photos[box.index];
  const go = useCallback((d: number) => onIndex((box.index + d + n) % n), [box.index, n, onIndex]);

  useEffect(() => {
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      lenis?.start();
      // focus goes back to the photograph that opened the lightbox
      returnTo?.focus({ preventScroll: true });
    };
  }, [lenis, returnTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === "Tab" && dialog.current) {
        // keep focus inside the dialog
        const f = Array.from(dialog.current.querySelectorAll<HTMLElement>("button"));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`${box.title}: photograph ${box.index + 1} of ${n}`}
      data-lenis-prevent
      className="fixed inset-0 z-[90] flex flex-col bg-[color-mix(in_srgb,var(--color-night)_96%,transparent)] tone-dark"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="gutter flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
        <p className="label text-sand">
          {box.title} · <span className="font-mono">{box.index + 1} / {n}</span>
        </p>
        <button ref={closeBtn} type="button" onClick={onClose} className="label inline-flex min-h-11 items-center rounded-full border border-brass/60 px-5 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
          Close ✕
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Image key={photo.src} src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-contain" />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photograph" className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-brass/60 bg-night/70 text-bone hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">←</button>
            <button type="button" onClick={() => go(1)} aria-label="Next photograph" className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-brass/60 bg-night/70 text-bone hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">→</button>
          </>
        )}
      </div>
      <div className="gutter flex min-h-16 flex-wrap items-baseline gap-x-3 gap-y-1 py-4">
        <span className="label text-brass">{photo.label}</span>
        {photo.caption && <span className="t-ui text-sm text-sand">{photo.caption}</span>}
        <span className="t-ui ml-auto text-xs text-dust">Arrow keys or swipe to move · Esc to close</span>
      </div>
    </div>
  );
}
