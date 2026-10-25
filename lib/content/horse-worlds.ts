/**
 * Words for the "one horse, three horizons" viewer (components/sections/anatomy/HorseWorlds.tsx). The scenes themselves are data
 * in components/horse-worlds/worlds.ts; this file holds only what a visitor reads or hears.
 */
export type WorldId = "desert" | "field" | "village";

export const worldOrder: readonly WorldId[] = ["desert", "field", "village"];

export type WorldCopy = {
  /** The button text. */
  label: string;
  /** The name of the place. */
  title: string;
  /** One plain sentence about it. */
  caption: string;
  /** What a screen reader hears when the scene has changed. */
  announce: string;
};

export const worldCopy: Record<WorldId, WorldCopy> = {
  desert: {
    label: "Desert",
    title: "The Marwar flats",
    caption: "Level sand in low golden light, a long horizon, and the first dunes far off in the haze.",
    announce: "Now showing the Marwar desert at golden hour.",
  },
  field: {
    label: "Horse Field",
    title: "The home paddock",
    caption: "Green grass on a cool morning, with fences, stables and old trees. A gentler pace.",
    announce: "Now showing the horse field on a morning in early light.",
  },
  village: {
    label: "Village",
    title: "A lane in the village",
    caption: "Sandstone and lime-washed walls, wooden doors, and slow steps between the houses.",
    announce: "Now showing a Marwar village lane.",
  },
};

export const horseWorldsCopy = {
  label: "Three horizons",
  inscription: "One horse,",
  voice: "three horizons.",
  lede: "Choose a place. The horse stays where it is; the ground, the trees and the far land move past at the pace of its stride.",
  groupLabel: "Choose a place",
  howTitle: "How it moves",
  how: "The horse never leaves the middle of the frame. What moves is the world: ground, sky and distance slide past at the speed of the horse's own stride, so a walk looks like a walk and a halt is a halt.",
  reduced: "Motion is reduced: the horse stands still and the scene changes without a transition.",
  unavailable: "The 3D view is unavailable on this device. Showing a still of the scene.",
  loading: "Loading the scene",
  gaitNote: "Each place offers the gaits that suit it.",
} as const;
