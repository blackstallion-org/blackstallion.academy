"use client";

import { SplitSlider, type SplitSlide } from "@/components/cinematic/SplitSlider";
import { Label } from "@/components/film/Marks";
import { GSAPScrollReveal } from "@/components/cinematic/GSAPScrollReveal";

/**
 * §2 Story Strip — Reel 01 · The Legend
 * The Legend in Five Frames implemented via our award-winning SplitSlider:
 * - Left: large cinematic media frame with rounded corners
 * - Right: oversized editorial typography overlapping across the boundary
 * - Local high-definition authentic Marwari imagery from Rajasthan
 */
export function StoryStrip() {
  const slides: SplitSlide[] = [
    {
      imageSrc: "/images/1_desert.png",
      imageAlt: "A Marwari stallion in the Thar Desert sands",
      imageFocus: "55% 45%",
      kicker: "Reel 01 · The Legend — Frame 01A · One bloodline",
      heading: "Eight hundred years in one bloodline.",
      body: "For centuries, civilisation was shaped by the partnership between horse and rider. In the Thar Desert that partnership bred a horse unlike any other.",
      ctaLabel: "Read the full legend",
      ctaHref: "/legend",
      ambientTone: "#A9673F",
    },
    {
      imageSrc: "/images/2_war.png",
      imageAlt: "Ruins of a sandstone Rajput fort and battlefield above the Thar",
      imageFocus: "50% 50%",
      kicker: "Reel 01 · The Legend — Frame 02A · Marwar, the Thar",
      heading: "Survival on terrain, not ideology.",
      body: "Driven onto the arid plains of the Thar, the horsemen of Marwar survived on terrain, not ideology. Their horses learned to live on a cup of water.",
      ctaLabel: "Read the full legend",
      ctaHref: "/legend",
      ambientTone: "#332219",
    },
    {
      imageSrc: "/images/0_hero.png",
      imageAlt: "A Marwari stallion carrying its wounded rider home",
      imageFocus: "50% 40%",
      kicker: "Reel 01 · The Legend — Frame 03A · The vow",
      heading: "Victory, death, or the wounded rider home.",
      body: "A Marwari left the battlefield three ways: in victory, in death, or carrying its wounded rider home. That vow is bred into the bone.",
      ctaLabel: "Read the full legend",
      ctaHref: "/legend",
      ambientTone: "#C5A059",
    },
    {
      imageSrc: "/images/3_fall.png",
      imageAlt: "The nearly lost bloodline after 1947",
      imageFocus: "50% 55%",
      kicker: "Reel 01 · The Legend — Frame 04A · Nearly lost",
      heading: "A few people refused to let the line end.",
      body: "After 1947 the royal stables emptied. Horses were sold, castrated, shot. A few noble breeders refused to let the indigenous bloodline die.",
      ctaLabel: "Read the full legend",
      ctaHref: "/legend",
      ambientTone: "#2A1D15",
    },
    {
      imageSrc: "/images/5_academy.png",
      imageAlt: "Close-up of Marwari inward-curling ears — the mark of pure blood",
      imageFocus: "50% 35%",
      kicker: "Reel 01 · The Legend — Frame 05A · The mark",
      heading: "Their ears curl inward until the tips touch.",
      body: "That is how you know the blood is pure. The lyre-shaped ears swivel 180° independently, tracking the rider's breathing and ambient shifts.",
      ctaLabel: "Read the full legend",
      ctaHref: "/legend",
      ambientTone: "#A9673F",
    },
  ];

  return (
    <section aria-label="The Legend in Five Frames" className="relative bg-[#08090B] border-b border-brass/20">
      <div className="gutter pt-16 pb-8">
        <GSAPScrollReveal variant="fade-up">
          <Label reel={1}>The Legend</Label>
        </GSAPScrollReveal>
      </div>

      <SplitSlider
        slides={slides}
        autoPlay={8000}
      />
    </section>
  );
}
