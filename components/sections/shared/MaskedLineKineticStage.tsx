"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useLenis } from "lenis/react";

export interface KineticBoxConfig {
  id: string;
  label: string;
  metric: string;
  description: string;
}

export interface MaskedLineKineticStageProps {
  id: string;
  label?: string;
  headline: string;
  caption?: string;
  boxes?: [KineticBoxConfig, KineticBoxConfig, KineticBoxConfig];
  tone?: "dark" | "light";
}

const DEFAULT_BOXES: [KineticBoxConfig, KineticBoxConfig, KineticBoxConfig] = [
  {
    id: "box1",
    label: "ROTATIONAL EQUILIBRIUM",
    metric: "-360° CORONA",
    description: "Centrifugal balance calibration under active rein tension.",
  },
  {
    id: "box2",
    label: "ELASTIC RECOIL SHIELD",
    metric: "45 KN DEFLECTION",
    description: "Shock attenuation curve absorbing arena turf impact.",
  },
  {
    id: "box3",
    label: "PRECISION HORIZON GYRO",
    metric: "+360° / 100 PX",
    description: "Multi-axis gyro alignment ensuring sovereign saddle poise.",
  },
];

export function MaskedLineKineticStage({
  id,
  label = "PROTOCOL TELEMETRY · REEL 10",
  headline,
  caption,
  boxes = DEFAULT_BOXES,
  tone = "dark",
}: MaskedLineKineticStageProps) {
  const containerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const splitRef = useRef<SplitText | null>(null);
  const textTweenRef = useRef<gsap.core.Tween | null>(null);
  const boxesTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const box1Ref = useRef<HTMLDivElement>(null);
  const box2Ref = useRef<HTMLDivElement>(null);
  const box3Ref = useRef<HTMLDivElement>(null);

  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const lenis = useLenis();

  useEffect(() => {
    const unsub = lenis?.on("scroll", ScrollTrigger.update);
    return () => unsub?.();
  }, [lenis]);

  // Function to replay the masked line animation
  const replayTextAnimation = useCallback((slow: boolean) => {
    const heading = headlineRef.current;
    if (!heading) return;

    setIsPlaying(true);
    setIsSlowMotion(slow);

    if (textTweenRef.current) {
      textTweenRef.current.kill();
    }

    if (splitRef.current) {
      splitRef.current.revert();
      splitRef.current = null;
    }

    splitRef.current = SplitText.create(heading, {
      type: "words,lines",
      linesClass: "masked-line-wrap",
      autoSplit: true,
      mask: "lines",
    });

    const lines = splitRef.current.lines;

    // Set lines visible
    gsap.set(heading, { opacity: 1 });
    gsap.set(lines, { overflow: "hidden", display: "block" });

    const tween = gsap.from(lines, {
      duration: slow ? 2.4 : 0.8,
      yPercent: 110,
      opacity: 0,
      stagger: slow ? 0.35 : 0.1,
      ease: slow ? "power1.out" : "expo.out",
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    textTweenRef.current = tween;
  }, []);

  // Setup SplitText & Sequenced Kinetic Boxes Timeline
  useEffect(() => {
    gsap.registerPlugin(SplitText, ScrollTrigger);

    const heading = headlineRef.current;
    const box1 = box1Ref.current;
    const box2 = box2Ref.current;
    const box3 = box3Ref.current;

    if (!heading || !box1 || !box2 || !box3) return;

    void document.fonts.ready.then(() => {
      replayTextAnimation(false);
    });

    // Sequenced Kinetic Shapes Timeline (one-after-the-other)
    const tl = gsap.timeline({
      delay: 1.2,
      repeat: -1,
      yoyo: true,
      defaults: { ease: "power2.inOut" },
    });

    tl.to(box1, {
      duration: 1.2,
      rotation: -360,
      ease: "power2.inOut",
    })
      .to(
        box2,
        {
          duration: 1.8,
          x: -80,
          ease: "elastic.out(1, 0.75)",
        },
        "+=0.2"
      )
      .to(
        box3,
        {
          duration: 1.8,
          rotation: 360,
          x: 80,
          ease: "expo.out",
        },
        "+=0.2"
      );

    boxesTimelineRef.current = tl;

    return () => {
      textTweenRef.current?.kill();
      splitRef.current?.revert();
      tl.kill();
    };
  }, [headline, replayTextAnimation]);

  const isDark = tone === "dark";

  return (
    <section
      id={id}
      ref={containerRef}
      aria-labelledby={`${id}-heading`}
      className={`relative overflow-hidden py-[clamp(6rem,13vh,11rem)] transition-colors ${
        isDark ? "bg-[#0e0d0c] text-[#f3ede2]" : "bg-[#f3ede2] text-[#201d1d]"
      }`}
    >
      {/* Background Subtle Noise & Vignette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(201, 166, 107, 0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="gutter relative mx-auto w-full max-w-5xl text-center">
        {/* Folio Label */}
        {label && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/35 bg-black/40 px-4 py-1 text-xs font-mono uppercase tracking-[0.22em] text-[#c9a66b] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c9a66b] animate-ping" aria-hidden="true" />
            {label}
          </div>
        )}

        {/* Masked Line Reveal Headline */}
        <div className="relative mx-auto max-w-4xl overflow-hidden py-2">
          <h2
            id={`${id}-heading`}
            ref={headlineRef}
            className={`font-playfair text-3xl sm:text-5xl md:text-6xl font-normal leading-[1.18] tracking-tight ${
              isDark ? "text-white" : "text-[#171513]"
            }`}
          >
            {headline}
          </h2>
        </div>

        {caption && (
          <p className="t-story mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#d4c3ad]/80">
            {caption}
          </p>
        )}

        {/* Interactive Controls Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => replayTextAnimation(false)}
            disabled={isPlaying}
            className="inline-flex items-center gap-2 rounded-full border border-[#c9a66b]/40 bg-black/50 px-5 py-2 text-xs font-mono uppercase tracking-widest text-[#c9a66b] hover:border-[#c9a66b] hover:bg-[#c9a66b]/15 transition-all backdrop-blur-sm disabled:opacity-50"
          >
            <span>Replay Reveal (1x)</span>
            <span aria-hidden="true">↺</span>
          </button>

          <button
            type="button"
            onClick={() => replayTextAnimation(true)}
            disabled={isPlaying}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-mono uppercase tracking-widest transition-all backdrop-blur-sm disabled:opacity-50 ${
              isSlowMotion
                ? "border-[#c9a66b] bg-[#c9a66b] text-[#0e0d0c] font-semibold shadow-lg shadow-[#c9a66b]/30"
                : "border-[#c9a66b]/40 bg-black/50 text-[#f3ede2] hover:border-[#c9a66b]"
            }`}
          >
            <span>Replay Slowly (0.25x)</span>
            <span aria-hidden="true">⏳</span>
          </button>
        </div>

        {/* Sequenced Kinetic Shapes Stage */}
        <div className="mt-16 sm:mt-24 border-t border-[#c9a66b]/20 pt-16">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#c9a66b] mb-10">
            SEQUENCED KINETIC TELEMETRY TRIAD · CONTINUOUS FLUX
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-center">
            {/* Box 1: Rotates -360 deg */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-[#c9a66b]/20 bg-[#171513]/60 backdrop-blur-sm">
              <div
                ref={box1Ref}
                className="box1 relative flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-[#c9a66b] bg-gradient-to-br from-[#c9a66b]/25 to-transparent shadow-xl shadow-black/60 will-change-transform"
              >
                <div className="h-16 w-16 rounded-full border border-[#c9a66b]/60 flex items-center justify-center">
                  <span className="font-mono text-xs text-[#c9a66b]">↺ -360°</span>
                </div>
                {/* 4 Corner tick marks */}
                <span className="absolute top-1 left-1 h-2 w-2 border-t-2 border-l-2 border-[#c9a66b]" />
                <span className="absolute top-1 right-1 h-2 w-2 border-t-2 border-r-2 border-[#c9a66b]" />
                <span className="absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-[#c9a66b]" />
                <span className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-[#c9a66b]" />
              </div>

              <span className="font-mono text-xs uppercase tracking-widest text-[#c9a66b] mt-5">
                {boxes[0].label}
              </span>
              <span className="font-serif text-lg text-white font-medium mt-1">
                {boxes[0].metric}
              </span>
              <p className="text-xs text-[#d4c3ad]/70 mt-2 max-w-xs leading-relaxed">
                {boxes[0].description}
              </p>
            </div>

            {/* Box 2: Translates x: -80px with elastic.out */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-[#c9a66b]/20 bg-[#171513]/60 backdrop-blur-sm overflow-hidden">
              <div
                ref={box2Ref}
                className="box2 relative flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-[#b87467] bg-gradient-to-br from-[#b87467]/25 to-transparent shadow-xl shadow-black/60 will-change-transform"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="h-1 w-10 bg-[#b87467] rounded-full animate-pulse" />
                  <span className="font-mono text-xs text-[#f3ede2]">⟵ ELASTIC</span>
                  <span className="h-1 w-10 bg-[#b87467] rounded-full animate-pulse" />
                </div>
                {/* Lateral Spring Indicator */}
                <span className="absolute inset-y-2 left-1.5 w-0.5 bg-[#b87467]/70" />
                <span className="absolute inset-y-2 right-1.5 w-0.5 bg-[#b87467]/70" />
              </div>

              <span className="font-mono text-xs uppercase tracking-widest text-[#b87467] mt-5">
                {boxes[1].label}
              </span>
              <span className="font-serif text-lg text-white font-medium mt-1">
                {boxes[1].metric}
              </span>
              <p className="text-xs text-[#d4c3ad]/70 mt-2 max-w-xs leading-relaxed">
                {boxes[1].description}
              </p>
            </div>

            {/* Box 3: Rotates 360 deg + Translates x: 80px with expo.out */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-[#c9a66b]/20 bg-[#171513]/60 backdrop-blur-sm overflow-hidden">
              <div
                ref={box3Ref}
                className="box3 relative flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-[#844628] bg-gradient-to-br from-[#844628]/35 to-transparent shadow-xl shadow-black/60 will-change-transform"
              >
                <div className="h-14 w-14 rotate-45 border border-[#c9a66b]/70 flex items-center justify-center">
                  <div className="h-3 w-3 bg-[#c9a66b] rounded-full" />
                </div>
                <span className="absolute bottom-2 font-mono text-[0.62rem] text-[#c9a66b]">
                  360° EXPO ⟶
                </span>
              </div>

              <span className="font-mono text-xs uppercase tracking-widest text-[#844628] mt-5">
                {boxes[2].label}
              </span>
              <span className="font-serif text-lg text-white font-medium mt-1">
                {boxes[2].metric}
              </span>
              <p className="text-xs text-[#d4c3ad]/70 mt-2 max-w-xs leading-relaxed">
                {boxes[2].description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
