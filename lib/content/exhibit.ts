/**
 * Reel 01 · The Marwari, chapter "The last exhibit". Copy for the cloaked stallion at the end of the museum.
 * No factual claims beyond the breed history already in lib/content/legend.ts: this is a rendered model.
 */
export const lastExhibit = {
  label: "The last exhibit",
  inscription: "A horse that",
  voice: "would not vanish.",
  body: "The corridor ends at a stallion. Move your pointer over him, or press and hold on him, and the black coat dissolves into glass, cell by cell, until only the shape of the animal remains. Let go and the coat closes over him again. The breed came close to disappearing in the twentieth century; here it takes the opposite turn.",
  hintPointer: "Hover over the stallion, or press and hold.",
  hintTouch: "Press and hold on the stallion.",
  pin: "Pin the cloak",
  unpin: "Release the cloak",
  stateCloaked: "The coat has dissolved into glass.",
  stateVisible: "The black coat is closed.",
  unsupported: "This device cannot draw the 3D exhibit. A photograph of the stallion is shown instead.",
  alt: "A black Marwari stallion",
  note: "A rendered model; the glass effect is a shader, not a photograph.",
} as const;
