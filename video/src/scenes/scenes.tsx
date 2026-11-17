import React from "react";
import { interpolate, random } from "remotion";
import { DISPLAY, SANS } from "../lib/fonts";
import { InkDefs } from "../lib/ink";
import { Camera, H, Plane, Plate, W, house, img, prog } from "../lib/stage";
import { ANTIQUE, CHESTNUT, IVORY, LEATHER, PathTitle, Shade } from "../lib/title";

/*
 * The ten scenes of "The Lineage". Every image is the website's own approved artwork in public/ (history scene layers
 * -b/-s/-f, the Pratap & Chetak painted bands, the shared parchment, the official crest and the bondField photograph).
 * Every title is the website's own copy: the two-voice headline of that page's reel in lib/content/site.ts, and the
 * place labels of the history scenes in lib/content/history/*.ts. Nothing is invented.
 */

const IN = "images/history/india/";
const JH = "images/history/lakshmibai/";
const AL = "images/history/alexander/";
const WO = "images/history/world/";
const PR = "images/story/pratap/";
const PAPER = "images/history/shared/sh01.webp";
const STAMP = "brand/bsah-stamp-mark.webp";
const BOND = "media/bond-field-cadet.webp";

export const ARTWORK = [
  PAPER, STAMP, BOND,
  `${IN}in01-b.webp`, `${IN}in01-s.webp`, `${IN}in01-f.webp`,
  `${IN}in02-s.webp`, `${IN}in02-f.webp`, `${IN}in08-b.webp`, `${IN}in08-s.webp`,
  `${PR}sunset.webp`, `${PR}el-birds.webp`, `${PR}haldighati.webp`, `${PR}battle-army.webp`, `${PR}charge.webp`,
  `${PR}dust.webp`, `${PR}band-fg.webp`, `${PR}banners.webp`, `${PR}rocks.webp`,
  `${JH}jh06-b.webp`, `${JH}jh06-s.webp`, `${JH}jh06-f.webp`,
  `${AL}al02-b.webp`, `${AL}al02-s.webp`, `${AL}al02-f.webp`,
  `${WO}wo02-b.webp`, `${WO}wo02-s.webp`, `${WO}wo02-f.webp`, `${WO}wo05-s.webp`,
];

/** Cutout size (the -s layers are 1168×880) scaled to a height. */
const cut = (h: number) => ({ w: (h * 1168) / 880, h });

/** A camera that glides from x0 to x1 and pushes from p0 to p1 across the scene. */
const glideCam = (t: number, x0: number, x1: number, p0: number, p1: number, y = 0): Camera => ({
  x: interpolate(t, [0, 1], [x0, x1]),
  y,
  push: interpolate(t, [0, 1], [p0, p1]),
});

/** Parchment ground: ivory with the sh01 paper tiled over it. */
export function Paper({ id, opacity = 1 }: { id: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <defs>
        <pattern id={`${id}-pp`} patternUnits="userSpaceOnUse" width={1024} height={1024}>
          <image href={img(PAPER)} width={1024} height={1024} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="#F3EDE2" />
      <rect width={W} height={H} fill={`url(#${id}-pp)`} opacity={0.9} />
    </g>
  );
}

