import { FAR_OFFSET, REST, capsule, line, longBone, place, poly, spline, vec, type FP, type LimbId, type Pose, type V } from "./atlas-rig";

/**
 * Everything the atlas draws, as geometry computed from a pose. Shapes are authored in rest-pose coordinates inside the frame
 * they belong to (see atlas-rig.ts), so they follow the skeleton. Superficial muscle groups only, lateral (near-side) view.
 */

export type Layer = "farBody" | "body" | "tack" | "farBone" | "bone" | "muscle" | "riderBody" | "riderBone" | "riderNear";

export type ShapeDef = {
  id: string;
  layer: Layer;
  /** structure id for highlighting and labels (lib/content/anatomy-atlas.ts) */
  structure?: string;
  /** visual class key */
  tone: string;
  stroke?: boolean;
};

const { add, sub } = vec;

/* ------------------------------------------------------------------ frames per limb */
const off = (id: LimbId): V => (id.startsWith("R") ? FAR_OFFSET : [0, 0]);
const fp = (frame: string, p: V, o: V = [0, 0]): FP => [frame, p[0] + o[0], p[1] + o[1]];

/* ------------------------------------------------------------------ outlines (rest coordinates) */
const TRUNK_OUTLINE = (L: string, H: string): FP[] => [
  ["trunk", 455, 262],
  ["trunk", 500, 279],
  ["trunk", 548, 289],
  ["trunk", 600, 289],
  ["trunk", 652, 283],
  ["trunk", 700, 271],
  ["trunk", 730, 266],
  ["trunk", 768, 279],
  ["trunk", 800, 308],
  ["trunk", 818, 350],
  [`${H}.fem`, 820, 396],
  [`${H}.fem`, 810, 440],
  [`${H}.tib`, 790, 488],
  [`${H}.tib`, 784, 520],
  [`${H}.tib`, 752, 524],
  [`${H}.tib`, 726, 506],
  [`${H}.fem`, 696, 480],
  [`${H}.fem`, 686, 452],
  ["trunk", 660, 440],
  ["trunk", 624, 466],
  ["trunk", 545, 488],
  ["trunk", 472, 494],
  [`${L}.hum`, 432, 486],
  [`${L}.hum`, 416, 488],
  [`${L}.hum`, 386, 482],
  [`${L}.hum`, 366, 458],
  [`${L}.scap`, 346, 412],
  ["trunk", 350, 372],
  ["trunk", 400, 304],
  ["trunk", 428, 275],
];

const NECK_HEAD: FP[] = [
  ["trunk", 432, 272],
  ["neck", 384, 276],
  ["neck", 334, 262],
  ["neck", 290, 246],
  ["head", 254, 238],
  ["head", 236, 242],
  ["head", 214, 250],
  ["head", 192, 274],
  ["head", 168, 312],
  ["head", 146, 348],
  ["head", 126, 380],
  ["head", 114, 398],
  ["head", 118, 412],
  ["head", 132, 420],
  ["head", 156, 416],
  ["head", 184, 406],
  ["head", 214, 394],
  ["head", 240, 372],
  ["head", 254, 340],
  ["neck", 272, 340],
  ["neck", 302, 362],
  ["neck", 330, 386],
  [`LF.scap`, 348, 408],
  ["trunk", 380, 340],
];

const EAR_NEAR: FP[] = [["head", 226, 248], ["head", 228, 222], ["head", 234, 198], ["head", 244, 186], ["head", 246, 194], ["head", 240, 214], ["head", 240, 246]];
const EAR_FAR: FP[] = [["head", 240, 246], ["head", 248, 220], ["head", 250, 198], ["head", 242, 186], ["head", 238, 192], ["head", 241, 210], ["head", 236, 246]];

const TAIL: FP[] = [
  ["tail", 766, 286],
  ["tail", 792, 296],
  ["tail", 814, 330],
  ["tail", 826, 400],
  ["tail", 836, 480],
  ["tail", 846, 560],
  ["tail", 840, 620],
  ["tail", 822, 640],
  ["tail", 812, 600],
  ["tail", 806, 520],
  ["tail", 796, 440],
  ["tail", 786, 370],
  ["tail", 774, 316],
];

const foreLower = (id: LimbId): FP[] => {
  const o = off(id);
  return [
    fp(`${id}.hum`, [384, 470], o),
    fp(`${id}.rad`, [380, 500], o),
    fp(`${id}.rad`, [383, 540], o),
    fp(`${id}.can`, [381, 562], o),
    fp(`${id}.can`, [386, 590], o),
    fp(`${id}.can`, [387, 616], o),
    fp(`${id}.pas`, [383, 634], o),
    fp(`${id}.pas`, [374, 652], o),
    fp(`${id}.hoof`, [362, 664], o),
    fp(`${id}.hoof`, [344, 699], o),
    fp(`${id}.hoof`, [388, 699], o),
    fp(`${id}.hoof`, [392, 682], o),
    fp(`${id}.pas`, [402, 660], o),
    fp(`${id}.pas`, [409, 638], o),
    fp(`${id}.can`, [404, 610], o),
    fp(`${id}.can`, [404, 578], o),
    fp(`${id}.can`, [408, 562], o),
    fp(`${id}.rad`, [412, 548], o),
    fp(`${id}.rad`, [413, 518], o),
    fp(`${id}.rad`, [420, 500], o),
    fp(`${id}.hum`, [418, 474], o),
  ];
};

