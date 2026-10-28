"use client";

import { ScrollRevealText } from "@/components/motion/ScrollRevealText";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import { ease } from "@/lib/motion/tokens";
import { asset } from "@/lib/content/asset";

interface BentoStallion {
  id: string;
  num: string;
  name: string;
  breed: string;
  chip: string;
  coat: string;
  trait: string;
  quote: string;
  hands: string;
  age: number;
  image: string;
  alt: string;
}

const STALLIONS: BentoStallion[] = [
  {
    id: "chetak-ix",
    num: "01",
    name: "Chetak IX",
    breed: "Purebred Marwari",
    chip: "356 098 112 004 912",
    coat: "Dark Bay · Blaze",
    trait: "The Calm Sovereign",
    quote: "A fortress of composure. Chetak grounds anxious first-time cadets.",
    hands: "15.2",
    age: 7,
    image: asset("/images/fleet/fleet-chetak.webp"),
    alt: "Chetak IX flagship purebred Marwari stallion",
  },
  {
    id: "veer",
    num: "02",
    name: "Veer",
    breed: "Kathiawari Cavalry Line",
    chip: "356 098 112 004 988",
    coat: "Chestnut Gold",
    trait: "The High-Velocity Lancer",
    quote: "Relentless focus under momentum. Veer answers ten grams of rein.",
    hands: "15.0",
    age: 6,
    image: asset("/images/fleet/fleet-veer.webp"),
    alt: "Veer chestnut gold Kathiawari stallion",
  },
  {
    id: "kesar",
    num: "03",
    name: "Kesar",
    breed: "Marwari Ablak",
    chip: "356 098 112 005 027",
    coat: "Skewbald Ablak",
    trait: "The Mounted Archer",
    quote: "Rare dual-tone coat pattern. Steps lightly and loves an audience.",
    hands: "14.3",
    age: 8,
    image: asset("/images/fleet/fleet-kesar.webp"),
    alt: "Kesar skewbald Marwari stallion",
  },
  {
    id: "arbudh",
    num: "04",
    name: "Arbudh",
    breed: "Marwari Endurance Line",
    chip: "356 098 112 005 034",
    coat: "Light Bay · 4 Socks",
    trait: "The Desert Pillar",
    quote: "Never the fastest. Never the first to tire.",
    hands: "15.0",
    age: 10,
    image: asset("/images/fleet/fleet-arbudh.webp"),
    alt: "Arbudh light bay Marwari stallion",
  },
  {
    id: "zilzal",
    num: "05",
    name: "Zilzal",
    breed: "Purebred Marwari",
    chip: "356 098 112 005 011",
    coat: "Obsidian Black",
    trait: "The Stoic Leader",
    quote: "Commanding presence, unshakable patience in tactical formation.",
    hands: "15.3",
    age: 8,
    image: asset("/images/fleet/fleet-zilzal.webp"),
    alt: "Zilzal obsidian black Marwari stallion",
  },
  {
    id: "tofan",
    num: "06",
    name: "Tofan",
    breed: "Purebred Marwari",
    chip: "356 098 112 004 991",
    coat: "Dappled Grey",
    trait: "The Tempest Lancer",
    quote: "High sensitivity. Demands absolute rider composure at full speed.",
    hands: "15.1",
    age: 9,
    image: asset("/images/fleet/fleet-tofan.webp"),
    alt: "Tofan dappled grey Marwari stallion",
  },
  {
    id: "bahadur",
    num: "07",
    name: "Bahadur",
    breed: "Purebred Marwari",
    chip: "356 098 112 005 049",
    coat: "Mahogany Bay",
    trait: "The Ridge Sentinel",
    quote: "Untroubled by sudden desert dust or flashing steel.",
    hands: "15.1",
    age: 8,
    image: asset("/images/legend/legend-bahadur.webp"),
    alt: "Bahadur Marwari stallion on desert ridge",
  },
  {
    id: "nukra",
    num: "08",
    name: "Kala Bhairav",
    breed: "Purebred Marwari",
    chip: "356 098 112 005 056",
    coat: "Midnight Obsidian",
    trait: "The Sovereign Knight",
    quote: "The sovereign vow of fidelity. Traces back six documented generations.",
    hands: "15.4",
    age: 9,
    image: asset("/images/black-marwari-stallion.webp"),
    alt: "Kala Bhairav midnight obsidian Marwari stallion",
  },
];

