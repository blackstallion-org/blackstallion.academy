"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ModelBoundary } from "@/components/three/ModelBoundary";

/**
 * The riding-gear WebGL stage, split out of HorseEquipmentSection so three.js, R3F, drei and the 5 MB model are only
 * fetched when the stage approaches the viewport (the model used to be preloaded the moment the page's JS ran).
 */
export const RIDING_GEAR_MODEL_URL = "/models/riding-gear-draco.glb";

/* ------------------------------------------------------------------
   1. Interactive 3D Composite Riding Gear Model Component
   ------------------------------------------------------------------ */
function RidingGearModel() {
  const { scene } = useGLTF(RIDING_GEAR_MODEL_URL, "/draco/");
  const groupRef = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  // Center model and enhance luxury leather & brass materials
  const centeredModel = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.roughness = 0.72;
          child.material.metalness = 0.18;
          child.material.envMapIntensity = 1.25;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(root);
    const boxCenter = box.getCenter(new THREE.Vector3());
    root.position.set(-boxCenter.x, -boxCenter.y, -boxCenter.z);

    const wrapper = new THREE.Group();
    wrapper.add(root);
    return wrapper;
  }, [scene]);

  // Subtle natural breathing float
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const floatY = reduced ? 0 : Math.sin(t * 0.9) * 0.015;
    groupRef.current.position.y = floatY;
  });

  return (
    <group ref={groupRef} scale={1.45}>
      <primitive object={centeredModel} />
    </group>
  );
}

/** `active` pauses the render loop while the stage is offscreen. Pixel ratio is capped at 1.5 on phones. */
export function RidingGearStage({ active }: { active: boolean }) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
  return (
    <Canvas
      camera={{ position: [0, 0.15, 2.6], fov: 32, near: 0.1, far: 50 }}
      dpr={[1, maxDpr]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "none" }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.15, 2.6]} fov={32} />

      {/* Three-Point Studio Lighting on Deep Black */}
      <ambientLight intensity={1.1} color="#fbf4ea" />
      <directionalLight position={[-4, 5, 4]} color="#fff0db" intensity={3.2} />
      <directionalLight position={[4, 2, -3]} color="#e8c898" intensity={2.2} />
      <directionalLight position={[0, -4, 3]} color="#334455" intensity={0.9} />
      <pointLight position={[0, 0.8, 1.2]} intensity={1.5} color="#ffd494" distance={4} />

      <ModelBoundary>
        <Suspense fallback={null}>
          <RidingGearModel />
        </Suspense>
      </ModelBoundary>

      {/* Intuitive 360° Drag Orbit Interaction */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}

useGLTF.preload(RIDING_GEAR_MODEL_URL, "/draco/");
