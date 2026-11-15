import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import Image from "next/image";
import { asset } from "@/lib/content/asset";
import { cn } from "@/lib/utils";
import styles from "./GateBondScene.module.css";

/*
 * 15 Nov 2026 (owner): the 3D bay head is replaced by the curriculum's black Marwari and the cadet's offered hand (the same two
 * cutouts as /curriculum's BondHero), fitted to the gate's frame. Sizes and the fingertip gap are in GateBondScene.module.css.
 */
/**
 * /contact, the last encounter: a black Marwari and a cadet's offered hand, on the ground of the gate.
 */
export function GateBondScene() {
  return (
    <section
      aria-labelledby="gate-bond-h"
      data-parallax-skip
      className="tone-dark gate-bond-scene relative overflow-hidden border-t border-line/40 bg-night"
    >
      <div className="gutter relative grid items-center gap-8 py-[clamp(5rem,12vh,8rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="relative z-10 order-2 max-w-[24rem] lg:order-1 lg:max-w-[32rem]">
          <Label>Final corridor · Gate 01</Label>
          <Headline
            id="gate-bond-h"
            size="2"
            className="mt-4"
            inscription="Before the gate closes,"
            voice="the bond begins."
            voiceColor="gold"
          />
          <p className="t-story mt-4 max-w-[34ch] text-sand/90">
            Every cadet meets an assigned horse before the first lesson: an open hand, a pause, and the horse chooses to come
            the last few centimetres.
          </p>
        </div>
        <div className={cn("relative order-1 -mx-[max(16px,4vw)] sm:mx-0 lg:order-2", styles.frame)} role="img" aria-label="A black Marwari stallion's head in a jewelled bridle, and a cadet's open hand offered a short way from its muzzle">
          <span className={styles.glow} aria-hidden />
          <Image src={asset("/images/curriculum/marwari-black-head.webp")} alt="" width={602} height={879} sizes="(max-width: 1023px) 46vw, 26vw" className={styles.horse} />
          <Image src={asset("/images/curriculum/cadet-reaching-hand.webp")} alt="" width={2172} height={724} sizes="(max-width: 1023px) 50vw, 28vw" className={styles.hand} />
        </div>
      </div>
    </section>
  );
}
