"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { bottom, left, right, top, type CampusTier, type Rect } from "@/lib/content/campus";
import { PALETTE, contactShadowTexture, grainTexture } from "./campus-materials";
import { BoxSet, SphereSet, type Item } from "./parts";

const TERRAIN_T = 0.5;
const FOUND_T = 1.6;
const PLINTH_T = 0.5;

/** A bevelled slab: top face at y = 0 (before `top` is applied), thickness `t`, chamfered all round. */
function slabGeometry(w: number, d: number, t: number, bevel: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2);
  shape.lineTo(w / 2, d / 2);
  shape.lineTo(-w / 2, d / 2);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -t + bevel, 0);
  geo.computeVertexNormals();
  return geo;
}

function useSlab(w: number, d: number, t: number, bevel: number, color: number, roughness: number, grainScale?: number) {
  const geo = useMemo(() => slabGeometry(w, d, t, bevel), [w, d, t, bevel]);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
    if (grainScale) {
      const map = grainTexture().clone();
      map.repeat.set(1 / grainScale, 1 / grainScale);
      map.needsUpdate = true;
      m.map = map;
    }
    return m;
  }, [color, roughness, grainScale]);
  useEffect(
    () => () => {
      geo.dispose();
      mat.map?.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  return { geo, mat };
}

const rectItem = (r: Rect, y: number, h: number): Item => ({ p: [r.x, y, r.z], s: [r.w, h, r.d] });

/** Deterministic miniature trees along the plot's edge, kept clear of every building and path. Model staging only. */
function treePositions(t: CampusTier, count: number): { x: number; z: number; s: number }[] {
  const hw = t.site.w / 2;
  const hd = t.site.d / 2;
  const out: { x: number; z: number; s: number }[] = [];
  const clear = (x: number, z: number) => {
    const probe: Rect = { x, z, w: 3.2, d: 3.2 };
    const hits = (r: Rect, pad: number) => left(probe) < right(r) + pad && right(probe) > left(r) - pad && top(probe) < bottom(r) + pad && bottom(probe) > top(r) - pad;
    return !t.modules.some((m) => hits(m.rect, 1.2)) && !t.paths.some((p) => hits(p, 0.4)) && Math.abs(x - t.entrance.x) > 4;
  };
  const step = 7.5;
  let i = 0;
  const edge = (x: number, z: number) => {
    if (out.length < count && clear(x, z)) out.push({ x, z, s: 0.85 + ((i++ * 37) % 10) / 28 });
  };
  for (let x = -hw + 1.6; x <= hw - 1.6; x += step) {
    edge(x, -hd + 1.6);
    edge(x + step / 2, hd - 1.4);
  }
  for (let z = -hd + 5; z <= hd - 5; z += step) {
    edge(-hw + 1.5, z);
    edge(hw - 1.5, z + step / 2);
  }
  return out;
}

type Props = { tier: CampusTier; trees: number };

/**
 * The model's base: a dark-brown plinth, a sandstone foundation in three courses with a gold inlay, and the ivory terrain
 * slab (bevelled, visible thickness) with the paths, gate piers and a few trees. Everything sits on a shadow-catching table.
 */
export const CampusTerrain = forwardRef<THREE.Group, Props>(function CampusTerrain({ tier, trees }, ref) {
  const { w, d } = tier.site;
  const terrain = useSlab(w, d, TERRAIN_T, 0.14, PALETTE.terrain, 0.96, 9);
  const found = useSlab(w + 1.2, d + 1.2, FOUND_T, 0.1, PALETTE.sandstone, 0.95);
  const plinth = useSlab(w + 3.2, d + 3.2, PLINTH_T, 0.12, PALETTE.brown, 0.62);

  const mats = useMemo(() => {
    const m = (hex: number, roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
    return {
      path: m(new THREE.Color(PALETTE.sandstone).lerp(new THREE.Color(PALETTE.ivory), 0.5).getHex(), 0.97),
      stone: m(PALETTE.sandstone, 0.94),
      joint: m(new THREE.Color(PALETTE.sandstone).multiplyScalar(0.8).getHex(), 0.98),
      gold: m(PALETTE.gold, 0.36, 0.7),
      trunk: m(PALETTE.brown, 0.9),
      leaf: m(new THREE.Color(PALETTE.terrain).lerp(new THREE.Color(0x7d8566), 0.7).getHex(), 0.95),
      catcher: new THREE.ShadowMaterial({ opacity: 0.22 }),
      blob: new THREE.MeshBasicMaterial({ color: PALETTE.brown, alphaMap: contactShadowTexture(w, d, 12), transparent: true, opacity: 0.4, depthWrite: false }),
    };
  }, [w, d]);
  useEffect(
    () => () => {
      for (const m of Object.values(mats)) {
        (m as THREE.Material & { alphaMap?: THREE.Texture | null }).alphaMap?.dispose();
        m.dispose();
      }
    },
    [mats],
  );

  const detail = useMemo(() => {
    const paths: Item[] = tier.paths.map((p) => rectItem(p, 0.02, 0.05));
    // Two joints between the courses of foundation stone: thin slabs a hair proud of the foundation.
    const joints: Item[] = [1, 2].map((k) => ({ p: [0, -TERRAIN_T - (FOUND_T / 3) * k, 0], s: [w + 1.24, 0.035, d + 1.24] }));
    const inlay: Item[] = [
      { p: [0, -TERRAIN_T - 0.02, -(d / 2 + 0.62)], s: [w + 1.32, 0.07, 0.05] },
      { p: [0, -TERRAIN_T - 0.02, d / 2 + 0.62], s: [w + 1.32, 0.07, 0.05] },
      { p: [-(w / 2 + 0.62), -TERRAIN_T - 0.02, 0], s: [0.05, 0.07, d + 1.2] },
      { p: [w / 2 + 0.62, -TERRAIN_T - 0.02, 0], s: [0.05, 0.07, d + 1.2] },
    ];
    const gx = tier.entrance.x;
    const gz = tier.entrance.z - 0.45;
    const gateW = tier.entrance.width / 2 + 0.55;
    const piers: Item[] = [-1, 1].map((e) => ({ p: [gx + e * gateW, 1.05, gz], s: [0.7, 2.1, 0.7] }));
    const pierCaps: Item[] = [-1, 1].map((e) => ({ p: [gx + e * gateW, 2.18, gz], s: [0.86, 0.12, 0.86] }));
    return { paths, joints, inlay, piers, pierCaps };
  }, [tier, w, d]);

  const treeList = useMemo(() => treePositions(tier, trees), [tier, trees]);
  const trunks = useMemo<Item[]>(() => treeList.map((t) => ({ p: [t.x, 0.7 * t.s, t.z], s: [0.22 * t.s, 1.4 * t.s, 0.22 * t.s] })), [treeList]);
  const crowns = useMemo<Item[]>(() => treeList.map((t) => ({ p: [t.x, 2.1 * t.s, t.z], s: [2.3 * t.s, 2.1 * t.s, 2.3 * t.s], c: 0.94 + ((Math.round(t.x * 7) % 5) * 0.025) })), [treeList]);

  return (
    <group ref={ref}>
      <mesh geometry={terrain.geo} material={terrain.mat} receiveShadow castShadow />
      <mesh geometry={found.geo} material={found.mat} position-y={-TERRAIN_T} receiveShadow castShadow />
      <mesh geometry={plinth.geo} material={plinth.mat} position-y={-TERRAIN_T - FOUND_T} receiveShadow castShadow />
      <BoxSet items={detail.joints} material={mats.joint} cast={false} receive={false} />
      <BoxSet items={detail.inlay} material={mats.gold} cast={false} />
      <BoxSet items={detail.paths} material={mats.path} cast={false} />
      <BoxSet items={detail.piers} material={mats.stone} />
      <BoxSet items={detail.pierCaps} material={mats.gold} cast={false} />
      <BoxSet items={trunks} material={mats.trunk} />
      <SphereSet items={crowns} material={mats.leaf} />
      {/* The table: a soft shadow under the plinth, and a catcher for the sun's shadow. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-TERRAIN_T - FOUND_T - PLINTH_T + 0.01} material={mats.blob} renderOrder={-1}>
        <planeGeometry args={[w + 24, d + 24]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-TERRAIN_T - FOUND_T - PLINTH_T} receiveShadow material={mats.catcher}>
        <planeGeometry args={[w * 4, d * 4]} />
      </mesh>
    </group>
  );
});
