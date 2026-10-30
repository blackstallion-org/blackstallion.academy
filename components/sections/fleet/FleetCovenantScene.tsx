"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { Label } from "@/components/film/Marks";
import { cn } from "@/lib/utils";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";

/* ------------------------------------------------------------------
   1–5. Keyframes, model, dust, camera rig and lighting live in FleetCovenantCanvas (loaded on approach).
   ------------------------------------------------------------------ */
const FleetCovenantCanvas = dynamic(() => import("./FleetCovenantCanvas").then((mod) => mod.FleetCovenantCanvas), { ssr: false });


/* ------------------------------------------------------------------
   6. Scene Story Descriptions
   ------------------------------------------------------------------ */
interface SceneData {
  id: string;
  reelNumber: string;
  badge: string;
  titleInscription: string;
  titleVoice: string;
  description: string;
  start: number;
  end: number;
}

const SCENES: SceneData[] = [
  {
    id: "sky-prologue",
    reelNumber: "PROLOGUE",
    badge: "THE DESERT DAWN",
    titleInscription: "Before the command.",
    titleVoice: "The covenant.",
    description:
      "Under the quiet sky of dawn, the bond begins not with reins, but with stillness. High above the sand, silence precedes the first step.",
    start: 0.0,
    end: 0.18,
  },
  {
    id: "wide-angle",
    reelNumber: "SCENE 01",
    badge: "EQUILIBRIUM",
    titleInscription: "Two wills meet.",
    titleVoice: "Stillness first.",
    description:
      "The cadet stands grounded. The Marwari stallion bows its crown. Before reins are taken, the measure of courage is taken eye to eye.",
    start: 0.19,
    end: 0.40,
  },
  {
    id: "horse-head",
    reelNumber: "SCENE 02",
    badge: "THE NOBLE CREST",
    titleInscription: "Royal Marwari bloodline.",
    titleVoice: "Unbroken spirit.",
    description:
      "Curled lyre ears locked forward, breath misting in the cold morning air. Centuries of battlefield loyalty carved into sinew and bone.",
    start: 0.41,
    end: 0.63,
  },
  {
    id: "touch-screen",
    reelNumber: "SCENE 03",
    badge: "THE TOUCH",
    titleInscription: "Where command dissolves.",
    titleVoice: "A touch on velvet.",
    description:
      "A single touch upon warm velvet. The bit relaxes. The stallion yields its breath not to physical force, but to absolute stillness.",
    start: 0.64,
    end: 0.83,
  },
  {
    id: "boy-head",
    reelNumber: "SCENE 04",
    badge: "TRANSFIGURATION",
    titleInscription: "A rider is not born.",
    titleVoice: "Forged in silence.",
    description:
      "Pride without arrogance. Sovereignty without fear. The young cadet steps forward—no longer separate from the stallion, but one.",
    start: 0.84,
    end: 0.95,
  },
];

/* ------------------------------------------------------------------
   7. Main FleetCovenantScene Component
   ------------------------------------------------------------------ */
