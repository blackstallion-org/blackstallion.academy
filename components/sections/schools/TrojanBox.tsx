"use client";

import Link from "next/link";
import { AnimatePresence, animate, motion, useAnimationFrame, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Headline } from "@/components/film/Headline";
import { Reveal } from "@/components/film/Reveal";
import { Label } from "@/components/film/Marks";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import styles from "./TrojanBox.module.css";

const REST_TILT = -15; // degrees: the lid is seen from a little above
const OPEN_TILT = -36; // looking down into the open box
const LID_OPEN = 112; // degrees the lid swings back on its hinge
const SWAY_CENTRE = -30; // the idle sway turns the box a little either side of this
const SWAY_RANGE = 15;
const CLOSED_ZOOM = 0.84;
const OPEN_ZOOM = 0.88;

/** An angle wrapped into -180 to 180, for the slider. */
const wrap = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;

const CLOSED_LABEL = "A matte black presentation box with a leather sleeve and a brass seal, closed.";
const OPEN_LABEL = "The presentation box open: a bottle, a passport and a sealed invitation sit in foam cut-outs.";

/**
 * The Trojan presentation box, a design concept: a CSS 3D model (no WebGL, no downloads) that sways gently, turns when
 * dragged or swiped (and keeps a little momentum), and opens its lid on a hinge to show the proposed contents.
 * The slider and the button do the same for keyboard and screen-reader users. Reduced motion: no sway, no momentum,
 * and the lid changes state at once.
 */
