"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ease } from "@/lib/motion/tokens";

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
    image: "/images/equipment/traditional-saddle.webp",
    hex: "#844628",
    colorName: "Chestnut Leather",
    spec: "Studded cantle · fur-lined seat · brass hardware",
    detail: "Handcrafted Marwari cavalry saddle engineered with high cantle support for lance momentum and extended desert patrol.",
  },
  {
    id: "stirrup",
    name: "Stirrup Iron & Pad",
    category: "Equitation Hardware",
    image: "/images/equipment/english-stirrup.webp",
    hex: "#2b7da8",
    colorName: "Cadet Blue & Steel",
    spec: "Forged stainless iron · 12 cm tread · shock absorption pad",
    detail: "Precision-weighted irons with textured rubber tread for immediate release and ankle posture absorption at full gallop.",
  },
  {
    id: "halters",
    name: "Stable Halters & Bridle",
    category: "Tack Room Gear",
    image: "/images/equipment/stable-bridles.webp",
    hex: "#b87467",
    colorName: "Terracotta Webbing",
    spec: "Triple-ply reinforced canvas · cast-iron rings · brass snaps",
    detail: "Daily stable headstalls and lead lines stationed in the tack room for morning turnout, veterinary inspection, and grooming.",
  },
  {
    id: "horseshoe",
    name: "Hand-Forged Horseshoe",
    category: "Farrier & Ironwork",
    image: "/images/equipment/horseshoe-farrier.webp",
    hex: "#271c17",
    colorName: "Forged Iron Horn",
    spec: "Drop-forged steel · hot-fitted · balanced desert angle",
    detail: "Custom farrier fitting balancing the 50-degree desert hoof angle, protecting sensitive soles across limestone and arena gravel.",
  },
];

export function HorseEquipmentSection() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <section
      id="equipment"
      aria-labelledby="equipment-h"
      className="relative w-full border-t border-line/40 bg-night py-[clamp(5rem,12vh,10rem)] overflow-hidden"
    >
      <div className="gutter relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-line/30">
          <div>
            <Label>The Armoury · Tack &amp; Farrier</Label>
            <Headline
              id="equipment-h"
              className="mt-4"
              inscription="Horse shoes"
              voice="and equipment."
            />
          </div>
          <p className="max-w-md text-sm text-sand leading-relaxed">
            Every saddle, stirrup iron, halter and shoe is checked daily in the tack room. 
            Balanced weight, hand-forged steel, and tailored fit for both horse and rider.
          </p>
        </div>

        {/* 4-Card Luxury Grid matching reference image */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {EQUIPMENT_ITEMS.map((item, idx) => (
            <motion.div
              key={item.id}
              className="group flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: ease.citadel, delay: idx * 0.12 }}
            >
              {/* Card Image Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-line/40 bg-umber shadow-lg transition-all duration-500 group-hover:border-gold/60 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  quality={90}
                />
                {/* Subtle sheen highlight */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
              </div>

              {/* Color Swatch Bar (Matching reference image) */}
              <div
                className="mt-4 h-9 sm:h-11 w-full rounded-sm border border-black/10 shadow-inner transition-transform group-hover:scale-[1.02]"
                style={{ backgroundColor: item.hex }}
                aria-label={`Color swatch for ${item.name}: ${item.colorName}`}
              />

              {/* Hex Code (Matching reference image) */}
              <div className="mt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopy(item.hex)}
                  title="Click to copy hex code"
                  className="font-serif text-sm sm:text-base tracking-wide text-sand hover:text-gold transition-colors flex items-center gap-1.5"
                >
                  <span className="font-medium">{item.hex}</span>
                  {copiedHex === item.hex && (
                    <span className="font-mono text-[0.62rem] uppercase tracking-wider text-gold bg-black/70 px-1.5 py-0.5 rounded">
                      Copied
                    </span>
                  )}
                </button>
                <span className="font-mono text-[0.62rem] uppercase tracking-widest text-dust">
                  0{idx + 1}
                </span>
              </div>

              {/* Equipment Editorial Info */}
              <div className="mt-3 pt-3 border-t border-line/25 flex flex-col gap-1">
                <h3 className="t-voice text-lg sm:text-xl text-bone group-hover:text-gold transition-colors">
                  {item.name}
                </h3>
                <p className="font-mono text-[0.68rem] uppercase tracking-wider text-dust">
                  {item.spec}
                </p>
                <p className="mt-1 text-xs text-sand/85 leading-relaxed line-clamp-3">
                  {item.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ethereal Watermark matching reference image ("Hoof & Mane" / "Hoof & Tack") */}
        <div className="mt-20 pt-10 text-center pointer-events-none select-none">
          <p
            className="font-playfair text-[clamp(2.8rem,7vw,6.5rem)] italic font-light tracking-tight text-bone/[0.12] leading-none transition-colors"
            style={{
              fontFamily: 'var(--font-kalnia), var(--font-playfair), "Playfair Display", Georgia, serif',
            }}
          >
            Hoof <span className="font-serif font-normal not-italic text-gold/25">&amp;</span> Tack
          </p>
          <p className="font-mono text-[0.65rem] sm:text-[0.72rem] uppercase tracking-[0.35em] text-dust/60 mt-2">
            The Sovereign Armoury · Fitted by Hand
          </p>
        </div>
      </div>
    </section>
  );
}
