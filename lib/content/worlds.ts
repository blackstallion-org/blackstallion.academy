/**
 * Copy for /worlds and the opening film (components/worlds). One idea per world; no claims from the "No" rows of the claims
 * ledger. 14 Nov 2026 (owner): two worlds, the hill and the memory of Marwar; the cells (Life) and space (Beyond) were cut.
 */
export type WorldCopy = { inscription: string; voice: string; line: string; note?: string };

export const WORLD_COPY: Record<"origins" | "legacy", WorldCopy> = {
  origins: {
    inscription: "One horse",
    voice: "small against the world.",
    line: "A black Marwari on the hill above the academy. Scroll, and follow him.",
  },
  legacy: {
    inscription: "Bred in Marwar",
    voice: "for the cavalry.",
    line: "The breed was raised by the horsemen of Marwar, in western Rajasthan, and rode with its cavalry for centuries.",
  },
};

/** What the film shows on screen: one short line per world (the full copy above is for the static version). */
export const WORLD_SWISS: Record<"origins" | "legacy", { line: string; note?: string }> = {
  origins: { line: "One horse, small against the world." },
  legacy: { line: "Bred in Marwar for the cavalry." },
};

/**
 * The intro film (components/worlds): one large headline and one short sentence per world. Plain statements about the horse and
 * the breed.
 */
export const INTRO_COPY: Record<"origins" | "legacy", { headline: string; line: string }> = {
  origins: { headline: "One horse.", line: "A black Marwari on the hill above the academy." },
  legacy: { headline: "Bred in Marwar.", line: "Raised by the horsemen of Rajasthan to ride with the cavalry." },
};

/** The CC0 sources are credited as a courtesy. */
export const WORLDS_CREDITS =
  "The opening film is rendered live in your browser. Skies, ground textures and a boulder scan: Poly Haven and ambientCG (CC0). Terrain, academy, fort and riders: built for BSAH in Blender. Horse: the academy's own Marwari model.";

export const WORLDS_FINAL = {
  inscription: "One horse. One lineage.",
  voice: "an 800-year lineage, handed to your child.",
  sub: "An 800-year lineage, handed to your child.",
  primary: { label: "Enrol a cadet", href: "/enroll" },
  secondary: { label: "Visit the academy", href: "/contact" },
};
