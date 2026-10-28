"use client";

import { useMemo } from "react";
import type { CampusModule } from "@/lib/content/campus";
import type { Materials } from "./campus-materials";
import { ContactShadow, FACE_ANGLE, LodGroup, localSize } from "./common";
import { BoxSet, CylinderSet, type Item } from "./parts";

type Props = { module: CampusModule; mats: Materials; near: number; quality: "high" | "low" };

const PLINTH = 0.2;

/** A gable roof over a rectangle, ridge along x, as two slabs plus a gold ridge cap and eave lines. */
function gable(w: number, zFront: number, zBack: number, eave: number, ridge: number, over: number) {
  const zMid = (zFront + zBack) / 2;
  const half = (zFront - zBack) / 2 + over;
  const angle = Math.atan2(ridge - eave, half);
  const len = Math.hypot(half, ridge - eave);
  const slabs: Item[] = [-1, 1].map((sgn) => ({ p: [0, eave + (ridge - eave) / 2 + 0.08, zMid + (sgn * half) / 2], s: [w + over * 2, 0.16, len], r: [sgn * angle, 0, 0] }));
  const trim: Item[] = [
    { p: [0, ridge + 0.17, zMid], s: [w + over * 2 + 0.1, 0.09, 0.26] },
    { p: [0, eave - 0.02, zMid + half], s: [w + over * 2 + 0.1, 0.18, 0.08] },
    { p: [0, eave - 0.02, zMid - half], s: [w + over * 2 + 0.1, 0.18, 0.08] },
  ];
  return { slabs, trim };
}

/** Evenly spaced glazing panels between slim timber mullions on a front face at z. */
function glazing(w: number, z: number, y: number, h: number, panels: number, door = true) {
  const glass: Item[] = [];
  const mullions: Item[] = [];
  const usable = w - 1.4;
  const pw = usable / panels;
  for (let i = 0; i < panels; i++) {
    glass.push({ p: [-usable / 2 + pw * (i + 0.5), y, z], s: [pw - 0.1, h, 0.04] });
  }
  for (let i = 0; i <= panels; i++) mullions.push({ p: [-usable / 2 + pw * i, y, z + 0.02], s: [0.08, h + 0.1, 0.1] });
  mullions.push({ p: [0, y + h / 2 + 0.05, z + 0.02], s: [usable + 0.08, 0.09, 0.1] });
  const doors: Item[] = door ? [{ p: [w / 2 - 0.7, y - 0.1, z + 0.03], s: [0.95, h - 0.2, 0.07] }] : [];
  return { glass, mullions, doors };
}

function TackRoom({ module: m, mats }: Props) {
  const { w, d } = localSize(m.rect, m.facing);
  const parts = useMemo(() => {
    const veranda = 1.8;
    const bodyD = d - veranda;
    const zBack = -d / 2;
    const zFront = zBack + bodyD;
    const body: Item[] = [{ p: [0, PLINTH + 1.55, (zBack + zFront) / 2], s: [w, 3.1, bodyD] }];
    const plinth: Item[] = [{ p: [0, PLINTH / 2, 0], s: [w + 0.3, PLINTH, d + 0.3] }];
    const posts: Item[] = [];
    const n = Math.max(2, Math.round(w / 2.2));
    for (let i = 0; i <= n; i++) posts.push({ p: [-w / 2 + 0.2 + ((w - 0.4) / n) * i, PLINTH + 1.55, d / 2 - 0.2], s: [0.16, 3.1, 0.16] });
    const roof = gable(w, d / 2, zBack, 3.4, m.height - 0.2, 0.55);
    return { body, plinth, posts, roof, glaze: glazing(w, zFront + 0.02, PLINTH + 1.5, 2.6, 4), zFront };
  }, [w, d, m.height]);
  return (
    <group rotation-y={FACE_ANGLE[m.facing]}>
      <ContactShadow w={w} d={d} grow={1.8} opacity={0.34} />
      <BoxSet items={parts.plinth} material={mats.floor} />
      <BoxSet items={parts.body} material={mats.wall} />
      <BoxSet items={parts.glaze.glass} material={mats.glass} cast={false} />
      <BoxSet items={parts.glaze.mullions} material={mats.timber} cast={false} />
      <BoxSet items={parts.glaze.doors} material={mats.roof} cast={false} />
      <BoxSet items={parts.posts} material={mats.timber} />
      <BoxSet items={parts.roof.slabs} material={mats.roof} />
      <BoxSet items={parts.roof.trim} material={mats.trim} cast={false} />
    </group>
  );
}