/** The official crest (white on black stamp mark) turned into chestnut ink on the paper. */
function Crest({ id, cx, cy, size, amount, color = CHESTNUT }: { id: string; cx: number; cy: number; size: number; amount: number; color?: string }) {
  const c = hexToRgb(color);
  return (
    <g>
      <InkDefs id={`${id}-ink`} amount={amount} cx={cx} cy={cy} tear={60} grain={0.02} seed={11} />
      <defs>
        <filter id={`${id}-tone`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`0 0 0 0 ${c[0]}  0 0 0 0 ${c[1]}  0 0 0 0 ${c[2]}  0.34 0.33 0.33 0 0`} />
        </filter>
      </defs>
      <g mask={`url(#${id}-ink)`}>
        <image href={img(STAMP)} x={cx - size / 2} y={cy - size / 2} width={size} height={size} filter={`url(#${id}-tone)`} />
      </g>
    </g>
  );
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/* ───────────── S0 · 0:00 parchment, the crest inks in ───────────── */
export function S0Crest({ f }: { f: number }) {
  const t = prog(f, 0, 170);
  const s = 1 + 0.06 * t;
  return (
    <g>
      <Paper id="s0" />
      <g transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-W / 2} ${-H / 2})`}>
        <Crest id="s0c" cx={W / 2} cy={470} size={500} amount={prog(f, 8, 78, house)} />
        <text x={W / 2} y={800} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={22} letterSpacing={8} fill={LEATHER} opacity={prog(f, 60, 100)}>
          AN 800-YEAR LINEAGE
        </text>
      </g>
    </g>
  );
}

/* ───────────── S1 · 0:04 the Thar at dusk, the Marwari (India IN01) ───────────── */
export function S1Marwar({ f }: { f: number }) {
  const t = prog(f, 120, 330);
  const cam = glideCam(t, 150, -150, 0, 0.06);
  const r = cut(690);
  return (
    <g>
      <Plate href={`${IN}in01-b.webp`} cam={cam} p={0.3} />
      <Plane href={`${IN}in01-s.webp`} x={520 + 260 * t} y={H - r.h - 18} w={r.w} h={r.h} p={1} cam={cam} />
      <Plane href={`${IN}in01-f.webp`} x={-340} y={H - 1114 + 290} w={2600} h={1114} p={1.6} cam={cam} />
      <Shade id="s1-sh" side="l" strength={0.66} />
      <PathTitle id="s1-t" kicker="Marwar, Rajasthan" inscription="The horse," voice="the crown & the empire." x0={130} x1={1180} y={350} size={92} inAmt={prog(f, 172, 222)} outAmt={prog(f, 288, 312)} />
    </g>
  );
}

/* ───────────── S2 · 0:11 Shalihotra to the Mughal stables (India IN02, IN08) ───────────── */
export function S2Mughal({ f }: { f: number }) {
  const t = prog(f, 330, 530);
  const cam = glideCam(t, -130, 130, 0.02, 0.08);
  const a = cut(640);
  const b = cut(650);
  return (
    <g>
      <Plate href={`${IN}in08-b.webp`} cam={cam} p={0.3} />
      <Plane href={`${IN}in02-s.webp`} x={110} y={H - a.h - 10} w={a.w} h={a.h} p={0.9} cam={cam} />
      <Plane href={`${IN}in08-s.webp`} x={960 + 150 * t} y={H - b.h - 8} w={b.w} h={b.h} p={1} cam={cam} />
      <Plane href={`${IN}in02-f.webp`} x={-340} y={H - 1114 + 330} w={2600} h={1114} p={1.6} cam={cam} />
      <Shade id="s2-sh" side="t" strength={0.7} />
      <PathTitle id="s2-t" kicker="The Shalihotra tradition · Mughal India" inscription="Eight centuries." voice="One lineage." x0={560} x1={1360} y={340} size={100} align="middle" inAmt={prog(f, 350, 400)} outAmt={prog(f, 470, 495)} />
    </g>
  );
}

/* ───────────── S3 · 0:16 Haldighati, 1576: Pratap and Chetak (the Pratap painted bands) ───────────── */
export function S3Haldighati({ f }: { f: number }) {
  const t = prog(f, 480, 720);
  const cam = glideCam(t, 110, -170, 0.02, 0.11);
  return (
    <g>
      <Plate href={`${PR}sunset.webp`} cam={cam} p={0.15} over={1.2} />
      <Plane href={`${PR}el-birds.webp`} x={180 - 220 * t} y={90} w={1100} h={541} p={0.4} cam={cam} opacity={0.7} />
      <Plane href={`${PR}haldighati.webp`} x={0} y={520} w={1920} h={506} p={0.45} cam={cam} />
      <Plane href={`${PR}battle-army.webp`} x={260} y={500} w={1500} h={514} p={0.65} cam={cam} />
      <Plane href={`${PR}dust.webp`} x={-260 + 300 * t} y={470} w={1200} h={699} p={0.9} cam={cam} opacity={0.38} />
      <Plane href={`${PR}charge.webp`} x={300 + 380 * t} y={H - 700 - 30} w={1022} h={700} p={1} cam={cam} />
      <Plane href={`${PR}band-fg.webp`} x={-260} y={H - 650 + 420} w={2440} h={650} p={1.6} cam={cam} />
      <Shade id="s3-sh" side="r" strength={0.66} />
      <PathTitle id="s3-t" kicker="Haldighati, June 1576" inscription="A bond" voice="through the storm." x0={1010} x1={1850} y={330} size={84} inAmt={prog(f, 545, 595)} outAmt={prog(f, 668, 692)} />
    </g>
  );
}

/* ───────────── S4 · 0:24 Jhansi at night, Lakshmibai rides out (JH06) ───────────── */
export function S4Jhansi({ f }: { f: number }) {
  const t = prog(f, 720, 900);
  const cam = glideCam(t, -40, -200, 0.03, 0.05, 10);
  const r = cut(730);
  return (
    <g>
      <Plate href={`${JH}jh06-b.webp`} cam={cam} p={0.3} />
      <Embers f={f} start={720} />
      <Plane href={`${JH}jh06-s.webp`} x={340 + 420 * t} y={H - r.h - 6} w={r.w} h={r.h} p={1} cam={cam} />
      <Plane href={`${JH}jh06-f.webp`} x={-340} y={H - 1114 + 320} w={2600} h={1114} p={1.6} cam={cam} />
      <Shade id="s4-sh" side="l" strength={0.5} />
      <PathTitle id="s4-t" kicker="Jhansi to Kalpi, April 1858" inscription="Jhansi will not" voice="be surrendered." x0={130} x1={1030} y={330} size={96} inAmt={prog(f, 742, 792)} outAmt={prog(f, 850, 872)} />
    </g>
  );
}

/** Embers rising past the fort walls: small warm sparks, seeded so every render is identical. */
function Embers({ f, start }: { f: number; start: number }) {
  const n = 34;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const speed = 1.2 + random(`e-s-${i}`) * 2.2;
    const life = (f - start + random(`e-o-${i}`) * 260) * speed;
    const y = H - 120 - (life % 900);
    const x = random(`e-x-${i}`) * W + Math.sin((f + i * 40) / 23) * 18;
    const r = 1.4 + random(`e-r-${i}`) * 2.6;
    const o = interpolate(life % 900, [0, 120, 700, 900], [0, 0.95, 0.6, 0]);
    out.push(<circle key={i} cx={x} cy={y} r={r} fill="#F2A65A" opacity={o} />);
  }
  return (
    <g>
      <defs>
        <filter id="ember-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.2} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#ember-glow)" style={{ mixBlendMode: "screen" }}>
        {out}
      </g>
    </g>
  );
}

/* ───────────── S5 · 0:30 Alexander and Bucephalus, turned toward the sun (AL02) ───────────── */
export function S5Alexander({ f }: { f: number }) {
  const t = prog(f, 900, 1105);
  const cam = glideCam(t, 210, -70, 0, 0.08);
  const r = cut(700);
  const sun = { x: 1383 + cam.x * 0.3, y: 327 };
  return (
    <g>
      <Plate href={`${AL}al02-b.webp`} cam={cam} p={0.3} />
      <defs>
        <radialGradient id="s5-bloom">
          <stop offset="0" stopColor="#FFE2A8" stopOpacity={0.85} />
          <stop offset="1" stopColor="#FFE2A8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={sun.x} cy={sun.y} r={260 + 160 * t} fill="url(#s5-bloom)" opacity={0.25 + 0.5 * t} style={{ mixBlendMode: "screen" }} />
      <Plane href={`${AL}al02-s.webp`} x={760} y={H - r.h - 8} w={r.w} h={r.h} p={1} cam={cam} />
      <Plane href={`${AL}al02-f.webp`} x={-340} y={H - 1114 + 330} w={2600} h={1114} p={1.6} cam={cam} />
      <Shade id="s5-sh" side="l" strength={0.62} />
      <PathTitle id="s5-t" kicker="Macedon, Alexander's boyhood" inscription="The shadow." voice="The boy." x0={140} x1={860} y={340} size={110} inAmt={prog(f, 925, 975)} outAmt={prog(f, 1030, 1052)} />
    </g>
  );
}

/* ───────────── S6 · 0:35 the world: the Silk Roads and the steppe (WO02, WO05) ───────────── */
export const ROUTE_S6 = "M -60 600 C 260 540, 520 640, 820 575 S 1360 500, 1990 545";
export function S6World({ f }: { f: number }) {
  const t = prog(f, 1050, 1290);
  const cam = glideCam(t, 160, -200, 0.02, 0.07);
  const a = cut(600);
  const b = cut(620);
  const draw = prog(f, 1110, 1220);
  const tr = `translate(${W / 2 + cam.x * 0.5} ${H / 2}) scale(${1 + cam.push * 0.5}) translate(${-W / 2} ${-H / 2})`;
  return (
    <g>
      <Plate href={`${WO}wo02-b.webp`} cam={cam} p={0.3} />
      <g transform={tr}>
        <defs>
          <mask id="s6-route" maskUnits="userSpaceOnUse" x={-200} y={0} width={2400} height={H}>
            <path d={ROUTE_S6} pathLength={1} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          </mask>
        </defs>
        <path d={ROUTE_S6} pathLength={1} fill="none" stroke={LEATHER} strokeWidth={9} strokeLinecap="round" strokeDasharray="0.012 0.008" mask="url(#s6-route)" opacity={0.35} />
        <path d={ROUTE_S6} pathLength={1} fill="none" stroke={IVORY} strokeWidth={5} strokeLinecap="round" strokeDasharray="0.012 0.008" mask="url(#s6-route)" opacity={0.95} />
      </g>
      <Plane href={`${WO}wo02-s.webp`} x={170 + 230 * t} y={H - a.h - 24} w={a.w} h={a.h} p={0.9} cam={cam} />
      <Plane href={`${WO}wo05-s.webp`} x={980 + 320 * t} y={H - b.h - 70} w={b.w} h={b.h} p={1.1} cam={cam} />
      <Plane href={`${WO}wo02-f.webp`} x={-340} y={H - 1114 + 340} w={2600} h={1114} p={1.6} cam={cam} />
      <Shade id="s6-sh" side="l" strength={0.6} />
      <PathTitle id="s6-t" kicker="The Silk Roads · The steppe" inscription="Silk roads." voice="Iron roads." x0={130} x1={900} y={330} size={110} inAmt={prog(f, 1100, 1150)} outAmt={prog(f, 1205, 1228)} />
    </g>
  );
}

/* ───────────── S7 · 0:41 pull back to the whole lineage on the map ───────────── */
type Medal = { label: string; x: number; y: number; plate: string; cutout?: string; cutH?: number; cutX?: number };
export const MEDALS: Medal[] = [
  { label: "Marwar", x: 300, y: 650, plate: `${IN}in01-b.webp`, cutout: `${IN}in01-s.webp` },
  { label: "Mughal India", x: 610, y: 410, plate: `${IN}in08-b.webp`, cutout: `${IN}in08-s.webp` },
  { label: "Haldighati", x: 930, y: 670, plate: `${PR}sunset.webp`, cutout: `${PR}charge.webp` },
  { label: "Jhansi", x: 1240, y: 410, plate: `${JH}jh06-b.webp`, cutout: `${JH}jh06-s.webp` },
  { label: "Macedon", x: 1540, y: 670, plate: `${AL}al02-b.webp`, cutout: `${AL}al02-s.webp` },
  { label: "The Silk Roads", x: 1640, y: 360, plate: `${WO}wo02-b.webp`, cutout: `${WO}wo05-s.webp` },
];
export const MEDAL_R = 128;
/** Where S6 contracts to: the last medallion, in frame space at the start of S7's rise. */
export const S7_SCALE0 = 1.12;
export const s7Point = (m: Medal, s: number) => ({ x: W / 2 + (m.x - W / 2) * s, y: H / 2 + (m.y - H / 2) * s });

export function S7Map({ f }: { f: number }) {
  const rise = prog(f, 1290, 1440);
  const s = interpolate(rise, [0, 1], [S7_SCALE0, 1]);
  const route = `M ${MEDALS.map((m) => `${m.x} ${m.y}`).join(" L ")}`;
  const draw = prog(f, 1275, 1420);
  return (
    <g>
      <Paper id="s7" />
      <g transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-W / 2} ${-H / 2})`}>
        <path d={route} pathLength={1} fill="none" stroke={CHESTNUT} strokeWidth={3} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={0.55} />
        {MEDALS.map((m, i) => {
          const last = i === MEDALS.length - 1;
          const a = last ? 1 : prog(f, 1270 + i * 24, 1320 + i * 24, house);
          return <Medallion key={m.label} id={`m${i}`} m={m} amount={a} labelIn={last ? prog(f, 1290, 1330) : prog(f, 1300 + i * 24, 1340 + i * 24)} />;
        })}
      </g>
    </g>
  );
}

