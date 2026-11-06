/**
 * Species the detector can name, and what Motion Lab is willing to claim for each.
 *
 * Detection comes from YOLOX-Nano trained on COCO, which has these nine four-legged animal classes. The pose model (RTMPose-m on AP-10K)
 * was trained on 54 species with one shared 17-point layout, so the same weights can be asked about any of them, but a model that
 * can be asked is not a model that has been checked. `status` records what was actually verified on real footage:
 *
 *   "tested"       skeleton and movement analysis were run on real video of this species and the results reviewed (docs/MOTION_LAB.md).
 *   "detect-only"  the animal is found and named, a box is drawn, and nothing else is claimed: no skeleton, angles or gait.
 *
 * Changing a status to "tested" is a statement about evidence, not a setting: do it only with a recorded test.
 */
export type SpeciesKey = "horse" | "dog" | "cat" | "sheep" | "cow" | "zebra" | "bear" | "elephant" | "giraffe";
export type SpeciesStatus = "tested" | "detect-only";

export type GaitKind = "standing" | "walk" | "trot" | "canter" | "gallop" | "run" | "moving" | "unclear";

export type SpeciesProfile = {
  key: SpeciesKey;
  label: string;
  /** COCO class index of the detector. */
  cls: number;
  status: SpeciesStatus;
  /** Name for the lowest point of a leg, so the report says "hoof" or "paw" without claiming an anatomical landmark. */
  foot: string;
  /**
   * Gaits this species may be labelled with. Anything else the legs might be doing is reported as "moving" (rhythmic leg movement,
   * type not named) rather than guessed.
   */
  gaits: readonly GaitKind[];
  /** Plausible stride frequencies (strides per second, one stride = every leg stepped once), from textbook ranges, per gait. */
  strideHz: Partial<Record<GaitKind, readonly [number, number]>>;
  /** Frequency above which an asymmetric gait is a gallop rather than a canter (horses) or a run (others). */
  fastHz: number;
  /** One line for the report: what this species' result does and does not mean. */
  note: string;
};

export const SPECIES: Record<SpeciesKey, SpeciesProfile> = {
  horse: {
    key: "horse", label: "Horse", cls: 17, status: "tested", foot: "hoof",
    gaits: ["standing", "walk", "trot", "canter", "gallop"],
    strideHz: { walk: [0.6, 1.4], trot: [0.9, 2.1], canter: [1.2, 2.1], gallop: [1.8, 3.2] },
    fastHz: 1.95,
    note: "Horse results use the generic AP-10K animal points, not hoof, fetlock or hock markers.",
  },
  dog: {
    key: "dog", label: "Dog", cls: 16, status: "tested", foot: "paw",
    gaits: ["standing"],
    strideHz: { walk: [0.7, 2.0], trot: [1.2, 3.0], run: [2.0, 4.8] },
    fastHz: 2.4,
    note: "Dogs are reported as stationary, or moving with a stride rate. Walk, trot and run are not separated: on the test footage the model confuses near-side and far-side legs, which is what tells a walk from a trot.",
  },
  cat: {
    key: "cat", label: "Cat", cls: 15, status: "tested", foot: "paw",
    gaits: ["standing"],
    strideHz: { walk: [0.7, 2.2], trot: [1.4, 3.2], run: [2.2, 5.0] },
    fastHz: 2.6,
    note: "Cats are the least validated species: the detector missed the only cat footage tested. They are reported as stationary, or moving with a stride rate, never by named gait.",
  },
  sheep: { key: "sheep", label: "Sheep", cls: 18, status: "detect-only", foot: "hoof", gaits: [], strideHz: {}, fastHz: 2.4, note: "Sheep are detected but pose and movement have not been validated." },
  cow: { key: "cow", label: "Cow", cls: 19, status: "detect-only", foot: "hoof", gaits: [], strideHz: {}, fastHz: 2.0, note: "Cows are detected but pose and movement have not been validated." },
  zebra: { key: "zebra", label: "Zebra", cls: 22, status: "detect-only", foot: "hoof", gaits: [], strideHz: {}, fastHz: 2.0, note: "Zebras are detected but pose and movement have not been validated." },
  bear: { key: "bear", label: "Bear", cls: 21, status: "detect-only", foot: "paw", gaits: [], strideHz: {}, fastHz: 2.0, note: "Bears are detected but pose and movement have not been validated." },
  elephant: { key: "elephant", label: "Elephant", cls: 20, status: "detect-only", foot: "foot", gaits: [], strideHz: {}, fastHz: 1.5, note: "Elephants are detected but pose and movement have not been validated." },
  giraffe: { key: "giraffe", label: "Giraffe", cls: 23, status: "detect-only", foot: "hoof", gaits: [], strideHz: {}, fastHz: 1.5, note: "Giraffes are detected but pose and movement have not been validated." },
};

export const SPECIES_LIST = Object.values(SPECIES);
export const ANIMAL_CLASSES: readonly number[] = SPECIES_LIST.map((s) => s.cls);
const BY_CLASS = new Map<number, SpeciesProfile>(SPECIES_LIST.map((s) => [s.cls, s]));

export const speciesOfClass = (cls: number): SpeciesProfile | null => BY_CLASS.get(cls) ?? null;
export const speciesByKey = (key: string | undefined | null): SpeciesProfile | null => (key && key in SPECIES ? SPECIES[key as SpeciesKey] : null);

/** Whether skeleton, angles and movement analysis are offered for this species. */
export const poseSupported = (key: SpeciesKey | null | undefined) => !!key && SPECIES[key].status === "tested";
