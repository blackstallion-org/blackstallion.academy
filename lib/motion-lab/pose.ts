import type { Box, Pose } from "./types";
import { KP_COUNT } from "./skeleton";

/**
 * RTMPose-m (AP-10K, Apache-2.0) pre- and post-processing. Model file: huggingface.co/litert-community/RTMPose-Animal-AP10K-LiteRT.
 * Input [1,3,256,256] NCHW RGB, (v - mean) / std; outputs two SimCC vectors [1,17,512] (x then y), 2 bins per input pixel.
 * Top-down: a detector box is padded to a 1:1 crop and the keypoints are read back into the source frame.
 */
export const POSE_SIZE = 256;
export const SIMCC_BINS = 512;
export const SIMCC_RATIO = 2;
export const POSE_MEAN = [123.675, 116.28, 103.53] as const;
export const POSE_STD = [58.395, 57.12, 57.375] as const;
/** mmpose pads the box by 1.25 before cropping. */
export const CROP_PADDING = 1.25;

export type Crop = { x: number; y: number; w: number; h: number };

/** The square source rectangle (may extend past the frame edges) that the pose model looks at for `box`. */
export function cropFor(box: Box, padding = CROP_PADDING): Crop {
  const cx = (box.x1 + box.x2) / 2, cy = (box.y1 + box.y2) / 2;
  const side = Math.max(box.x2 - box.x1, box.y2 - box.y1) * padding;
  return { x: cx - side / 2, y: cy - side / 2, w: side, h: side };
}

/**
 * How to draw `crop` of a frame of size srcW x srcH into a size x size canvas: the source part inside the frame, and where it
 * lands. Anything outside the frame stays black, like the zero padding of mmpose's affine warp.
 */
export function cropDrawArgs(crop: Crop, srcW: number, srcH: number, size = POSE_SIZE) {
  const sx = Math.max(0, crop.x), sy = Math.max(0, crop.y);
  const sx2 = Math.min(srcW, crop.x + crop.w), sy2 = Math.min(srcH, crop.y + crop.h);
  const sw = Math.max(0, sx2 - sx), sh = Math.max(0, sy2 - sy);
  const k = size / crop.w;
  return { sx, sy, sw, sh, dx: (sx - crop.x) * k, dy: (sy - crop.y) * k, dw: sw * k, dh: sh * k };
}

/** Fills `dst` (3*256*256, NCHW RGB, normalised) from RGBA canvas pixels. */
export function rgbaToPoseInput(rgba: Uint8ClampedArray, dst: Float32Array) {
  const plane = POSE_SIZE * POSE_SIZE;
  for (let p = 0, i = 0; p < plane; p++, i += 4) {
    dst[p] = (rgba[i] - POSE_MEAN[0]) / POSE_STD[0];
    dst[plane + p] = (rgba[i + 1] - POSE_MEAN[1]) / POSE_STD[1];
    dst[2 * plane + p] = (rgba[i + 2] - POSE_MEAN[2]) / POSE_STD[2];
  }
}

/** Index of the largest value in sx[offset .. offset + SIMCC_BINS) and the value. */
function argmax(v: ArrayLike<number>, offset: number): [number, number] {
  let best = offset, bv = v[offset];
  for (let i = offset + 1; i < offset + SIMCC_BINS; i++) if (v[i] > bv) { bv = v[i]; best = i; }
  return [best - offset, bv];
}

/**
 * SimCC decode: each keypoint is the arg-max bin of its x and y vectors (bin / 2 = model pixel); its score is the lower of the
 * two peak heights (mmpose's rule). Returns the pose in source-frame pixels.
 */
export function decodeSimcc(simccX: ArrayLike<number>, simccY: ArrayLike<number>, crop: Crop): Pose {
  const x = new Float32Array(KP_COUNT), y = new Float32Array(KP_COUNT), score = new Float32Array(KP_COUNT);
  for (let k = 0; k < KP_COUNT; k++) {
    const [bx, vx] = argmax(simccX, k * SIMCC_BINS);
    const [by, vy] = argmax(simccY, k * SIMCC_BINS);
    x[k] = crop.x + (bx / SIMCC_RATIO / POSE_SIZE) * crop.w;
    y[k] = crop.y + (by / SIMCC_RATIO / POSE_SIZE) * crop.h;
    score[k] = Math.min(vx, vy);
  }
  return { x, y, score };
}

/** Tight box around the visible keypoints, grown a little (the tracker's box for the next frame). Null when too few are visible. */
export function boxFromPose(p: Pose, minScore: number, srcW: number, srcH: number, grow = 0.12, minPoints = 5): Box | null {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, n = 0, s = 0;
  for (let k = 0; k < KP_COUNT; k++) {
    if (p.score[k] < minScore) continue;
    n++; s += p.score[k];
    x1 = Math.min(x1, p.x[k]); y1 = Math.min(y1, p.y[k]); x2 = Math.max(x2, p.x[k]); y2 = Math.max(y2, p.y[k]);
  }
  if (n < minPoints) return null;
  const gw = (x2 - x1) * grow, gh = (y2 - y1) * grow;
  return { x1: Math.max(0, x1 - gw), y1: Math.max(0, y1 - gh), x2: Math.min(srcW, x2 + gw), y2: Math.min(srcH, y2 + gh), score: s / n };
}
