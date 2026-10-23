"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";

export const STATUE_MODEL_URL = "/models/horse-statue-monument.glb";

// Preload the model asset
useGLTF.preload(STATUE_MODEL_URL, "/draco/");

interface StatueModelProps {
  statueX: number;
}

function StatueModel({ statueX }: StatueModelProps) {
  const { scene } = useGLTF(STATUE_MODEL_URL, "/draco/");

  const processedScene = useMemo(() => {
    // Clone to ensure clean instance
    const clone = scene.clone(true);

    // Calculate bounding box in world coordinates
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const min = box.min;

    // Normalize height to exactly 3.0 units (Statue standard)
    const rawHeight = Math.max(size.y, 0.001);
    const scale = 3.0 / rawHeight;
    clone.scale.setScalar(scale);

    // Center X & Z, and place base cleanly at Y = 0
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x = -center.x * scale;
    clone.position.y = -min.y * scale;
    clone.position.z = -center.z * scale;

    // Optimize materials for chiaroscuro bronze/stone response with rich specular glow
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          // If multi-material or single material
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if ("roughness" in mat) {
              const stdMat = mat as THREE.MeshStandardMaterial;
              stdMat.roughness = Math.min(Math.max(stdMat.roughness ?? 0.45, 0.38), 0.65);
              stdMat.metalness = Math.min(Math.max(stdMat.metalness ?? 0.3, 0.22), 0.52);
              stdMat.envMapIntensity = 1.15;
              stdMat.needsUpdate = true;
            }
          });
        }
      }
    });

    const rootGroup = new THREE.Group();
    rootGroup.position.set(statueX, 0, 0);
    rootGroup.add(clone);
    return rootGroup;
  }, [scene, statueX]);

  return <primitive object={processedScene} />;
}



interface StudioLightingProps {
  statueX: number;
  scrollProgressRef: React.MutableRefObject<number>;
}

function StudioLighting({ statueX, scrollProgressRef }: StudioLightingProps) {
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const bounceLightRef = useRef<THREE.PointLight>(null);
  const rearLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const p = Math.max(0, Math.min(1, scrollProgressRef.current));
    const baseP = Math.min(1, p / 0.72);

    // Rim light: shifts vertically to sculpt crown at top and full silhouette at base
    if (rimLightRef.current) {
      rimLightRef.current.position.y = THREE.MathUtils.lerp(4.8, 3.2, baseP);
      rimLightRef.current.intensity = THREE.MathUtils.lerp(3.6, 2.9, baseP);
    }

    // Key light: illuminates cheek/bridle, rider, torso, and plinth
    if (keyLightRef.current) {
      keyLightRef.current.position.y = THREE.MathUtils.lerp(3.2, 1.8, baseP);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(1.3, 1.6, baseP);
    }

    // Golden bounce: rises to illuminate the stone plinth and base in Ch 4 and 5
    if (bounceLightRef.current) {
      bounceLightRef.current.intensity = THREE.MathUtils.lerp(0.8, 1.45, baseP);
      bounceLightRef.current.position.y = THREE.MathUtils.lerp(-0.5, 0.35, baseP);
    }

    // Dedicated rear sculpt light for Section 06 orbit (illuminates rear haunches & spine)
    if (rearLightRef.current) {
      if (p > 0.7) {
        const u = (p - 0.7) / 0.3;
        const rearFactor = Math.sin(Math.PI * u); // 0 at front, 1 at rear
        rearLightRef.current.intensity = 0.6 + rearFactor * 3.2;
      } else {
        rearLightRef.current.intensity = 0.6;
      }
    }
  });

  return (
    <>
      <ambientLight color="#181512" intensity={0.4} />
      <directionalLight
        ref={rimLightRef}
        position={[statueX - 2.8, 4.8, -2.8]}
        color="#FDF6E2"
        intensity={3.6}
      />
      <directionalLight
        ref={keyLightRef}
        position={[statueX + 3.2, 3.2, 3.2]}
        color="#FFF3DB"
        intensity={1.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight
        ref={rearLightRef}
        position={[statueX + 1.8, 3.4, -3.8]}
        color="#FFE8BC"
        intensity={0.6}
      />
      <pointLight
        ref={bounceLightRef}
        position={[statueX, -0.4, 2.2]}
        color="#C5A059"
        intensity={1.1}
        distance={8}
      />
    </>
  );
}

/**
 * 3D Soft Museum Halo Disc placed physically behind the statue in scene space.
 * Features a soft feathered radial gradient with zero sharp outlines,
 * gently illuminating the bronze monument silhouette and plinth from behind.
 */