const hindLower = (id: LimbId): FP[] => {
  const o = off(id);
  return [
    fp(`${id}.tib`, [728, 506], o),
    fp(`${id}.tib`, [744, 528], o),
    fp(`${id}.can`, [748, 556], o),
    fp(`${id}.can`, [750, 590], o),
    fp(`${id}.can`, [750, 618], o),
    fp(`${id}.pas`, [747, 636], o),
    fp(`${id}.pas`, [740, 654], o),
    fp(`${id}.hoof`, [731, 667], o),
    fp(`${id}.hoof`, [714, 699], o),
    fp(`${id}.hoof`, [758, 699], o),
    fp(`${id}.hoof`, [762, 684], o),
    fp(`${id}.pas`, [770, 662], o),
    fp(`${id}.pas`, [774, 642], o),
    fp(`${id}.can`, [771, 610], o),
    fp(`${id}.can`, [771, 566], o),
    fp(`${id}.can`, [790, 532], o),
    fp(`${id}.tib`, [786, 506], o),
    fp(`${id}.tib`, [782, 486], o),
  ];
};

/** far-side thigh/forearm masses, so the far limbs read as limbs behind the body */
const farUpper = (fore: boolean, id: LimbId): FP[] => {
  const o = off(id);
  return fore
    ? [fp(`${id}.hum`, [372, 440], o), fp(`${id}.hum`, [430, 470], o), fp(`${id}.rad`, [420, 504], o), fp(`${id}.rad`, [380, 504], o)]
    : [fp(`${id}.fem`, [700, 440], o), fp(`${id}.fem`, [800, 420], o), fp(`${id}.tib`, [786, 500], o), fp(`${id}.tib`, [728, 506], o)];
};

const hoofCap = (id: LimbId, fore: boolean): FP[] => {
  const o = off(id);
  const K = fore ? REST.fore.K : REST.hind.K;
  const pts: V[] = [[-12, -1], [-30, 35], [14, 35], [18, 18], [12, -3]];
  return pts.map((p) => fp(`${id}.hoof`, add(K, p), o));
};
const coffin = (id: LimbId, fore: boolean): FP[] => {
  const o = off(id);
  const K = fore ? REST.fore.K : REST.hind.K;
  const pts: V[] = [[-8, 4], [-25, 32], [9, 32], [10, 16], [4, 4]];
  return pts.map((p) => fp(`${id}.hoof`, add(K, p), o));
};

/* ------------------------------------------------------------------ skull */
const SKULL: FP[] = (
  [
    [242, 254], [232, 246], [220, 248], [204, 256], [188, 268], [168, 296], [148, 330], [130, 362], [120, 384], [116, 398], [122, 406],
    [146, 400], [176, 388], [204, 378], [224, 362], [234, 340], [238, 316], [246, 300], [252, 276],
  ] as V[]
).map((p) => ["head", p[0], p[1]] as FP);
const MANDIBLE: FP[] = (
  [
    [234, 300], [246, 326], [250, 356], [240, 384], [208, 400], [168, 410], [130, 414], [121, 409], [150, 402], [186, 392], [214, 380], [228, 354], [230, 320],
  ] as V[]
).map((p) => ["head", p[0], p[1]] as FP);

/* ------------------------------------------------------------------ axial skeleton (trunk frame) */
const THORACIC: V[] = Array.from({ length: 18 }, (_, i) => {
  const t = i / 17;
  return [397 + (614 - 397) * t, 347 - 26 * Math.sin(Math.PI * t * 0.7) - 4 * t];
});
const T_SPINE_TIPS: V[] = [
  [408, 300], [420, 284], [432, 274], [445, 268], [458, 266], [471, 269], [484, 274], [497, 281], [509, 288], [520, 294],
  [531, 298], [543, 300], [555, 301], [567, 302], [579, 302], [592, 302], [605, 300], [617, 299],
];
const LUMBAR: V[] = Array.from({ length: 6 }, (_, i) => [630 + i * 13.5, 322 + i * 1.2]);
const L_TIPS: V[] = LUMBAR.map((p) => [p[0] - 5, 300 + (p[0] - 630) * -0.02]);
const CERVICAL: V[] = [[247, 268], [268, 287], [295, 306], [318, 324], [338, 340], [357, 352], [378, 352], [397, 347]];
const STERNUM: V[] = [[352, 446], [370, 442], [430, 458], [500, 474], [508, 484], [498, 488], [428, 472], [364, 456]];
const PELVIS: V[] = [[680, 298], [704, 286], [728, 284], [746, 300], [758, 345], [786, 364], [808, 380], [806, 398], [780, 404], [752, 402], [736, 398], [740, 380], [722, 344], [694, 320]];
const SACRUM: V[] = [[700, 320], [732, 324], [762, 334], [764, 348], [732, 342], [702, 336]];
const SCAPULA: V[] = [[418, 276], [446, 290], [474, 316], [446, 342], [400, 372], [383, 390], [370, 397], [356, 386], [360, 372], [384, 336], [404, 300]];
const SCAP_CART: V[] = [[414, 270], [450, 282], [480, 308], [474, 316], [446, 290], [418, 276]];
const CAUDAL: V[] = [[766, 344], [778, 356], [790, 372], [799, 392], [806, 414], [810, 438], [813, 462], [815, 486]];

function rib(i: number): { bone: [V, V, V]; cart: [V, V] | null } {
  const top = add(THORACIC[i], [4, 6]);
  const k = i + 1;
  let bot: V;
  if (k <= 8) {
    const t = (k - 1) / 7;
    bot = [372 + (500 - 372) * t, 450 + (480 - 450) * t];
  } else {
    const t = (k - 9) / 9;
    bot = [518 + (632 - 518) * t, 476 + (398 - 476) * t];
  }
  const boneEnd: V = k <= 8 ? vec.lerpV(top, bot, 0.78) : bot;
  const ctrl: V = [top[0] + (bot[0] - top[0]) * 0.55 + 30, top[1] + (bot[1] - top[1]) * 0.45];
  return { bone: [top, ctrl, boneEnd], cart: k <= 8 ? [boneEnd, bot] : null };
}

