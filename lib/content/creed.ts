/**
 * The academy creed on /about (MandateKineticStage). 17 Nov 2026 (owner: "this text doesn't suit here, make it light"): one short
 * headline, one plain line, three principles in everyday words. The old animation leftovers ("-360° inner discipline",
 * "elastic harmony") and the wrong "Reel 14" label are gone; /about is not a reel.
 */
export const creed = {
  label: "The Sovereign Creed",
  headline: "Master yourself first. Then the horse.",
  caption: "The academy's motto, Dominus sui, dominus equi, in three parts. A calm rider earns a horse's trust.",
  boxes: [
    {
      id: "box1",
      label: "Dominus sui",
      metric: "Self-discipline",
      description: "Staying calm and steady when the arena is loud or something goes wrong.",
    },
    {
      id: "box2",
      label: "Dominus equi",
      metric: "Harmony with the horse",
      description: "Asking with a light hand and a quiet seat, and listening for the horse's answer.",
    },
    {
      id: "box3",
      label: "Sovereign character",
      metric: "A steady compass",
      description: "Honesty, care for the animal and loyalty to friends, off the field as well as on it.",
    },
  ],
} as const;