function Medallion({ id, m, amount, labelIn }: { id: string; m: Medal; amount: number; labelIn: number }) {
  if (amount <= 0) return null;
  const R = MEDAL_R;
  const ch = R * 1.5;
  const cw = (ch * 1168) / 880;
  return (
    <g>
      <InkDefs id={`${id}-ink`} amount={amount} cx={m.x} cy={m.y} tear={46} grain={0.025} seed={5} />
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx={m.x} cy={m.y} r={R} />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-ink)`}>
        <g clipPath={`url(#${id}-clip)`}>
          <image href={img(m.plate)} x={m.x - R * 2} y={m.y - R * 1.15} width={R * 4} height={R * 2.3} preserveAspectRatio="xMidYMid slice" />
          {m.cutout && <image href={img(m.cutout)} x={m.x - cw / 2} y={m.y + R - ch * 0.98} width={cw} height={ch} preserveAspectRatio="xMidYMid meet" />}
        </g>
        <circle cx={m.x} cy={m.y} r={R} fill="none" stroke={CHESTNUT} strokeWidth={3} />
        <circle cx={m.x} cy={m.y} r={R + 9} fill="none" stroke={CHESTNUT} strokeWidth={1} opacity={0.6} />
      </g>
      <text x={m.x} y={m.y + R + 46} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={19} letterSpacing={5} fill={LEATHER} opacity={labelIn}>
        {m.label.toUpperCase()}
      </text>
    </g>
  );
}