/* neck muscles are laid out as bands between the crest and the throat line, so they always sit inside the neck */
const NECK_CREST: V[] = [[252, 248], [292, 252], [336, 266], [384, 282], [420, 298]];
const NECK_VENTRAL: V[] = [[250, 322], [274, 340], [302, 362], [330, 384], [350, 404]];
const along = (pts: V[], t: number): V => {
  const x = t * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(x));
  return vec.lerpV(pts[i], pts[i + 1], x - i);
};
function neckBand(a: number, b: number, t0: number, t1: number, endFrame?: [string, V, V]): FP[] {
  const n = 6;
  const top: FP[] = [];
  const bot: FP[] = [];
  for (let k = 0; k <= n; k++) {
    const t = t0 + ((t1 - t0) * k) / n;
    const c = along(NECK_CREST, t);
    const v = along(NECK_VENTRAL, t);
    top.push(["neck", ...vec.lerpV(c, v, a)] as FP);
    bot.push(["neck", ...vec.lerpV(c, v, b)] as FP);
  }
  if (endFrame) {
    top.push([endFrame[0], ...endFrame[1]] as FP);
    bot.push([endFrame[0], ...endFrame[2]] as FP);
  }
  return [...top, ...bot.reverse()];
}

/* ------------------------------------------------------------------ muscles (near side, superficial) */
export type MuscleDef = { id: string; structure: string; tone: string; pts: FP[] };
const M = (id: string, structure: string, tone: string, pts: FP[]): MuscleDef => ({ id, structure, tone, pts });
export const MUSCLES: MuscleDef[] = [
  M("m-longissimus", "longissimus", "m3", [["trunk", 455, 302], ["trunk", 560, 298], ["trunk", 660, 292], ["trunk", 704, 296], ["trunk", 694, 318], ["trunk", 600, 320], ["trunk", 500, 326], ["trunk", 455, 318]]),
  M("m-oblique", "oblique", "m4", [["trunk", 492, 404], ["trunk", 560, 372], ["trunk", 642, 360], ["trunk", 690, 392], ["trunk", 676, 436], ["trunk", 622, 464], ["trunk", 545, 482], ["trunk", 494, 458]]),
  M("m-serratus", "serratus", "m2", [["trunk", 462, 372], ["trunk", 494, 396], ["trunk", 492, 440], ["trunk", 470, 452], ["trunk", 452, 420]]),
  M("m-latissimus", "latissimus", "m2", [["trunk", 492, 292], ["trunk", 560, 297], ["trunk", 618, 298], ["trunk", 566, 344], ["trunk", 506, 386], [`LF.hum`, 442, 430], [`LF.hum`, 430, 414], ["trunk", 466, 356], ["trunk", 470, 312]]),
  M("m-pectoral", "pectoral", "m1", [[`LF.scap`, 346, 410], [`LF.hum`, 370, 440], [`LF.hum`, 384, 476], ["trunk", 372, 492], ["trunk", 350, 468], ["trunk", 340, 432]]),
  M("m-trapezius", "trapezius", "m3", [["trunk", 404, 298], ["trunk", 452, 272], ["trunk", 506, 288], [`LF.scap`, 452, 322], [`LF.scap`, 428, 324], ["neck", 386, 308]]),
  M("m-deltoid", "deltoid", "m1", [[`LF.scap`, 440, 336], [`LF.scap`, 404, 352], [`LF.hum`, 376, 392], [`LF.hum`, 392, 412], [`LF.scap`, 424, 372], [`LF.scap`, 452, 344]]),
  M("m-triceps", "triceps", "m2", [[`LF.scap`, 452, 342], [`LF.scap`, 470, 322], [`LF.hum`, 440, 420], [`LF.rad`, 422, 450], [`LF.rad`, 404, 456], [`LF.hum`, 394, 432], [`LF.hum`, 392, 410], [`LF.scap`, 424, 374]]),
  M("m-splenius", "splenius", "m2", neckBand(0.06, 0.42, 0.02, 0.92)),
  M("m-brachiocephalicus", "brachiocephalicus", "m1", neckBand(0.5, 0.78, 0.04, 0.9, ["LF.hum", [374, 404], [362, 418]])),
  M("m-sternocephalicus", "sternocephalicus", "m3", neckBand(0.82, 0.97, 0.06, 1)),
  M("m-carpi-ext", "forearm-ext", "m3", [[`LF.rad`, 381, 466], [`LF.rad`, 393, 470], [`LF.rad`, 392, 540], [`LF.rad`, 386, 548], [`LF.rad`, 380, 520]]),
  M("m-carpi-flex", "forearm-flex", "m4", [[`LF.rad`, 409, 466], [`LF.rad`, 418, 478], [`LF.rad`, 405, 545], [`LF.rad`, 398, 546], [`LF.rad`, 400, 500]]),
  M("m-gluteus", "gluteus", "m1", [["trunk", 655, 292], ["trunk", 705, 278], ["trunk", 745, 285], ["trunk", 768, 306], [`LH.fem`, 772, 346], [`LH.fem`, 750, 362], ["trunk", 700, 332], ["trunk", 664, 314]]),
  M("m-tfl", "tfl", "m3", [["trunk", 668, 300], ["trunk", 694, 300], [`LH.fem`, 722, 380], [`LH.fem`, 708, 448], [`LH.fem`, 694, 454], [`LH.fem`, 690, 420], ["trunk", 668, 330]]),
  M("m-supglut", "gluteus", "m4", [[`LH.fem`, 734, 330], [`LH.fem`, 748, 392], [`LH.fem`, 726, 410], [`LH.fem`, 714, 360]]),
  M("m-biceps-fem", "biceps-femoris", "m2", [["trunk", 768, 304], ["trunk", 800, 330], [`LH.fem`, 812, 382], [`LH.fem`, 800, 440], [`LH.tib`, 770, 482], [`LH.tib`, 746, 472], [`LH.fem`, 746, 420], [`LH.fem`, 752, 362]]),
  M("m-semiten", "semitendinosus", "m3", [["trunk", 805, 336], [`LH.fem`, 821, 392], [`LH.fem`, 813, 446], [`LH.tib`, 790, 490], [`LH.tib`, 780, 486], [`LH.fem`, 801, 440], [`LH.fem`, 806, 392]]),
  M("m-gastroc", "gastrocnemius", "m1", [[`LH.tib`, 766, 478], [`LH.tib`, 784, 488], [`LH.tib`, 788, 514], [`LH.can`, 791, 532], [`LH.can`, 785, 535], [`LH.tib`, 777, 514], [`LH.tib`, 767, 496]]),
  M("m-lde", "hind-ext", "m3", [[`LH.tib`, 712, 480], [`LH.tib`, 728, 485], [`LH.tib`, 746, 530], [`LH.tib`, 738, 536], [`LH.tib`, 722, 505]]),
];