export function FleetCovenantScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  // The WebGL layer mounts one screen before the section is reached and renders only while it is on screen. Its module
  // (libraries + model download and decode) is fetched three screens ahead, so the model is ready when it is seen.
  const canvasNear = useNearViewport(containerRef);
  const canvasOnScreen = useOnScreen(containerRef);
  const canvasSoon = useNearViewport(containerRef, "300% 0px");
  useEffect(() => { if (canvasSoon) void import("./FleetCovenantCanvas").catch(() => {}); }, [canvasSoon]);
  // Start on the stallion study so the 3D model is present immediately at the top of the Fleet page.
  const [scrollProgress, setScrollProgress] = useState(0.41);
  const [activeSceneIndex, setActiveSceneIndex] = useState(2);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrollProgress(latest);
    const idx = SCENES.findIndex((s) => latest >= s.start && latest <= s.end);
    if (idx !== -1) setActiveSceneIndex(idx);
    else if (latest > 0.94) setActiveSceneIndex(SCENES.length - 1);
  });

  // Sky gradient fades down as user leaves top screen
  const skyOpacity = useTransform(scrollYProgress, [0, 0.18], [0.95, 0]);
  // Smooth curtain close-down into deep black before footer (from 0.95 to 1.0)
  const closeDownOpacity = useTransform(scrollYProgress, [0.95, 1.0], [0, 1]);

  const scrollToScene = (index: number) => {
    if (!containerRef.current) return;
    const scene = SCENES[index];
    const targetProgress = (scene.start + scene.end) / 2;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top + targetProgress * (rect.height - window.innerHeight);
    window.scrollTo({ top: scrollTop, behavior: "smooth" });
  };

  return (
    <section
      ref={containerRef}
      id="covenant"
      aria-label="The Covenant: Cinematic 3D encounter between cadet and stallion"
      className="relative w-full h-[500vh] bg-[#080706] text-white"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#080706]">
        {/* Atmospheric Dawn Sky Gradient Overlay (Screen 0) */}
        <motion.div
          style={{ opacity: skyOpacity }}
          className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-gradient-to-b from-[#251910]/90 via-[#18100a]/60 to-transparent z-[2]"
          aria-hidden
        />

        {/* Cinematic Vignette */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(8,7,6,0.85)_85%,#080706_100%)] z-[3]"
          aria-hidden
        />

        {/* 3D WebGL Canvas (Always full viewport without dynamic resize jumps) */}
        <div className="absolute inset-0 z-[1]">
          {canvasNear && <FleetCovenantCanvas scrollProgress={scrollProgress} active={canvasOnScreen} />}
        </div>

        {/* Content Overlays: Adheres strictly to AGENTS.md Safe Zone (pt-24 md:pt-28) */}
        <div className="gutter relative z-10 flex h-full flex-col justify-between pt-24 md:pt-28 pb-6 md:pb-10 pointer-events-none">
          {/* Top Editorial Label Bar (Clear of SiteNav) */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-gold animate-pulse" />
              <Label className="font-mono text-xs uppercase tracking-[0.25em] text-gold/90">
                BSAH · THE COVENANT
              </Label>
            </div>
            <span className="font-mono text-xs tracking-widest text-dust/80 uppercase hidden sm:inline">
              Scroll Driven Sequence
            </span>
          </div>

          {/* Scene 0: Sky & Prologue Centered Header */}
          {activeSceneIndex === 0 && (
            <div className="pointer-events-auto mx-auto max-w-2xl text-center my-auto transition-opacity duration-700">
              <span className="font-mono text-[0.75rem] uppercase tracking-[0.3em] text-[#e8c47c] block mb-3">
                PROLOGUE · THE DESERT DAWN
              </span>
              <h2 className="rounded-sm bg-black/50 px-5 py-4 text-3xl font-display font-light leading-tight tracking-tight text-[#f6efe5] backdrop-blur-sm sm:text-4xl md:text-5xl">
                <span className="block font-serif text-xl italic text-[#f6efe5]/90 sm:text-2xl md:text-3xl mb-1">
                  Before the command.
                </span>
                <span className="block text-[#e8c47c] font-normal">
                  The covenant.
                </span>
              </h2>
              <p className="mt-4 rounded-sm bg-black/50 px-5 py-3 text-sm leading-relaxed text-[#f6efe5]/90 backdrop-blur-sm sm:text-base max-w-lg mx-auto">
                Under the quiet sky of dawn, the bond begins not with reins, but with stillness. High above the sand, silence precedes the first step.
              </p>
              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-gold/70 animate-bounce">
                <span>Scroll down to enter the arena</span>
                <span>↓</span>
              </div>
            </div>
          )}

          {/* Scenes 1 through 4:
              Desktop: Slim panel (max-w-[320px] md:max-w-[340px]) aligned to left margin, leaving right 75% free.
              Mobile: Positioned at bottom (mt-auto mb-14), leaving upper 55% model completely visible.
              Guarantees ZERO overlap! */}
          {activeSceneIndex > 0 && (
            <div className="relative w-full max-w-[330px] lg:max-w-[340px] self-start pointer-events-auto mt-auto mb-14 lg:my-auto">
              {SCENES.slice(1).map((scene, idx) => {
                const sceneIdx = idx + 1;
                const isVisible = activeSceneIndex === sceneIdx;
                return (
                  <div
                    key={scene.id}
                    className={cn(
                      "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      isVisible
                        ? "opacity-100 translate-y-0 relative pointer-events-auto"
                        : "opacity-0 translate-y-6 absolute inset-0 pointer-events-none"
                    )}
                  >
                    <div className="rounded-none border-l-2 border-[#e8c47c] bg-black/90 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#e8c47c] font-semibold">
                          {scene.reelNumber}
                        </span>
                        <span className="h-px w-4 bg-gold/40" />
                        <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#f6efe5]/80">
                          {scene.badge}
                        </span>
                      </div>

                      <h2 className="mt-2.5 text-xl sm:text-2xl font-display font-light leading-tight tracking-tight text-[#f6efe5]">
                        <span className="block text-[#f6efe5]/85 font-serif italic text-sm sm:text-base">
                          {scene.titleInscription}
                        </span>
                        <span className="block text-[#e8c47c] font-normal">
                          {scene.titleVoice}
                        </span>
                      </h2>

                      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#f6efe5]/90 font-sans">
                        {scene.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Interactive HUD & Chapter Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto border-t border-line/30 pt-3">
            {/* Chapter Step Indicators */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {SCENES.map((scene, idx) => {
                const isActive = activeSceneIndex === idx;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => scrollToScene(idx)}
                    className={cn(
                      "px-2.5 py-1 text-[0.65rem] sm:text-xs font-mono uppercase tracking-wider transition-all duration-300 border",
                      isActive
                        ? "border-gold bg-gold/15 text-gold shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                        : "border-line/40 text-dust hover:border-gold/40 hover:text-bone"
                    )}
                  >
                    0{idx + 1} {scene.badge.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {/* Scroll Progress Bar */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="font-mono text-[0.7rem] text-dust">
                {Math.round(scrollProgress * 100)}%
              </span>
              <div className="h-1 w-28 sm:w-36 bg-line/30 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gold transition-all duration-150"
                  style={{ width: `${Math.min(100, scrollProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Close Down Curtain: Fades smoothly to deep black (#080706) leading to footer */}
        <motion.div
          style={{ opacity: closeDownOpacity }}
          className="pointer-events-none absolute inset-0 bg-[#080706] z-[20]"
          aria-hidden
        />
      </div>
    </section>
  );
}

// Preload the compressed Draco model
