"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CampusModule, Gate } from "@/lib/content/campus";
import { PALETTE, sandTexture, type Materials } from "./campus-materials";
import { LodGroup } from "./common";
import { BoxSet, CylinderSet, type Item } from "./parts";

const SLAB = 0.12;
const POST_H = 1.5;
const GATE_H = 1.45;

type Seg = { a: number; b: number };

/** Free stretches of one fence side once the gates are cut out. `at` is measured from the middle of the side. */
function freeSegments(length: number, gates: Gate[]): Seg[] {
  const cuts = gates.map((g) => ({ a: g.at - g.width / 2, b: g.at + g.width / 2 })).sort((p, q) => p.a - q.a);
  const out: Seg[] = [];
  let cursor = -length / 2;
  for (const c of cuts) {
    if (c.a > cursor) out.push({ a: cursor, b: c.a });
    cursor = c.b;
  }
  if (cursor < length / 2) out.push({ a: cursor, b: length / 2 });
  return out;
}

function buildFence(a: NonNullable<CampusModule["arena"]>) {
  const fx = a.w / 2 + 0.1;
  const fz = a.d / 2 + 0.1;
  const posts: Item[] = [];
  const caps: Item[] = [];
  const rails: Item[] = [];
  const rails3: Item[] = [];
  const piers: Item[] = [];
  const pierCaps: Item[] = [];
  const leaves: Item[] = [];
  const seen = new Set<string>();
  const addPost = (x: number, z: number) => {
    const key = `${Math.round(x * 10)}_${Math.round(z * 10)}`;
    if (seen.has(key)) return;
    seen.add(key);
    posts.push({ p: [x, SLAB + POST_H / 2, z], s: [0.14, POST_H, 0.14] });
    caps.push({ p: [x, SLAB + POST_H + 0.025, z], s: [0.2, 0.05, 0.2] });
  };

  (["n", "s", "e", "w"] as const).forEach((side) => {
    const alongX = side === "n" || side === "s";
    const length = alongX ? a.w + 0.2 : a.d + 0.2;
    const fixed = side === "n" ? -fz : side === "s" ? fz : side === "e" ? fx : -fx;
    const gates = a.gates.filter((g) => g.side === side);
    for (const seg of freeSegments(length, gates)) {
      const len = seg.b - seg.a;
      const mid = (seg.a + seg.b) / 2;
      const n = Math.max(1, Math.ceil(len / 3));
      for (let i = 0; i <= n; i++) {
        const t = seg.a + (len / n) * i;
        addPost(alongX ? t : fixed, alongX ? fixed : t);
      }
      const rail = (y: number): Item => ({ p: alongX ? [mid, y, fixed] : [fixed, y, mid], s: alongX ? [len, 0.1, 0.07] : [0.07, 0.1, len] });
      rails.push(rail(SLAB + 0.5), rail(SLAB + 1.05));
      rails3.push(rail(SLAB + 1.42));
    }
    for (const g of gates) {
      for (const dir of [-1, 1]) {
        const x = alongX ? g.at + dir * (g.width / 2 + 0.2) : fixed;
        const z = alongX ? fixed : g.at + dir * (g.width / 2 + 0.2);
        piers.push({ p: [x, SLAB + 0.95, z], s: [0.42, 1.9, 0.42] });
        pierCaps.push({ p: [x, SLAB + 1.94, z], s: [0.54, 0.08, 0.54] });
      }
      // Two closed leaves.
      const leaf = g.width / 2 - 0.04;
      for (const dir of [-1, 1]) {
        const c = g.at + dir * (leaf / 2 + 0.02);
        for (const y of [0.45, 0.85, 1.25]) leaves.push({ p: alongX ? [c, SLAB + y, fixed] : [fixed, SLAB + y, c], s: alongX ? [leaf, 0.09, 0.06] : [0.06, 0.09, leaf] });
        for (const e of [-1, 1]) {
          const u = c + e * (leaf / 2 - 0.04);
          leaves.push({ p: alongX ? [u, SLAB + GATE_H / 2 - 0.1, fixed] : [fixed, SLAB + GATE_H / 2 - 0.1, u], s: alongX ? [0.08, GATE_H - 0.1, 0.06] : [0.06, GATE_H - 0.1, 0.08] });
        }
      }
    }
  });
  return { posts, caps, rails, rails3, piers, pierCaps, leaves };
}

/** Sand with fine furrows, sized from the arena so the pattern is the same scale in every tier. */
function useSand(w: number, d: number) {
  const material = useMemo(() => {
    const map = sandTexture(w / 7, d / 7);
    return new THREE.MeshStandardMaterial({ color: PALETTE.sand, roughness: 1, metalness: 0, map });
  }, [w, d]);
  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );
  return material;
}

