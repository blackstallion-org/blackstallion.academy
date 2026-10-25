/**
 * The three worlds the black Marwari can stand in. Everything that makes a place itself is data here: its light, sky, haze,
 * ground, the layers of scenery and how each is placed, what the hooves kick up, and the camera shots for each gait.
 *
 * Colours are CSS hex, authored to be seen as they are (the backdrop layers are drawn without tone mapping). Distances are metres.
 * All the art is original and free of any horse: it is drawn by scripts/horse-worlds/gen_*.py.
 */
import { asset } from "@/lib/content/asset";
import { worldCopy } from "@/lib/content/horse-worlds";
import type { GaitChoice, ShotSpec, WorldConfig, WorldId } from "./types";

const TARGET: [number, number, number] = [0, 0.95, 0.2];
const shot = (azimuth: number, elevation: number, distance: number, fov: number): ShotSpec => ({ azimuth, elevation, distance, fov, target: TARGET });

/**
 * Cinematic, guided shots: the camera starts full-body and a little in front of the horse and eases wider and lower as the gait
 * gets faster, so a gallop reads as a gallop. The visitor can nudge the angle but never leaves the shot.
 */
const SHOTS: Record<GaitChoice, ShotSpec> = {
  stand: shot(32, 7, 6.4, 30),
  walk: shot(24, 5, 7.0, 32),
  trot: shot(22, 4, 7.6, 33),
  canter: shot(18, 3, 8.2, 34),
  gallop: shot(14, 2, 9.2, 36),
};

const desert: WorldConfig = {
  id: "desert",
  ...worldCopy.desert,
  gaits: ["stand", "walk", "canter", "gallop"],
  defaultGait: "walk",
  fog: { color: "#e9bd8a", density: 0.0058 },
  light: {
    sunDir: [0.62, 0.26, -0.74],
    sunColor: "#ffc27a",
    sunIntensity: 3.8,
    skyColor: "#b9c6d8",
    groundColor: "#a07848",
    hemiIntensity: 0.55,
    rimDir: [0.35, 0.55, -0.75],
    rimColor: "#ffcf8a",
    rimIntensity: 2.4,
    fillDir: [-0.8, 0.25, 0.35],
    fillColor: "#cfa77a",
    fillIntensity: 0.5,
    exposure: 1.2,
    envIntensity: 0.5,
  },
  sky: {
    zenith: "#5d84b2",
    mid: "#a9bccb",
    horizon: "#efc18c",
    haze: "#e9bd8a",
    sunColor: "#ffd9a0",
    sunGlow: 1,
    clouds: 0.35,
    cloudColor: "#fff0d6",
    cloudShade: "#dba57a",
    cloudScale: 1.6,
    drift: 0.004,
    hazeAmount: 0.85,
    hazeFalloff: 7,
  },
  ground: {
    albedo: asset("/images/horse-worlds/desert/ground.webp"),
    albedoMobile: asset("/images/horse-worlds/desert/ground-m.webp"),
    normal: asset("/images/horse-worlds/desert/ground-n.webp"),
    normalMobile: asset("/images/horse-worlds/desert/ground-n-m.webp"),
    tileMetres: 3.5,
    roughness: 0.94,
    normalScale: 0.9,
    macro: 0.14,
    tint: "#ffffff",
  },
  distant: {
    image: asset("/images/horse-worlds/desert/distant.webp"),
    imageMobile: asset("/images/horse-worlds/desert/distant-m.webp"),
    radius: 700,
    height: 68.8,
    repeats: 4,
    base: 3,
  },
  mid: {
    atlas: "desert.mid",
    image: asset("/images/horse-worlds/desert/mid.webp"),
    imageMobile: asset("/images/horse-worlds/desert/mid-m.webp"),
    layout: "scatter",
    count: 130,
    countMobile: 80,
    span: 256,
    x: [9, 130],
    facing: "camera",
    scale: [0.8, 1.25],
    tint: "#ffffff",
    shadow: 0.55,
    fade: 16,
    sway: 0.012,
  },
  fore: {
    atlas: "desert.fore",
    image: asset("/images/horse-worlds/desert/fore.webp"),
    imageMobile: asset("/images/horse-worlds/desert/fore-m.webp"),
    layout: "scatter",
    count: 150,
    countMobile: 70,
    span: 128,
    x: [-4.6, -2.0],
    facing: "camera",
    scale: [0.8, 1.3],
    tint: "#ffffff",
    shadow: 0.4,
    fade: 8,
    sway: 0.03,
  },
  surface: { dust: 1, prints: 0.8, hardness: 0.25, dustColor: "#d9b583", printTint: "#7e6140", printStrength: 0.5, printLife: 10 },
  ambientDust: { rate: 7, color: "#e6c394", size: 0.5 },
  wind: [1.6, 0, 0.5],
  shots: SHOTS,
};