function Lounge({ module: m, mats, quality }: Props) {
  const { w, d } = localSize(m.rect, m.facing);
  const parts = useMemo(() => {
    const deckD = 3.5;
    const bodyD = d - deckD;
    const zBack = -d / 2;
    const zFront = zBack + bodyD;
    const deckH = 0.55;
    const body: Item[] = [{ p: [0, PLINTH + 2.0, (zBack + zFront) / 2], s: [w, 4.0, bodyD] }];
    const plinth: Item[] = [{ p: [0, PLINTH / 2, zBack + bodyD / 2], s: [w + 0.3, PLINTH, bodyD + 0.3] }];
    const deck: Item[] = [{ p: [0, deckH / 2, zFront + deckD / 2], s: [w, deckH, deckD] }];
    const boards: Item[] = [];
    if (quality === "high") for (let i = 0; i < Math.floor(deckD / 0.18); i++) boards.push({ p: [0, deckH + 0.012, zFront + 0.1 + i * 0.18], s: [w - 0.06, 0.025, 0.15], c: 0.96 + ((i * 7) % 5) * 0.012 });
    const roof: Item[] = [{ p: [0, PLINTH + 4.2, (zBack + zFront) / 2 + 0.9], s: [w + 0.9, 0.24, bodyD + 2.4] }];
    const fascia: Item[] = [{ p: [0, PLINTH + 4.2, zFront + 2.1], s: [w + 0.95, 0.3, 0.07] }];
    const rails: Item[] = [{ p: [0, deckH + 1.0, d / 2 - 0.12], s: [w - 0.1, 0.06, 0.06] }];
    const sideRails: Item[] = [-1, 1].map((e) => ({ p: [e * (w / 2 - 0.1), deckH + 1.0, zFront + deckD / 2], s: [0.06, 0.06, deckD - 0.2] }));
    const posts: Item[] = [];
    const n = Math.round(w / 1.6);
    for (let i = 0; i <= n; i++) posts.push({ p: [-w / 2 + 0.1 + ((w - 0.2) / n) * i, deckH + 0.5, d / 2 - 0.12], s: [0.07, 1.0, 0.07] });
    const steps: Item[] = [0, 1].map((k) => ({ p: [0, 0.14 + k * 0.2, d / 2 + 0.3 - k * 0.3], s: [2.4, 0.28 + k * 0.2 - 0.0, 0.5] }));
    const colls: Item[] = [-1, 1].map((e) => ({ p: [e * (w / 2 - 0.3), PLINTH + 2.15, zFront + 2.1 - 0.15], s: [0.26, 4.1, 0.26] }));
    return { body, plinth, deck, boards, roof, fascia, rails, sideRails, posts, steps, colls, glaze: glazing(w, zFront + 0.02, PLINTH + 1.9, 3.1, 6, false), zFront };
  }, [w, d, quality]);
  return (
    <group rotation-y={FACE_ANGLE[m.facing]}>
      <ContactShadow w={w} d={d} grow={2} opacity={0.36} />
      <BoxSet items={parts.plinth} material={mats.floor} />
      <BoxSet items={parts.body} material={mats.wall} />
      <BoxSet items={parts.glaze.glass} material={mats.glass} cast={false} />
      <BoxSet items={parts.glaze.mullions} material={mats.timber} cast={false} />
      <BoxSet items={parts.deck} material={mats.timber} />
      <BoxSet items={parts.boards} material={mats.floor} cast={false} />
      <BoxSet items={parts.steps} material={mats.stone} />
      <BoxSet items={parts.colls} material={mats.timber} />
      <BoxSet items={parts.roof} material={mats.roof} />
      <BoxSet items={parts.fascia} material={mats.trim} cast={false} />
      <BoxSet items={[...parts.rails, ...parts.sideRails]} material={mats.trim} cast={false} />
      <BoxSet items={parts.posts} material={mats.trim} cast={false} />
    </group>
  );
}

