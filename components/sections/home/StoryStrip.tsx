"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mediaSrc } from "@/lib/content/media";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroSectionItem {
  id: string;
  imgUrl: string;
  alt: string;
  title: string;
}

const HERO_SECTIONS: HeroSectionItem[] = [
  {
    id: "hero-1",
    imgUrl:
      mediaSrc("legendSand") ||
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
    alt: "A Marwari's hooves lifting out of deep desert sand",
    title: "THE ART OF LIFE",
  },
  {
    id: "hero-2",
    imgUrl:
      mediaSrc("bgFort") ||
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80",
    alt: "Ruins of a sandstone Rajput fort above the Thar at dusk",
    title: "THE ART OF LIFE",
  },
  {
    id: "hero-3",
    imgUrl:
      mediaSrc("legendCavalry") ||
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80",
    alt: "Marwari horsemen riding through a plume of golden desert dust",
    title: "THE ART OF LIFE",
  },
];

export function StoryStrip() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.log("🎬 [Knockout Reveal] Initializing 'THE ART OF LIFE' hero sections...");

    const sections = container.querySelectorAll<HTMLElement>(".hero");
    if (!sections.length) return;

    const ctx = gsap.context(() => {
      sections.forEach((section, index) => {
        const title = section.querySelector<HTMLElement>(".hero-title");
        if (!title) return;

        // Animate initial section immediately on mount, and scroll-trigger subsequent sections
        if (index === 0) {
          gsap.fromTo(
            title,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              duration: 1.3,
              ease: "power3.out",
              delay: 0.25,
              onStart: () => {
                console.log("✅ [Knockout Reveal] Hero section 1 animation fired successfully");
              },
            }
          );
        } else {
          ScrollTrigger.create({
            trigger: section,
            start: "top 75%",
            onEnter: () => {
              gsap.fromTo(
                title,
                { opacity: 0, y: 35 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 1.3,
                  ease: "power3.out",
                  overwrite: "auto",
                  onStart: () => {
                    console.log(`✅ [Knockout Reveal] Hero section ${index + 1} animation fired successfully`);
                  },
                }
              );
            },
          });
        }
      });
    }, container);

    // Safety fallback: ensure text is never stuck hidden if GSAP is skipped
    const fallbackTimer = setTimeout(() => {
      const titles = container.querySelectorAll<HTMLElement>(".hero-title");
      titles.forEach((el) => {
        if (getComputedStyle(el).opacity === "0") {
          el.style.opacity = "1";
          el.style.transform = "translateY(0px)";
        }
      });
    }, 1500);

    return () => {
      clearTimeout(fallbackTimer);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hero-slider"
      className="relative w-full bg-black text-white overflow-hidden select-none"
    >
      {HERO_SECTIONS.map((sec, idx) => (
        <section
          key={sec.id}
          id={`hero-section-${idx + 1}`}
          className="hero relative w-full h-[100vh] min-h-[640px] overflow-hidden bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url("${sec.imgUrl}")`,
          }}
        >
          {/* IMAGE – locked in the back for fallback / accessibility */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sec.imgUrl}
            alt={sec.alt}
            className="absolute inset-0 w-full h-full object-cover object-center z-[1] opacity-0 pointer-events-none"
          />

          {/* Dark cinematic overlay so knockout punch pops against the landscape */}
          <div
            className="absolute inset-0 bg-black/55 z-[2] pointer-events-none"
            aria-hidden="true"
          />

          {/* TEXT – locked in the front, pure knockout */}
          <h1
            className="hero-title absolute inset-0 z-10 flex items-center justify-center m-0 font-serif text-[clamp(3.8rem,13vw,9.5rem)] font-normal tracking-[0.05em] text-center uppercase leading-[0.9] text-transparent bg-inherit will-change-transform"
            style={{
              WebkitTextFillColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {sec.title}
          </h1>
        </section>
      ))}
    </div>
  );
}
