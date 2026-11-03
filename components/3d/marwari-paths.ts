import { asset } from "@/lib/content/asset";

/** Model URLs (kept apart from marwari.ts so importing them does not pull in three.js). */
// next.config.mjs sets a content hash in production builds; the versioned URL is served immutable, the plain one (dev) is not.
const V = process.env.NEXT_PUBLIC_MODEL_V;
const versioned = (url: string) => (V ? `${url}?v=${V}` : url);
// The three-view refinement (3 Nov 2026, tools/blender/10_refine): blaze, four stockings, warm coat, full tail. The previous
// exports (marwari-hero.glb, marwari-hero-mobile.glb) are untouched; pointing these two lines back at them restores the old horse.
export const HERO_MODEL = versioned(asset("/models/marwari-hero-refined.glb"));
export const HERO_MODEL_MOBILE = versioned(asset("/models/marwari-hero-mobile-refined.glb"));
export const ANATOMY_MODEL = versioned(asset("/models/marwari-anatomy.glb"));
// The riding kit (saddle, bridle, helmet, boots, stirrups) is one scan. The original, riding-gear-draco.glb, has 1.9 million
// triangles (5.2 MB) and is no longer served; these two are simplified copies of it (282 000 and 94 000 triangles).
export const RIDING_GEAR_MODEL = versioned(asset("/models/riding-gear-high.glb"));
export const RIDING_GEAR_MODEL_LOW = versioned(asset("/models/riding-gear-low.glb"));
