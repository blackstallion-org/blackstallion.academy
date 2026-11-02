"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { Monogram } from "@/components/brand/Monogram";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";

/**
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

        {/* the envelope */}
        <div className="relative mx-auto w-full max-w-[34rem] pt-[30%] lg:pt-[26%]">
          <div className="relative aspect-[7/5] [perspective:1600px]">
            {/* back of the envelope */}
            <div aria-hidden className="absolute inset-0 rounded-[3px] bg-[linear-gradient(160deg,#5e1d19,#3d100d)] shadow-[0_30px_70px_rgb(0_0_0/0.45)]" />
            {/* the card */}
            <motion.div
              id="invite-card"
              aria-hidden={!open}
              className="absolute inset-x-[5%] top-[6%] bottom-[6%] flex flex-col items-center justify-center rounded-[2px] bg-[#f4eee3] px-[8%] text-center text-[#2a1a10] shadow-[0_6px_24px_rgb(0_0_0/0.25)]"
              initial={false}
              animate={{ y: open ? "-46%" : "0%", zIndex: open ? 3 : 1 }}
              transition={{ y: t(0.9, open ? 0.45 : 0), zIndex: { duration: 0, delay: reduced ? 0 : open ? 0.45 : 0.9 } }}
            >
              <Monogram className="h-7 w-7 text-[#8a5a2b]" />
              <p className="mt-3 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[#6b4a2e]">The Black Stallion Academy of Horsemanship</p>
              <p className="t-voice mt-3 text-[clamp(1.05rem,2.4vw,1.45rem)] leading-snug">requests the pleasure of presenting a riding campus to your school</p>
              <p className="mt-3 font-sans text-[0.58rem] uppercase tracking-[0.18em] text-[#6b4a2e]">A proposal · nothing is signed until your board agrees</p>
            </motion.div>
            {/* the folded body of the envelope: everything but the notch under the flap, so the card is hidden while sealed */}
            <div aria-hidden className="absolute inset-0 z-[2] rounded-[3px] bg-[linear-gradient(170deg,#6a221d,#4a1410)] [clip-path:polygon(0_0,50%_54%,100%_0,100%_100%,0_100%)]" />
            <div aria-hidden className="absolute inset-0 z-[2] [clip-path:polygon(0_0,50%_54%,100%_0,100%_0.8%,50%_55.2%,0_0.8%)] bg-[#2a0a08]/45" />
            {/* the flap: folds back on its top edge once the seal is lifted */}
            <motion.div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[66%] origin-top rounded-t-[3px] bg-[linear-gradient(180deg,#5a1b17,#6e2620)] [clip-path:polygon(0_0,100%_0,50%_100%)] [backface-visibility:hidden]"
              initial={false}
              animate={{ rotateX: open ? 180 : 0, zIndex: open ? 0 : 4 }}
              transition={{ rotateX: t(0.7, open ? 0.25 : 0.55), zIndex: { duration: 0, delay: reduced ? 0 : open ? 0.5 : 0.6 } }}
            />
            {/* the wax seal */}
            <motion.div
              aria-hidden
              className="absolute left-1/2 top-[66%] z-[5] grid h-[4.6rem] w-[4.6rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_38%_32%,#d9a95a,#a8732f_45%,#6d4618_100%)] shadow-[0_6px_14px_rgb(0_0_0/0.45),inset_0_-3px_6px_rgb(0_0_0/0.35),inset_0_2px_3px_rgb(255_240_200/0.35)]"
              initial={false}
              animate={open ? { scale: 1.06, y: -14, opacity: 0, rotate: -8 } : { scale: 1, y: 0, opacity: 1, rotate: 0 }}
              transition={t(0.4, open ? 0 : 0.8)}
            >
              <span className="grid h-[3.5rem] w-[3.5rem] place-items-center rounded-full border border-[#5a3a12]/50">
                <Monogram className="h-8 w-8 text-[#4f3210]" />
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