function SoftHaloDisc({
  statueX,
  scrollProgressRef,
}: {
  statueX: number;
  scrollProgressRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Procedural feathered radial gradient texture (no sharp polygon edges)
  const haloTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(256, 256, 12, 256, 256, 256);
    grad.addColorStop(0, "rgba(245, 230, 200, 0.42)");
    grad.addColorStop(0.25, "rgba(212, 175, 105, 0.24)");
    grad.addColorStop(0.55, "rgba(197, 160, 89, 0.08)");
    grad.addColorStop(0.82, "rgba(184, 142, 74, 0.015)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const p = Math.max(0, Math.min(1, scrollProgressRef.current));
    const t = clock.getElapsedTime();
    const baseP = Math.min(1, p / 0.72);

    if (groupRef.current) {
      // Subtle vertical position tracking
      groupRef.current.position.y = THREE.MathUtils.lerp(1.58, 1.35, baseP);
      const s = THREE.MathUtils.lerp(3.2, 4.0, baseP);
      groupRef.current.scale.set(s, s, 1);
    }

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        // Ultra-subtle, slow organic breath (no distracting neon pulsation)
        const breath = Math.sin(t * 0.7) * 0.02;
        let baseOpacity = THREE.MathUtils.lerp(0.48, 0.62, baseP);

        // Soften halo when camera sweeps directly behind statue in Section 06 360° orbit
        if (p > 0.72) {
          const u = (p - 0.72) / 0.28;
          const rearFactor = Math.sin(Math.PI * u);
          baseOpacity = THREE.MathUtils.lerp(0.62, 0.12, rearFactor);
        }
        mat.opacity = Math.max(0.06, baseOpacity + breath);
      }
    }
  });

  if (!haloTexture) return null;

  return (
    <group ref={groupRef} position={[statueX, 1.58, -1.2]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={haloTexture}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Camera Controller
 * Keyframed CatmullRom spline across Chapters 01 to 05, seamlessly transitioning
 * into a cinematic 360° orbit around the horse statue in Section 06.
 *
 * 100% bidirectional:
 * - Chapters 01..05: Top-to-base architectural reveal (Crown -> Head -> Rider -> Craft -> Archive front).
 * - Section 06: Smooth 360° circular orbit (Front -> Right flank -> Muscular Rear & Tail -> Left flank -> Front).
 * - Reverse scroll: Exactly retraces the full 360° orbit and climbs back to Chapter 01 without clipping or jumps.
 */
interface CameraControllerProps {
  scrollProgressRef: React.MutableRefObject<number>;
  statueX: number;
  isMobile: boolean;
}

const ORBIT_START_P = 0.72;

function CameraController({ scrollProgressRef, statueX, isMobile }: CameraControllerProps) {
  // Compute camera curves for Chapters 01 to 05
  const { camCurve, tarCurve } = useMemo(() => {
    const sX = statueX;
    const zMult = isMobile ? 1.35 : 1.0;
    const yOff = isMobile ? -0.15 : 0;

    // 5 section camera positions [x, y, z]
    const camPts = [
      // 01 · Origin (Crown & upper crest)
      new THREE.Vector3(sX * 0.6 + 0.8, 3.2 + yOff, 2.2 * zMult),
      // 02 · The Steed (Horse's head, eye & lyre ears)
      new THREE.Vector3(sX * 0.6 + 1.2, 2.4 + yOff, 1.8 * zMult),
      // 03 · The Rider (Commander head, vertical posture & reins)
      new THREE.Vector3(sX * 0.6 - 0.6, 1.8 + yOff, 1.6 * zMult),
      // 04 · Craft & Stone (Musculature, flanks & chiseled stone)
      new THREE.Vector3(sX * 0.6 + 1.6, 0.8 + yOff, 2.0 * zMult),
      // 05 · Archive (Wide complete monument & plinth base)
      new THREE.Vector3(sX * 0.5 + 2.2, 0.1 + yOff, 4.3 * zMult),
    ];

    // 5 section lookAt targets [x, y, z]
    const tarPts = [
      // 01 · Origin (Crown of statue)
      new THREE.Vector3(sX, 2.8, 0),
      // 02 · The Steed (Horse head & expression)
      new THREE.Vector3(sX + 0.15, 2.3, 0.35),
      // 03 · The Rider (Torso & reins)
      new THREE.Vector3(sX, 1.7, 0.2),
      // 04 · Craft & Stone (Lower torso / musculature)
      new THREE.Vector3(sX, 0.6, 0),
      // 05 · Archive (Complete statue visual center)
      new THREE.Vector3(sX, 1.25, 0),
    ];

    return {
      camCurve: new THREE.CatmullRomCurve3(camPts, false, "centripetal"),
      tarCurve: new THREE.CatmullRomCurve3(tarPts, false, "centripetal"),
    };
  }, [statueX, isMobile]);

  useFrame(({ camera }) => {
    // Current scroll progress strictly clamped [0, 1]
    const progress = Math.max(0, Math.min(1, scrollProgressRef.current));

    if (progress <= ORBIT_START_P) {
      // Phase 1: Chapters 01 to 05 (100% preserved exact trajectory)
      const t = progress / ORBIT_START_P;
      const targetCam = camCurve.getPoint(t);
      const targetLook = tarCurve.getPoint(t);

      camera.position.copy(targetCam);
      camera.lookAt(targetLook);
    } else {
      // Phase 2: Section 06 — Cinematic 360° Orbit (Front -> Side -> Rear -> Side -> Front)
      const u = (progress - ORBIT_START_P) / (1.0 - ORBIT_START_P);
      // Smooth Hermite velocity profile so the orbit initiates and completes with zero jerk
      const smoothU = u * u * (3 - 2 * u);

      const startCam = camCurve.getPoint(1.0);
      const startLook = tarCurve.getPoint(1.0);

      // Pivot center at horse torso & plinth center
      const pivotCenter = new THREE.Vector3(statueX, 1.35, 0);

      // Relative radius and angle from Section 05 start
      const v0X = startCam.x - pivotCenter.x;
      const v0Z = startCam.z - pivotCenter.z;
      const radius = Math.sqrt(v0X * v0X + v0Z * v0Z);
      const baseAngle = Math.atan2(v0X, v0Z);

      // Full 360-degree rotation (2 * PI)
      const currentAngle = baseAngle + smoothU * Math.PI * 2;

      const posX = pivotCenter.x + radius * Math.sin(currentAngle);
      const posZ = pivotCenter.z + radius * Math.cos(currentAngle);

      // Elevation lifts gracefully as camera sweeps behind to clearly reveal horse's rear and spine
      const rearElevation = Math.sin(Math.PI * smoothU) * (isMobile ? 1.05 : 1.35);
      const posY = startCam.y + rearElevation;

      // Target lookAt point remains centered on the equine sculpture
      const lookY = THREE.MathUtils.lerp(startLook.y, 1.35, Math.sin(Math.PI * smoothU));
      const lookTarget = new THREE.Vector3(statueX, lookY, 0);

      camera.position.set(posX, posY, posZ);
      camera.lookAt(lookTarget);
    }
  });

  return null;
}

interface StatueCanvasProps {
  scrollProgressRef: React.MutableRefObject<number>;
  statueX: number;
  isMobile: boolean;
}

export function StatueCanvas({
  scrollProgressRef,
  statueX,
  isMobile,
}: StatueCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let visible = false;
    const sync = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(container);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);
  return (
    <div ref={containerRef} className="h-full w-full" style={{ touchAction: "pan-y" }}>
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      style={{ touchAction: "pan-y" }}
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.35,
      }}
      camera={{
        fov: isMobile ? 48 : 42,
        near: 0.1,
        far: 50,
        position: [statueX * 0.6 + 0.8, 3.2, 2.2],
      }}
      className="h-full w-full block bg-transparent"
    >
      {/* ================================================================
          CHIAROSCURO STUDIO LIGHTING (Dynamic with scroll progress)
          ================================================================ */}
      <StudioLighting statueX={statueX} scrollProgressRef={scrollProgressRef} />

      {/* 3D Soft Museum Halo Disc behind the statue */}
      <SoftHaloDisc statueX={statueX} scrollProgressRef={scrollProgressRef} />

      {/* Contact shadows under the base */}
      <ContactShadows
        frames={1}
        position={[statueX, 0.005, 0]}
        opacity={0.65}
        scale={6.5}
        blur={2.4}
        far={3.5}
        resolution={512}
        color="#000000"
      />

      {/* The Statue Model */}
      <StatueModel statueX={statueX} />

      {/* Active Camera Trajectory Controller */}
      <CameraController
        scrollProgressRef={scrollProgressRef}
        statueX={statueX}
        isMobile={isMobile}
      />
    </Canvas>
    </div>
  );
}
