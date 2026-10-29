"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ModelBoundary } from "@/components/three/ModelBoundary";
import { detectQualityTier } from "@/lib/3d/device-tier";
import { useReducedMotion } from "@/lib/motion/reduced";

/** Centres the model and scales it so its bounding sphere has radius 1, whatever size it was exported at. */
function FittedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, "/draco/");
  const fitted = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius || 1;
    root.position.sub(box.getCenter(new THREE.Vector3()));
    const wrapper = new THREE.Group();
    wrapper.add(root);
    wrapper.scale.setScalar(1 / radius);
    return wrapper;
  }, [scene]);
  return <primitive object={fitted} />;
}

/**
 * A staff-uploaded GLB on its own small stage: lit by plain lights (no environment map, which would be fetched from another
 * origin), draggable, slowly turning unless reduced motion is asked for. `active` pauses drawing while it is off screen.
 */
export function GalleryModelStage({ url, active }: { url: string; active: boolean }) {
  const reduced = useReducedMotion();
  const maxDpr = detectQualityTier() === "low" ? 1.5 : 2;
  return (
    <Canvas
      camera={{ position: [0, 0.25, 4.2], fov: 32, near: 0.1, far: 50 }}
      dpr={[1, Math.min(window.devicePixelRatio || 1, maxDpr)]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight args={["#fff3e0", "#2b2118", 1.3]} />
      <directionalLight position={[-4, 5, 4]} color="#fff0db" intensity={2.6} />
      <directionalLight position={[4, 2, -3]} color="#e8c898" intensity={1.6} />
      <ModelBoundary fallback={null}>
        <Suspense fallback={null}>
          <FittedModel url={url} />
        </Suspense>
      </ModelBoundary>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={!reduced} autoRotateSpeed={0.7} />
    </Canvas>
  );
}
