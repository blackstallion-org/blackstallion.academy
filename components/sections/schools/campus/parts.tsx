"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Repeated parts. Every box-shaped or cylindrical piece of a building is an instance of one unit shape, so a whole
 * building costs a handful of draw calls (one per material and shape) however many stalls, posts or slats it has.
 */
export type Item = {
  /** Centre, metres. */
  p: readonly [number, number, number];
  /** Size (box) or [diameter, height, diameter] (cylinder). */
  s: readonly [number, number, number];
  /** Euler rotation, radians. */
  r?: readonly [number, number, number];
  /** Brightness multiplier, around 1: a little variation between neighbours. */
  c?: number;
};

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
const UNIT_SPHERE = new THREE.IcosahedronGeometry(0.5, 1);

const dummy = new THREE.Object3D();
const tint = new THREE.Color();

type SetProps = {
  items: readonly Item[];
  material: THREE.Material;
  cast?: boolean;
  receive?: boolean;
};

function InstanceSet({ geometry, items, material, cast = true, receive = true }: SetProps & { geometry: THREE.BufferGeometry }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const colored = useMemo(() => items.some((i) => i.c !== undefined), [items]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2]);
      dummy.rotation.set(it.r?.[0] ?? 0, it.r?.[1] ?? 0, it.r?.[2] ?? 0);
      dummy.scale.set(it.s[0], it.s[1], it.s[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (colored) mesh.setColorAt(i, tint.setScalar(it.c ?? 1));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, colored]);
  if (items.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={cast} receiveShadow={receive} frustumCulled={false} />;
}

export function BoxSet(props: SetProps) {
  return <InstanceSet geometry={UNIT_BOX} {...props} />;
}

export function CylinderSet(props: SetProps) {
  return <InstanceSet geometry={UNIT_CYL} {...props} />;
}

/** Low-poly spheres: miniature tree crowns. */
export function SphereSet(props: SetProps) {
  return <InstanceSet geometry={UNIT_SPHERE} {...props} />;
}

/* ------------------------------------------------------------ small shared builders */

/** A rail or wall between two points on the ground plane, as an Item (axis-aligned or not). */
export function span(x1: number, z1: number, x2: number, z2: number, y: number, h: number, t: number): Item {
  const len = Math.hypot(x2 - x1, z2 - z1);
  return { p: [(x1 + x2) / 2, y, (z1 + z2) / 2], s: [len, h, t], r: [0, -Math.atan2(z2 - z1, x2 - x1), 0] };
}
