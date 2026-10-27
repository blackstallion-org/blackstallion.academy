"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Label } from "@/components/film/Marks";
import { HorseHandBond, BOND_MODEL_URL } from "@/components/3d/HorseHandBond";
import { useGLTF } from "@react-three/drei";
import { ModelBoundary } from "@/components/three/ModelBoundary";

function CurriculumCamera() {
  const { size } = useThree();
  const mobile = size.width < 768;
  const tablet = size.width >= 768 && size.width < 1024;

  const fov = mobile ? 32 : tablet ? 28 : 26;
  const camZ = mobile ? 2.5 : tablet ? 2.2 : 2.05;
  const camY = mobile ? 0.02 : 0.0;

  return (
    <PerspectiveCamera
      makeDefault
      fov={fov}
      position={[0, camY, camZ]}
      near={0.1}
      far={50}
    />
  );
}

export default function BondHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);

  // Suspend rendering outside viewport for 60fps performance
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.05,
    });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="A quiet approach between horse and hand"
      data-parallax-skip
      className="relative w-full overflow-hidden bg-[#f2ece1] select-none lg:h-[95svh] lg:min-h-[640px]"
    >
      {/* 3D WebGL canvas. Phones: a stage under the fixed nav (h-16) with the copy below it. Wide screens: from under the nav (h-20) to the foot of the section so the bar never covers the head. The
          sculpt is cut at the neck and at the sleeve; the mask fades those ends and the foot into the page colour. */}
      <div
        className="relative z-0 mt-16 h-[46svh] min-h-[300px] lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-20 lg:mt-0 lg:h-auto lg:min-h-0"
        style={{
          WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%), linear-gradient(180deg, #000 0, #000 95%, transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%), linear-gradient(180deg, #000 0, #000 95%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 2.05], fov: 26, near: 0.1, far: 50 }}
          dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 2)]}
          frameloop={active ? "always" : "never"}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          style={{ touchAction: "pan-y" }}
        >
          <color attach="background" args={["#f2ece1"]} />
          <CurriculumCamera />

          {/* Warm equestrian daylight studio lighting */}
          <ambientLight intensity={1.4} color="#fbf4ea" />
          <directionalLight position={[-4, 5, 4]} color="#fff0db" intensity={3.6} />
          <directionalLight position={[4, 2, -3]} color="#e8c898" intensity={2.5} />
          <directionalLight position={[0, -4, 3]} color="#ffffff" intensity={0.7} />

          <ModelBoundary>
            <Suspense fallback={null}>
              <HorseHandBond
                theme="light"
                desktopOffsetX={0.06}
                desktopOffsetY={0.01}
                scaleMultiplier={1.0}
              />
            </Suspense>
          </ModelBoundary>
        </Canvas>
      </div>

            {/* The whole head now shows, so on wide screens the copy sits in the clear space at the upper right, away from the head and the hand. */}
      <div className="gutter pointer-events-none relative z-10 pb-10 pt-3 lg:absolute lg:inset-0 lg:flex lg:flex-col lg:items-end lg:justify-start lg:pb-0 lg:pt-36">
        <div className="max-w-[19rem] sm:max-w-[22rem] lg:max-w-[22rem] xl:max-w-[25rem]">
          <Label className="text-[#a66b26]">Phase 01 · The Covenant</Label>
          <h2
            className="mt-2 font-serif text-2xl sm:text-3xl lg:text-[2.1rem] font-light text-[#231710] leading-[1.12] tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
            }}
          >
            The stillness before the command.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#4d3c33] font-normal leading-relaxed max-w-[34ch]">
            Every great partnership begins in silence. Before the saddle is cinched or the reins are gathered, the cadet learns the discipline of touch.
          </p>

          <div className="mt-3.5 flex items-center gap-2.5 font-mono text-[0.62rem] tracking-[0.2em] uppercase text-[#735849]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#a66b26]" />
            <span>Harmonious Physical Scale · Living Steed &amp; Cadet</span>
          </div>
        </div>
      </div>

      {/* Editorial subtle edge gradient fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#f2ece1] to-transparent opacity-40"
      />
    </section>
  );
}

useGLTF.preload(BOND_MODEL_URL, "/draco/");