/** Slim columns and a shallow-pitch timber roof over the arena (Signature tier). Columns stand outside the fence. */
function Canopy({ a, mats, near, quality }: { a: NonNullable<CampusModule["arena"]>; mats: Materials; near: number; quality: "high" | "low" }) {
  const parts = useMemo(() => {
    const colZ = a.d / 2 + 0.8;
    const eave = 6.4;
    const ridge = 8.2;
    const half = colZ + 1.6;
    const slope = Math.atan2(ridge - eave, half);
    const slopeLen = Math.hypot(half, ridge - eave);
    const roofLen = a.w + 3.2;
    const cols: Item[] = [];
    const beams: Item[] = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x = -a.w / 2 + 2.2 + ((a.w - 4.4) / (n - 1)) * i;
      for (const sgn of [-1, 1]) cols.push({ p: [x, eave / 2, sgn * colZ], s: [0.34, eave, 0.34] });
      beams.push({ p: [x, eave + 0.12, 0], s: [0.22, 0.34, colZ * 2 + 0.3] });
    }
    const slabs: Item[] = [-1, 1].map((sgn) => ({
      p: [0, eave + (ridge - eave) / 2 + 0.28, (sgn * half) / 2],
      s: [roofLen, 0.22, slopeLen],
      r: [sgn * slope, 0, 0],
    }));
    const fascia: Item[] = [-1, 1].map((sgn) => ({ p: [0, eave - 0.02, sgn * half], s: [roofLen + 0.1, 0.2, 0.1] }));
    const ridgeCap: Item[] = [{ p: [0, ridge + 0.42, 0], s: [roofLen + 0.1, 0.1, 0.34] }];
    const rafters: Item[] = [];
    for (const sgn of [-1, 1]) {
      for (let i = 0; i <= 16; i++) {
        const x = -roofLen / 2 + 0.2 + ((roofLen - 0.4) / 16) * i;
        rafters.push({ p: [x, eave + (ridge - eave) / 2 + 0.42, (sgn * half) / 2], s: [0.1, 0.16, slopeLen], r: [sgn * slope, 0, 0] });
      }
    }
    const slats: Item[] = [];
    if (quality === "high") {
      for (const sgn of [-1, 1]) {
        for (let k = 1; k < 14; k++) {
          const z = (sgn * half * k) / 14;
          const y = eave + ((ridge - eave) * (1 - Math.abs(z) / half)) - 0.0;
          slats.push({ p: [0, y + 0.04, z], s: [roofLen - 0.4, 0.05, 0.12] });
        }
      }
    }
    return { cols, beams, slabs, rafters, fascia, ridgeCap, slats };
  }, [a, quality]);
  return (
    <group>
      <CylinderSet items={parts.cols.map((c) => ({ ...c, s: [0.36, c.s[1], 0.36] as const }))} material={mats.roof} />
      <BoxSet items={parts.beams} material={mats.roof} />
      <BoxSet items={parts.slabs} material={mats.canopy} cast={false} />
      <BoxSet items={parts.rafters} material={mats.timber} />
      <BoxSet items={parts.fascia} material={mats.trim} />
      <BoxSet items={parts.ridgeCap} material={mats.trim} />
      <LodGroup distance={near} enabled={quality === "high"}>
        <BoxSet items={parts.slats} material={mats.timber} cast={false} />
      </LodGroup>
    </group>
  );
}

function Floodlights({ a, mats }: { a: NonNullable<CampusModule["arena"]>; mats: Materials }) {
  const { poles, heads, housings } = useMemo(() => {
    const poles: Item[] = [];
    const heads: Item[] = [];
    const housings: Item[] = [];
    const h = 12;
    for (const x of [-a.w * 0.34, a.w * 0.24]) {
      for (const sgn of [-1, 1]) {
        const z = sgn * (a.d / 2 + 1.5);
        poles.push({ p: [x, h / 2, z], s: [0.26, h, 0.26] });
        housings.push({ p: [x, h + 0.2, z - sgn * 0.0], s: [1.5, 0.5, 0.36] });
        heads.push({ p: [x, h + 0.2, z - sgn * 0.2], s: [1.3, 0.34, 0.06] });
      }
    }
    return { poles, heads, housings };
  }, [a]);
  return (
    <group>
      <CylinderSet items={poles} material={mats.roof} />
      <BoxSet items={housings} material={mats.roof} />
      <BoxSet items={heads} material={mats.lamp} cast={false} />
    </group>
  );
}

