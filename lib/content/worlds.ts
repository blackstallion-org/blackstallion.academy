/**
 * Copy for /worlds, the Four Worlds journey (components/worlds). One idea per world; no claims from the "No" rows of the
 * claims ledger. World 02 is an illustration: its light is storytelling, not a measurement, and the page says so.
 */
export type WorldCopy = { inscription: string; voice: string; line: string; note?: string };

export const WORLD_COPY: Record<"origins" | "life" | "legacy" | "beyond", WorldCopy> = {
  origins: {
    inscription: "One horse",
    voice: "small against the world.",
    line: "A black Marwari on the hill above the academy. Scroll, and follow him.",
  },
  life: {
    inscription: "Muscle, bone, breath",
    voice: "the horse within the horse.",
    line: "Every stride is bone and muscle working together. A rider learns to feel it before they can name it.",
    note: "Illustration. The anatomy follows the academy's Marwari model; the light is storytelling, not a measurement.",
  },
  legacy: {
    inscription: "Bred in Marwar",
    voice: "for the cavalry.",
    line: "The breed was raised by the horsemen of Marwar, in western Rajasthan, and rode with its cavalry for centuries.",
  },
  beyond: {
    inscription: "The same horse",
    voice: "a new century.",
    line: "What the horse teaches does not change: balance, patience, trust.",
  },
};

/** Required by the CC BY 4.0 licence of the planet textures; the CC0 sources are credited as a courtesy. */
export const WORLDS_CREDITS =
  "Four Worlds is rendered live in your browser. Planet and moon textures: Solar System Scope (solarsystemscope.com), CC BY 4.0, based on NASA imagery. Skies, ground textures and a boulder scan: Poly Haven and ambientCG (CC0). Terrain, academy, fort, riders, orbital platform and stars: built for BSAH in Blender. Horse and anatomy: the academy's own Marwari model.";

export const WORLDS_FINAL = {
  inscription: "One horse. Four worlds.",
  voice: "an 800-year lineage, handed to your child.",
  primary: { label: "Enrol a cadet", href: "/enroll" },
  secondary: { label: "Visit the academy", href: "/contact" },
};
