"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "motion/react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ease } from "@/lib/motion/tokens";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { asset } from "@/lib/content/asset";

/* ------------------------------------------------------------------
   1. Interactive 3D Composite Riding Gear Model (lazy: see RidingGearStage)
   ------------------------------------------------------------------ */
const RidingGearStage = dynamic(() => import("./RidingGearStage").then((mod) => mod.RidingGearStage), { ssr: false });

/* ------------------------------------------------------------------
   2. Specimen Data for the 4-Card Luxury Grid
   ------------------------------------------------------------------ */
interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  image: string;
  hex: string;
  colorName: string;
  spec: string;
  detail: string;
}

const EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    id: "saddle",
    name: "Cavalry Saddle",
    category: "Saddlery & Tack",
    image: asset("/images/equipment/traditional-saddle.webp"),
    hex: "#844628",
    colorName: "Chestnut Leather",
    spec: "Studded cantle · fur-lined seat · brass hardware",
    detail: "Handcrafted Marwari cavalry saddle engineered with high cantle support for desert endurance and riding equilibrium.",
  },
  {
    id: "stirrup",
    name: "Stirrup Iron & Pad",
    category: "Equitation Hardware",
    image: asset("/images/equipment/english-stirrup.webp"),
    hex: "#2b7da8",
    colorName: "Cadet Blue & Steel",
    spec: "Forged stainless iron · 12 cm tread · shock absorption pad",
    detail: "Precision-weighted irons with textured rubber tread for immediate release and ankle posture absorption at full gallop.",
  },
  {
    id: "halters",
    name: "Stable Halters & Bridle",
    category: "Tack Room Gear",
    image: asset("/images/equipment/stable-bridles.webp"),
    hex: "#b87467",
    colorName: "Terracotta Webbing",
    spec: "Triple-ply reinforced canvas · cast-iron rings · brass snaps",
    detail: "Reinforced stable headstalls and lead lines stationed in the tack room for morning turnout, inspection, and grooming.",
  },
  {
    id: "horseshoe",
    name: "Hand-Forged Horseshoe",
    category: "Farrier & Ironwork",
    image: asset("/images/equipment/horseshoe-farrier.webp"),
    hex: "#271c17",
    colorName: "Forged Iron Horn",
    spec: "Drop-forged steel · hot-fitted · balanced desert angle",
    detail: "Custom farrier fitting balancing the 50-degree desert hoof angle, protecting sensitive soles across arena gravel.",
  },
];

/* ------------------------------------------------------------------
   3. Main HorseEquipmentSection Component
   ------------------------------------------------------------------ */
