"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import * as THREE from "three";
import { Label } from "@/components/film/Marks";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import { ModelBoundary } from "@/components/three/ModelBoundary";

export const COVENANT_MODEL_URL = "/models/fleet-covenant-draco.glb";

/* ------------------------------------------------------------------
   1. Keyframes & Landmark Definitions
   Calibrated directly to the mesh landmark clusters:
   - Wide: full horse and boy in arena equilibrium
   - Horse Head: Marwari lyre-shaped ears, eye, and crest
   - Touch: horse nose/muzzle and boy's outstretched fingertips
   - Boy Head: cadet profile, determined expression, high uniform collar
   ------------------------------------------------------------------ */
interface Keyframe {
  progress: number;
  camPos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

const DESKTOP_KEYFRAMES: Keyframe[] = [
  // 0: Sky and dark horizon — camera looks upward into the quiet dawn sky
  { progress: 0.0, camPos: [0, 1.35, 2.2], target: [0, 1.35, 0], fov: 32 },
  // 1: Wide angle — camera swoops down into the arena to reveal horse and boy together
  { progress: 0.25, camPos: [-0.08, 0.05, 1.9], target: [-0.08, -0.02, 0], fov: 32 },
  // 2: Horse head — macro close up on arched neck, curled lyre ears, and dark noble eye
  { progress: 0.5, camPos: [0.03, 0.18, 0.55], target: [0.09, 0.16, 0], fov: 28 },
  // 3: The Touch — macro close up on horse nose/muzzle and cadet's fingertips meeting
  { progress: 0.74, camPos: [0.14, 0.11, 0.40], target: [0.18, 0.11, 0], fov: 26 },
  // 4: Boy's head — close up on the young cadet's profile, expression, and uniform collar
  { progress: 0.90, camPos: [0.38, 0.18, 0.50], target: [0.41, 0.17, 0], fov: 28 },
  // 5: Close down — smooth blackout into the footer
  { progress: 1.0, camPos: [0.38, 0.18, 0.54], target: [0.41, 0.17, 0], fov: 28 },
];

const MOBILE_KEYFRAMES: Keyframe[] = [
  // Mobile: Model is elevated into upper 55% of screen; text sits comfortably in lower 45%
  { progress: 0.0, camPos: [0, 1.45, 3.2], target: [0, 1.45, 0], fov: 34 },
  { progress: 0.25, camPos: [0.06, -0.16, 3.0], target: [0.06, -0.16, 0], fov: 34 },
  { progress: 0.5, camPos: [0.09, 0.04, 1.15], target: [0.09, 0.04, 0], fov: 28 },
  { progress: 0.74, camPos: [0.18, 0.02, 0.78], target: [0.18, 0.02, 0], fov: 26 },
  { progress: 0.90, camPos: [0.41, 0.05, 0.92], target: [0.41, 0.05, 0], fov: 28 },
  { progress: 1.0, camPos: [0.41, 0.05, 0.95], target: [0.41, 0.05, 0], fov: 28 },
];

function interpolateKeyframes(
  keyframes: Keyframe[],
  t: number
): { camPos: THREE.Vector3; target: THREE.Vector3; fov: number } {
  const clamped = Math.max(0, Math.min(1, t));

  let i = 0;
  while (i < keyframes.length - 1 && keyframes[i + 1].progress < clamped) {
    i++;
  }

  const k1 = keyframes[i];
  const k2 = keyframes[Math.min(i + 1, keyframes.length - 1)];

  const span = Math.max(0.0001, k2.progress - k1.progress);
  let localT = (clamped - k1.progress) / span;
  localT = Math.max(0, Math.min(1, localT));
  const smooth = localT * localT * (3 - 2 * localT);

  const camPos = new THREE.Vector3(
    k1.camPos[0] + (k2.camPos[0] - k1.camPos[0]) * smooth,
    k1.camPos[1] + (k2.camPos[1] - k1.camPos[1]) * smooth,
    k1.camPos[2] + (k2.camPos[2] - k1.camPos[2]) * smooth
  );

  const target = new THREE.Vector3(
    k1.target[0] + (k2.target[0] - k1.target[0]) * smooth,
    k1.target[1] + (k2.target[1] - k1.target[1]) * smooth,
    k1.target[2] + (k2.target[2] - k1.target[2]) * smooth
  );

  const fov = k1.fov + (k2.fov - k1.fov) * smooth;

  return { camPos, target, fov };
}

/* ------------------------------------------------------------------
   2. 3D Model Component
   ------------------------------------------------------------------ */
function CovenantModel({ scrollProgress }: { scrollProgress: number }) {
  const { scene } = useGLTF(COVENANT_MODEL_URL, "/draco/");
  const groupRef = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  // Normalize model center and enhance luxury PBR materials
  const centeredModel = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.roughness = 0.72;
          child.material.metalness = 0.16;
          child.material.envMapIntensity = 1.25;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.set(-center.x, -center.y, -center.z);

    const wrapper = new THREE.Group();
    wrapper.add(root);
    return wrapper;
  }, [scene]);

  // Subtle breathing motion for realistic presence
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const breath = reduced ? 0 : Math.sin(t * 0.8) * 0.0025;
    groupRef.current.position.y = breath;
  });

  return (
    <group ref={groupRef}>
      <primitive object={centeredModel} />
    </group>
  );
}

