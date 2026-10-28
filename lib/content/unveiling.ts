import { asset } from "@/lib/content/asset";
/**
 * "The unveiling": the opening of a page, in three beats that never share the screen.
 *   1. STONE   a white marble statue of the Marwari, lit by a gallery light.
 *   2. LANTERN the visitor's lantern (pointer, finger or scroll) is carried over it and the stone gives way to the living stallion.
 *   3. LIGHT   the lit stallion holds the frame and the page's own light and images follow below.
 * Each scene is a pair of stills, the marble and its living twin in the same pose and framing, each with a neural depth map
 * (scripts/make-depth.py) so the relighting shader (components/3d/relight) can rake light across them. The stills are Higgsfield
 * placeholder art (GPT Image 2.5, 28 Oct 2026; the twin generated from the statue as a reference) and the page says so.
 */

export type UnveilingBeat = { inscription: string; voice: string; line: string };
export type UnveilingStill = { image: string; depth: string; alt: string };

export type UnveilingScene = {
  id: string;
  /** Small label above the headline. */
  label: string;
  stone: UnveilingBeat;
  lantern: UnveilingBeat;
  light: UnveilingBeat;
  statue: UnveilingStill;
  living: UnveilingStill;
  /** The lantern's own path while nobody is steering it: points as fractions of the picture (x right, y down), scroll-driven. */
  path: readonly (readonly [number, number])[];
};

/** Words that are the same on every page. */
export const unveilingChrome = {
  regionLabel: "A marble stallion, lit by a lantern until it becomes a living one",
  beats: ["Stone", "Lantern", "Light"] as const,
  scroll: "Scroll to light it",
  hintPointer: "Move your pointer over the horse to carry the lantern.",
  hintTouch: "Scroll to carry the lantern; drag a finger over the horse to steer it.",
  hintKeys: "Or focus the picture and use the arrow keys.",
  stageLabel: "A lantern you carry over a marble stallion until it becomes a living one. Use the arrow keys to move it.",
  note: "Illustration (placeholder art): a rendered marble statue and its living twin, not photographs of a real sculpture or horse. The lantern is a shader working from a depth map made from each picture.",
  read: "Read on",
};

export const unveilings = {
  anatomy: {
    id: "unveiling-instrument",
    label: "The Instrument",
    stone: {
      inscription: "First,",
      voice: "stone.",
      line: "A sculptor learns a horse by its planes before its colour: the shoulder, the long back, the carry of the neck.",
    },
    lantern: {
      inscription: "Then the",
      voice: "lantern.",
      line: "Carry the light across it. The marble gives way, and the dark gives up the animal: ears, crest, croup and hoof.",
    },
    light: {
      inscription: "Now the",
      voice: "living horse.",
      line: "Everything below is how to read it: six points on one stallion, and what each one asks of a young rider.",
    },
    statue: {
      image: asset("/images/unveil/stone-anatomy.webp"),
      depth: asset("/images/unveil/stone-anatomy-depth.webp"),
      alt: "A white marble statue of a Marwari stallion in profile on a black plinth, with inward-curving ears, a carved bridle with tassels and a long carved mane and tail.",
    },
    living: {
      image: asset("/images/unveil/living-anatomy.webp"),
      depth: asset("/images/unveil/living-anatomy-depth.webp"),
      alt: "The same Marwari stallion alive: a glossy black horse in profile on a dark studio floor, rim-lit along the crest and croup, with a bridle and small brass tassels.",
    },
    path: [[0.24, 0.3], [0.42, 0.36], [0.58, 0.46], [0.72, 0.5]],
  },
  curriculum: {
    id: "unveiling-curriculum",
    label: "The Ledger",
    stone: {
      inscription: "Carved in",
      voice: "patience.",
      line: "Every skill starts as stillness: a young rider, a horse much larger than they are, and time.",
    },
    lantern: {
      inscription: "Then the",
      voice: "lantern.",
      line: "Light finds what training builds: the head that stays up, the ear that listens, the neck that carries the bit.",
    },
    light: {
      inscription: "Now the",
      voice: "lesson.",
      line: "The curriculum below is that lantern, held steady, one lesson after another.",
    },
    statue: {
      image: asset("/images/unveil/stone-curriculum.webp"),
      depth: asset("/images/unveil/stone-curriculum-depth.webp"),
      alt: "A white marble bust of a Marwari stallion seen from three-quarter front, head high, with inward-curving ears, a carved bridle with tassels and a flowing carved mane.",
    },
    living: {
      image: asset("/images/unveil/living-curriculum.webp"),
      depth: asset("/images/unveil/living-curriculum-depth.webp"),
      alt: "The same Marwari stallion alive: a glossy black horse, head high and alert, in a three-quarter view with a long mane and a bridle with small brass tassels, rim-lit against darkness.",
    },
    path: [[0.4, 0.26], [0.46, 0.4], [0.52, 0.58], [0.66, 0.5]],
  },
  parents: {
    id: "unveiling-parents",
    label: "The Guardian",
    stone: {
      inscription: "A quiet",
      voice: "horse.",
      line: "Before the lessons and the uniform there is one horse, and a child learning to be calm beside it.",
    },
    lantern: {
      inscription: "Then the",
      voice: "light.",
      line: "Move the lantern slowly. The eye opens, the ear turns toward you. A horse reads a child as carefully as a child reads a horse.",
    },
    light: {
      inscription: "Now the",
      voice: "welcome.",
      line: "Below: what a morning looks like, what we promise and what we do not, and how to ask for a place.",
    },
    statue: {
      image: asset("/images/unveil/stone-parents.webp"),
      depth: asset("/images/unveil/stone-parents-depth.webp"),
      alt: "A white marble study of a calm Marwari stallion's head and neck in profile, head lowered, with a carved bridle with tassels and a long carved mane falling forward.",
    },
    living: {
      image: asset("/images/unveil/living-parents.webp"),
      depth: asset("/images/unveil/living-parents-depth.webp"),
      alt: "The same Marwari stallion alive: a glossy black horse, head gently lowered, in profile with a soft eye, a long mane and a bridle with small brass tassels.",
    },
    path: [[0.36, 0.38], [0.5, 0.46], [0.62, 0.52], [0.72, 0.42]],
  },
} satisfies Record<string, UnveilingScene>;
