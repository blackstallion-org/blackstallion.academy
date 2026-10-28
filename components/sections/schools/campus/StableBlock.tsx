"use client";

import { useMemo } from "react";
import { BLOCK_DEPTH, STALL, type CampusModule } from "@/lib/content/campus";
import type { Materials } from "./campus-materials";
import { ContactShadow, FACE_ANGLE, LodGroup } from "./common";
import { BoxSet, type Item } from "./parts";

const FLOOR = 0.14;
const WALL_H = 3.1;
const DOOR_W = 1.4;
const DOOR_H = 2.3;
const REAR_EAVE = 3.5;
const FRONT_EAVE = 2.8;

/**
 * A row of loose boxes drawn facing +z (the module is turned to its facing). Each bay is 12 ft wide and 12 ft deep; a
 * covered walkway runs along the stall fronts. Ventilation: louvred doors at the front and a high vent band at the rear.
 * Bays are stalls, a grooming bay (open front, tie rail) or a closed feed bay.
 */
export function StableBlock({ module: m, mats, near, quality }: { module: CampusModule; mats: Materials; near: number; quality: "high" | "low" }) {
  const bays = m.bays!;
  const parts = useMemo(() => {
    const n = bays.length;
    const L = n * STALL;
    const zr = -BLOCK_DEPTH / 2; // rear wall plane
    const zf = zr + STALL; // stall front plane
    const zw = BLOCK_DEPTH / 2; // walkway edge
    const x0 = -L / 2;
    const walls: Item[] = [];
    const piers: Item[] = [];
    const doors: Item[] = [];
    const solidDoors: Item[] = [];
    const posts: Item[] = [];
    const vents: Item[] = [];
    const slats: Item[] = [];
    const ventSlats: Item[] = [];
    const rails: Item[] = [];
    const floors: Item[] = [{ p: [0, FLOOR / 2, 0], s: [L + 0.5, FLOOR, BLOCK_DEPTH + 0.5] }];
    const pads: Item[] = [];

    walls.push({ p: [0, FLOOR + WALL_H / 2, zr + 0.1], s: [L + 0.2, WALL_H, 0.2] });
    for (const e of [-1, 1]) walls.push({ p: [e * (L / 2 - 0.05), FLOOR + WALL_H / 2, (zr + zf) / 2], s: [0.2, WALL_H, STALL] });
    for (let i = 1; i < n; i++) walls.push({ p: [x0 + i * STALL, FLOOR + 1.35, (zr + zf) / 2], s: [0.12, 2.7, STALL - 0.1] });

    bays.forEach((kind, i) => {
      const cx = x0 + (i + 0.5) * STALL;
      // Rear ventilation: one dark vent band per bay under the roof, louvred up close.
      vents.push({ p: [cx, FLOOR + WALL_H - 0.28, zr - 0.02], s: [STALL - 0.45, 0.4, 0.06] });
      for (let k = 0; k < 4; k++) ventSlats.push({ p: [cx, FLOOR + WALL_H - 0.4 + k * 0.1, zr - 0.06], s: [STALL - 0.5, 0.035, 0.05], r: [0.5, 0, 0] });
      if (kind === "grooming") {
        // Open front, a gold tie rail and a stone wash pad.
        rails.push({ p: [cx, FLOOR + 1.3, zf + 0.05], s: [STALL - 0.4, 0.06, 0.06] });
        pads.push({ p: [cx, FLOOR + 0.02, (zr + zf) / 2 + 0.1], s: [STALL - 0.5, 0.04, STALL - 0.7] });
        return;
      }
      // Front wall: two piers, a lintel and the door.
      const pierW = (STALL - DOOR_W) / 2;
      piers.push({ p: [cx - (DOOR_W / 2 + pierW / 2), FLOOR + WALL_H / 2, zf], s: [pierW, WALL_H, 0.2] });
      piers.push({ p: [cx + (DOOR_W / 2 + pierW / 2), FLOOR + WALL_H / 2, zf], s: [pierW, WALL_H, 0.2] });
      piers.push({ p: [cx, FLOOR + DOOR_H + (WALL_H - DOOR_H) / 2, zf], s: [DOOR_W, WALL_H - DOOR_H, 0.2] });
      if (kind === "feed") {
        solidDoors.push({ p: [cx, FLOOR + DOOR_H / 2, zf + 0.04], s: [DOOR_W - 0.06, DOOR_H, 0.08] });
      } else {
        // Dutch door: solid lower leaf, louvred upper leaf.
        solidDoors.push({ p: [cx, FLOOR + 0.6, zf + 0.04], s: [DOOR_W - 0.06, 1.2, 0.08] });
        doors.push({ p: [cx, FLOOR + 1.25 + 0.55, zf + 0.02], s: [DOOR_W - 0.1, 1.1, 0.05] });
        for (let k = 0; k < 9; k++) slats.push({ p: [cx, FLOOR + 1.28 + k * 0.115, zf + 0.07], s: [DOOR_W - 0.16, 0.04, 0.05], r: [-0.55, 0, 0] });
      }
    });
    for (let i = 0; i <= n; i++) posts.push({ p: [x0 + i * STALL, FLOOR + (FRONT_EAVE - 0.1) / 2, zw - 0.1], s: [0.14, FRONT_EAVE - 0.1, 0.14] });
    return { L, zr, zw, walls, piers, doors, solidDoors, posts, vents, slats, ventSlats, rails, floors, pads };
  }, [bays]);

  const roof = useMemo(() => {
    const run = BLOCK_DEPTH + 0.7;
    const rise = REAR_EAVE - FRONT_EAVE;
    const angle = Math.atan2(rise, run);
    const len = Math.hypot(run, rise);
    const zMid = (-BLOCK_DEPTH / 2 - 0.3 + BLOCK_DEPTH / 2 + 0.4) / 2;
    const slab: Item = { p: [0, (REAR_EAVE + FRONT_EAVE) / 2 + 0.07, zMid], s: [parts.L + 0.9, 0.14, len], r: [angle, 0, 0] };
    const fascia: Item = { p: [0, FRONT_EAVE - 0.02, BLOCK_DEPTH / 2 + 0.4], s: [parts.L + 0.95, 0.16, 0.08] };
    const ridgeCap: Item = { p: [0, REAR_EAVE + 0.12, -BLOCK_DEPTH / 2 - 0.3], s: [parts.L + 0.95, 0.08, 0.1] };
    return { slab, fascia, ridgeCap };
  }, [parts.L]);

  return (
    <group rotation-y={FACE_ANGLE[m.facing]}>
      <ContactShadow w={parts.L} d={BLOCK_DEPTH} grow={1.8} opacity={0.36} />
      <BoxSet items={parts.floors} material={mats.floor} />
      <BoxSet items={parts.pads} material={mats.stone} />
      <BoxSet items={parts.walls} material={mats.wall} />
      <BoxSet items={parts.piers} material={mats.wall} />
      <BoxSet items={parts.solidDoors} material={mats.timber} />
      <BoxSet items={parts.doors} material={mats.roof} cast={false} />
      <BoxSet items={parts.vents} material={mats.roof} cast={false} />
      <BoxSet items={parts.posts} material={mats.timber} />
      <BoxSet items={parts.rails} material={mats.trim} />
      <BoxSet items={[roof.slab]} material={mats.roof} />
      <BoxSet items={[roof.fascia, roof.ridgeCap]} material={mats.trim} cast={false} />
      <LodGroup distance={near} enabled={quality === "high"}>
        <BoxSet items={parts.slats} material={mats.timber} cast={false} />
        <BoxSet items={parts.ventSlats} material={mats.timber} cast={false} />
      </LodGroup>
    </group>
  );
}