/** tendons and ligaments, drawn as stroked lines between frame points */
export const TENDONS: { id: string; structure: string; pts: FP[] }[] = [
  { id: "t-fore-flex", structure: "flexor-tendons", pts: [[`LF.rad`, 404, 548], [`LF.can`, 405, 572], [`LF.can`, 405, 612], [`LF.pas`, 404, 636], [`LF.pas`, 396, 660]] },
  { id: "t-fore-ext", structure: "forearm-ext", pts: [[`LF.rad`, 386, 548], [`LF.can`, 386, 580], [`LF.can`, 388, 618], [`LF.pas`, 382, 638]] },
  { id: "t-hind-flex", structure: "flexor-tendons", pts: [[`LH.can`, 784, 538], [`LH.can`, 773, 572], [`LH.can`, 772, 614], [`LH.pas`, 772, 640], [`LH.pas`, 764, 662]] },
  { id: "t-calcaneal", structure: "gastrocnemius", pts: [[`LH.tib`, 780, 500], [`LH.can`, 789, 530]] },
  { id: "t-hind-ext", structure: "hind-ext", pts: [[`LH.tib`, 742, 530], [`LH.can`, 750, 566], [`LH.can`, 751, 618], [`LH.pas`, 746, 640]] },
  { id: "t-nuchal", structure: "nuchal", pts: [["head", 244, 250], ["neck", 300, 258], ["neck", 360, 280], ["trunk", 420, 290], ["trunk", 445, 272]] },
];

/* ------------------------------------------------------------------ rider (rest, frames R.*) */
const R_TORSO: FP[] = [
  ["R.thorax", 516, 168], ["R.thorax", 512, 200], ["R.lumbar", 516, 240], ["R.pelvis", 520, 278], ["R.pelvis", 528, 296],
  ["R.pelvis", 562, 294], ["R.pelvis", 566, 270], ["R.lumbar", 561, 234], ["R.thorax", 560, 200], ["R.thorax", 554, 168], ["R.thorax", 538, 158],
];
const R_HELMET: FP[] = [["R.head", 512, 118], ["R.head", 514, 100], ["R.head", 530, 90], ["R.head", 552, 94], ["R.head", 562, 112], ["R.head", 560, 124], ["R.head", 512, 124], ["R.head", 500, 128], ["R.head", 504, 122]];
const R_FACE: FP[] = [["R.head", 516, 124], ["R.head", 512, 140], ["R.head", 518, 150], ["R.head", 532, 154], ["R.head", 548, 146], ["R.head", 556, 124]];
const R_BOOT_FOOT: FP[] = [["R.foot", 520, 488], ["R.foot", 540, 490], ["R.foot", 541, 506], ["R.foot", 500, 514], ["R.foot", 494, 508], ["R.foot", 512, 500]];
const R_SKULL: FP[] = [["R.head", 516, 120], ["R.head", 522, 102], ["R.head", 538, 96], ["R.head", 554, 104], ["R.head", 558, 122], ["R.head", 552, 138], ["R.head", 540, 146], ["R.head", 528, 150], ["R.head", 516, 146], ["R.head", 512, 132]];
const R_RIBS: FP[] = [["R.thorax", 524, 176], ["R.thorax", 520, 200], ["R.thorax", 526, 222], ["R.thorax", 544, 228], ["R.thorax", 556, 210], ["R.thorax", 554, 182], ["R.thorax", 542, 170]];
const R_PELVIS: FP[] = [["R.pelvis", 530, 262], ["R.pelvis", 552, 258], ["R.pelvis", 562, 272], ["R.pelvis", 556, 290], ["R.pelvis", 546, 300], ["R.pelvis", 534, 296], ["R.pelvis", 528, 280]];
const R_FOOTBONE: FP[] = [["R.foot", 524, 494], ["R.foot", 536, 496], ["R.foot", 535, 504], ["R.foot", 503, 510], ["R.foot", 506, 504]];

