/**
 * Shared types for the horse environments: one persistent black Marwari placed in three 2.5D worlds.
 *
 * Frame of reference (the same as the model's): +Y up, the horse faces +Z, its left side is +X, metres. The horse stays at the
 * origin; the world moves past it toward -Z (the treadmill). The camera looks at the horse's right side (it sits at -X when its
 * azimuth is 0), so a horse that faces +Z travels from the left of the picture to the right.
 */
import type { WorldId } from "@/lib/content/horse-worlds";
import { worldOrder } from "@/lib/content/horse-worlds";

export type { WorldId };
export const WORLD_IDS: readonly WorldId[] = worldOrder;

/** What the visitor can ask the horse to do. Each maps to one speed the measured clips were authored for. */
export type GaitChoice = "stand" | "walk" | "trot" | "canter" | "gallop";

export type Vec3Tuple = [number, number, number];

/** A guided camera shot. Azimuth 0 looks at the horse's right side; positive azimuth swings toward its front. */
export type ShotSpec = {
  azimuth: number; // degrees
  elevation: number; // degrees above the horizon
  distance: number; // metres from the target (a floor: narrow frames pull back to keep the whole horse in)
  fov: number; // vertical field of view, degrees
  target: Vec3Tuple; // where the camera looks, relative to the horse's root
};

/** Light for one world. Colours are CSS hex; directions point FROM the horse TO the light, in the model frame. */
export type LightRig = {
  sunDir: Vec3Tuple;
  sunColor: string;
  sunIntensity: number;
  skyColor: string;
  groundColor: string;
  hemiIntensity: number;
  rimDir: Vec3Tuple;
  rimColor: string;
  rimIntensity: number;
  fillDir: Vec3Tuple;
  fillColor: string;
  fillIntensity: number;
  exposure: number;
  envIntensity: number;
};

/** The ground the hooves meet: how much dust a strike lifts, how deep a print reads, and what colour both are. */
export type SurfaceSpec = {
  dust: number; // 0..1.5 particles per strike
  prints: number; // 0..1
  hardness: number; // 0..1 (soft sand .. packed earth)
  dustColor: string;
  printTint: string;
  printStrength: number;
  printLife: number; // seconds a print stays visible
};

/**
 * One cut-out in a sprite atlas, as recorded by the generator that drew it (scripts/horse-worlds, merged into atlas-data.ts):
 * where it sits in the image (pixels, y from the top) and how large it is in the world (metres).
 */
export type SpriteVariant = {
  name: string;
  rect: [number, number, number, number]; // x, y, w, h in the full-size image
  width: number; // metres
  height: number;
  weight: number; // relative chance of being picked
};

export type AtlasData = { size: [number, number]; variants: SpriteVariant[] };

/** One instanced field of upright cut-outs (trees, fences, houses...) that scrolls past with the ground. */
export type SpriteFieldSpec = {
  atlas: string; // key into ATLAS (atlas-data.ts), e.g. "desert.mid"
  image: string; // site path of the full-size RGBA atlas (goes through asset())
  imageMobile?: string; // the half-size copy used on phones
  pick?: string[]; // only these variants (default: all in the atlas)
  /** scatter: random places in a lateral band; row: one after another along the track (walls, fences). */
  layout: "scatter" | "row";
  count: number; // scatter: instances; row: ignored (span / spacing)
  countMobile?: number;
  span: number; // metres of track one lap covers before the field repeats (re-rolled each lap)
  x: [number, number]; // lateral range: +X is behind the horse as the camera sees it, -X is between the camera and the horse
  spacing?: number; // row only: metres from one cut-out to the next (set to the cut-out's width for a continuous wall)
  facing: "camera" | "track"; // trees turn to the camera; walls and fences stay square to the track
  scale: [number, number]; // random size multiplier
  tint: string; // multiplied over the art
  shadow: number; // 0..1 strength of the sheared cast shadow on the ground (0 = none)
  fade: number; // metres over which a cut-out fades in/out at the ends of its span
  sway: number; // 0..0.05 how far the crown leans in the wind (fraction of its height)
};

