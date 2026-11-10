/**
 * Scroll motion for the illustrated history pages: one "world" profile per page (depth, camera push, atmosphere) and the
 * gait of each scene's subject cutout, read from the painting itself (see docs/history-scrolls/PLAN.md).
 */

export type Gait = "gallop" | "canter" | "walk" | "rear" | "still";
/** dir: the way the subject faces and travels (1 = right). travel: horizontal travel across the scene, in % of the art width. */
export type SubjectMotion = { gait: Gait; dir: 1 | -1; travel?: number };

export type WorldId = "india" | "world" | "lakshmibai" | "alexander";
export type AtmoPreset = "dust" | "wind" | "embers" | "haze";

export type WorldProfile = {
  /** Parallax amplitude in % of each layer's height: background drift and foreground counter-drift. */
  depth: { B: number; F: number };
  /** Background push-in over a scene's pass: start scale minus one. */
  push: number;
  atmo: AtmoPreset;
  /** Particle colours, sRGB (canvas cannot read the CSS custom properties cheaply); taken from the .hs palette. */
  colors: string[];
  /** Base drift to the right, px per frame at 60fps. */
  wind: number;
};

export const WORLDS: Record<WorldId, WorldProfile> = {
  india: { depth: { B: 4, F: 10 }, push: 0.08, atmo: "dust", colors: ["#c7a15a", "#d9b98a", "#b5793f"], wind: 0.25 },
  world: { depth: { B: 5, F: 12 }, push: 0.07, atmo: "wind", colors: ["#f2e9d8", "#c7a15a", "#9fae8c"], wind: 1.6 },
  lakshmibai: { depth: { B: 4, F: 11 }, push: 0.1, atmo: "embers", colors: ["#e0763a", "#a63c32", "#f2b45a"], wind: 0.35 },
  alexander: { depth: { B: 4, F: 9 }, push: 0.06, atmo: "haze", colors: ["#f2e9d8", "#c7a15a", "#e8d3a4"], wind: 0.15 },
};

export function worldFor(route: string): WorldId {
  if (route.includes("india")) return "india";
  if (route.includes("lakshmibai")) return "lakshmibai";
  if (route.includes("alexander")) return "alexander";
  return "world";
}

const TRAVEL: Record<Gait, number> = { gallop: 16, canter: 11, walk: 6, rear: 0, still: 0 };

const M = (gait: Gait, dir: 1 | -1 = 1): SubjectMotion => ({ gait, dir, travel: TRAVEL[gait] });

/** Keyed by scene id. A scene without an entry keeps only the depth parallax. */
export const SUBJECT_MOTION: Record<string, SubjectMotion> = {
  IN01: M("walk", -1),
  IN02: M("still"),
  IN03: M("gallop"),
  IN04: M("gallop"),
  IN05: M("walk", -1),
  IN06: M("gallop"),
  IN07: M("gallop", -1),
  WO01: M("walk"),
  WO02: M("walk", -1),
  WO03: M("gallop"),
  WO04: M("still"),
  WO05: M("gallop"),
  WO06: M("still"),
  WO07: M("still"),
  JH01: M("walk", -1),
  JH02: M("gallop"),
  JH03: M("still"),
  JH04: M("walk"),
  JH05: M("still"),
  JH06: M("gallop"),
  JH07: M("canter", -1),
  JH08: M("still"),
  AL01: M("rear", -1),
  AL02: M("still"),
  AL03: M("still"),
  AL04: M("walk"),
  AL05: M("still"),
  AL06: M("walk", -1),
  AL07: M("still"),
  AL08: M("still"),
};