/**
 * The horse field on an early morning: green paddock, post-and-rail fencing, mature trees, a stable block and soft hills far away.
 * Cooler and gentler than the desert; the sun stands higher and the air is clear, so the distance is a soft green-grey, not gold.
 */
const field: WorldConfig = {
  id: "field",
  ...worldCopy.field,
  gaits: ["stand", "walk", "trot", "canter"],
  defaultGait: "stand",
  fog: { color: "#d7e0cf", density: 0.0044 },
  light: {
    sunDir: [0.55, 0.42, -0.72],
    sunColor: "#ffe3b8",
    sunIntensity: 3.2,
    skyColor: "#bcd0e6",
    groundColor: "#6f8a4c",
    hemiIntensity: 0.62,
    rimDir: [0.35, 0.5, -0.8],
    rimColor: "#fff1d2",
    rimIntensity: 1.9,
    fillDir: [-0.8, 0.25, 0.35],
    fillColor: "#c9d8c0",
    fillIntensity: 0.55,
    exposure: 1.12,
    envIntensity: 0.5,
  },
  sky: {
    zenith: "#6f9bd0",
    mid: "#b4d0e6",
    horizon: "#f0e8cc",
    haze: "#dfe5cf",
    sunColor: "#fff0c8",
    sunGlow: 0.8,
    clouds: 0.45,
    cloudColor: "#ffffff",
    cloudShade: "#cdd8e4",
    cloudScale: 1.5,
    drift: 0.003,
    hazeAmount: 0.8,
    hazeFalloff: 7,
  },
  ground: {
    albedo: asset("/images/horse-worlds/field/ground.webp"),
    albedoMobile: asset("/images/horse-worlds/field/ground-m.webp"),
    normal: asset("/images/horse-worlds/field/ground-n.webp"),
    normalMobile: asset("/images/horse-worlds/field/ground-n-m.webp"),
    tileMetres: 4,
    roughness: 0.95,
    normalScale: 0.7,
    macro: 0.1,
    tint: "#ffffff",
  },
  distant: {
    image: asset("/images/horse-worlds/field/distant.webp"),
    imageMobile: asset("/images/horse-worlds/field/distant-m.webp"),
    radius: 700,
    height: 68.8,
    repeats: 4,
    base: 3,
    hazeLow: 0.16,
    hazeFoot: 0.8,
  },
  mid: {
    atlas: "field.mid",
    image: asset("/images/horse-worlds/field/mid.webp"),
    imageMobile: asset("/images/horse-worlds/field/mid-m.webp"),
    pick: ["oak-a", "oak-b", "round-a", "slim-a", "bush-a", "bush-b"],
    layout: "scatter",
    count: 84,
    countMobile: 50,
    span: 256,
    x: [22, 150],
    facing: "camera",
    scale: [0.62, 1.05],
    tint: "#ffffff",
    shadow: 0.5,
    fade: 16,
    sway: 0.006,
  },
  extra: [
    // a stable block or two, standing back from the track
    {
      atlas: "field.mid",
      image: asset("/images/horse-worlds/field/mid.webp"),
      imageMobile: asset("/images/horse-worlds/field/mid-m.webp"),
      pick: ["stable"],
      layout: "scatter",
      count: 3,
      span: 256,
      x: [38, 70],
      facing: "track",
      scale: [0.9, 1.1],
      tint: "#ffffff",
      shadow: 0.5,
      fade: 16,
      sway: 0,
    },
    // post-and-rail fencing along the far side of the paddock, one whole post after another
    {
      atlas: "field.mid",
      image: asset("/images/horse-worlds/field/mid.webp"),
      imageMobile: asset("/images/horse-worlds/field/mid-m.webp"),
      pick: ["fence"],
      layout: "row",
      count: 0,
      span: 256,
      x: [11, 11],
      spacing: 4,
      facing: "track",
      scale: [1, 1],
      tint: "#ffffff",
      shadow: 0.45,
      fade: 12,
      sway: 0,
    },
  ],
  fore: {
    atlas: "field.fore",
    image: asset("/images/horse-worlds/field/fore.webp"),
    imageMobile: asset("/images/horse-worlds/field/fore-m.webp"),
    layout: "scatter",
    count: 130,
    countMobile: 64,
    span: 128,
    x: [-4.8, -2.3],
    facing: "camera",
    scale: [0.7, 1.15],
    tint: "#ffffff",
    shadow: 0.35,
    fade: 8,
    sway: 0.04,
  },
  // short pasture around the horse: it leans in the breeze and parts around each hoof
  grass: {
    count: 11000,
    countMobile: 4200,
    height: 0.085,
    color: "#2a4818",
    tipColor: "#6f9d40",
    dryColor: "#a3a265",
    dry: 0.06,
    area: [4.4, 7.5],
    center: [0.4, 0.2],
    bend: 1.1,
    sway: 0.8,
  },
  surface: { dust: 0.3, prints: 0.4, hardness: 0.55, dustColor: "#8e8c5c", printTint: "#2f4a22", printStrength: 0.4, printLife: 6 },
  ambientDust: { rate: 4, color: "#f2eed2", size: 0.35 },
  wind: [1.2, 0, 0.4],
  shots: SHOTS,
  shadowColor: "#1d2c18",
};