export function StallionBentoGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const splitRef = useRef<SplitText | null>(null);
  const splitTweenRef = useRef<gsap.core.Tween | null>(null);

  const [selectedStallion, setSelectedStallion] = useState<BentoStallion | null>(null);

  const lenis = useLenis();

  // Lenis - ScrollTrigger synchronization
  useEffect(() => {
    const unsub = lenis?.on("scroll", ScrollTrigger.update);
    return () => {
      unsub?.();
    };
  }, [lenis]);

  // Unhurried masked line typography reveal
  const animateText = useCallback(() => {
    const heading = headingRef.current;
    if (!heading) return;

    splitTweenRef.current?.kill();
    splitRef.current?.revert();

    gsap.registerPlugin(SplitText);

    splitRef.current = SplitText.create(heading, {
      type: "lines",
      linesClass: "split-line-wrapper",
      autoSplit: true,
      aria: "auto",
    });

    const lines = splitRef.current.lines;
    gsap.set(lines, { overflow: "hidden" });

    splitTweenRef.current = gsap.from(lines, {
      duration: 1.4,
      yPercent: 100,
      opacity: 0,
      stagger: 0.18,
      ease: "power3.out",
    });
  }, []);

  // Initialize SplitText on mount / fonts ready
  useEffect(() => {
    gsap.registerPlugin(SplitText);
    let mounted = true;

    void document.fonts.ready.then(() => {
      if (mounted) {
        animateText();
      }
    });

    return () => {
      mounted = false;
      splitTweenRef.current?.kill();
      splitRef.current?.revert();
      splitRef.current = null;
    };
  }, [animateText]);

  // Bento Flip + ScrollTrigger Pinned Expansion
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, Flip);

    let flipCtx: gsap.Context | null = null;
    let resizeTimer: NodeJS.Timeout;

    const createTween = () => {
      const galleryElement = galleryRef.current;
      const wrapElement = wrapRef.current;
      if (!galleryElement || !wrapElement) return;

      const galleryItems = galleryElement.querySelectorAll<HTMLElement>(".gallery__item");
      if (!galleryItems.length) return;

      flipCtx?.revert();
      galleryElement.classList.remove("gallery--final");

      flipCtx = gsap.context(() => {
        // Temporarily add final class to capture target expanded layout
        galleryElement.classList.add("gallery--final");
        const flipState = Flip.getState(galleryItems, {
          props: "transform,opacity",
        });
        galleryElement.classList.remove("gallery--final");

        // Create the Flip tween to animate smoothly from initial bento to expanded mosaic
        const flip = Flip.to(flipState, {
          simple: true,
          ease: "expoScale(1, 5)",
        });

        // Pin gallery wrap and scrub Flip tween with scroll
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: galleryElement,
            start: "center center",
            end: "+=120%",
            scrub: 0.6,
            pin: wrapElement,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.add(flip);

        return () => gsap.set(galleryItems, { clearProps: "all" });
      }, wrapElement);
    };

    void document.fonts.ready.then(() => {
      // Short delay to ensure client layout and grid dimensions are resolved
      const id = requestAnimationFrame(() => {
        createTween();
      });
      return () => cancelAnimationFrame(id);
    });

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        createTween();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
      flipCtx?.revert();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      aria-labelledby="bento-gallery-heading"
      className="relative bg-[#0e0d0c] text-white pt-24 pb-16 selection:bg-[#c9a66b] selection:text-black overflow-hidden"
    >
      {/* Editorial Intro & SplitText Interactive Showcase */}
      <div className="gutter relative mx-auto max-w-5xl text-center pb-14">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-[#c9a66b]/35 bg-[#171513]/90 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.22em] text-[#c9a66b] mb-6 shadow-lg shadow-black/40">
          <span className="h-2 w-2 rounded-full bg-[#c9a66b] animate-pulse" aria-hidden="true" />
          REEL 06B · BENTO STUDBOOK VISUALIZER
        </div>

        <h2
          id="bento-gallery-heading"
          ref={headingRef}
          className="font-playfair text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#f3ede2] leading-[1.1] max-w-4xl mx-auto"
        >
          Eight sovereign bloodlines. One sacred ledger.
        </h2>

        <ScrollRevealText className="t-story mt-6 text-[#d4c3ad] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Twenty-one indigenous Marwari and Kathiawari stallions registered under ISO 11784 telemetry.
          Scroll to expand the royal stable mosaic across the horizon.
        </ScrollRevealText>

      </div>

      {/* GSAP Flip Bento-to-Fullscreen Expansion Stage */}
      <div ref={wrapRef} className="gallery-wrap">
        <div
          ref={galleryRef}
          className="gallery gallery--bento gallery--switch"
          id="gallery-8"
        >
          {STALLIONS.map((s) => (
            <div
              key={s.id}
              className="gallery__item group cursor-pointer"
              onClick={() => setSelectedStallion(s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedStallion(s);
                }
              }}
              aria-label={`Inspect ${s.name}, ${s.breed}`}
            >
              {/* Image with subtle hover zoom */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt={s.alt}
                // The gallery sits far below the title card; the first four (~820 kB) used to load eagerly with the page.
                loading="lazy"
                decoding="async"
                className="transition-transform duration-700 ease-out group-hover:scale-105"
              />

            </div>
          ))}
        </div>
      </div>

      <div className="tone-dark editorial-reel-notes gutter">
        {STALLIONS.map((s) => <article key={s.id}>
          <button type="button" onClick={() => setSelectedStallion(s)} className="text-left w-full">
            <h3>{s.num} · {s.name}</h3><p>{s.trait}</p><small>{s.coat} · ISO {s.chip.slice(-7)} · Inspect ↗</small>
          </button>
        </article>)}
      </div>

      {/* Narrative Section Matching User Prompt Content */}
      <div className="section gutter mx-auto max-w-4xl py-24 sm:py-32">
        <div className="border-t border-[#c9a66b]/20 pt-16">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#c9a66b]">
            BSAH ARCHIVAL FOLIO · CHAPTER VI
          </p>
          <h3 className="font-playfair text-3xl sm:text-4xl text-[#f3ede2] mt-4 font-normal">
            The Living Bloodline that Never Left the Field
          </h3>

          <div className="mt-8 space-y-6 text-[#d4c3ad] leading-relaxed text-base sm:text-lg">
            <p>
              For over eight hundred years, the desert clans of Marwar bred horses not for docile surrender,
              but for absolute fidelity in the chaos of battle. Their inward-curving lyre ears swivel 180 degrees
              to intercept the rider’s lowest whisper over galloping hooves and roaring dust storms.
            </p>
            <p>
              Every stallion housed at the Black Stallion Academy is microchipped under ISO 11784/11785 standards,
              undergoes pre-dawn pulse and tendon inspections, and rests in lantern-lit stalls with round-the-clock
              parent telemetry. When a cadet mounts Chetak IX or Veer, they are not riding livestock; they are
              communing with eight centuries of living Indian history.
            </p>
            <p>
              The transition from squiredom to Sovereign Lancer demands that every cadet master the distinct personality
              of multiple steeds. From the measured, steady breathing of Chetak IX to the lightning sprint of Veer
              under the lowered tent-pegging lance, the studbook records each cadet&rsquo;s ascent into sovereign command.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Stallion Inspection Drawer / Modal */}
      <AnimatePresence>
        {selectedStallion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStallion(null)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedStallion.name} studbook folio`}
              initial={{ x: "100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.6, ease: ease.citadel }}
              className="fixed inset-y-0 right-0 z-[85] w-full max-w-lg overflow-y-auto border-l border-[#c9a66b]/30 bg-[#171513] text-white p-6 sm:p-8"
              data-lenis-prevent
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#c9a66b]/20">
                <span className="font-mono text-xs uppercase tracking-widest text-[#c9a66b]">
                  STUDBOOK FOLIO · {selectedStallion.num}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStallion(null)}
                  className="rounded border border-[#c9a66b]/30 px-3 py-1 text-xs font-mono uppercase text-[#d4c3ad] hover:text-[#c9a66b] hover:border-[#c9a66b]"
                >
                  Close ✕
                </button>
              </div>

              <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded border border-[#c9a66b]/25">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedStallion.image}
                  alt={selectedStallion.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#171513] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-[#c9a66b]">
                    {selectedStallion.trait}
                  </p>
                  <p className="font-playfair text-3xl text-white font-normal mt-0.5">
                    {selectedStallion.name}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="italic text-[#f3ede2] text-lg font-serif">
                  &ldquo;{selectedStallion.quote}&rdquo;
                </p>

                <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-[#c9a66b]/20 pt-6 text-sm">
                  <div>
                    <dt className="font-mono text-xs uppercase text-[#d4c3ad]/70">Breed</dt>
                    <dd className="font-playfair text-base text-white mt-0.5">{selectedStallion.breed}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase text-[#d4c3ad]/70">Coat</dt>
                    <dd className="text-white mt-0.5">{selectedStallion.coat}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase text-[#d4c3ad]/70">Height</dt>
                    <dd className="text-white mt-0.5">{selectedStallion.hands} Hands</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase text-[#d4c3ad]/70">Age</dt>
                    <dd className="text-white mt-0.5">{selectedStallion.age} Years</dd>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-[#c9a66b]/10">
                    <dt className="font-mono text-xs uppercase text-[#d4c3ad]/70">Microchip ISO 11784</dt>
                    <dd className="font-mono text-sm text-[#c9a66b] mt-0.5">{selectedStallion.chip}</dd>
                  </div>
                </dl>

                <div className="mt-8 rounded border border-[#c9a66b]/20 bg-black/40 p-4">
                  <p className="font-mono text-xs uppercase text-[#c9a66b] tracking-wider">
                    STABLE TELEMETRY STATUS
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#d4c3ad]">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active Vet Log Verified
                    </span>
                    <span className="font-mono">PULSE: 36 BPM</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStallion(null)}
                  className="mt-8 w-full rounded border border-[#c9a66b] bg-[#c9a66b] py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#0e0d0c] hover:bg-[#c9a66b]/90 transition-colors"
                >
                  Return to Studbook Mosaic
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