function Pavilion({ module: m, mats, near, quality }: Props) {
  const { w, d } = localSize(m.rect, m.facing);
  const parts = useMemo(() => {
    const zBack = -d / 2;
    const bodyD = 6;
    const zFront = zBack + bodyD;
    const storey = 4.4;
    const plinth: Item[] = [{ p: [0, PLINTH / 2, 0], s: [w + 0.4, PLINTH, d + 0.4] }];
    const ground: Item[] = [{ p: [0, PLINTH + storey / 2, (zBack + zFront) / 2], s: [w, storey, bodyD] }];
    const terrace: Item[] = [{ p: [0, PLINTH + storey + 0.15, (zBack + d / 2) / 2], s: [w + 0.2, 0.3, d] }];
    const cols: Item[] = [];
    const nc = 9;
    for (let i = 0; i < nc; i++) cols.push({ p: [-w / 2 + 0.5 + ((w - 1) / (nc - 1)) * i, PLINTH + storey / 2, d / 2 - 0.5], s: [0.5, storey, 0.5] });
    const capitals: Item[] = cols.map((c) => ({ p: [c.p[0], PLINTH + storey - 0.12, c.p[2]], s: [0.78, 0.24, 0.78] }));
    const bases: Item[] = cols.map((c) => ({ p: [c.p[0], PLINTH + 0.14, c.p[2]], s: [0.72, 0.28, 0.72] }));
    const upperW = w - 2.4;
    const upperY = PLINTH + storey + 0.3;
    const upper: Item[] = [{ p: [0, upperY + 1.6, zBack + bodyD / 2], s: [upperW, 3.2, bodyD] }];
    const roof = gable(upperW, zFront + 0.6, zBack, upperY + 3.2, m.height - 0.3, 0.7);
    const rail: Item[] = [
      { p: [0, upperY + 1.0, d / 2 - 0.05], s: [w, 0.07, 0.07] },
      ...[-1, 1].map((e): Item => ({ p: [e * (w / 2 - 0.05), upperY + 1.0, (zFront + d / 2) / 2], s: [0.07, 0.07, d / 2 - bodyD / 2 + 0.2] })),
    ];
    const balusters: Item[] = [];
    const nb = Math.round(w / 0.7);
    if (quality === "high") for (let i = 0; i <= nb; i++) balusters.push({ p: [-w / 2 + 0.1 + ((w - 0.2) / nb) * i, upperY + 0.5, d / 2 - 0.05], s: [0.06, 1.0, 0.06] });
    const steps: Item[] = [0, 1, 2].map((k) => ({ p: [0, 0.12 + k * 0.17, d / 2 + 0.85 - k * 0.38], s: [4.2, 0.24 + k * 0.17, 0.5] }));
    const finials: Item[] = [-1, 1].map((e) => ({ p: [e * (upperW / 2 + 0.55), m.height + 0.05, (zFront + 0.6 + zBack) / 2], s: [0.22, 0.6, 0.22] }));
    return {
      plinth, ground, terrace, cols, capitals, bases, upper, roof, rail, balusters, steps, finials,
      glazeGround: glazing(w, zFront + 0.02, PLINTH + 1.9, 3.0, 7, false),
      glazeUpper: glazing(upperW, zBack + bodyD + 0.02, upperY + 1.6, 2.4, 6, false),
    };
  }, [w, d, m.height, quality]);
  return (
    <group rotation-y={FACE_ANGLE[m.facing]}>
      <ContactShadow w={w} d={d} grow={2.4} opacity={0.38} />
      <BoxSet items={parts.plinth} material={mats.floor} />
      <BoxSet items={parts.ground} material={mats.wall} />
      <BoxSet items={parts.glazeGround.glass} material={mats.glass} cast={false} />
      <BoxSet items={parts.glazeGround.mullions} material={mats.stone} cast={false} />
      <CylinderSet items={parts.cols} material={mats.wall} />
      <BoxSet items={parts.capitals} material={mats.stone} />
      <BoxSet items={parts.bases} material={mats.stone} />
      <BoxSet items={parts.terrace} material={mats.stone} />
      <BoxSet items={parts.upper} material={mats.wall} />
      <BoxSet items={parts.glazeUpper.glass} material={mats.glass} cast={false} />
      <BoxSet items={parts.glazeUpper.mullions} material={mats.stone} cast={false} />
      <BoxSet items={parts.rail} material={mats.trim} cast={false} />
      <LodGroup distance={near} enabled={quality === "high"}>
        <BoxSet items={parts.balusters} material={mats.trim} cast={false} />
      </LodGroup>
      <BoxSet items={parts.steps} material={mats.stone} />
      <BoxSet items={parts.roof.slabs} material={mats.roof} />
      <BoxSet items={parts.roof.trim} material={mats.trim} cast={false} />
      <CylinderSet items={parts.finials} material={mats.trim} cast={false} />
    </group>
  );
}