/**
 * A Marwar village lane in the late afternoon: lime-plaster and sandstone house fronts, a haveli or two, a shrine, thatched
 * huts and neem trees, with a low sun behind the roofs so their shadows lie across the packed earth. Calm and slow, so the horse
 * only stands or walks. The houses are rows of cut-outs exactly one house wide, so they read as continuous streets.
 */
const VILLAGE_MID = asset("/images/horse-worlds/village/mid.webp");
const VILLAGE_MID_M = asset("/images/horse-worlds/village/mid-m.webp");
const VILLAGE_PROPS = asset("/images/horse-worlds/village/props.webp");
const VILLAGE_PROPS_M = asset("/images/horse-worlds/village/props-m.webp");

const village: WorldConfig = {
  id: "village",
  ...worldCopy.village,
  gaits: ["stand", "walk"],
  defaultGait: "stand",
  fog: { color: "#ead3ab", density: 0.0085 },
  light: {
    sunDir: [0.62, 0.3, -0.72],
    sunColor: "#ffcb8e",
    sunIntensity: 3.4,
    skyColor: "#b8c2d0",
    groundColor: "#a97b4c",
    hemiIntensity: 0.6,
    rimDir: [0.4, 0.5, -0.75],
    rimColor: "#ffd7a0",
    rimIntensity: 2.2,
    fillDir: [-0.8, 0.28, 0.35],
    fillColor: "#d9b48a",
    fillIntensity: 0.6,
    exposure: 1.14,
    envIntensity: 0.5,
  },
  sky: {
    zenith: "#6f8fb8",
    mid: "#c4c9cc",
    horizon: "#f2cf9b",
    haze: "#ead3ab",
    sunColor: "#ffd9a0",
    sunGlow: 0.95,
    clouds: 0.22,
    cloudColor: "#fff0d8",
    cloudShade: "#e0b184",
    cloudScale: 1.7,
    drift: 0.0035,
    hazeAmount: 0.85,
    hazeFalloff: 7,
  },
  ground: {
    albedo: asset("/images/horse-worlds/village/ground.webp"),
    albedoMobile: asset("/images/horse-worlds/village/ground-m.webp"),
    normal: asset("/images/horse-worlds/village/ground-n.webp"),
    normalMobile: asset("/images/horse-worlds/village/ground-n-m.webp"),
    tileMetres: 4,
    roughness: 0.96,
    normalScale: 0.8,
    macro: 0.12,
    tint: "#ffffff",
  },
  distant: {
    image: asset("/images/horse-worlds/village/distant.webp"),
    imageMobile: asset("/images/horse-worlds/village/distant-m.webp"),
    radius: 320,
    height: 62.8,
    repeats: 2,
    base: 3,
    hazeLow: 0.16,
    hazeFoot: 0.75,
  },
  // the near side of the lane: house fronts one after another (every cut-out is 6 m wide, so the spacing is 6 m)
  mid: {
    atlas: "village.mid",
    image: VILLAGE_MID,
    imageMobile: VILLAGE_MID_M,
    layout: "row",
    count: 0,
    span: 240,
    x: [14.5, 14.5],
    spacing: 6,
    facing: "track",
    scale: [1, 1],
    tint: "#eee6da",
    shadow: 0.55,
    fade: 12,
    sway: 0,
  },
  extra: [
    // a second street of roofs behind the first, a little larger and further back, so the lane has depth and gaps show more houses
    {
      atlas: "village.mid",
      image: VILLAGE_MID,
      imageMobile: VILLAGE_MID_M,
      pick: ["house-ochre", "haveli-cream", "house-blue", "sandstone", "haveli-ochre", "huts", "house-cream", "gate"],
      layout: "row",
      count: 0,
      span: 255,
      x: [24, 24],
      spacing: 7.5,
      facing: "track",
      scale: [1.25, 1.25],
      tint: "#e6ddd0",
      shadow: 0.3,
      fade: 12,
      sway: 0,
    },
    // neem and khejri trees: a few between the houses and the lane, more behind the roofs
    {
      atlas: "village.props",
      image: VILLAGE_PROPS,
      imageMobile: VILLAGE_PROPS_M,
      pick: ["neem-a", "neem-b", "khejri-a", "khejri-b"],
      layout: "scatter",
      count: 9,
      countMobile: 6,
      span: 256,
      x: [10.2, 13],
      facing: "camera",
      scale: [0.8, 1.1],
      tint: "#ffffff",
      shadow: 0.5,
      fade: 16,
      sway: 0.006,
    },
    {
      atlas: "village.props",
      image: VILLAGE_PROPS,
      imageMobile: VILLAGE_PROPS_M,
      pick: ["neem-a", "neem-b", "khejri-a", "khejri-b"],
      layout: "scatter",
      count: 28,
      countMobile: 16,
      span: 256,
      x: [19, 50],
      facing: "camera",
      scale: [0.9, 1.4],
      tint: "#f1ead8",
      shadow: 0.4,
      fade: 16,
      sway: 0.006,
    },
    // the things a lane holds: a trough, water pots, a haystack, a woodpile, set back against the wall
    {
      atlas: "village.props",
      image: VILLAGE_PROPS,
      imageMobile: VILLAGE_PROPS_M,
      pick: ["trough", "pots", "haystack", "woodpile"],
      layout: "scatter",
      count: 20,
      countMobile: 12,
      span: 256,
      x: [6.5, 12.5],
      facing: "track",
      scale: [0.9, 1.25],
      tint: "#ffffff",
      shadow: 0.45,
      fade: 12,
      sway: 0,
    },
  ],
  fore: {
    atlas: "village.fore",
    image: asset("/images/horse-worlds/village/fore.webp"),
    imageMobile: asset("/images/horse-worlds/village/fore-m.webp"),
    layout: "scatter",
    count: 100,
    countMobile: 50,
    span: 128,
    x: [-4.6, -2.4],
    facing: "camera",
    scale: [0.8, 1.3],
    tint: "#ffffff",
    shadow: 0.3,
    fade: 8,
    sway: 0.03,
  },
  surface: { dust: 0.55, prints: 0.6, hardness: 0.7, dustColor: "#cfa878", printTint: "#6e5033", printStrength: 0.42, printLife: 8 },
  ambientDust: { rate: 3, color: "#e8cfa0", size: 0.4 },
  wind: [0.8, 0, 0.3],
  shots: SHOTS,
  shadowColor: "#34200f",
};

export const WORLDS: Record<WorldId, WorldConfig> = { desert, field, village };

/** The gait to use in `world` when the visitor had `wanted` in the world before: the same if the place allows it, else the nearest. */
export function gaitFor(world: WorldConfig, wanted: GaitChoice): GaitChoice {
  if (world.gaits.includes(wanted)) return wanted;
  const order: GaitChoice[] = ["stand", "walk", "trot", "canter", "gallop"];
  const w = order.indexOf(wanted);
  let best = world.defaultGait;
  let bestDelta = Infinity;
  for (const g of world.gaits) {
    const delta = Math.abs(order.indexOf(g) - w);
    // when two are equally near, prefer the calmer one
    if (delta < bestDelta || (delta === bestDelta && order.indexOf(g) < order.indexOf(best))) {
      best = g;
      bestDelta = delta;
    }
  }
  return best;
}
