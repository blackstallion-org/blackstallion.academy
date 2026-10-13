"use client";

import { useMemo } from "react";
import { WebGLTransitionSlider, type WebGLSlideItem } from "@/components/film/WebGLTransitionSlider";
import { mediaSrc } from "@/lib/content/media";

/**
 * Dedicated 3-Image WebGL Transition Section for /fleet.
 * Showcases the 3 supreme foundation stallions with Three.js 4D simplex noise liquid displacement waves.
 */
export function StallionTriadGallery() {
  const slides: WebGLSlideItem[] = useMemo(() => {
    const src1 = mediaSrc("fleetChetak") || "/media/fleet-chetak.png";
    const src2 = mediaSrc("fleetVeer") || "/media/fleet-veer.png";
    const src3 = mediaSrc("legendBlack") || "/media/legend-black.png";

    return [
      {
        id: "chetak-ix",
        image: src1,
        title: "Chetak IX",
        subtitle: "A fortress of composure. Purebred Marwari bloodline traced to 1193.",
        tag: "STALLION 01 · THE CALM SOVEREIGN",
        meta: "15.2 hh · Dark bay with white blaze",
      },
      {
        id: "veer",
        image: src2,
        title: "Veer",
        subtitle: "Relentless focus under momentum. Answers ten grams of rein.",
        tag: "STALLION 02 · THE HIGH-VELOCITY LANCER",
        meta: "15.0 hh · Chestnut gold cavalry line",
      },
      {
        id: "zilzal",
        image: src3,
        title: "Zilzal",
        subtitle: "Commanding presence, unshakable patience. Notices a rider's nerves instantly.",
        tag: "STALLION 03 · THE STOIC LEADER",
        meta: "15.3 hh · Jet black purebred stud",
      },
    ];
  }, []);

  return (
    <section
      id="webgl-gallery"
      aria-label="WebGL Stallion Transition Gallery"
      className="gutter relative py-[clamp(5rem,10vh,8rem)] border-b border-gold/20 bg-[#0F0E0D]"
    >
      <div className="mx-auto max-w-6xl">
        <WebGLTransitionSlider
          slides={slides}
          title="The Stallion Triad · WebGL Image Transition"
          kicker="Reel 06 · Liquid Simplex Noise Wave"
          heightClass="h-[480px] sm:h-[580px] md:h-[680px]"
        />
      </div>
    </section>
  );
}
