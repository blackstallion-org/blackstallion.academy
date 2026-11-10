/**
 * Puppet rigs for the painted cutouts. Points are in normalized image coordinates (0..1, y down) of the cutout file.
 * A rig names landmarks; components/history-scroll/puppet/build.ts turns them into bones and skin weights.
 */
export type P = [number, number];
/** A limb from its top joint (shoulder, hip, stifle) through the knee or hock to the hoof, hand or foot. */
export type Limb = { top: P; mid: P; end: P };

export type HorsePreset = "gallop" | "canter" | "walk" | "idle" | "rear" | "lying" | "elephant";
export type HumanPreset = "ride" | "stand" | "walk" | "work" | "seated" | "crew";

export type HorseRig = {
  kind: "horse";
  preset: HorsePreset;
  /** Facing: 1 = toward +x (right). */
  dir: 1 | -1;
  seed: number;
  /** Middle of the barrel: the body pivot. */
  body: P;
  withers: P;
  /** Poll (top of the head, behind the ears) and muzzle. */
  poll: P;
  muzzle: P;
  tailRoot: P;
  tailTip: P;
  /** Front near/far and hind near/far legs (which is near does not matter; timing is per leg). */
  legs: { FL: Limb; FR: Limb; HL: Limb; HR: Limb };
  /** Limb radius in image heights (default 0.028). */
  r?: number;
  /** Half-height of the barrel region in image heights (default from withers to body). */
  barrel?: number;
};

export type HumanRig = {
  kind: "human";
  preset: HumanPreset;
  seed: number;
  /** Index of the horse figure in the same rig this person rides or is attached to (moves with it). */
  on?: number;
  hip: P;
  neck: P;
  head: P;
  /** Head radius in image heights (default 0.05). */
  headR?: number;
  /** Torso half-width in image heights (default 0.06). */
  torsoR?: number;
  armA?: Limb;
  armB?: Limb;
  legA?: Limb;
  legB?: Limb;
  /** Cloth that ripples in the wind (sash, turban tail, pennant): from its fixed end to its free end, with a radius. */
  cloth?: [P, P, number][];
  r?: number;
};

export type Figure = HorseRig | HumanRig;
export type SceneRig = { figures: Figure[] };
