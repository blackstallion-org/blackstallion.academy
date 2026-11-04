"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { asset } from "@/lib/content/asset";

/** The navy ceremonial uniform on a mannequin (Higgsfield image-to-3D from the studio reference, 4 Nov 2026). */
export const UNIFORM_MODEL_URL = asset("/models/bsah-cadet-uniform.glb");

export type UniformControl = {
  /** Target rotation about the vertical axis, in radians. Written by the page's drag and arrow keys. */
  yaw: number;
  /** performance.now() until which the slow idle turn stays paused after the visitor lets go. */
  pausedUntil: number;
};

const HEIGHT = 2.2;

function UniformModel({ control, idleTurn, onReady }: { control: RefObject<UniformControl>; idleTurn: boolean; onReady: () => void }) {
  const { scene } = useGLTF(UNIFORM_MODEL_URL, "/draco/");
  const pivot = useRef<THREE.Group>(null);
  const idle = useRef(0);

  // Fit the model to a fixed height, stand it on the floor and centre it, so the pivot turns about its own spine.
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const s = HEIGHT / Math.max(size.y, 0.0001);
    return { s, position: new THREE.Vector3(-centre.x * s, -HEIGHT / 2 - box.min.y * s, -centre.z * s) };
  }, [scene]);

  useEffect(() => {
    // The generated texture bakes in flecks as full metal, which turns navy wool near-black and scratchy. Wool is not metal:
    // drop the metal map (the gold braid and buttons keep their colour) and let the roughness map do the work.
    scene.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const mesh = o as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.metalnessMap = null;
          m.metalness = 0.05;
          m.needsUpdate = true;
        }
      }
    });
    onReady();
  }, [scene, onReady]);

  useFrame((_, delta) => {
    const g = pivot.current;
    const c = control.current;
    if (!g || !c) return;
    // The slow idle turn is added on top of what the visitor has set, and stops while they are dragging or just let go.
    if (idleTurn && performance.now() > c.pausedUntil) idle.current += delta * 0.35;
    // Ease toward the target so a drag feels weighted, not twitchy.
    g.rotation.y += (c.yaw + idle.current - g.rotation.y) * Math.min(1, delta * 8);
  });

  return (
    <group ref={pivot}>
      <primitive object={scene} scale={fit.s} position={fit.position} />
    </group>
  );
}

export function UniformCanvas({ control, idleTurn, onReady }: { control: RefObject<UniformControl>; idleTurn: boolean; onReady: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // Draw only while the viewer is on screen and the tab is in front.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let visible = false;
    const sync = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ fov: 30, near: 0.1, far: 30, position: [0, 0.1, 5.6] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        className="block h-full w-full bg-transparent"
      >
        <hemisphereLight args={["#fff1d8", "#2a1d12", 0.9]} />
        <directionalLight position={[3, 4, 4]} intensity={2.4} color="#ffe2b8" />
        <directionalLight position={[-4, 2.5, -3]} intensity={1.4} color="#9fb4ff" />
        <directionalLight position={[-2, 1, 4]} intensity={0.7} color="#fff6e8" />
        <Suspense fallback={null}>
          <UniformModel control={control} idleTurn={idleTurn} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