/** A single-storey suite and its own fenced yard, set apart from the stables. */
function VetSuite({ module: m, mats }: Props) {
  const { w, d } = localSize(m.rect, m.facing);
  const parts = useMemo(() => {
    const yardD = 3.4;
    const bodyD = d - yardD;
    const zBack = -d / 2;
    const zFront = zBack + bodyD;
    const body: Item[] = [{ p: [0, PLINTH + 1.55, zBack + bodyD / 2], s: [w, 3.1, bodyD] }];
    const plinth: Item[] = [{ p: [0, PLINTH / 2, 0], s: [w + 0.3, PLINTH, d + 0.3] }];
    const yard: Item[] = [{ p: [0, PLINTH / 2 + 0.02, zFront + yardD / 2], s: [w, PLINTH, yardD] }];
    const rise = 0.7;
    const run = bodyD + 1.0;
    const angle = Math.atan2(rise, run);
    const roof: Item[] = [{ p: [0, PLINTH + 3.1 + rise / 2 + 0.1, zBack + bodyD / 2 + 0.2], s: [w + 0.9, 0.16, Math.hypot(run, rise)], r: [angle, 0, 0] }];
    const eave: Item[] = [{ p: [0, PLINTH + 3.1 + 0.02, zFront + 0.5], s: [w + 0.95, 0.16, 0.07] }];
    const posts: Item[] = [];
    const rails: Item[] = [];
    const n = 4;
    for (let i = 0; i <= n; i++) posts.push({ p: [-w / 2 + (w / n) * i, PLINTH + 0.75, d / 2 - 0.08], s: [0.12, 1.5, 0.12] });
    for (const e of [-1, 1]) {
      posts.push({ p: [e * (w / 2 - 0.06), PLINTH + 0.75, zFront + yardD / 2], s: [0.12, 1.5, 0.12] });
      rails.push({ p: [e * (w / 2 - 0.06), PLINTH + 0.5, zFront + yardD / 2], s: [0.06, 0.09, yardD] }, { p: [e * (w / 2 - 0.06), PLINTH + 1.05, zFront + yardD / 2], s: [0.06, 0.09, yardD] });
    }
    for (const y of [0.5, 1.05]) rails.push({ p: [0, PLINTH + y, d / 2 - 0.08], s: [w, 0.09, 0.06] });
    const windows = glazing(w, zFront + 0.02, PLINTH + 1.7, 1.2, 3);
    return { body, plinth, yard, roof, eave, posts, rails, windows };
  }, [w, d]);
  return (
    <group rotation-y={FACE_ANGLE[m.facing]}>
      <ContactShadow w={w} d={d} grow={1.8} opacity={0.34} />
      <BoxSet items={parts.plinth} material={mats.floor} />
      <BoxSet items={parts.yard} material={mats.stone} />
      <BoxSet items={parts.body} material={mats.wall} />
      <BoxSet items={parts.windows.glass} material={mats.glass} cast={false} />
      <BoxSet items={parts.windows.mullions} material={mats.timber} cast={false} />
      <BoxSet items={parts.windows.doors} material={mats.roof} cast={false} />
      <BoxSet items={parts.posts} material={mats.timber} />
      <BoxSet items={parts.rails} material={mats.timber} />
      <BoxSet items={parts.roof} material={mats.roof} />
      <BoxSet items={parts.eave} material={mats.trim} cast={false} />
    </group>
  );
}

export function FacilityModel(props: Props) {
  switch (props.module.kind) {
    case "tack-room":
      return <TackRoom {...props} />;
    case "lounge":
      return <Lounge {...props} />;
    case "pavilion":
      return <Pavilion {...props} />;
    case "vet-suite":
      return <VetSuite {...props} />;
    default:
      return null;
  }
}