/* ───────────── S8 · 0:48 today: a cadet and a horse (the bondField photograph) ───────────── */
export function S8Today({ f }: { f: number }) {
  const t = prog(f, 1440, 1665);
  const pw = 1100;
  const ph = (pw * 1340) / 2400;
  const px = 790;
  const py = (H - ph) / 2 + 10;
  const s = 1 + 0.05 * t;
  const cx = px + pw / 2;
  const cy = py + ph / 2;
  return (
    <g>
      <Paper id="s8" />
      <InkDefs id="s8-photo" amount={1} radius={interpolate(prog(f, 1450, 1525, house), [0, 1], [1, 560])} cx={cx} cy={cy} tear={150} grain={0.009} seed={8} />
      <defs>
        <filter id="s8-grade" colorInterpolationFilters="sRGB">
          {/* warm the photograph toward the paper: a gentle sepia mix, held contrast */}
          <feColorMatrix type="matrix" values="0.86 0.2 0.04 0 0.02  0.12 0.82 0.06 0 0.01  0.08 0.16 0.66 0 0  0 0 0 1 0" />
        </filter>
      </defs>
      <g mask="url(#s8-photo)" style={{ mixBlendMode: "multiply" }}>
        <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
          <image href={img(BOND)} x={px - 60} y={py - 34} width={pw + 120} height={ph + 68} preserveAspectRatio="xMidYMid slice" filter="url(#s8-grade)" />
        </g>
      </g>
      <PathTitle id="s8-t" inscription="Eight hundred years," voice="handed to your child." x0={96} x1={720} y={600} bend={16} size={60} ink={LEATHER} gold={CHESTNUT} inAmt={prog(f, 1490, 1545)} />
    </g>
  );
}

