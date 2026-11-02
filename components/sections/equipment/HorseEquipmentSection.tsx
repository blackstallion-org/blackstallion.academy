"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { TextAnimate } from "@/components/motion/TextAnimate";
import { Label } from "@/components/film/Marks";
import { saveDataMode } from "@/lib/motion/save-data";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { FilmImage } from "@/components/film/FilmImage";

/* ------------------------------------------------------------------
   1. Interactive 3D Composite Riding Gear Model (lazy: see RidingGearStage)
   ------------------------------------------------------------------ */
const RidingGearStage = dynamic(() => import("./RidingGearStage").then((mod) => mod.RidingGearStage), { ssr: false });

/* ------------------------------------------------------------------
   2. Main HorseEquipmentSection Component
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

        {/* R24 (2 Nov 2026): the four product cards (saddle, stirrup iron, bridle, horseshoe) read like a shop window; the section
            now looks at the horse being saddled, and at what the horse says about the fit. */}
        <div className="mt-20 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-end">
          <figure className="relative aspect-[4/3] overflow-hidden">
            <FilmImage name="equipmentSaddling" sizes="(min-width: 1024px) 60vw, 100vw" grade="film" />
          </figure>
          <div className="max-w-md">
            <Label>Tack, read from the horse</Label>
            <p className="t-voice mt-4 text-3xl text-bone">The horse tells you if it fits.</p>
            <p className="t-story mt-4 text-sand">
              Before a cadet tacks up alone, a groom shows where the saddle sits behind the shoulder, how two fingers slide under the
              girth, and how the bridle lies without pinching. Then they watch the horse: a soft eye, a swinging tail and an even
              stride say the kit is right.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
