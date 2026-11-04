"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Rect, Side } from "@/lib/content/campus";
import { PALETTE, contactShadowTexture } from "./campus-materials";

/** Rotation about y that turns a model drawn facing +z (south) to face `side`. */
export const FACE_ANGLE: Record<Side, number> = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

/** A footprint's width and depth in the model's own frame, where the front is +z. */
export function localSize(rect: Rect, facing: Side) {
  const turned = facing === "e" || facing === "w";
  return { w: turned ? rect.d : rect.w, d: turned ? rect.w : rect.d };
}

/** A baked contact shadow: a soft dark falloff on the ground under and around a building. */
export function ContactShadow({ w, d, grow = 2.2, opacity = 0.4 }: { w: number; d: number; grow?: number; opacity?: number }) {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: PALETTE.brown,
        alphaMap: contactShadowTexture(w, d, grow),
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    [w, d, grow, opacity],
  );
  useEffect(
    () => () => {
      material.alphaMap?.dispose();
      material.dispose();
    },
    [material],
  );
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.03} renderOrder={1} material={material}>
      <planeGeometry args={[w + grow * 2, d + grow * 2]} />
    </mesh>
  );
}

/**
 * Fine detail (louvre slats, fence caps, gate braces) shown only when the camera is close. Level of detail by distance with a
 * little hysteresis. With `enabled` false (phones) the detail is never drawn.
 */
export function LodGroup({ distance, enabled = true, children }: { distance: number; enabled?: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const g = ref.current;
    if (!g) return;
    g.getWorldPosition(world);
    const d = camera.position.distanceTo(world);
    const next = enabled && d < distance * (g.visible ? 1.1 : 1);
    if (g.visible !== next) g.visible = next;
  });
  return (
    <group ref={ref} visible={false}>
      {children}
    </group>
  );
}
