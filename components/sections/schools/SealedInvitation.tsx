"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { CrestMark } from "@/components/brand/CrestMark";
import { ModelPlate } from "@/components/3d/ModelPlate";
import { asset } from "@/lib/content/asset";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";

/**
 * 4 Nov 2026: the envelope is the supplied 3D model (ModelPlate), swaying under the pointer; "Break the seal" now draws the card up
 * beneath it, since the model's flap does not open. The drawn envelope is the fallback.
 * R28/R29 (2 Nov 2026): the invitation to a school's board as one sealed card, after the owner's reference of a wax-sealed
 * envelope, without the hands and without turning the page red: the oxblood stays inside the envelope, the page keeps its own
 * ground. Replaces the 3D presentation box over a night-field photograph (TrojanBox). "Break the seal" lifts the seal, folds the
 * flap back and draws the card up; it closes again. Reduced motion: the same states without travel.
 */
export function SealedInvitation() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const t = (duration: number, delay = 0) => ({ duration: reduced ? 0 : duration, delay: reduced ? 0 : delay, ease: ease.citadel });

  return (
    <section aria-labelledby="invite-h" className="tone-dark relative overflow-hidden bg-night py-[clamp(6rem,14vh,11rem)]">
      <div className="gutter grid items-center gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="max-w-md">
          <Label>For a school&apos;s board</Label>
          <Headline id="invite-h" className="mt-5" inscription="An invitation," voice="under seal." />
          <p className="t-story mt-6 text-sand">
            Each proposal reaches a board as one sealed card: the corridor, the arena plan and the terms, signed by the academy.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button
              type="button"
              aria-pressed={open}
              aria-controls="invite-card"
              onClick={() => setOpen((o) => !o)}
              className="label min-h-11 border border-brass px-5 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {open ? "Seal it again" : "Break the seal"}
            </button>
            <Link href="/schools/access" className="label text-gold underline-offset-4 hover:underline">
              Request the campus blueprint →
            </Link>
          </div>
        </div>

        {/* the envelope: the supplied 3D model (4 Nov 2026), turned by hand; the drawn envelope stays underneath as its fallback */}
        <div className="mx-auto w-full max-w-[34rem]">
          <ModelPlate
            src={asset("/models/sealed-envelope.glb")}
            label="A burgundy envelope sealed with a gold wax seal bearing the Black Stallion emblem"
            mode="sway"
            fill={0.92}
            className="aspect-[7/5] w-full"
            fallback={<FlatEnvelope />}
          />
          {/* the card, drawn up when the seal is broken */}
          <motion.div
            id="invite-card"
            aria-hidden={!open}
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0, marginTop: open ? 20 : 0 }}
            transition={t(0.7)}
            className="overflow-hidden"
          >
            <div className="flex flex-col items-center rounded-[2px] bg-[#f4eee3] px-[8%] py-8 text-center text-[#2a1a10] shadow-[0_6px_24px_rgb(0_0_0/0.25)]">
              <CrestMark decorative className="h-9 w-9" />
              <p className="mt-3 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[#6b4a2e]">The Black Stallion Academy of Horsemanship</p>
              <p className="t-voice mt-3 text-[clamp(1.05rem,2.4vw,1.45rem)] leading-snug">requests the pleasure of presenting a riding campus to your school</p>
              <p className="mt-3 font-sans text-[0.58rem] uppercase tracking-[0.18em] text-[#6b4a2e]">A proposal · nothing is signed until your board agrees</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** The drawn envelope shown until the 3D one is ready, and when it cannot be drawn. */
function FlatEnvelope() {
  return (
    <div aria-hidden className="relative h-full w-full">
      <div className="absolute inset-0 rounded-[3px] bg-[linear-gradient(170deg,#6a221d,#4a1410)] shadow-[0_30px_70px_rgb(0_0_0/0.45)]" />
      <div className="absolute inset-0 [clip-path:polygon(0_0,50%_54%,100%_0,100%_0.8%,50%_55.2%,0_0.8%)] bg-[#2a0a08]/45" />
      <div className="absolute left-1/2 top-[54%] grid h-[4.6rem] w-[4.6rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_38%_32%,#d9a95a,#a8732f_45%,#6d4618_100%)] shadow-[0_6px_14px_rgb(0_0_0/0.45),inset_0_-3px_6px_rgb(0_0_0/0.35)]">
        <CrestMark decorative className="h-10 w-10" />
      </div>
    </div>
  );
}
