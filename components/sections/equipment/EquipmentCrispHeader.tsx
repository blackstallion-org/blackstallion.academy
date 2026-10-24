"use client";

import { CrispHeaderSlideshow, type CrispSlide } from "@/components/sections/shared/CrispHeaderSlideshow";
import { asset } from "@/lib/content/asset";

const EQUIPMENT_SLIDES: CrispSlide[] = [
  {
    id: "traditional-saddle",
    title: "Cavalry Saddle",
    category: "Saddlery & Tack",
    image: asset("/images/equipment/traditional-saddle.webp"),
    badge: "CANVAS & HIDE",
    spec: "Studded cantle · fur-lined seat · brass hardware",
    detail: "Handcrafted Marwari cavalry saddle engineered with high cantle support for lance momentum and extended desert patrol.",
  },
  {
    id: "english-stirrup",
    title: "Stirrup Iron & Pad",
    category: "Equitation Hardware",
    image: asset("/images/equipment/english-stirrup.webp"),
    badge: "STAINLESS STEEL",
    spec: "Forged stainless iron · 12 cm tread · shock absorption pad",
    detail: "Precision-weighted irons with textured rubber tread for immediate release and ankle posture absorption at full gallop.",
  },
  {
    id: "stable-bridles",
    title: "Stable Halters & Bridle",
    category: "Tack Room Gear",
    image: asset("/images/equipment/stable-bridles.webp"),
    badge: "REINFORCED",
    spec: "Triple-ply reinforced canvas · cast-iron rings · brass snaps",
    detail: "Daily stable headstalls and lead lines stationed in the tack room for morning turnout, veterinary inspection, and grooming.",
  },
  {
    id: "horseshoe-farrier",
    title: "Hand-Forged Horseshoe",
    category: "Farrier & Ironwork",
    image: asset("/images/equipment/horseshoe-farrier.webp"),
    badge: "HOT-FITTED",
    spec: "Drop-forged steel · hot-fitted · balanced desert angle",
    detail: "Custom farrier fitting balancing the 50-degree desert hoof angle, protecting sensitive soles across limestone and arena gravel.",
  },
  {
    id: "sovereign-charger",
    title: "Sovereign Charger Mount",
    category: "Cavalry Lineage",
    image: asset("/images/fleet/fleet-chetak.webp"),
    badge: "15.2 HANDS",
    spec: "Purebred Marwari · Inward lyre ears · Battleline composure",
    detail: "The living instrument that wears the steel and saddle. Microchipped, vet-checked daily and bred for sovereign equilibrium.",
  },
];

export function EquipmentCrispHeader() {
  return (
    <CrispHeaderSlideshow
      id="equipment-crisp-header"
      label="REEL 02B · THE ARMOURY & TACK"
      headlineInscription="The Sovereign"
      headlineVoice="Armoury & Tack."
      tagline="HAND-FORGED SADDLERY · ARCHIVAL TACK · DESERT SPECS"
      slides={EQUIPMENT_SLIDES}
      replayEnabled={true}
    />
  );
}
