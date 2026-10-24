"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ModelBoundary } from "@/components/three/ModelBoundary";

/**
 * The covenant's WebGL layer, split out of FleetCovenantScene so three.js, R3F, drei and the 5 MB model are only
 * fetched when the scene approaches the viewport (the model used to be preloaded the moment the page's JS ran).
 */
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

/** `active` pauses the render loop while the scene is offscreen. */
export function FleetCovenantCanvas({ scrollProgress, active }: { scrollProgress: number; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
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
  );
}

useGLTF.preload(COVENANT_MODEL_URL, "/draco/");