/* ------------------------------------------------------------------
   3. Floating Gold Particles / Arena Dust
   ------------------------------------------------------------------ */
function ArenaDust() {
  const points = useMemo(() => {
    const count = 55;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const seed = i * 0.618033;
      data[i * 3] = -1.8 + ((seed * 19.3) % 1) * 3.6;
      data[i * 3 + 1] = -0.8 + ((seed * 11.7) % 1) * 2.2;
      data[i * 3 + 2] = -1.0 + ((seed * 7.1) % 1) * 2.5;
    }
    return data;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.012;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#edc98d"
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------
   4. Smooth Cinematic Camera Rig with Inertia
   ------------------------------------------------------------------ */
function CinematicCameraRig({ scrollProgress }: { scrollProgress: number }) {
  const size = useThree((state) => state.size);
  const isMobile = size.width < 768;
  const keyframes = useMemo(() => (isMobile ? MOBILE_KEYFRAMES : DESKTOP_KEYFRAMES), [isMobile]);

  const currentCamPos = useRef(new THREE.Vector3(0, 1.35, isMobile ? 3.2 : 2.2));
  const currentTarget = useRef(new THREE.Vector3(0, 1.35, 0));

  // The camera comes from the frame state (not a hook return value) so React's compiler rules allow mutating it.
  useFrame(({ camera }) => {
    const { camPos, target, fov } = interpolateKeyframes(keyframes, scrollProgress);

    currentCamPos.current.lerp(camPos, 0.08);
    currentTarget.current.lerp(target, 0.08);

    camera.position.copy(currentCamPos.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 0.08);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(currentTarget.current);
  });

  return null;
}

/* ------------------------------------------------------------------
   5. Dynamic Touch Point Light
   ------------------------------------------------------------------ */
function DynamicLighting({ scrollProgress }: { scrollProgress: number }) {
  const touchLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!touchLightRef.current) return;
    const touchFactor = Math.max(0, 1 - Math.abs(scrollProgress - 0.74) * 6);
    touchLightRef.current.intensity = 0.5 + touchFactor * 2.5;
  });

  return (
    <>
      <ambientLight color="#bca791" intensity={1.25} />
      <directionalLight position={[-3, 4, 3]} color="#fff0db" intensity={3.5} castShadow />
      <directionalLight position={[3, 2, -2]} color="#e8c898" intensity={2.2} />
      <directionalLight position={[0, 3, -3]} color="#ffeedd" intensity={2.0} />
      <pointLight
        ref={touchLightRef}
        position={[0.18, 0.11, 0.3]}
        color="#ffd38a"
        intensity={0.5}
        distance={2.5}
      />
    </>
  );
}

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

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
          <Canvas
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ position: [0, 1.35, 2.2], fov: 32, near: 0.05, far: 50 }}
            style={{ touchAction: "pan-y" }}
          >
            <CinematicCameraRig scrollProgress={scrollProgress} />
            <DynamicLighting scrollProgress={scrollProgress} />
            <ArenaDust />
            <ModelBoundary>
              <Suspense fallback={null}>
                <CovenantModel scrollProgress={scrollProgress} />
              </Suspense>
            </ModelBoundary>
          </Canvas>
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
              <span className="font-mono text-[0.75rem] uppercase tracking-[0.3em] text-gold/90 block mb-3">
                PROLOGUE · THE DESERT DAWN
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-light leading-tight tracking-tight text-bone">
                <span className="block text-sand/90 font-serif italic text-xl sm:text-2xl md:text-3xl mb-1">
                  Before the command.
                </span>
                <span className="block text-gold font-normal">
                  The covenant.
                </span>
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-sand/80 max-w-lg mx-auto">
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
                    <div className="rounded-none border-l-2 border-gold/70 bg-[#080706]/85 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-gold font-semibold">
                          {scene.reelNumber}
                        </span>
                        <span className="h-px w-4 bg-gold/40" />
                        <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-sand/80">
                          {scene.badge}
                        </span>
                      </div>

                      <h2 className="mt-2.5 text-xl sm:text-2xl font-display font-light leading-tight tracking-tight text-bone">
                        <span className="block text-sand/80 font-serif italic text-sm sm:text-base">
                          {scene.titleInscription}
                        </span>
                        <span className="block text-gold font-normal">
                          {scene.titleVoice}
                        </span>
                      </h2>

                      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-sand/90 font-sans">
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
useGLTF.preload(COVENANT_MODEL_URL, "/draco/");