export type GroundSpec = {
  albedo: string;
  albedoMobile?: string;
  normal?: string;
  normalMobile?: string; // half-size detail map for phones (a quarter of the memory, about a third of the bytes)
  tileMetres: number; // metres one tile covers (the scroll speed is distance / tile size)
  roughness: number;
  normalScale: number;
  macro: number; // 0..0.3 strength of the slow colour variation that hides the tiling
  tint: string;
};

export type DistantSpec = {
  image: string; // RGBA band, tileable horizontally
  imageMobile?: string;
  radius: number; // metres: the layer's depth, which sets how slowly it slides (angular speed = v / radius)
  height: number; // metres of the band at that radius
  repeats: number; // times the tile wraps around the full circle
  base: number; // metres below the horizon the band starts (hidden under the haze)
  hazeLow?: number; // fraction of the band's height, from its foot, over which it melts into the haze (default 0.12)
  hazeFoot?: number; // how much haze at the very foot, 0..1 (default 0.9)
};

export type SkySpec = {
  zenith: string;
  mid: string;
  horizon: string;
  haze: string;
  sunColor: string;
  sunGlow: number;
  clouds: number; // 0..1 coverage
  cloudColor: string;
  cloudShade: string;
  cloudScale: number;
  drift: number; // cloud drift (units of cloud-plane per second)
  hazeAmount: number;
  hazeFalloff: number;
};

/**
 * Short grass standing on the ground around the horse (layer E): real tufts that lean in the wind and part around each hoof.
 * Only worlds with a lawn or pasture have it; the sand and the earth lane have dust instead.
 */
export type GrassSpec = {
  count: number; // tufts on a computer (each is a handful of blades)
  countMobile: number;
  height: number; // metres of an average blade
  color: string; // the foot of a blade
  tipColor: string;
  dryColor: string; // some tufts are dry and pale
  dry: number; // 0..1 share of dry tufts
  area: [number, number]; // half width (across the track) and half length (along it) of the patch of tufts, metres
  center: [number, number]; // x, z of the middle of the patch, in the horse's frame
  bend: number; // 0..1.2 how far a hoof pushes the blades aside
  sway: number; // 0..1 how far the wind leans them
};

export type WorldConfig = {
  id: WorldId;
  label: string; // the button text (copy lives in lib/content/horse-worlds.ts)
  title: string; // the name of the place
  caption: string; // one plain sentence about it
  gaits: GaitChoice[];
  defaultGait: GaitChoice;
  fog: { color: string; density: number };
  light: LightRig;
  sky: SkySpec;
  ground: GroundSpec;
  distant: DistantSpec;
  mid: SpriteFieldSpec;
  /** More fields of cut-outs behind the horse (a row of fences, a few stables), drawn with the same machinery as `mid`. */
  extra?: SpriteFieldSpec[];
  fore: SpriteFieldSpec;
  grass?: GrassSpec;
  surface: SurfaceSpec;
  ambientDust: { rate: number; color: string; size: number }; // drifting motes per second
  wind: Vec3Tuple;
  shots: Record<GaitChoice, ShotSpec>;
  /** Colour of the cast shadows the cut-outs lay on the ground (default a warm dark brown). */
  shadowColor?: string;
};

/** The speed (m/s) the Locomotor is asked for at each gait: the speed each clip was authored and measured at. */
export const GAIT_SPEED: Record<GaitChoice, number> = { stand: 0, walk: 1.44, trot: 3.33, canter: 4.9, gallop: 10 };

export const GAIT_LABEL: Record<GaitChoice, string> = { stand: "Stand", walk: "Walk", trot: "Trot", canter: "Canter", gallop: "Gallop" };
