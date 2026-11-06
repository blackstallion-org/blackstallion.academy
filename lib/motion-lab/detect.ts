import { ANIMAL_CLASSES } from "./species";
import type { Box } from "./types";

/**
 * YOLOX-Nano (COCO, Apache-2.0) host-side pre- and post-processing. The model file is the LiteRT conversion published at
 * huggingface.co/litert-community/yolox-nano-litert: input [1,416,416,3] NHWC, BGR, 0-255, letterboxed with grey 114;
 * output [1,3549,85] raw heads (4 box, 1 objectness, 80 classes, objectness and classes already sigmoided, boxes not decoded).
 */
export const DET_SIZE = 416;
export const DET_ANCHORS = 3549;
export const DET_STRIDE = 85;
/** COCO class index of "horse". */
export const HORSE_CLASS = 17;

const STRIDES = [8, 16, 32] as const;

/** Grid cell centre (in grid units) and stride for every anchor, in the model's output order. Built once. */
export const GRID = (() => {
  const gx = new Float32Array(DET_ANCHORS);
  const gy = new Float32Array(DET_ANCHORS);
  const st = new Float32Array(DET_ANCHORS);
  let i = 0;
  for (const s of STRIDES) {
    const n = DET_SIZE / s;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++, i++) { gx[i] = x; gy[i] = y; st[i] = s; }
  }
  return { gx, gy, st, count: i };
})();

/** Uniform scale that fits a frame inside the square input, and the size it occupies there (top-left aligned). */
export function letterbox(srcW: number, srcH: number, size = DET_SIZE) {
  const scale = Math.min(size / srcW, size / srcH);
  return { scale, w: Math.round(srcW * scale), h: Math.round(srcH * scale) };
}

export function iou(a: Box, b: Box): number {
  const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1), x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1), areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter + 1e-9);
}

export function nms(boxes: Box[], iouThreshold: number, max: number): Box[] {
  const sorted = [...boxes].sort((p, q) => q.score - p.score);
  const kept: Box[] = [];
  for (const b of sorted) {
    if (kept.length >= max) break;
    if (kept.every((k) => iou(k, b) < iouThreshold)) kept.push(b);
  }
  return kept;
}

/**
 * Decodes the raw heads into boxes for every animal species the detector knows (see species.ts), in source-frame pixels.
 * For each anchor the animal class with the highest probability names the species; the anchor is dropped when some NON-animal class
 * (a person, a chair, a toy) is more probable than any animal class, so a person is never called a dog. One class-agnostic NMS
 * then keeps a single box per animal: a cat and a dog cannot both claim the same patch of the frame. `alt` carries the runner-up
 * animal class so callers can tell a confident "horse" from an uncertain one.
 */
export function decodeAnimals(out: ArrayLike<number>, scale: number, srcW: number, srcH: number, conf = 0.25, nmsIou = 0.5, max = 8): Box[] {
  const found: Box[] = [];
  const isAnimal = ANIMAL_SET;
  for (let i = 0; i < DET_ANCHORS; i++) {
    const o = i * DET_STRIDE;
    const obj = out[o + 4];
    if (obj < conf) continue;
    let best = -1, bp = 0, second = -1, sp = 0, other = 0;
    for (let c = 0; c < 80; c++) {
      const p = out[o + 5 + c];
      if (isAnimal[c]) {
        if (p > bp) { second = best; sp = bp; best = c; bp = p; } else if (p > sp) { second = c; sp = p; }
      } else if (p > other) other = p;
    }
    if (best < 0 || other > bp) continue;
    const score = obj * bp;
    if (score < conf) continue;
    const s = GRID.st[i];
    const cx = (out[o] + GRID.gx[i]) * s, cy = (out[o + 1] + GRID.gy[i]) * s;
    const w = Math.exp(out[o + 2]) * s, h = Math.exp(out[o + 3]) * s;
    found.push({
      x1: Math.max(0, (cx - w / 2) / scale), y1: Math.max(0, (cy - h / 2) / scale),
      x2: Math.min(srcW, (cx + w / 2) / scale), y2: Math.min(srcH, (cy + h / 2) / scale), score,
      cls: best, p: bp, alt: second >= 0 && sp > 0.05 ? { cls: second, p: sp } : undefined,
    });
  }
  return nms(found, nmsIou, max);
}

const ANIMAL_SET = (() => { const a = new Array<boolean>(80).fill(false); for (const c of ANIMAL_CLASSES) a[c] = true; return a; })();

/**
 * Decodes the raw heads into horse boxes in source-frame pixels (`scale` is the letterbox scale used for the input).
 * score = objectness x horse-class probability.
 */
export function decodeHorses(out: ArrayLike<number>, scale: number, srcW: number, srcH: number, conf = 0.25, nmsIou = 0.45, max = 5): Box[] {
  const found: Box[] = [];
  for (let i = 0; i < DET_ANCHORS; i++) {
    const o = i * DET_STRIDE;
    const score = out[o + 4] * out[o + 5 + HORSE_CLASS];
    if (score < conf) continue;
    const s = GRID.st[i];
    const cx = (out[o] + GRID.gx[i]) * s, cy = (out[o + 1] + GRID.gy[i]) * s;
    const w = Math.exp(out[o + 2]) * s, h = Math.exp(out[o + 3]) * s;
    found.push({
      x1: Math.max(0, (cx - w / 2) / scale), y1: Math.max(0, (cy - h / 2) / scale),
      x2: Math.min(srcW, (cx + w / 2) / scale), y2: Math.min(srcH, (cy + h / 2) / scale), score,
    });
  }
  return nms(found, nmsIou, max);
}

/** Fills `dst` (length 416*416*3, NHWC) with BGR 0-255 from RGBA canvas pixels; pixels beyond the letterbox stay grey 114. */
export function rgbaToYoloInput(rgba: Uint8ClampedArray, dst: Float32Array) {
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) { dst[j] = rgba[i + 2]; dst[j + 1] = rgba[i + 1]; dst[j + 2] = rgba[i]; }
}
