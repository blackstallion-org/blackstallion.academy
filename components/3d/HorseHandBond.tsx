"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/motion/reduced";
import { asset } from "@/lib/content/asset";

export const BOND_MODEL_URL = asset("/models/horse-hand-draco.glb");

interface HorseHandBondProps {
  theme?: "dark" | "light";
  desktopOffsetX?: number;
  desktopOffsetY?: number;
  scaleMultiplier?: number;
}

export function HorseHandBond({
  theme = "light",
  desktopOffsetX = 0.05,
  desktopOffsetY = -0.04,
  scaleMultiplier = 1.0,
}: HorseHandBondProps) {
  const { scene } = useGLTF(BOND_MODEL_URL, "/draco/");
  const reduced = useReducedMotion();
  const { size } = useThree();
  const mobile = size.width < 768;
  const tablet = size.width >= 768 && size.width < 1024;

  const rootGroup = useRef<THREE.Group>(null);
  const contactLight = useRef<THREE.PointLight>(null);

  // Prepare and center the intact model as ONE continuous, anatomically whole sculpt
  const { model, contactPoint, modelWidth } = useMemo(() => {
    const root = scene.clone(true);

    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material = child.material.clone();
          child.material.roughness = theme === "dark" ? 0.65 : 0.74;
          child.material.metalness = theme === "dark" ? 0.2 : 0.12;
          child.material.envMapIntensity = 1.15;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(root);
    const boxCenter = box.getCenter(new THREE.Vector3());

    // Center the entire intact model at its local origin
    root.position.set(-boxCenter.x, -boxCenter.y, -boxCenter.z);

    // Midpoint between horse muzzle and cadet fingertips in centered space
    const contact = new THREE.Vector3(0.09 - boxCenter.x, 0.35 - boxCenter.y, 0.06 - boxCenter.z);

    const wrapper = new THREE.Group();
    wrapper.add(root);

    return { model: wrapper, contactPoint: contact, modelWidth: box.max.x - box.min.x };
  }, [scene, theme]);

  // Subtle ambient breathing loop: gentle, poetic, and lifelike
  useFrame(({ clock, viewport, camera }) => {
    const v = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
    if (!rootGroup.current) return;

    const t = clock.elapsedTime;

    // Extremely subtle natural movement (no jerky loops, no jumping)
    const breath = reduced ? 0 : Math.sin(t * 0.9) * 0.009;
    const microSway = reduced ? 0 : Math.cos(t * 0.7) * 0.006;
    const yawDrift = reduced ? 0 : Math.sin(t * 0.35) * 0.003;

    const halfW = v.width / 2;
    // Scale dynamically so horse neck (left) and cadet sleeve (right) both touch/bleed past viewport edges
    const spanScale = (v.width / modelWidth) * 1.08;
    const baseScale = mobile ? spanScale : tablet ? spanScale : spanScale;
    const finalScale = baseScale * scaleMultiplier;

    rootGroup.current.scale.setScalar(finalScale);

    // Ensure hand sleeve touches and bleeds past the right screen edge
    const targetRightX = halfW + 0.02;
    const rightmostOffset = modelWidth * 0.5 * finalScale;
    const alignedPosX = targetRightX - rightmostOffset;
    const posX = (alignedPosX + desktopOffsetX * 0.05) + microSway * 0.4;
    const posY = desktopOffsetY + breath;
    const posZ = 0.0;

    rootGroup.current.position.set(posX, posY, posZ);
    rootGroup.current.rotation.set(breath * 0.5, yawDrift, microSway);

    if (contactLight.current) {
      contactLight.current.intensity =
        (theme === "dark" ? 0.9 : 0.45) + (reduced ? 0 : Math.sin(t * 1.5) * 0.06);
    }
  });

  return (
    <group ref={rootGroup}>
      <primitive object={model} />

      {/* Gentle golden warmth at the connection zone */}
      <pointLight
        ref={contactLight}
        position={[contactPoint.x, contactPoint.y, contactPoint.z + 0.1]}
        color={theme === "dark" ? "#f5c57a" : "#ffe4ad"}
        distance={2.5}
        decay={2}
        intensity={theme === "dark" ? 0.9 : 0.45}
      />
    </group>
  );
}

useGLTF.preload(BOND_MODEL_URL, "/draco/");
