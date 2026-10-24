"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { HorseHandBond, BOND_MODEL_URL } from "@/components/3d/HorseHandBond";
import { useGLTF } from "@react-three/drei";
import { ModelBoundary } from "@/components/three/ModelBoundary";

function Dust() {
  const points = useMemo(() => {
    const data = new Float32Array(42 * 3);
    for (let index = 0; index < 42; index += 1) {
      const seed = index * 0.618;
      data[index * 3] = -1.5 + ((seed * 17.3) % 1) * 3.0;
      data[index * 3 + 1] = -1.2 + ((seed * 9.7) % 1) * 2.4;
      data[index * 3 + 2] = -0.7 + ((seed * 4.1) % 1) * 1.8;
    }
    return data;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.12) * 0.025;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#edc98d"
        size={0.024}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </points>
  );
}

function CinematicCamera() {
  const { size } = useThree();
  const mobile = size.width < 768;
  return (
    <PerspectiveCamera
      makeDefault
      fov={mobile ? 32 : 26}
      position={mobile ? [0, 0.02, 3.4] : [0, 0.02, 2.65]}
      near={0.1}
      far={50}
    />
  );
}

export function GateBondScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.05,
    });
    const section = sectionRef.current;
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="The final encounter between cadet and steed"
      data-parallax-skip
      className="tone-dark gate-bond-scene relative min-h-[100svh] overflow-hidden border-t border-line/40 bg-[#0e0a08]"
    >
      {/* Cinematic Studio Lighting Vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_85%_at_55%_50%,rgba(180,110,50,0.14),transparent_68%)]"
        aria-hidden
      />

      {/* 3D WebGL Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ fov: 26, position: [0, 0, 2.65], near: 0.1, far: 50 }}
          dpr={[1, 1.5]}
          frameloop={active ? "always" : "never"}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ touchAction: "pan-y" }}
        >
          <CinematicCamera />
          <ambientLight color="#b89368" intensity={0.8} />
          <directionalLight position={[-4, 5, 5]} color="#fde5c2" intensity={3.2} />
          <directionalLight position={[4, 3, -3]} color="#e3a054" intensity={2.2} />
          <directionalLight position={[1, -3, 3]} color="#f7be76" intensity={1.4} />

          <ModelBoundary>
            <Suspense fallback={null}>
              <HorseHandBond theme="dark" desktopOffsetX={0.42} scaleMultiplier={1.0} />
              <Dust />
            </Suspense>
          </ModelBoundary>
        </Canvas>
      </div>

      {/* Editorial Narrative Typography */}
      <div className="gutter pointer-events-none relative z-10 flex min-h-[100svh] flex-col justify-end pb-16 pt-24 md:justify-center md:pb-0 md:pt-0">
        <div className="max-w-[19rem] sm:max-w-[24rem] lg:max-w-[32rem]">
          <Label>Final Corridor · Gate 01</Label>
          <Headline
            id="gate-bond-h"
            size="2"
            className="mt-4"
            inscription="Before the gate closes,"
            voice="the bond begins."
            voiceColor="gold"
          />
          <p className="t-story mt-4 max-w-[32ch] text-sand/90">
            Every cadet who enters the academy meets their assigned partner in quiet stillness.
            A connection forged through trust, discipline, and four seconds of breath.
          </p>

          <div className="mt-6 flex items-center gap-3 font-mono text-[0.68rem] tracking-wider uppercase text-gold/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>4s Resonance Loop · Hand &amp; Steed</span>
          </div>
        </div>
      </div>

      {/* Subtle top/bottom edge gradient fades */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0e0a08] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0e0a08] to-transparent"
      />
    </section>
  );
}

useGLTF.preload(BOND_MODEL_URL, "/draco/");
