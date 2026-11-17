import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFonts } from "./lib/fonts";
import { Finish, usePreload } from "./lib/finish";
import { InkDefs } from "./lib/ink";
import { Occluder } from "./lib/occluder";
import { H, W, house, prog } from "./lib/stage";
import {
  ARTWORK,
  MEDALS,
  MEDAL_R,
  S0Crest,
  S1Marwar,
  S2Mughal,
  S3Haldighati,
  S4Jhansi,
  S5Alexander,
  S6World,
  S7Map,
  S8Today,
  S9End,
  S7_SCALE0,
  s7Point,
} from "./scenes/scenes";

loadFonts();

/**
 * "The Lineage": 60 s at 30 fps. Scenes in z-order with the frames they are on screen. A scene can enter through an
 * ink-bleed matte (`ink`), and the cuts at 330, 720 and 900 are hidden behind occluder wipes. The map (S7) sits under
 * the world scene so that scene can shrink, as ink, into its own medallion on the map.
 */
type Entry = {
  key: string;
  from: number;
  to: number;
  C: (p: { f: number }) => React.ReactElement;
  ink?: { a: number; b: number; cx: number; cy: number; seed?: number };
  opacityIn?: [number, number];
};

const last = MEDALS[MEDALS.length - 1];
const lastPt = s7Point(last, S7_SCALE0);

export const SCENES: Entry[] = [
  { key: "s0", from: 0, to: 176, C: S0Crest },
  { key: "s1", from: 120, to: 330, C: S1Marwar, ink: { a: 120, b: 176, cx: W / 2, cy: 470, seed: 3 } },
  { key: "s2", from: 330, to: 536, C: S2Mughal },
  { key: "s3", from: 480, to: 720, C: S3Haldighati, ink: { a: 480, b: 536, cx: 420, cy: 600, seed: 7 } },
  { key: "s4", from: 720, to: 900, C: S4Jhansi },
  { key: "s5", from: 900, to: 1106, C: S5Alexander },
  { key: "s7", from: 1236, to: 1496, C: S7Map },
  { key: "s6", from: 1050, to: 1292, C: S6World, ink: { a: 1050, b: 1106, cx: 1500, cy: 520, seed: 13 } },
  { key: "s8", from: 1440, to: 1666, C: S8Today, ink: { a: 1440, b: 1496, cx: W / 2, cy: H / 2, seed: 17 } },
  { key: "s9", from: 1624, to: 1800, C: S9End, opacityIn: [1624, 1664] },
];

export const Film: React.FC = () => {
  usePreload(ARTWORK);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#171513" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
        {SCENES.filter((s) => f >= s.from && f < s.to).map((s) => {
          const body = <s.C f={f} />;
          let node = body;
          if (s.ink && f < s.ink.b) {
            const id = `${s.key}-in`;
            node = (
              <g>
                <InkDefs id={id} amount={prog(f, s.ink.a, s.ink.b, house)} cx={s.ink.cx} cy={s.ink.cy} seed={s.ink.seed} />
                <g mask={`url(#${id})`}>{body}</g>
              </g>
            );
          }
          // The world scene shrinks, as ink, into its medallion on the map.
          if (s.key === "s6" && f >= 1236) {
            const k = prog(f, 1236, 1290, house);
            const cx = W / 2 + (lastPt.x - W / 2) * k;
            const cy = H / 2 + (lastPt.y - H / 2) * k;
            const radius = (Math.hypot(W, H) * 0.62 + 240) * (1 - k) + MEDAL_R * S7_SCALE0 * k;
            node = (
              <g>
                <InkDefs id="s6-out" amount={1} radius={radius} cx={cx} cy={cy} seed={21} tear={170 * (1 - k) + 10 * k} />
                <g mask="url(#s6-out)">{body}</g>
              </g>
            );
          }
          if (s.opacityIn) node = <g opacity={prog(f, s.opacityIn[0], s.opacityIn[1])}>{node}</g>;
          return <React.Fragment key={s.key}>{node}</React.Fragment>;
        })}

        {/* Occluder wipes: a dark silhouette passes right in front of the lens and hides each cut. */}
        <Occluder id="o1" href="images/history/india/in01-s.webp" t={prog(f, 300, 360)} dir={-1} />
        <Occluder id="o2" href="images/story/pratap/banners.webp" t={prog(f, 690, 750)} dir={1} />
        <Occluder id="o3" href="images/story/pratap/rocks.webp" t={prog(f, 870, 930)} dir={-1} y={-H * 0.25} h={H * 1.6} />

        <Finish frame={f} />
      </svg>
    </AbsoluteFill>
  );
};
