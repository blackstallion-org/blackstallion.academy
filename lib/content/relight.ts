import { asset } from "./asset";
import { fleet } from "./fleet";

/**
 * Reel 06 · The Studbook, scene "Light the stable". Three stallions from the studbook, each a studio portrait on a
 * dark ground that the pointer lights like a stable lantern. The effect is the Codrops "Relighting Images" shader on
 * a neural depth map made from each photograph (Depth Anything V2 Small, scripts/make-depth.py). Studbook profiles are
 * SAMPLE data.
 */
/** Copy for a relit scene (components/sections/shared/RelightScene). */
export type RelightCopy = {
  label: string;
  inscription: string;
  voice: string;
  body: string;
  hintPointer: string;
  hintTouch: string;
  hintKeys: string;
  stageLabel: string;
  unsupported: string;
  note: string;
  tablist?: string;
  sample?: string;
};

export const relightScene: RelightCopy = {
  label: "The stable at night",
  inscription: "Light the",
  voice: "stallion.",
  body: "The lantern is your pointer. Draw it across the horse and the coat answers: light rakes the muscle of the neck, a shadow falls behind the ears, and the dark gives way to the animal. Choose a stallion below.",
  hintPointer: "Move your pointer over the horse to carry the lantern.",
  hintTouch: "Drag a finger over the horse to carry the lantern.",
  hintKeys: "Or focus the picture and use the arrow keys.",
  stageLabel: "A lantern you move over the portrait. Use the arrow keys to move it.",
  unsupported: "This device cannot draw the relit portrait, so the lantern is a simple glow over the photograph.",
  note: "The relighting is a shader working from a depth map made from the photograph, not a second photograph. Studbook profiles are sample data.",
  tablist: "Stallions in the stable",
  sample: "Sample profile",
};

const byId = (id: string) => {
  const stallion = fleet.find((s) => s.id === id);
  if (!stallion) throw new Error(`Unknown stallion: ${id}`);
  return stallion;
};

/** One relit picture. `coat` and `character` label tabs; `caption` sits under the copy when there is one picture. */
export type RelightItem = {
  id: string;
  name: string;
  image: string;
  depth: string;
  alt: string;
  coat?: string;
  character?: string;
  caption?: string;
};

/** Photographs are the studbook's own portraits; depth maps are in public/images/relight. */
export const relightHorses: RelightItem[] = [
  { ...pick("chetak-ix", "fleet-chetak", "chetak"), alt: "Chetak IX, a dark bay Marwari with a white blaze, in a dark stable." },
  { ...pick("veer", "fleet-veer", "veer"), alt: "Veer, a chestnut-gold stallion, rim-lit against darkness." },
  { ...pick("zilzal", "fleet-zilzal", "zilzal"), alt: "Zilzal, a black Marwari stallion, in a dark stable." },
];

function pick(id: string, file: string, depth: string) {
  const s = byId(id);
  return {
    id: s.id,
    name: s.name,
    character: s.character,
    coat: s.coat,
    image: asset(`/images/fleet/${file}.webp`),
    depth: asset(`/images/relight/${depth}-depth.webp`),
  };
}

/**
 * Reel 02 · The Instrument, scene "Read it in stone": a marble study of a Marwari head under a gallery light. The
 * marble is Higgsfield placeholder art (an illustration, not a real sculpture) and the page says so.
 */
export const marbleScene: RelightCopy = {
  label: "The sculptor's study",
  inscription: "Read it",
  voice: "in stone.",
  body: "A sculptor learns a horse by its planes before its colour. Carry the light across the marble: the ears curving inward until the tips touch, the hollow above the eye, the jaw, and the long muscle of the neck running down to the chest.",
  hintPointer: "Move your pointer over the marble to carry the light.",
  hintTouch: "Drag a finger over the marble to carry the light.",
  hintKeys: "Or focus the picture and use the arrow keys.",
  stageLabel: "A light you move over a marble study of a Marwari head. Use the arrow keys to move it.",
  unsupported: "This device cannot draw the relit marble, so the light is a simple glow over the picture.",
  note: "Illustration (placeholder art): a rendered marble study, not a photograph of a real sculpture. The relighting is a shader working from a depth map made from the picture.",
};

export const marbleStallion: RelightItem[] = [
  {
    id: "marble-marwari",
    name: "Marwari head, marble study",
    image: asset("/images/anatomy/marble-stallion.webp"),
    depth: asset("/images/relight/marble-stallion-depth.webp"),
    alt: "A white marble bust of a Marwari stallion with inward-curving ears, a carved bridle with tassels and a long wavy mane, on a black plinth.",
    caption: "Study in white marble: the ears, the eye, the jaw, the neck.",
  },
];
