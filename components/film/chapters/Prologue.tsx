"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import { useState } from "react";
import { Chapter } from "../Chapter";
import { FilmImage, LOCAL_MEDIA } from "../FilmImage";
import { MaskLine } from "../MaskLine";
import { heroVideo, heroVideoRemote } from "@/lib/content/film";
import { r } from "../range";

const film = [0.7, 0, 0.2, 1] as const;

/** Opening titles. Signature moment: the letterbox closes to black as you leave. */
export function Prologue() {
  const reduced = useReducedMotion();
  const [video, setVideo] = useState<"loading" | "ok" | "missing">("loading");
  const [videoSrc, setVideoSrc] = useState(LOCAL_MEDIA ? heroVideo : heroVideoRemote);

  return (
    <Chapter id="prologue" label="Prologue" length={2.6}>
      {(p) => <PrologueFrame p={p} reduced={!!reduced} video={video} setVideo={setVideo} videoSrc={videoSrc} onVideoError={() => (videoSrc === heroVideo ? setVideoSrc(heroVideoRemote) : setVideo("missing"))} />}
    </Chapter>
  );
}

function PrologueFrame({
  p,
  reduced,
  video,
  setVideo,
  videoSrc,
  onVideoError,
}: {
  videoSrc: string;
  onVideoError: () => void;
  p: import("motion/react").MotionValue<number>;
  reduced: boolean;
  video: "loading" | "ok" | "missing";
  setVideo: (v: "loading" | "ok" | "missing") => void;
}) {
  const scale = useTransform(p, r(0, 1), [1.04, 1.3]);
  const imgY = useTransform(p, r(0, 1), ["0%", "-6%"]);
  const dustY = useTransform(p, r(0, 1), ["18%", "-22%"]);
  const dustOpacity = useTransform(p, r(0, 0.5, 1), [0.55, 0.9, 0.6]);
  const titleOpacity = useTransform(p, r(0, 0.28, 0.42), [1, 1, 0]);
  const titleScale = useTransform(p, r(0, 0.42), [1, 1.12]);
  const titleBlur = useTransform(p, r(0.2, 0.42), ["blur(0px)", "blur(10px)"]);
  const bar = useTransform(p, r(0, 0.75, 1), ["7svh", "12svh", "50.5svh"]);
  const cueOpacity = useTransform(p, r(0, 0.08), [1, 0]);

  return (
    <div className="relative h-full w-full bg-night">
      <FilmImage name="heroDust" priority scale={reduced ? 1.04 : scale} y={reduced ? "0%" : imgY} position="50% 60%" />
      {video !== "missing" && !reduced && (
        <motion.video
          className="absolute inset-0 h-full w-full object-cover"
          style={{ scale, y: imgY, opacity: video === "ok" ? 1 : 0, transition: "opacity 1.6s" }}
          key={videoSrc}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onCanPlay={() => setVideo("ok")}
          onError={onVideoError}
        />
      )}
      <FilmImage name="dustWall" blend="screen" y={reduced ? "0%" : dustY} opacity={dustOpacity} />
      <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-transparent to-night/90" />

      {/* Opening titles */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
        style={{ opacity: titleOpacity, scale: reduced ? 1 : titleScale, filter: reduced ? undefined : titleBlur }}
      >
        <motion.p
          className="label mb-8 text-sand/90 sm:mb-10"
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.28em" }}
          transition={{ duration: 2.4, ease: film, delay: 0.3 }}
        >
          Vicarius Infinitum Holdings presents
        </motion.p>
        <h1 className="font-display text-poster font-normal tracking-display text-bone opsz-display">
          <span className="block overflow-hidden pb-[0.06em]">
            <motion.span
              className="block"
              initial={{ y: "105%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.6, ease: film, delay: 0.6 }}
            >
              We do not teach
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <motion.span
              className="block italic text-sand"
              initial={{ y: "105%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.6, ease: film, delay: 0.78 }}
            >
              children to ride.
            </motion.span>
          </span>
        </h1>
      </motion.div>

      {/* Second title, revealed by scroll */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        <p className="font-display text-poster tracking-display text-bone opsz-display" aria-label="We forge them to lead.">
          <MaskLine progress={p} range={[0.38, 0.55]} exit={[0.74, 0.86]}>
            We forge them
          </MaskLine>
          <MaskLine progress={p} range={[0.44, 0.6]} exit={[0.76, 0.88]} className="italic text-gold">
            to lead.
          </MaskLine>
        </p>
      </div>

      {/* Bottom credits + scroll cue */}
      <motion.div className="absolute inset-x-0 bottom-[calc(7svh+1.5rem)] flex items-end justify-between px-5 sm:px-10" style={{ opacity: cueOpacity }}>
        <p className="label max-w-[34ch] text-[0.68rem] text-sand/80">
          The interscholastic equestrian leadership academy and national tent pegging circuit
        </p>
        <div className="hidden flex-col items-center gap-3 sm:flex">
          <span className="label text-[0.68rem] text-sand/80">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-sand/20">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-gold"
              animate={reduced ? undefined : { y: ["-100%", "200%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: film }}
            />
          </span>
        </div>
      </motion.div>

      {/* Letterbox: closes to black as the prologue ends */}
      <motion.div className="absolute inset-x-0 top-0 z-10 bg-night" style={{ height: bar }} />
      <motion.div className="absolute inset-x-0 bottom-0 z-10 bg-night" style={{ height: bar }} />
    </div>
  );
}