export function TrojanBox() {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const inView = useInView(stageRef, { margin: "120px" });
  const inViewRef = useRef(false);
  const swaying = useRef(true);
  const [open, setOpen] = useState(false);

  const yaw = useMotionValue(SWAY_CENTRE);
  const tilt = useMotionValue(REST_TILT);
  const lid = useMotionValue(0);
  const shift = useMotionValue(0); // em: the box sinks a little while the lid stands up behind it
  const zoom = useMotionValue(CLOSED_ZOOM); // the camera: a little further back while closed, slightly closer once open
  const rigY = useTransform(shift, (value) => `${value}em`);
  const itemsZ = useTransform(lid, [10, 100], ["-1.5em", "0.15em"]); // the contents rise out of their cut-outs

  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  // Idle sway, only while the box is on screen and nobody has touched it.
  useAnimationFrame((time) => {
    if (reduced || !swaying.current || !inViewRef.current) return;
    yaw.set(SWAY_CENTRE + Math.sin(time / 2600) * SWAY_RANGE);
  });

  // Keep the slider in step with the box without re-rendering on every frame.
  useEffect(
    () =>
      yaw.on("change", (value) => {
        const input = rangeRef.current;
        if (input && document.activeElement !== input) input.value = String(Math.round(wrap(value)));
      }),
    [yaw],
  );

  const move = (duration: number) => (reduced ? { duration: 0 } : { duration, ease: ease.citadel });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    swaying.current = false;
    animate(lid, next ? LID_OPEN : 0, move(1.25));
    animate(tilt, next ? OPEN_TILT : REST_TILT, move(1.25));
    animate(shift, next ? 4 : 0, move(1.25));
    animate(zoom, next ? OPEN_ZOOM : CLOSED_ZOOM, move(1.25));
    if (next) animate(yaw, Math.round(yaw.get() / 360) * 360 - 14, move(1.25));
  };

  const drag = useRef<{ id: number; x: number; yaw: number; last: number; time: number; speed: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swaying.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, yaw: yaw.get(), last: event.clientX, time: performance.now(), speed: 0 };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (stage && !reduced) {
      const rect = stage.getBoundingClientRect();
      stage.style.setProperty("--lx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      stage.style.setProperty("--ly", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    }
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    yaw.set(d.yaw + (event.clientX - d.x) * 0.6);
    const now = performance.now();
    if (now > d.time) d.speed = (event.clientX - d.last) / (now - d.time); // px per ms
    d.last = event.clientX;
    d.time = now;
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    if (!reduced && Math.abs(d.speed) > 0.05) animate(yaw, yaw.get() + d.speed * 0.6 * 380, { duration: 1.6, ease: ease.citadel });
  };

  const onSlide = (value: number) => {
    swaying.current = false;
    yaw.set(Math.round(yaw.get() / 360) * 360 + value);
  };

  return (
    <section aria-labelledby="trojan-h" className={cn(styles.invitation, "tone-dark gutter")}>
      <div className={styles.copy}>
        <Label className="text-brass">BSAH · Sovereign invitation</Label>
        <Headline id="trojan-h" className="mt-5" inscription="The Sovereign" voice="invitation." />
        <div className={styles.rule} aria-hidden="true" />
        <div className={styles.words} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={open ? "open" : "closed"}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduced ? 0 : 0.5, ease: ease.citadel }}
            >
              <p className="t-story text-lede text-sand">
                {open
                  ? "A bottle, a passport and a sealed invitation, each set into its own cut-out."
                  : "Matte black, copper edges, a leather sleeve and a brass seal: the presentation introducing a campus to the academy."}
              </p>
              <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-dust">
                {open
                  ? "Proposed custom foam holds the 350 ml gift, the institutional passport and the invitation. The contents are a design specification pending approval."
                  : "Drag or swipe to turn the box, then open it to see the proposed contents. Interactive design concept: final dimensions and photography await approval."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className={styles.actions}>
          <button type="button" aria-pressed={open} onClick={toggle} className={styles.cta}>
            <span className={styles.line}>{open ? "Close the invitation" : "Open the invitation"}</span>
          </button>
          <AnimatePresence>
            {open ? (
              <motion.span
                initial={reduced ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.45, ease: ease.citadel, delay: reduced ? 0 : 0.5 }}
              >
                <Link href="/schools/access" className={cn(styles.line, styles.access)}>
                  Request sovereign access
                </Link>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <Reveal className={styles.panel}>
        <div className={styles.frame}>
          <div
            ref={stageRef}
            className={styles.stage}
            role="img"
            aria-label={open ? OPEN_LABEL : CLOSED_LABEL}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <span className={styles.light} aria-hidden="true" />
            <span className={styles.floorShadow} aria-hidden="true" />
            <div className={styles.scene} aria-hidden="true">
              <motion.div className={styles.rig} style={{ rotateX: tilt, rotateY: yaw, y: rigY, scale: zoom }}>
                {/* The body: open at the top, lined, with a foam floor and three cut-outs. */}
                <div className={cn(styles.cuboid, styles.body)}>
                  <div className={cn(styles.f, styles.front, styles.matte)} />
                  <div className={cn(styles.f, styles.back, styles.matte)} />
                  <div className={cn(styles.f, styles.left, styles.matte)} />
                  <div className={cn(styles.f, styles.right, styles.matte)} />
                  <div className={cn(styles.f, styles.bottom, styles.matte)} />
                  <div className={cn(styles.f, styles.inFront, styles.lining)} />
                  <div className={cn(styles.f, styles.inBack, styles.lining)} />
                  <div className={cn(styles.f, styles.inLeft, styles.lining)} />
                  <div className={cn(styles.f, styles.inRight, styles.lining)} />
                  <div className={cn(styles.f, styles.floor, styles.foam)}>
                    <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={{ z: itemsZ }}>
                      <div className={styles.cut} style={{ left: "12%", top: "6%", width: "74%", height: "27%" }}>
                        <div className={cn(styles.thing, styles.bottle)} />
                      </div>
                      <div className={styles.cut} style={{ left: "13%", top: "42%", width: "25%", height: "50%" }}>
                        <div className={cn(styles.thing, styles.passport)}>
                          <span className={styles.ring} />
                          <span className={styles.caps}>Passport</span>
                        </div>
                      </div>
                      <div className={styles.cut} style={{ left: "44%", top: "48%", width: "44%", height: "38%" }}>
                        <div className={cn(styles.thing, styles.envelope)} />
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* The leather sleeve: a band around the body, with the brass seal. */}
                <div className={cn(styles.cuboid, styles.sleeve)}>
                  <div className={cn(styles.f, styles.front, styles.leather, styles.sleeveFace)}>
                    <span className={styles.seal}>BSAH</span>
                    <span className={styles.caps}>Sovereign invitation</span>
                  </div>
                  <div className={cn(styles.f, styles.back, styles.leather, styles.sleeveFace)}>
                    <span className={styles.caps}>Dominus Sui</span>
                    <span className={styles.caps}>Dominus Equi</span>
                  </div>
                  <div className={cn(styles.f, styles.left, styles.leather, styles.sleeveFace)} />
                  <div className={cn(styles.f, styles.right, styles.leather, styles.sleeveFace)} />
                </div>

                {/* The lid, on a hinge along the back edge. */}
                <div className={styles.hingeMount}>
                  <motion.div className={styles.hinge} style={{ rotateX: lid }}>
                    <div className={cn(styles.cuboid, styles.lidBox)}>
                      <div className={cn(styles.f, styles.top, styles.matte, styles.lidTop)}>
                        <span className={styles.ring} />
                        <span className={styles.caps}>The Black Stallion Academy</span>
                      </div>
                      <div className={cn(styles.f, styles.front, styles.matte)} />
                      <div className={cn(styles.f, styles.back, styles.matte)} />
                      <div className={cn(styles.f, styles.left, styles.matte)} />
                      <div className={cn(styles.f, styles.right, styles.matte)} />
                      <div className={cn(styles.f, styles.inFront, styles.lining)} />
                      <div className={cn(styles.f, styles.inBack, styles.lining)} />
                      <div className={cn(styles.f, styles.inLeft, styles.lining)} />
                      <div className={cn(styles.f, styles.inRight, styles.lining)} />
                      <div className={cn(styles.f, styles.under, styles.leather, styles.lidEmblem)}>
                        <span className={styles.ring} />
                        <span className={styles.caps}>BSAH</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <label className={styles.turn}>
            <span className={styles.caption}>Turn</span>
            <input
              ref={rangeRef}
              type="range"
              min={-180}
              max={180}
              step={1}
              defaultValue={SWAY_CENTRE}
              aria-label="Turn the presentation box"
              onInput={(event) => onSlide(Number(event.currentTarget.value))}
            />
          </label>
          <span className={styles.caption} aria-hidden="true">
            Drag the box to turn it
          </span>
        </div>
      </Reveal>
    </section>
  );
}
