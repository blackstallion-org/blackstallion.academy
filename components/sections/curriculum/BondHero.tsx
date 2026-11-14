"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Label } from "@/components/film/Marks";
import { asset } from "@/lib/content/asset";
import { r } from "@/components/film/range";
import { useReducedMotion } from "@/lib/motion/reduced";
import styles from "./BondHero.module.css";

/**
 * Curriculum title (14 Nov 2026, owner): the black Marwari cropped to head and neck (marwari-black-head.webp, cut from the full
 * cutout to the owner's reference crop), attached flush to the left edge of the page, with the cadet's reaching hand, lit from
 * behind so the black coat reads. As the scene scrolls, hand and muzzle drift the last few centimetres toward each other and stop just short of touching:
 * the stillness before the command. Both layers also breathe on a slow loop. Reduced motion: the closing position, still.
 */
export default function BondHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const horseX = useTransform(scrollYProgress, r(0, 0.7), reduced ? ["0vw", "0vw"] : ["-1.5vw", "0vw"]);
  const handX = useTransform(scrollYProgress, r(0, 0.7), reduced ? ["0vw", "0vw"] : ["2.5vw", "0vw"]);
  const glow = useTransform(scrollYProgress, r(0, 0.7), reduced ? [1, 1] : [0.7, 1]);

  return (
    <section ref={ref} aria-label="A cadet approaches a black Marwari horse" data-parallax-skip className={styles.scene}>
      <div className={styles.stage} aria-hidden="true">
        <motion.span className={styles.glow} style={{ opacity: glow }} />
        <motion.div className={styles.horseWrap} style={{ x: horseX }}>
          <Image
            src={asset("/images/curriculum/marwari-black-head.webp")}
            alt=""
            width={602}
            height={879}
            priority
            sizes="(max-width: 767px) 76vw, 38vw"
            className={styles.horse}
          />
        </motion.div>
        <motion.div className={styles.handWrap} style={{ x: handX }}>
          <Image
            src={asset("/images/curriculum/cadet-reaching-hand.webp")}
            alt=""
            width={2172}
            height={724}
            sizes="(max-width: 767px) 66vw, 76vw"
            className={styles.hand}
          />
        </motion.div>
      </div>
      <div className={styles.copy}>
        <Label className="text-gold">Phase 01 · The Covenant</Label>
        <h2 className={styles.heading}>The stillness before the command.</h2>
        <p className={styles.description}>
          Every great partnership begins in silence. Before the saddle is cinched or the reins are gathered, the cadet learns the discipline of touch.
        </p>
      </div>
    </section>
  );
}
