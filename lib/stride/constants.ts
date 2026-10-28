import { asset } from "@/lib/content/asset";
/**
 * Facts the stride study is built on. Nothing here is measured from a living horse.
 *
 * The horse is the site's rigged black Marwari and the Walk is its own authored clip: planar inverse kinematics from published
 * stride data, written in Blender (tools/blender/03_animation), not captured from a horse. The clip, its length and its stride
 * length come from public/models/marwari-gaits.json ("Walk").
 */
export const STRIDE_MODEL_URL = asset("/models/anatomy-exhibit.glb");
export const STRIDE_RIDER_URL = asset("/models/cadet-rider.glb");
export const WALK_CLIP = "Walk";

/** The authored clip: one stride lasts 0.8 s (75 strides a minute), the horse advances 1.152 m, 24 frames at 30 per second. */
export const AUTHORED = { strideSeconds: 0.8, strideLengthM: 1.152, frames: 24 } as const;

/**
 * The clip is played slower than it was authored so that the rider's seat completes about a hundred movements a minute, the
 * figure in the hippotherapy literature (Blueprint Part 9, "about a hundred"). The seat in this clip repeats twice per stride
 * in the up-and-down, fore-and-aft and tilt channels, so one stride lasts 1.2 s: 50 strides, 100 seat cycles a minute.
 * At 0.8 s the same clip gives 150 a minute. The change is one number, applied to every curve and to the ground speed.
 */
export const STUDY_STRIDE_SECONDS = 1.2;

/** Samples per stride for every curve (and the resolution of the stride timeline). */
export const SAMPLES = 240;

/** Playback speed, as a share of the study tempo. */
export const SPEEDS = [0.25, 0.5, 1] as const;
export type Speed = (typeof SPEEDS)[number];

/**
 * The rider's soft seat: the pelvis follows the saddle through a second-order low-pass (natural frequency 5 Hz, damping 0.7).
 * At this tempo that is a gain of 1.0 and a delay of about 45 ms: the pelvis follows without bouncing. It is a modelling
 * choice, not a measurement, and the page says so.
 */
export const SOFT_SEAT = { fnHz: 5, zeta: 0.7 } as const;

/** How much of the seat's tilt each part of the rider's body keeps (pelvis, spine, chest, neck, head): the torso steadies. */
export const TORSO_SHARE = [1, 0.55, 0.34, 0.2, 0.12] as const;

/** Stance detection (see analysis.ts): within 2.5 cm of the hoof's own planted height, and not arriving faster than 0.5 m/s over the ground; planted means under 0.15 m/s. */
export const STANCE_CLEARANCE_M = 0.025;
export const ARRIVING_MPS = 0.5;
export const PLANTED_MPS = 0.15;
/** The toe point is the hoof bone's tail, 0.14 m along the bone; the sole is 0.019 m below it (components/stallion-film/locomotion.ts). */
export const HOOF_LENGTH_M = 0.14;
export const SOLE_TO_TOE_M = 0.019;

export type Limb = "FL" | "FR" | "HL" | "HR";
export const LIMBS: Limb[] = ["HL", "FL", "HR", "FR"];
export const HOOF_BONE: Record<Limb, string> = { FL: "Hoof_F_L", FR: "Hoof_F_R", HL: "Hoof_B_L", HR: "Hoof_B_R" };
export const LIMB_LABEL: Record<Limb, string> = { HL: "Left hind", FL: "Left fore", HR: "Right hind", FR: "Right fore" };
export const LIMB_SHORT: Record<Limb, string> = { HL: "LH", FL: "LF", HR: "RH", FR: "RF" };

/** The authored footfall table for the walk (marwari-gaits.json): where in the stride each hoof lands, and the share it stays down. Used before the animation has loaded and when the 3D view is unavailable. */
export const AUTHORED_FOOTFALLS: Record<Limb, { start: number; duty: number }> = {
  HL: { start: 0, duty: 0.55 },
  FL: { start: 0.25, duty: 0.55 },
  HR: { start: 0.5, duty: 0.55 },
  FR: { start: 0.75, duty: 0.55 },
};