export function HorseEquipmentSection() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  // The WebGL stage mounts one screen before it is reached and only renders while visible; the stage frame keeps its
  // size meanwhile. Its module (libraries + model download and decode) is fetched three screens ahead, so the model
  // is ready by the time the stage is seen.
  const stageRef = useRef<HTMLDivElement>(null);
  const stageNear = useNearViewport(stageRef);
  const stageOnScreen = useOnScreen(stageRef);
  const stageSoon = useNearViewport(stageRef, "300% 0px");
  useEffect(() => { if (stageSoon) void import("./RidingGearStage").catch(() => {}); }, [stageSoon]);

  const handleCopy = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <section
      id="equipment"
      aria-labelledby="equipment-h"
      className="tone-dark relative w-full border-t border-line/40 bg-[#0a0908] py-[clamp(4rem,10vh,8rem)] overflow-hidden text-white"
    >
      <div className="gutter relative z-10">
        {/* Section Header with Minimal, Clear Copy */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-line/30">
          <div>
            <Label>The Armoury · Tack &amp; Farrier</Label>
            <Headline
              id="equipment-h"
              className="mt-3"
              inscription="Horse shoes"
              voice="and equipment."
            />
          </div>
          <p className="max-w-md text-sm text-[#d4c3ad] font-light leading-relaxed">
            Checked daily in the tack room. Balanced weight, hand-forged steel, and tailored fit for both steed and rider.
          </p>
        </div>

        {/* 3D Interactive Riding Gear Stage */}
        <div ref={stageRef} className="mt-12 relative w-full h-[520px] sm:h-[600px] lg:h-[680px] rounded-lg border border-line/40 bg-[#100e0c] overflow-hidden shadow-2xl">
          {/* 3D WebGL Canvas */}
          <div className="absolute inset-0 z-0">
            {stageNear && <RidingGearStage active={stageOnScreen} />}
          </div>

          {/* Minimal Editorial Badges Over 3D Scene */}
          <div className="pointer-events-none absolute inset-x-0 top-0 p-6 flex flex-wrap items-center justify-between gap-4 z-10">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold border border-gold/30 px-3 py-1 rounded bg-black/60 backdrop-blur-sm">
              3D SPECIMEN · RIDING TACK
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[#a89584] bg-black/50 px-3 py-1 rounded border border-white/10">
              Drag to Rotate 360°
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-light text-[#f5efe6] tracking-tight">
                The Complete Cavalry Kit
              </h3>
              <p className="mt-1 text-xs text-[#c4b5a3] font-light max-w-[42ch]">
                Archival saddle, drop-forged stirrup irons, reinforced headstall, and riding boots fitted for desert endurance.
              </p>
            </div>
            <div className="font-mono text-[0.62rem] uppercase tracking-wider text-gold/80 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span>Full-Grain Leather · Solid Brass · Tempered Steel</span>
            </div>
          </div>
        </div>

        {/* 4-Card Luxury Grid */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {EQUIPMENT_ITEMS.map((item, idx) => (
            <motion.div
              key={item.id}
              className="group flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: ease.citadel, delay: idx * 0.1 }}
            >
              {/* Card Image Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-line/40 bg-[#161311] shadow-lg transition-all duration-500 group-hover:border-gold/60 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  quality={90}
                />
                {/* Subtle sheen highlight */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity"
                />
              </div>

              {/* Minimal Color Swatch Bar */}
              <div
                className="mt-3.5 h-8 sm:h-9 w-full rounded-sm border border-black/30 shadow-inner transition-transform group-hover:scale-[1.01]"
                style={{ backgroundColor: item.hex }}
                role="img"
                aria-label={`Color swatch for ${item.name}: ${item.colorName}`}
              />

              {/* Minimal Hex Code & Index */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopy(item.hex)}
                  title="Click to copy hex code"
                  className="font-mono text-xs text-[#d4c3ad] hover:text-gold transition-colors flex items-center gap-1.5 focus:outline-none"
                >
                  <span className="font-medium tracking-wide">{item.hex}</span>
                  {copiedHex === item.hex && (
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider text-gold bg-black/80 px-1.5 py-0.5 rounded border border-gold/30">
                      Copied
                    </span>
                  )}
                </button>
                <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[#8c7b6c]">
                  0{idx + 1}
                </span>
              </div>

              {/* Clear, Minimal Equipment Editorial Info */}
              <div className="mt-2.5 pt-2.5 border-t border-line/25 flex flex-col gap-1">
                <h3 className="font-serif text-lg sm:text-xl font-normal text-[#f5efe6] group-hover:text-gold transition-colors">
                  {item.name}
                </h3>
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-gold/80">
                  {item.spec}
                </p>
                <p className="mt-1 text-xs text-[#c4b5a3] font-light leading-relaxed line-clamp-3">
                  {item.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ethereal Watermark ("Hoof & Tack") */}
        <div className="mt-16 pt-8 text-center pointer-events-none select-none">
          <p
            className="font-playfair text-[clamp(2.5rem,6vw,5.5rem)] italic font-light tracking-tight text-[#f5efe6]/[0.08] leading-none transition-colors"
            style={{
              fontFamily: 'var(--font-display)',
            }}
          >
            Hoof <span className="font-serif font-normal not-italic text-gold/20">&amp;</span> Tack
          </p>
          <p className="font-mono text-[0.62rem] sm:text-[0.68rem] uppercase tracking-[0.3em] text-[#8c7b6c] mt-2">
            The Sovereign Armoury · Fitted by Hand
          </p>
        </div>
      </div>
    </section>
  );
}

