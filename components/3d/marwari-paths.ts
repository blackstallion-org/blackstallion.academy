import { asset } from "@/lib/content/asset";

/** Model URLs (kept apart from marwari.ts so importing them does not pull in three.js). */
// next.config.mjs sets a content hash in production builds; the versioned URL is served immutable, the plain one (dev) is not.
const V = process.env.NEXT_PUBLIC_MODEL_V;
const versioned = (url: string) => (V ? `${url}?v=${V}` : url);
// The three-view refinement (3 Nov 2026, tools/blender/10_refine): blaze, four stockings, warm coat, full tail. The previous
// exports (marwari-hero.glb, marwari-hero-mobile.glb) are untouched; pointing these two lines back at them restores the old horse.
export const HERO_MODEL = versioned(asset("/models/marwari-hero-refined.glb"));
export const HERO_MODEL_MOBILE = versioned(asset("/models/marwari-hero-mobile-refined.glb"));
// The Instrument plate shows the same refined horse as the hero (identical rig and clips); marwari-anatomy.glb is left untouched, pointing this back at it restores the earlier one.
export const ANATOMY_MODEL = versioned(asset("/models/marwari-hero-refined.glb"));
// The riding kit (saddle, bridle, helmet, boots, stirrups, gloves, crop) is the supplied tack set of 4 Nov 2026, simplified from 1.9 million
// triangles to 300 000 (1.3 MB) and, for phones, 100 000 (0.5 MB). The earlier kit (riding-gear-high.glb and riding-gear-low.glb) is
// untouched; pointing these two lines back at it restores it.
export const RIDING_GEAR_MODEL = versioned(asset("/models/riding-tack.glb"));
export const RIDING_GEAR_MODEL_LOW = versioned(asset("/models/riding-tack-low.glb"));
