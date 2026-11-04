"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/motion/reduced";
import { asset } from "@/lib/content/asset";

export const BOND_MODEL_URL = asset("/models/horse-hand-draco.glb");

/** Geometry-space x where the muzzle ends and the fingertips begin (the gap between them). */
const HAND_FROM = 0.098;
const HAND_TO = 0.114;
/** Share of the sculpt's height from the ear tips to the chin (the neck and sleeve below it may leave the frame). */
const HEAD_SPAN = 0.9;

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
  // On phones the sculpt is drawn larger: the horse's neck runs off the left edge so the head and hand stay big.
  const narrow = useThree((state) => state.size.width < 768);

  const rootGroup = useRef<THREE.Group>(null);
  const contactLight = useRef<THREE.PointLight>(null);

  // One continuous Tripo sculpt: the horse occupies x < CONTACT_X, the cadet's hand x > CONTACT_X (geometry space).
  // The two never touch, so a soft mask in that gap lets each side move on its own in the vertex shader.
  const motion = useRef({ uTime: { value: 0 }, uAmp: { value: 1 } });

  const { model, contactPoint, size: modelSize } = useMemo(() => {
    const root = scene.clone(true);

    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material instanceof THREE.MeshStandardMaterial) {
          const material = child.material.clone();
          material.roughness = theme === "dark" ? 0.65 : 0.74;
          material.metalness = theme === "dark" ? 0.2 : 0.12;
          material.envMapIntensity = 1.15;
          material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = motion.current.uTime;
            shader.uniforms.uAmp = motion.current.uAmp;
            shader.vertexShader = shader.vertexShader
              .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uAmp;")
              .replace(
                "#include <begin_vertex>",
                `#include <begin_vertex>
                float hand = smoothstep(${HAND_FROM.toFixed(3)}, ${HAND_TO.toFixed(3)}, position.x);
                float horse = 1.0 - hand;
                // Breathing: the head and neck swell and settle on a slow 6.5 s cycle.
                float breath = sin(uTime * 0.97);
                transformed += normal * 0.0011 * breath * horse * uAmp;
                // The muzzle lifts and reaches a few millimetres toward the hand, then eases back.
                float muzzle = smoothstep(-0.06, 0.085, position.x) * horse;
                transformed.y += (0.0022 * sin(uTime * 0.73) + 0.0008 * breath) * muzzle * uAmp;
                transformed.x += 0.0016 * sin(uTime * 0.51 + 0.6) * muzzle * uAmp;
                // The hand drifts, slower and smaller, never closing the gap.
                transformed.x += (0.0024 * sin(uTime * 0.43) - 0.0012) * hand * uAmp;
                transformed.y += 0.0016 * sin(uTime * 0.31 + 1.4) * hand * uAmp;`,
              );
          };
          material.customProgramCacheKey = () => "bsah-bond-motion";
          child.material = material;
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

    return { model: wrapper, contactPoint: contact, size: box.getSize(new THREE.Vector3()) };
  }, [scene, theme]);

  useFrame(({ clock, viewport, camera }) => {
    if (!rootGroup.current) return;
    const v = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
    const t = clock.elapsedTime;
    motion.current.uTime.value = t;
    motion.current.uAmp.value = reduced ? 0 : 1;

    // Fit both: the sculpt runs off the left (the neck) and right (the sleeve) edges only where it is cut, while the head from ear
    // tips to chin and the hand stay inside the stage with a margin. The chin sits about 85 % of the way down the sculpt (0.9 leaves room for the foot fade), so that
    // span (not the whole height, which includes the neck and the sleeve) is what has to fit. On a wide stage the height decides
    // and the cut ends sit a little inside the edges, where the section fades them out.
    const widthScale = (v.width / modelSize.x) * (narrow ? 1.42 : 1.04);
    const heightScale = (v.height * 0.94) / (modelSize.y * HEAD_SPAN);
    const finalScale = Math.min(widthScale, heightScale) * scaleMultiplier;
    rootGroup.current.scale.setScalar(finalScale);
    const scaledW = modelSize.x * finalScale;
    // Wide stage: centred. Phones: the neck runs off the left edge and the hand stays whole on the right.
    const posX = narrow ? v.width / 2 - scaledW / 2 + v.width * 0.012 : desktopOffsetX * 0;

    // Taller than the stage (the neck and sleeve below the chin run out of the bottom): the ear tips sit 3 % below the top edge.
    const scaledH = modelSize.y * finalScale;
    const posY = scaledH > v.height * 0.97 ? v.height / 2 - v.height * 0.03 - scaledH / 2 : desktopOffsetY;
    rootGroup.current.position.set(posX, posY, 0);
    rootGroup.current.rotation.set(0, 0, 0);

    if (contactLight.current) {
      contactLight.current.intensity = (theme === "dark" ? 0.9 : 0.45) + (reduced ? 0 : Math.sin(t * 1.5) * 0.06);
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
