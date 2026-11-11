import type { HorsePreset, HorseRig, Limb, P, SceneRig } from "@/components/history-scroll/puppet/types";

const limb = (top: P, mid: P, end: P): Limb => ({ top, mid, end });
type L3 = [P, P, P];
/** A horse from its landmarks: body, withers, poll, muzzle, tail root and tip, then FL, FR, HL, HR limbs (top, knee, hoof). */
const horse = (preset: HorsePreset, dir: 1 | -1, seed: number, body: P, withers: P, poll: P, muzzle: P, tailRoot: P, tailTip: P, FL: L3, FR: L3, HL: L3, HR: L3, r?: number): HorseRig => ({
  kind: "horse", preset, dir, seed, body, withers, poll, muzzle, tailRoot, tailTip, r,
  legs: { FL: limb(...FL), FR: limb(...FR), HL: limb(...HL), HR: limb(...HR) },
});

/**
 * Puppet rigs for the Maharana Pratap and Chetak cutouts (public/images/story/pratap/<name>.webp), keyed by file name.
 * Points are normalized image coordinates (0..1, y down), marked on gridded sheets of each cutout (12 Nov 2026).
 * battle-duel-cutout has no rig on purpose: two horses and two riders are knotted together and would tear apart.
 */
export const PRATAP_RIGS: Record<string, SceneRig> = {
  // Pratap stands in front of Chetak, one hand raised to the horse's neck.
  bond: {
    figures: [
      horse("idle", -1, 101, [0.62, 0.61], [0.42, 0.38], [0.11, 0.2], [0.03, 0.38], [0.92, 0.42], [0.95, 0.81],
        [[0.28, 0.67], [0.32, 0.83], [0.28, 0.96]], [[0.37, 0.67], [0.37, 0.85], [0.37, 0.95]],
        [[0.79, 0.73], [0.85, 0.83], [0.87, 0.96]], [[0.71, 0.73], [0.68, 0.85], [0.67, 0.92]]),
      {
        kind: "human", preset: "stand", seed: 102,
        hip: [0.57, 0.7], neck: [0.54, 0.32], head: [0.54, 0.25], headR: 0.06, torsoR: 0.07,
        armA: limb([0.44, 0.36], [0.38, 0.38], [0.35, 0.31]),
        armB: limb([0.6, 0.36], [0.61, 0.45], [0.51, 0.48]),
      },
    ],
  },
  // Pratap in the saddle, lance upright; Chetak steps out with a raised foreleg.
  mount: {
    figures: [
      horse("walk", 1, 111, [0.56, 0.6], [0.65, 0.45], [0.9, 0.24], [0.98, 0.44], [0.13, 0.5], [0.02, 0.83],
        [[0.82, 0.66], [0.93, 0.69], [0.82, 0.82]], [[0.74, 0.69], [0.74, 0.82], [0.81, 0.96]],
        [[0.21, 0.7], [0.11, 0.84], [0.13, 0.98]], [[0.32, 0.71], [0.32, 0.82], [0.43, 0.91]]),
      {
        kind: "human", preset: "ride", seed: 112, on: 0,
        hip: [0.51, 0.54], neck: [0.46, 0.22], head: [0.47, 0.15], headR: 0.07, torsoR: 0.07,
        armA: limb([0.53, 0.25], [0.54, 0.34], [0.58, 0.34]),
        legA: limb([0.56, 0.58], [0.61, 0.67], [0.61, 0.69]),
        cloth: [[[0.49, 0.45], [0.51, 0.5], 0.03]],
      },
    ],
  },
  // The charge: Chetak at full gallop, lance levelled, the blue scarf streaming back.
  charge: {
    figures: [
      horse("gallop", 1, 121, [0.46, 0.65], [0.63, 0.45], [0.76, 0.18], [0.83, 0.45], [0.26, 0.49], [0.01, 0.58],
        [[0.69, 0.65], [0.81, 0.65], [0.86, 0.89]], [[0.67, 0.69], [0.76, 0.75], [0.83, 0.77]],
        [[0.31, 0.71], [0.2, 0.81], [0.13, 0.97]], [[0.35, 0.73], [0.24, 0.87], [0.18, 0.97]]),
      {
        kind: "human", preset: "ride", seed: 122, on: 0,
        hip: [0.54, 0.53], neck: [0.51, 0.2], head: [0.51, 0.12], headR: 0.07, torsoR: 0.07,
        armA: limb([0.49, 0.26], [0.47, 0.37], [0.57, 0.34]),
        cloth: [[[0.42, 0.24], [0.17, 0.17], 0.05]],
      },
    ],
  },
  // The wounded Chetak walks on with his rider upright.
  carry: {
    figures: [
      horse("walk", -1, 131, [0.56, 0.59], [0.39, 0.37], [0.08, 0.25], [0.04, 0.45], [0.9, 0.44], [0.95, 0.84],
        [[0.22, 0.71], [0.14, 0.83], [0.25, 0.89]], [[0.33, 0.73], [0.32, 0.87], [0.27, 0.98]],
        [[0.68, 0.71], [0.72, 0.79], [0.59, 0.92]], [[0.79, 0.71], [0.86, 0.79], [0.83, 0.98]]),
      {
        kind: "human", preset: "ride", seed: 132, on: 0,
        hip: [0.53, 0.55], neck: [0.54, 0.18], head: [0.54, 0.12], headR: 0.065, torsoR: 0.07,
        armA: limb([0.51, 0.26], [0.46, 0.31], [0.43, 0.28]),
        cloth: [[[0.46, 0.35], [0.44, 0.44], 0.03]],
      },
    ],
  },
  // The leap over the stream.
  leap: {
    figures: [
      horse("gallop", 1, 141, [0.46, 0.59], [0.61, 0.39], [0.76, 0.16], [0.83, 0.41], [0.29, 0.45], [0.01, 0.58],
        [[0.69, 0.59], [0.79, 0.63], [0.83, 0.87]], [[0.67, 0.63], [0.75, 0.68], [0.72, 0.82]],
        [[0.31, 0.63], [0.2, 0.75], [0.12, 0.97]], [[0.35, 0.65], [0.25, 0.81], [0.17, 0.97]]),
      {
        kind: "human", preset: "ride", seed: 142, on: 0,
        hip: [0.54, 0.52], neck: [0.56, 0.2], head: [0.57, 0.14], headR: 0.07, torsoR: 0.07,
        armA: limb([0.5, 0.24], [0.49, 0.31], [0.54, 0.31]),
      },
    ],
  },
  // Chetak lies down, head raised against Pratap, who kneels and holds him.
  "chetak-rest-cutout": {
    figures: [
      horse("lying", 1, 151, [0.42, 0.67], [0.58, 0.52], [0.78, 0.25], [0.65, 0.24], [0.21, 0.65], [0.04, 0.85],
        [[0.68, 0.77], [0.74, 0.83], [0.93, 0.94]], [[0.63, 0.81], [0.58, 0.9], [0.49, 0.91]],
        [[0.26, 0.77], [0.15, 0.83], [0.06, 0.9]], [[0.33, 0.81], [0.38, 0.88], [0.4, 0.91]]),
      { kind: "human", preset: "seated", seed: 152, hip: [0.82, 0.67], neck: [0.78, 0.21], head: [0.76, 0.16], headR: 0.07, torsoR: 0.08 },
    ],
  },
};