/* ------------------------------------------------------------------ tack (trunk / head frames) */
const SADDLE: FP[] = [["trunk", 486, 276], ["trunk", 498, 290], ["trunk", 540, 297], ["trunk", 584, 292], ["trunk", 594, 278], ["trunk", 598, 290], ["trunk", 588, 302], ["trunk", 540, 306], ["trunk", 494, 300]];
const FLAP: FP[] = [["trunk", 506, 300], ["trunk", 570, 302], ["trunk", 566, 376], ["trunk", 510, 380], ["trunk", 500, 336]];

/* ------------------------------------------------------------------ the shape list (paint order) */
export const SHAPES: ShapeDef[] = [
  // far side, behind the body
  { id: "far-tail", layer: "farBody", tone: "coatFar" },
  { id: "RH-upper", layer: "farBody", tone: "coatFar" },
  { id: "RF-upper", layer: "farBody", tone: "coatFar" },
  { id: "RH-lower", layer: "farBody", tone: "coatFar" },
  { id: "RF-lower", layer: "farBody", tone: "coatFar" },
  { id: "RH-hoof", layer: "farBody", tone: "hoofFar" },
  { id: "RF-hoof", layer: "farBody", tone: "hoofFar" },
  { id: "ear-far", layer: "farBody", tone: "coatFar" },
  // far bones
  ...(["RF", "RH"] as LimbId[]).flatMap((id) => (id.endsWith("F") ? ["scap", "hum", "rad", "carpus", "can", "p1", "p2", "p3"] : ["fem", "tib", "tarsus", "calc", "can", "p1", "p2", "p3"]).map((b) => ({ id: `${id}-${b}`, layer: "farBone" as Layer, tone: "boneFar", structure: boneStructure(id, b) }))),
  // the body
  { id: "trunk", layer: "body", tone: "coat" },
  { id: "neckhead", layer: "body", tone: "coat" },
  { id: "LF-lower", layer: "body", tone: "coat" },
  { id: "LH-lower", layer: "body", tone: "coat" },
  { id: "LF-hoof", layer: "body", tone: "hoof" },
  { id: "LH-hoof", layer: "body", tone: "hoof" },
  { id: "ear-near", layer: "body", tone: "coat" },
  { id: "eye", layer: "body", tone: "eye" },
  { id: "nostril", layer: "body", tone: "line", stroke: true },
  { id: "tail", layer: "body", tone: "tail" },
  // axial skeleton and near limbs
  ...Array.from({ length: 18 }, (_, i) => ({ id: `rib-${i}`, layer: "bone" as Layer, tone: "boneLine", stroke: true, structure: "ribs" })),
  ...Array.from({ length: 8 }, (_, i) => ({ id: `cart-${i}`, layer: "bone" as Layer, tone: "cartLine", stroke: true, structure: "ribs" })),
  { id: "sternum", layer: "bone", tone: "bone", structure: "sternum" },
  ...Array.from({ length: 18 }, (_, i) => ({ id: `tsp-${i}`, layer: "bone" as Layer, tone: "bone", structure: i < 9 ? "withers" : "thoracic" })),
  ...Array.from({ length: 18 }, (_, i) => ({ id: `tv-${i}`, layer: "bone" as Layer, tone: "bone", structure: "thoracic" })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `lv-${i}`, layer: "bone" as Layer, tone: "bone", structure: "lumbar" })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `lsp-${i}`, layer: "bone" as Layer, tone: "bone", structure: "lumbar" })),
  { id: "sacrum", layer: "bone", tone: "bone", structure: "sacrum" },
  ...Array.from({ length: 4 }, (_, i) => ({ id: `ssp-${i}`, layer: "bone" as Layer, tone: "bone", structure: "sacrum" })),
  ...Array.from({ length: 7 }, (_, i) => ({ id: `cd-${i}`, layer: "bone" as Layer, tone: "bone", structure: "caudal" })),
  ...Array.from({ length: 7 }, (_, i) => ({ id: `cv-${i}`, layer: "bone" as Layer, tone: "bone", structure: i < 2 ? "atlas-axis" : "cervical" })),
  { id: "atlas-wing", layer: "bone", tone: "bone", structure: "atlas-axis" },
  { id: "pelvis", layer: "bone", tone: "bone", structure: "pelvis" },
  { id: "pelvis-foramen", layer: "bone", tone: "hole", structure: "pelvis" },
  { id: "skull", layer: "bone", tone: "bone", structure: "skull" },
  { id: "orbit", layer: "bone", tone: "hole", structure: "skull" },
  { id: "mandible", layer: "bone", tone: "bone", structure: "mandible" },
  { id: "teeth", layer: "bone", tone: "boneLine", stroke: true, structure: "mandible" },
  { id: "facial-crest", layer: "bone", tone: "boneLine", stroke: true, structure: "skull" },
  { id: "nasal-notch", layer: "bone", tone: "boneLine", stroke: true, structure: "skull" },
  { id: "LF-scapcart", layer: "bone", tone: "cart", structure: "scapula" },
  ...(["LF", "LH"] as LimbId[]).flatMap((id) => (id.endsWith("F") ? ["scap", "hum", "rad", "olecranon", "carpus", "accessory", "can", "splint", "sesamoid", "p1", "p2", "p3"] : ["fem", "patella", "tib", "fibula", "tarsus", "calc", "can", "splint", "sesamoid", "p1", "p2", "p3"]).map((b) => ({ id: `${id}-${b}`, layer: "bone" as Layer, tone: "bone", structure: boneStructure(id, b) }))),
  { id: "LF-scapspine", layer: "bone", tone: "boneLine", stroke: true, structure: "scapula" },
  // muscles
  ...MUSCLES.map((m) => ({ id: m.id, layer: "muscle" as Layer, tone: m.tone, structure: m.structure })),
  ...TENDONS.map((t) => ({ id: t.id, layer: "muscle" as Layer, tone: "tendon", stroke: true, structure: t.structure })),
  // tack (coat view and horse & rider)
  { id: "flap", layer: "tack", tone: "leather" },
  { id: "girth", layer: "tack", tone: "strap", stroke: true },
  { id: "saddle", layer: "tack", tone: "leatherDark" },
  { id: "bridle", layer: "tack", tone: "strap", stroke: true },
  { id: "noseband", layer: "tack", tone: "strap", stroke: true },
  { id: "bit", layer: "tack", tone: "metal", stroke: true },
  // rider
  { id: "r-thigh", layer: "riderBody", tone: "breeches", structure: "r-femur" },
  { id: "r-torso", layer: "riderBody", tone: "jacket", structure: "r-spine" },
  { id: "r-neck", layer: "riderBody", tone: "skin" },
  { id: "r-face", layer: "riderBody", tone: "skin" },
  { id: "r-helmet", layer: "riderBody", tone: "helmet" },
  { id: "r-leather", layer: "riderNear", tone: "strap", stroke: true },
  { id: "r-shin", layer: "riderNear", tone: "boot", structure: "r-tibia" },
  { id: "r-bootfoot", layer: "riderNear", tone: "boot" },
  { id: "r-stirrup", layer: "riderNear", tone: "metal", stroke: true },
  { id: "rein", layer: "riderNear", tone: "rein", stroke: true },
  { id: "r-upper", layer: "riderNear", tone: "jacket", structure: "r-arm" },
  { id: "r-fore", layer: "riderNear", tone: "jacket", structure: "r-arm" },
  { id: "r-glove", layer: "riderNear", tone: "glove" },
  // rider skeleton (overlay)
  { id: "rb-skull", layer: "riderBone", tone: "bone", structure: "r-skull" },
  { id: "rb-cerv", layer: "riderBone", tone: "boneLine", stroke: true, structure: "r-spine" },
  { id: "rb-ribs", layer: "riderBone", tone: "boneSoft", structure: "r-spine" },
  { id: "rb-tspine", layer: "riderBone", tone: "boneLine", stroke: true, structure: "r-spine" },
  { id: "rb-lspine", layer: "riderBone", tone: "boneLine", stroke: true, structure: "r-lumbar" },
  { id: "rb-pelvis", layer: "riderBone", tone: "bone", structure: "r-pelvis" },
  { id: "rb-femur", layer: "riderBone", tone: "bone", structure: "r-femur" },
  { id: "rb-tibia", layer: "riderBone", tone: "bone", structure: "r-tibia" },
  { id: "rb-foot", layer: "riderBone", tone: "bone", structure: "r-tibia" },
  { id: "rb-humerus", layer: "riderBone", tone: "bone", structure: "r-arm" },
  { id: "rb-radius", layer: "riderBone", tone: "bone", structure: "r-arm" },
];

