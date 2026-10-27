/** Model URLs (kept apart from marwari.ts so importing them does not pull in three.js). */
// next.config.mjs sets a content hash in production builds; the versioned URL is served immutable, the plain one (dev) is not.
const V = process.env.NEXT_PUBLIC_MODEL_V;
const versioned = (url: string) => (V ? `${url}?v=${V}` : url);
export const HERO_MODEL = versioned("/models/marwari-hero.glb");
export const HERO_MODEL_MOBILE = versioned("/models/marwari-hero-mobile.glb");
export const ANATOMY_MODEL = versioned("/models/marwari-anatomy.glb");