/** A free-standing stone arcade along both long sides (Royal tier). The south side is open at the main gate. */
function Colonnade({ a, mats, near, quality }: { a: NonNullable<CampusModule["arena"]>; mats: Materials; near: number; quality: "high" | "low" }) {
  const parts = useMemo(() => {
    const z = a.d / 2 + 1.8;
    const bay = 3;
    const n = Math.round(a.w / bay);
    const gate = a.gates.find((g) => g.side === "s");
    const shafts: Item[] = [];
    const bases: Item[] = [];
    const caps: Item[] = [];
    const lintels: Item[] = [];
    const cornice: Item[] = [];
    const parapet: Item[] = [];
    const flutes: Item[] = [];
    for (let i = 0; i <= n; i++) {
      const x = -a.w / 2 + i * bay;
      for (const sgn of [-1, 1]) {
        const inGate = sgn === 1 && gate !== undefined && Math.abs(x - gate.at) < gate.width / 2 + 0.01;
        if (inGate) continue;
        shafts.push({ p: [x, 3.1, sgn * z], s: [0.56, 5.0, 0.56] });
        bases.push({ p: [x, 0.3, sgn * z], s: [0.95, 0.3, 0.95] });
        bases.push({ p: [x, 0.58, sgn * z], s: [0.75, 0.26, 0.75] });
        caps.push({ p: [x, 5.78, sgn * z], s: [0.86, 0.3, 0.86] });
        if (quality === "high") for (const k of [-1, 0, 1]) flutes.push({ p: [x + k * 0.14, 3.1, sgn * (z + 0.285)], s: [0.04, 4.6, 0.02] });
      }
    }
    for (const sgn of [-1, 1]) {
      lintels.push({ p: [0, 6.12, sgn * z], s: [a.w + 1.4, 0.55, 0.9] });
      cornice.push({ p: [0, 6.5, sgn * z], s: [a.w + 1.6, 0.16, 1.15] });
      parapet.push({ p: [0, 6.64, sgn * z], s: [a.w + 1.2, 0.12, 0.5] });
    }
    return { shafts, bases, caps, lintels, cornice, parapet, flutes };
  }, [a, quality]);
  return (
    <group>
      <CylinderSet items={parts.shafts} material={mats.wall} />
      <BoxSet items={parts.bases} material={mats.stone} />
      <BoxSet items={parts.caps} material={mats.stone} />
      <BoxSet items={parts.lintels} material={mats.wall} />
      <BoxSet items={parts.cornice} material={mats.trim} />
      <BoxSet items={parts.parapet} material={mats.stone} />
      <LodGroup distance={near} enabled={quality === "high"}>
        <BoxSet items={parts.flutes} material={mats.stone} cast={false} />
      </LodGroup>
    </group>
  );
}

export function ArenaModel({ module: m, mats, near, quality }: { module: CampusModule; mats: Materials; near: number; quality: "high" | "low" }) {
  const a = m.arena!;
  const sand = useSand(a.w, a.d);
  const fence = useMemo(() => buildFence(a), [a]);
  const kerb = useMemo<Item[]>(() => {
    const fx = a.w / 2 + 0.1;
    const fz = a.d / 2 + 0.1;
    return [
      { p: [0, 0.07, -fz], s: [a.w + 0.6, 0.14, 0.4] },
      { p: [0, 0.07, fz], s: [a.w + 0.6, 0.14, 0.4] },
      { p: [-fx, 0.07, 0], s: [0.4, 0.14, a.d + 0.2] },
      { p: [fx, 0.07, 0], s: [0.4, 0.14, a.d + 0.2] },
    ];
  }, [a]);

  return (
    <group>
      <mesh position-y={SLAB / 2} receiveShadow material={sand}>
        <boxGeometry args={[a.w, SLAB, a.d]} />
      </mesh>
      <BoxSet items={kerb} material={mats.stone} />
      <BoxSet items={fence.posts} material={mats.timber} />
      <BoxSet items={fence.rails} material={mats.timber} />
      <BoxSet items={fence.piers} material={mats.stone} />
      <BoxSet items={fence.leaves} material={mats.timber} />
      <LodGroup distance={near} enabled={quality === "high"}>
        <BoxSet items={fence.rails3} material={mats.timber} />
        <BoxSet items={fence.caps} material={mats.trim} cast={false} />
        <BoxSet items={fence.pierCaps} material={mats.trim} cast={false} />
      </LodGroup>
      {a.roof === "canopy" && <Canopy a={a} mats={mats} near={near} quality={quality} />}
      {a.roof === "colonnade" && <Colonnade a={a} mats={mats} near={near} quality={quality} />}
      {a.floodlights && <Floodlights a={a} mats={mats} />}
    </group>
  );
}
