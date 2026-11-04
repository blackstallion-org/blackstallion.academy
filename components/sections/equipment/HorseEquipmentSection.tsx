"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { TextAnimate } from "@/components/motion/TextAnimate";
import { Label } from "@/components/film/Marks";
import { saveDataMode } from "@/lib/motion/save-data";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { asset } from "@/lib/content/asset";

/* ------------------------------------------------------------------
   1. Interactive 3D Composite Riding Gear Model (lazy: see RidingGearStage)
   ------------------------------------------------------------------ */
const RidingGearStage = dynamic(() => import("./RidingGearStage").then((mod) => mod.RidingGearStage), { ssr: false });

/* ------------------------------------------------------------------
   2. The four pieces, set as a numbered editorial row (30 Oct 2026: replaced the swatch cards with hex codes)
   ------------------------------------------------------------------ */
const EQUIPMENT_ITEMS = [
  {
    id: "saddle",
    name: "Cavalry saddle",
    category: "Saddlery",
    image: asset("/images/equipment/traditional-saddle.webp"),
    spec: "High cantle, fur-lined seat, brass hardware.",
    detail: "Built for desert endurance: the cantle holds the rider square at full gallop.",
  },
  {
    id: "stirrup",
    name: "Stirrup iron",
    category: "Hardware",
    image: asset("/images/equipment/english-stirrup.webp"),
    spec: "Forged stainless iron, 12 cm tread.",
    detail: "Weighted to hang true and release at once if a rider falls.",
  },
  {
    id: "halters",
    name: "Halter and bridle",
    category: "Tack room",
    image: asset("/images/equipment/stable-bridles.webp"),
    spec: "Triple-ply webbing, cast-iron rings.",
    detail: "Hung in the tack room for morning turnout, inspection and grooming.",
  },
  {
    id: "horseshoe",
    name: "Horseshoe",
    category: "Farrier",
    image: asset("/images/equipment/horseshoe-farrier.webp"),
    spec: "Drop-forged steel, hot-fitted.",
    detail: "Fitted by hand to each hoof and checked before every session.",
  },
];

/* ------------------------------------------------------------------
   3. Main HorseEquipmentSection Component
   ------------------------------------------------------------------ */
export function HorseEquipmentSection() {
  // The WebGL stage mounts one screen before it is reached and only renders while visible; the stage frame keeps its
  // size meanwhile. Its module (libraries + model download and decode) is fetched three screens ahead, so the model
  // is ready by the time the stage is seen.
  const stageRef = useRef<HTMLDivElement>(null);
  const stageNear = useNearViewport(stageRef);
  const stageOnScreen = useOnScreen(stageRef);
  const stageSoon = useNearViewport(stageRef, "300% 0px");
  // (Not for visitors with Data Saver or a 2G link: the stage still loads when it is actually reached.)
  useEffect(() => { if (stageSoon && !saveDataMode()) void import("./RidingGearStage").catch(() => {}); }, [stageSoon]);

  return (
    <section id="equipment" aria-labelledby="equipment-h" className="tone-dark relative w-full overflow-hidden bg-night py-[clamp(5rem,12vh,9rem)]">
      <div className="gutter relative">
        <div className="grid gap-8 border-b border-line pb-12 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Label>The armoury · Tack and farrier</Label>
            <h2 id="equipment-h" className="mt-5 text-bone">
              <TextAnimate as="span" animation="slideUp" className="t-inscribe block text-display-2">
                Horseshoes
              </TextAnimate>
              <TextAnimate as="span" animation="blurIn" delay={0.3} className="t-voice block text-display-2 text-gold">
                and the kit.
              </TextAnimate>
            </h2>
          </div>
          <p className="t-story max-w-sm text-lg italic text-sand">Checked every morning in the tack room, and fitted by hand to the horse and the rider.</p>
        </div>

        {/* The 3D stage: a plate, words below it, nothing laid over the model. */}
        <div ref={stageRef} className="plate relative mt-12 h-[460px] w-full overflow-hidden sm:h-[560px] lg:h-[640px]">
          <div className="absolute inset-0">{stageNear && <RidingGearStage active={stageOnScreen} />}</div>
        </div>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
          <p className="t-voice text-xl text-bone">The complete cavalry kit</p>
          <p className="label text-dust">Drag to turn · Leather, brass, steel</p>
        </div>

        {/* 01 – 04: numbered columns with hairlines, like a folio */}
        <ol className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {EQUIPMENT_ITEMS.map((item, idx) => (
            <li key={item.id} className="group border-t border-line pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-[clamp(2.4rem,4vw,3.4rem)] leading-none text-gold">{String(idx + 1).padStart(2, "0")}</span>
                <span className="label text-dust">{item.category}</span>
              </div>
              <div className="relative mt-6 aspect-[4/5] overflow-hidden bg-umber p-2">
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                  />
                </div>
              </div>
              <TextAnimate as="h3" animation="blurInUp" className="t-inscribe mt-6 text-2xl text-bone">
                {item.name}
              </TextAnimate>
              <p className="t-voice mt-2 text-lg text-gold">{item.spec}</p>
              <p className="t-story mt-3 text-sm leading-relaxed text-sand">{item.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