/* ───────────── S9 · 0:55 end card: crest, the brand lockup, the motto ───────────── */
export function S9End({ f }: { f: number }) {
  return (
    <g>
      <Paper id="s9" />
      <Crest id="s9c" cx={W / 2} cy={330} size={330} amount={prog(f, 1650, 1705, house)} />
      <g opacity={prog(f, 1680, 1715)}>
        {/* The brand lockup as the site draws it (components/brand/Wordmark.tsx): BLACK STALLION, ACADEMY OF HORSEMANSHIP under it. */}
        <text x={W / 2} y={600} textAnchor="middle" fontFamily={DISPLAY} fontWeight={600} fontSize={66} letterSpacing={66 * 0.07} fill={LEATHER}>
          BLACK STALLION
        </text>
        <text x={W / 2} y={645} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={24} letterSpacing={24 * 0.15 * 1.4} fill={CHESTNUT}>
          ACADEMY OF HORSEMANSHIP
        </text>
      </g>
      <text x={W / 2} y={745} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontWeight={420} fontSize={44} fill={CHESTNUT} opacity={prog(f, 1705, 1735)}>
        Dominus sui, dominus equi
      </text>
      <text x={W / 2} y={830} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={21} letterSpacing={7} fill={LEATHER} opacity={prog(f, 1720, 1750)}>
        BLACKSTALLION.ACADEMY
      </text>
    </g>
  );
}

export { ANTIQUE, IVORY };