function boneStructure(id: LimbId, b: string): string {
  const fore = id.endsWith("F");
  const map: Record<string, string> = fore
    ? { scap: "scapula", hum: "humerus", rad: "radius", olecranon: "radius", carpus: "carpus", accessory: "carpus", can: "cannon", splint: "cannon", sesamoid: "fetlock", p1: "pastern", p2: "pastern", p3: "coffin" }
    : { fem: "femur", patella: "stifle", tib: "tibia", fibula: "tibia", tarsus: "hock", calc: "hock", can: "hind-cannon", splint: "hind-cannon", sesamoid: "fetlock", p1: "pastern", p2: "pastern", p3: "coffin" };
  return map[b] ?? b;
}

/* ------------------------------------------------------------------ geometry */
export function geometry(pz: Pose): Record<string, string> {
  const P = (f: FP) => place(pz, f);
  const S = (pts: FP[], closed = true) => spline(pts.map(P), closed);
  const T = (frame: string, p: V): V => place(pz, [frame, p[0], p[1]]);
  const g: Record<string, string> = {};

  // body
  g.trunk = S(TRUNK_OUTLINE("LF", "LH"));
  g.neckhead = S(NECK_HEAD);
  g["ear-near"] = S(EAR_NEAR);
  g["ear-far"] = S(EAR_FAR);
  g.tail = S(TAIL);
  g["far-tail"] = S(TAIL.map((p) => [p[0], p[1] + 8, p[2] - 4] as FP));
  g.eye = spline([T("head", [196, 286]), T("head", [205, 280]), T("head", [214, 285]), T("head", [205, 292])]);
  g.nostril = spline([T("head", [126, 382]), T("head", [132, 376]), T("head", [138, 384])], false);
  for (const id of ["LF", "RF"] as LimbId[]) {
    g[`${id}-lower`] = S(foreLower(id));
    g[`${id}-hoof`] = S(hoofCap(id, true));
  }
  for (const id of ["LH", "RH"] as LimbId[]) {
    g[`${id}-lower`] = S(hindLower(id));
    g[`${id}-hoof`] = S(hoofCap(id, false));
  }
  g["RF-upper"] = S(farUpper(true, "RF"));
  g["RH-upper"] = S(farUpper(false, "RH"));

  // bones of each limb
  for (const id of ["LF", "RF", "LH", "RH"] as LimbId[]) {
    const fore = id.endsWith("F");
    const o = off(id);
    const j = pz.limbs[id].joints;
    if (fore) {
      g[`${id}-scap`] = spline(SCAPULA.map((p) => T(`${id}.scap`, add(p, o))));
      g[`${id}-hum`] = longBone(j.root, j.mid, 15, 8, 12, [{ t: 0.08, side: 1, h: 7 }, { t: 0.38, side: -1, h: 5 }]);
      g[`${id}-rad`] = longBone(j.mid, j.C, 11, 7.5, 11);
      g[`${id}-olecranon`] = longBone(j.mid, T(`${id}.rad`, add([420, 440], o)), 9, 6, 7);
      g[`${id}-carpus`] = spline([[-10, -8], [10, -9], [12, 9], [-10, 9]].map((d) => T(`${id}.can`, add(add(REST.fore.C, d as V), o))));
      g[`${id}-accessory`] = spline([[14, -6], [22, -2], [20, 6], [12, 4]].map((d) => T(`${id}.can`, add(add(REST.fore.C, d as V), o))));
      g[`${id}-can`] = longBone(T(`${id}.can`, add(add(REST.fore.C, [0, 10]), o)), j.F, 9, 6.5, 10);
      g[`${id}-splint`] = longBone(T(`${id}.can`, add([400, 566], o)), T(`${id}.can`, add([401, 604], o)), 4, 2, 1.5);
      g[`${id}-sesamoid`] = spline([[8, -8], [14, -4], [13, 4], [7, 2]].map((d) => T(`${id}.pas`, add(add(REST.fore.F, d as V), o))));
    } else {
      g[`${id}-fem`] = longBone(j.root, j.mid, 16, 10, 14, [{ t: 0.04, side: -1, h: 9 }, { t: 0.36, side: -1, h: 6 }]);
      g[`${id}-patella`] = spline([[-14, -12], [-8, -16], [-6, -4], [-12, -2]].map((d) => T(`${id}.fem`, add(add(REST.hind.St, d as V), o))));
      g[`${id}-tib`] = longBone(j.mid, j.C, 14, 8, 11, [{ t: 0.12, side: 1, h: 4 }]);
      g[`${id}-fibula`] = longBone(T(`${id}.tib`, add([720, 470], o)), T(`${id}.tib`, add([738, 500], o)), 3, 1.5, 1);
      g[`${id}-tarsus`] = spline([[-10, -6], [10, -8], [11, 12], [-9, 12]].map((d) => T(`${id}.can`, add(add(REST.hind.Ho, d as V), o))));
      g[`${id}-calc`] = longBone(T(`${id}.can`, add([768, 548], o)), T(`${id}.can`, add([790, 527], o)), 7, 5, 7);
      g[`${id}-can`] = longBone(T(`${id}.can`, add(add(REST.hind.Ho, [0, 12]), o)), j.F, 9, 6.5, 10);
      g[`${id}-splint`] = longBone(T(`${id}.can`, add([768, 566], o)), T(`${id}.can`, add([768, 606], o)), 4, 2, 1.5);
      g[`${id}-sesamoid`] = spline([[8, -8], [14, -4], [13, 4], [7, 2]].map((d) => T(`${id}.pas`, add(add(REST.hind.F, d as V), o))));
    }
    const K = j.K;
    const mid = vec.lerpV(j.F, K, 0.62);
    g[`${id}-p1`] = longBone(j.F, mid, 8, 6, 7);
    g[`${id}-p2`] = longBone(mid, vec.lerpV(j.F, K, 1.05), 7, 6, 7);
    g[`${id}-p3`] = S(coffin(id, fore));
  }
  g["LF-scapcart"] = spline(SCAP_CART.map((p) => T("LF.scap", p)));
  g["LF-scapspine"] = spline([T("LF.scap", [372, 382]), T("LF.scap", [404, 342]), T("LF.scap", [430, 318]), T("LF.scap", [446, 296])], false);

  // axial
  for (let i = 0; i < 18; i++) {
    const r = rib(i);
    const a = T("trunk", r.bone[0]);
    const c = T("trunk", r.bone[1]);
    const b = T("trunk", r.bone[2]);
    g[`rib-${i}`] = `M${a[0].toFixed(1)},${a[1].toFixed(1)}Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    if (r.cart && i < 8) g[`cart-${i}`] = line(T("trunk", r.cart[0]), T("trunk", r.cart[1]));
  }
  g.sternum = spline(STERNUM.map((p) => T("trunk", p)));
  for (let i = 0; i < 18; i++) {
    const base = THORACIC[i];
    g[`tsp-${i}`] = longBone(T("trunk", base), T("trunk", T_SPINE_TIPS[i]), 5, i < 9 ? 3.4 : 3, i < 9 ? 4 : 3);
    const next = THORACIC[Math.min(17, i + 1)];
    const prev = THORACIC[Math.max(0, i - 1)];
    const a = vec.lerpV(prev, base, 0.55);
    const b = vec.lerpV(base, next, 0.45);
    g[`tv-${i}`] = longBone(T("trunk", i === 0 ? add(base, [-5, 0]) : a), T("trunk", i === 17 ? add(base, [6, 0]) : b), 7, 5.5, 7);
  }
  for (let i = 0; i < 6; i++) {
    const c = LUMBAR[i];
    g[`lv-${i}`] = longBone(T("trunk", add(c, [-6, 0])), T("trunk", add(c, [6, 0])), 7.5, 6, 7.5, [{ t: 0.5, side: 1, h: 3 }]);
    g[`lsp-${i}`] = longBone(T("trunk", c), T("trunk", L_TIPS[i]), 5, 4, 5);
  }
  g.sacrum = spline(SACRUM.map((p) => T("trunk", p)));
  [[712, 296], [726, 293], [738, 296], [750, 302]].forEach((tip, i) => {
    g[`ssp-${i}`] = longBone(T("trunk", [708 + i * 13, 326 + i * 2]), T("trunk", tip as V), 4, 3, 3);
  });
  for (let i = 0; i < 7; i++) g[`cd-${i}`] = longBone(T("tail", CAUDAL[i]), T("tail", CAUDAL[i + 1]), 5 - i * 0.4, 3.5 - i * 0.3, 5 - i * 0.4);
  for (let i = 0; i < 7; i++) {
    const a = CERVICAL[i];
    const b = CERVICAL[i + 1];
    const fr = i === 6 ? "trunk" : "neck";
    const bumps = i === 1 ? [{ t: 0.4, side: 1, h: 6, s: 0.25 }] : [{ t: 0.85, side: 1, h: 3 }, { t: 0.3, side: -1, h: 3 }];
    g[`cv-${i}`] = longBone(T("neck", vec.lerpV(a, b, 0.06)), T(fr, vec.lerpV(a, b, 0.94)), 8, 6.5, 8, bumps);
  }
  g["atlas-wing"] = spline([[240, 262], [254, 258], [262, 270], [250, 282], [240, 276]].map((p) => T("neck", p as V)));
  g.pelvis = spline(PELVIS.map((p) => T("trunk", p)));
  g["pelvis-foramen"] = spline([[764, 382], [782, 380], [790, 392], [770, 396]].map((p) => T("trunk", p as V)));
  g.skull = S(SKULL);
  g.orbit = spline([T("head", [196, 282]), T("head", [206, 274]), T("head", [216, 282]), T("head", [206, 294])]);
  g.mandible = S(MANDIBLE);
  g.teeth = spline([T("head", [218, 368]), T("head", [190, 382]), T("head", [158, 394])], false);
  g["facial-crest"] = spline([T("head", [214, 312]), T("head", [192, 324]), T("head", [172, 340])], false);
  g["nasal-notch"] = spline([T("head", [150, 340]), T("head", [136, 360]), T("head", [128, 380])], false);

  // muscles and tendons
  for (const m of MUSCLES) g[m.id] = S(m.pts);
  for (const t of TENDONS) g[t.id] = spline(t.pts.map(P), false);

  // tack
  g.saddle = S(SADDLE);
  g.flap = S(FLAP);
  g.girth = line(T("trunk", [530, 376]), T("trunk", [522, 490]));
  const bit = T("head", [152, 372]);
  g.bit = spline([add(bit, [-6, 0]), add(bit, [0, -6]), add(bit, [6, 0]), add(bit, [0, 6])]);
  g.bridle = spline([T("head", [152, 372]), T("head", [196, 318]), T("head", [234, 262]), T("head", [242, 248])], false);
  g.noseband = line(T("head", [146, 352]), T("head", [184, 340]));

  // rider
  const rj = pz.rider.joints;
  const R = (f: string, p: V) => place(pz, [`R.${f}`, p[0], p[1]]);
  g["r-torso"] = S(R_TORSO);
  g["r-helmet"] = S(R_HELMET);
  g["r-face"] = S(R_FACE);
  g["r-neck"] = capsule(rj.c7, add(rj.c7, vec.mul(sub(rj.head, rj.c7), 0.6)), 9, 8);
  g["r-thigh"] = capsule(rj.hip, rj.knee, 21, 13);
  g["r-shin"] = capsule(rj.knee, rj.ankle, 13, 10);
  g["r-bootfoot"] = S(R_BOOT_FOOT);
  g["r-upper"] = capsule(rj.shoulder, rj.elbow, 11, 9);
  g["r-fore"] = capsule(rj.elbow, rj.hand, 9, 7);
  g["r-glove"] = capsule(rj.hand, add(rj.hand, vec.mul(sub(rj.hand, rj.elbow), 0.22)), 7, 6);
  const stirrup = R("foot", [512, 506]);
  g["r-leather"] = line(T("trunk", [536, 300]), add(stirrup, [0, -10]));
  g["r-stirrup"] = spline([add(stirrup, [-10, -10]), add(stirrup, [-11, 4]), add(stirrup, [11, 4]), add(stirrup, [10, -10])], false);
  g.rein = spline([rj.hand, vec.lerpV(rj.hand, bit, 0.5), bit], false);
  g["rb-skull"] = S(R_SKULL);
  g["rb-cerv"] = spline([rj.c7, vec.lerpV(rj.c7, rj.head, 0.4), vec.lerpV(rj.c7, rj.head, 0.75)], false);
  g["rb-ribs"] = S(R_RIBS);
  g["rb-tspine"] = spline([rj.c7, vec.lerpV(rj.c7, rj.lumbar, 0.5), rj.lumbar], false);
  g["rb-lspine"] = spline([rj.lumbar, vec.lerpV(rj.lumbar, rj.hip, 0.5), add(rj.hip, [0, -6])], false);
  g["rb-pelvis"] = S(R_PELVIS);
  g["rb-femur"] = longBone(rj.hip, rj.knee, 9, 5, 8, [{ t: 0.05, side: -1, h: 5 }]);
  g["rb-tibia"] = longBone(rj.knee, rj.ankle, 8, 4.5, 6);
  g["rb-foot"] = S(R_FOOTBONE);
  g["rb-humerus"] = longBone(rj.shoulder, rj.elbow, 7, 4, 6);
  g["rb-radius"] = longBone(rj.elbow, rj.hand, 5, 3.5, 5);
  return g;
}

/** the world position of a point in a frame, for labels and readouts */
export const at = (pz: Pose, frame: string, p: V): V => place(pz, [frame, p[0], p[1]]);
export { poly };
