"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { story } from "@/lib/content/home";
import type { MediaKey } from "@/lib/content/media";

const frames: { kicker: string; text: string; image: MediaKey }[] = [
  ...story.frames,
  { kicker: "The mark", text: story.closing, image: "legendEars" },
];

/** Sprocket holes along a strip of film. */
function Sprockets() {
  return (
    <div
      aria-hidden
      className="h-4 w-full"
      style={{
        backgroundColor: "rgb(42 29 18 / 0.85)",
        backgroundImage: "linear-gradient(90deg, transparent 0 7px, rgb(10 8 6) 7px 17px, transparent 17px 24px)",
        backgroundSize: "24px 7px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "0 50%",
      }}
    />
  );
}

/**
 * §2 Marwari story · S02 horizontal film strip.
 * Signature: frames travel sideways on sprocketed film while the frame counter ticks.
 */
export function StoryStrip() {
  return (
    <PinnedScene length={4.2} label="The legend in five frames" reducedFallback={<StoryStack />}>
      {(p) => <Strip progress={p} />}
    </PinnedScene>
  );
}

function Strip({ progress }: { progress: MotionValue<number> }) {
  const n = frames.length;
  const x = useTransform(progress, r(0.08, 0.95), ["0%", `-${((n - 1) / n) * 100}%`]);
  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    const i = Math.min(n - 1, Math.max(0, Math.round(((v - 0.08) / 0.87) * (n - 1))));
    setActive(i);
  });

  return (
    <div className="relative flex h-full flex-col justify-center gap-6 bg-night pt-16 md:gap-10">
      <div className="gutter flex items-end justify-between gap-6">
        <div>
          <Label reel={1}>The Legend</Label>
          <Headline className="mt-4" size="2" inscription={story.inscription} voice={story.voice} />
        </div>
        <p className="font-mono hidden text-sm text-dust md:block" aria-live="polite">
          FRAME <span className="text-gold">{String(active + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
        </p>
      </div>

      <div className="relative overflow-hidden">
        <motion.ol className="flex will-change-transform" style={{ x, width: `${n * 100}%` }}>
          {frames.map((f, i) => (
            <li key={f.kicker} className="relative" style={{ width: `${100 / n}%` }}>
              <div className="mx-[max(16px,4vw)] flex flex-col bg-ember/40 md:mx-[8vw]">
                <Sprockets />
                <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
                  <div className="relative aspect-[16/10] md:aspect-auto md:h-[52svh]">
                    <FilmImage name={f.image} sizes="(min-width: 768px) 55vw, 90vw" />
                    <span className="font-mono absolute left-3 top-3 text-[0.65rem] text-bone/70">
                      {String(i + 1).padStart(2, "0")}A
                    </span>
                  </div>
                  <div className="flex flex-col justify-end gap-3 p-5 md:p-10">
                    <p className="label text-brass">{f.kicker}</p>
                    <p
                      className={
                        i === n - 1
                          ? "t-voice text-[clamp(1.4rem,2.6vw,2.4rem)] leading-tight text-gold"
                          : "text-[clamp(1.05rem,1.5vw,1.35rem)] leading-relaxed text-sand"
                      }
                    >
                      {f.text}
                    </p>
                    {i === n - 1 && (
                      <div className="mt-4">
                        <Cta href="/legend" variant="solid">
                          Read the full legend
                        </Cta>
                      </div>
                    )}
                  </div>
                </div>
                <Sprockets />
              </div>
            </li>
          ))}
        </motion.ol>
      </div>

      <div className="gutter">
        <div className="flex gap-1.5" aria-hidden>
          {frames.map((f, i) => (
            <span key={f.kicker} className={`h-px flex-1 transition-colors duration-500 ${i <= active ? "bg-gold" : "bg-brass/20"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StoryStack() {
  return (
    <div className="gutter py-24">
      <Label reel={1}>The Legend</Label>
      <Headline className="mt-4" size="2" inscription={story.inscription} voice={story.voice} />
      <ol className="mt-12 grid gap-10 md:grid-cols-2">
        {frames.map((f) => (
          <li key={f.kicker}>
            <div className="relative aspect-[16/10]">
              <FilmImage name={f.image} sizes="(min-width: 768px) 45vw, 90vw" />
            </div>
            <p className="label mt-4 text-brass">{f.kicker}</p>
            <p className="mt-2 text-sand">{f.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10">
        <Cta href="/legend" variant="solid">
          Read the full legend
        </Cta>
      </div>
    </div>
  );
}
