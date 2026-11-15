"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useState, type CSSProperties } from "react";
import { CrestMark } from "@/components/brand/CrestMark";
import { QrSeal } from "@/components/brand/QrSeal";
import { r } from "@/components/film/range";
import { asset } from "@/lib/content/asset";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import styles from "./PassportBook.module.css";

const SEALS = ["Squire", "Rider", "Knight", "Lancer"];

/**
 * The Sovereign Cadet Passport as a small 3D object (14 Nov 2026, owner's request: "a book model, animated in 3D").
 * CSS 3D only, no WebGL: a navy leather board with real thickness (spine, page block with a fore-edge, back board) whose cover is
 * hinged at the spine. Scroll tilts the closed book toward the reader, swings the cover open (its lining is the identity page) and
 * slides the open spread to the centre, then the brass seals are struck one by one on the right page. The cover follows the
 * owner's reference (navy leather, gold foil), with the academy's own crest in place of the reference's generic horse.
 * `open` renders the finished spread, still (reduced motion).
 */
export function PassportBook({ progress, open = false }: { progress: MotionValue<number>; open?: boolean }) {
  const cover = useTransform(progress, r(0.12, 0.52), open ? [-176, -176] : [0, -176]);
  const shift = useTransform(progress, r(0.12, 0.52), open ? ["50%", "50%"] : ["0%", "50%"]);
  const tiltX = useTransform(progress, r(0, 0.5), open ? [4, 4] : [24, 4]);
  const tiltY = useTransform(progress, r(0, 0.5), open ? [0, 0] : [-28, 0]);
  const lift = useTransform(progress, r(0, 0.2), open ? [0, 0] : [40, 0]);
  const shadow = useTransform(progress, r(0.12, 0.52), open ? [1, 1] : [0.5, 1]);
  const [stage, setStage] = useState(open ? 3 : 0);
  useMotionValueEvent(progress, "change", (v) => setStage(v < 0.58 ? 0 : v < 0.7 ? 1 : v < 0.82 ? 2 : 3));

  return (
    <div className={styles.stage}>
      <motion.div className={styles.book} style={{ rotateX: tiltX, rotateY: tiltY, y: lift, x: shift }}>
        <div aria-hidden className={styles.shadowPlane}>
          <motion.div className={styles.shadow} style={{ scaleX: shadow }} />
        </div>
        {/* back board, page block (fore-edge, head and tail), spine */}
        <div aria-hidden className={styles.back} />
        <div aria-hidden className={cn(styles.edge, styles.fore)} />
        <div aria-hidden className={cn(styles.edge, styles.head)} />
        <div aria-hidden className={cn(styles.edge, styles.tail)} />
        <div aria-hidden className={styles.spine} />

        {/* the first page under the cover: the seals */}
        <div className={cn("parchment", styles.page)}>
          <p className="label text-[#6b5130]" style={{ fontSize: "3.6cqw" }}>Seals</p>
          <ul className={styles.seals}>
            {SEALS.map((s, i) => (
              <li key={s}>
                <motion.span
                  className={cn(styles.seal, i < 3 ? styles.sealStruck : styles.sealEmpty)}
                  initial={false}
                  animate={{ scale: i < 3 ? (stage > i ? 1 : 1.35) : 1, opacity: i < 3 ? (stage > i ? 1 : 0) : 1 }}
                  transition={{ duration: 0.38, ease: ease.citadel }}
                >
                  {i < 3 && <CrestMark decorative className="h-[78%] w-[78%]" />}
                </motion.span>
                <span className="label" style={{ fontSize: "3cqw" }}>{s}</span>
              </li>
            ))}
          </ul>
          <div className={styles.pageFoot}>
            <p className="font-mono leading-relaxed text-[#3b2a12]" style={{ fontSize: "3.4cqw" }}>
              HOURS · 48
              <br />
              BSAH-2026-HYD-042
            </p>
            <QrSeal code="BSAH-2026-HYD-042" label="QR seal" className="w-[24cqw] text-[#3b2a12] [&_figcaption]:sr-only" />
          </div>
        </div>

        {/* the cover, hinged at the spine; its lining is the identity page */}
        <div className={styles.hinge}>
        <motion.div className={styles.cover} style={{ rotateY: cover }}>
          <div className={styles.front}>
            <span aria-hidden className={styles.border} />
            <p className={cn(styles.foil, styles.title)}>
              Sovereign Cadet
              <span>Passport</span>
            </p>
            <span
              aria-hidden
              className={styles.crest}
              style={{ "--crest": `url(${asset("/brand/bsah-stamp-mark.webp?v=2")})` } as CSSProperties}
            />
            <p className={cn(styles.foil, styles.council)}>
              School Tent Pegging Council
              <span>of India (STPCI)</span>
            </p>
            <span aria-hidden className={styles.rule}>
              <i />✦<i />
            </span>
            <p className={cn(styles.foil, styles.bsah)}>BSAH</p>
            <p className={cn(styles.foil, styles.record)}>Participant / Cadet record</p>
          </div>
          <div className={cn("parchment", styles.lining)}>
            <p className="label text-[#6b5130]" style={{ fontSize: "3.6cqw" }}>Identity</p>
            <p className="t-voice mt-[4cqw] text-ink" style={{ fontSize: "8cqw" }}>Cadet Alpha</p>
            <p className="t-ui mt-[1cqw] text-[#5a4526]" style={{ fontSize: "3.6cqw" }}>Zone 01A · Financial District Hub</p>
            <p className="font-mono mt-[8cqw] text-[#3b2a12]" style={{ fontSize: "3.8cqw" }}>BSAH-2026-HYD-042</p>
            <p className="t-ui mt-[1cqw] text-[#5a4526]" style={{ fontSize: "3.4cqw" }}>Sample record</p>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
