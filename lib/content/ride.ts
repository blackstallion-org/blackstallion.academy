/**
 * "Ride Wild" (/ride): a scroll-driven 3D runway. Copy and station content only; the engine is components/runway.
 * Every fact here is one the site already publishes (lib/content/site.ts, the Legend and Curriculum reels).
 * HUD figures are illustrative and marked SAMPLE on the page.
 */

export const ride = {
  brand: "Black Stallion",
  tag: "Ride wild",
  title: ["RIDE", "WILD"],
  subtitle: "Born for the charge",
  finale: "BSAH",
  info: {
    title: "Ride wild",
    body: [
      "A Marwari stallion at full sprint, drawn as a white latitude and longitude grid over a black body. Scroll to push the camera down the runway; the horse keeps its stride the whole way.",
      "Five stations pass on the way: the record cards, the instruments, the controls, the glass, and the academy's mark.",
    ],
    keys: "Scroll or use the arrow keys to travel. BG COLOR changes the ground; RESTART returns to the start.",
  },
} as const;

export type RideStation = { id: string; label: string; title: string; lines: string[] };

/** In scroll order. The 3D scene draws each one; the same text is in the page for screen readers and reduced motion. */
export const rideStations: RideStation[] = [
  {
    id: "hero",
    label: "00 · Start",
    title: "Born for the charge",
    lines: ["The Marwari: the horse that would not leave the field.", "Several hundred kilograms that read you first."],
  },
  {
    id: "cards",
    label: "01 · The record",
    title: "Eight hundred years",
    lines: [
      "Bred in the dry country around Jodhpur, hardy on little water and quick over sand.",
      "Ears that curve inward until the tips almost touch.",
      "Twenty-one stallions at the academy. Every one has a name.",
    ],
  },
  {
    id: "hud",
    label: "02 · The instruments",
    title: "Every stride, read",
    lines: ["Gait, stride rate and speed, read as the horse runs.", "Figures on this screen are a SAMPLE, not a measurement."],
  },
  {
    id: "knobs",
    label: "03 · The controls",
    title: "Four ranks. Thirteen pillars.",
    lines: ["An athletic curriculum that builds character, one setting at a time."],
  },
  {
    id: "glass",
    label: "04 · The glass",
    title: "Safety before speed",
    lines: ["Ex-cavalry faculty, daily veterinary care, insurance."],
  },
  {
    id: "finale",
    label: "05 · The mark",
    title: "BSAH",
    lines: ["The Black Stallion Academy of Horsemanship. Dominus sui, dominus equi."],
  },
];

/** Card faces for the record station: [kicker, big line, small line]. */
export const rideCards: [string, string, string][] = [
  ["LINEAGE", "800", "YEARS OF THE MARWARI"],
  ["ORIGIN", "MARWAR", "JODHPUR · RAJASTHAN"],
  ["EARS", "INWARD", "TIPS ALMOST TOUCH"],
  ["STABLE", "21", "STALLIONS · EACH NAMED"],
  ["MOTTO", "DOMINUS SUI", "DOMINUS EQUI"],
  ["COUNCIL", "STPCI", "SCHOOL TENT PEGGING"],
];

/** Ground colours offered by BG COLOR (any colour can also be picked). */
export const rideSwatches = [
  { name: "Blue-violet", value: "#2260d9" },
  { name: "Charcoal", value: "#171513" },
  { name: "Chestnut", value: "#78472f" },
  { name: "Slate", value: "#3d4652" },
] as const;

/** Where each station sits in scroll progress (0 to 1). */
export const rideRanges: Record<string, [number, number]> = {
  hero: [0, 0.12],
  cards: [0.12, 0.3],
  hud: [0.3, 0.5],
  knobs: [0.5, 0.68],
  glass: [0.68, 0.85],
  finale: [0.85, 1],
};
