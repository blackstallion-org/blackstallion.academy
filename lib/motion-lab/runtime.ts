import { boxFromPose, cropDrawArgs, cropFor, decodeSimcc, POSE_SIZE, rgbaToPoseInput } from "./pose";
import { DET_SIZE, decodeHorses, iou, letterbox, rgbaToYoloInput } from "./detect";
import { KP_COUNT, VISIBLE_SCORE } from "./skeleton";
import type { Box, Pose, Sample } from "./types";

/**
 * In-browser inference with LiteRT.js (Google, Apache-2.0): YOLOX-Nano finds horses, RTMPose-m (AP-10K) reads 17 keypoints inside the
 * box. Both run on the visitor's device (WebAssembly/XNNPACK by default, WebGPU when asked for); no frame leaves the browser.
 * The detector runs every few frames and whenever the animal is lost; in between, the box follows the last pose.
 */
export const MODEL_BASE = process.env.NEXT_PUBLIC_MOTION_MODEL_BASE || "/models/motion-lab";
export const WASM_BASE = process.env.NEXT_PUBLIC_MOTION_WASM_BASE || "/motion-lab/wasm/";
export const DETECTOR_FILE = "yolox_nano.tflite";
export const POSE_FILE = "rtm_animal_fp16.tflite";

export type Source = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
export type FrameResult = { sample: Sample; pose: Pose | null; primary: Box | null; boxes: Box[]; detected: boolean };
export type EstimatorInfo = { runtime: string; accelerator: "wasm" | "webgpu"; detector: string; pose: string; loadMs: number };
export type Status = { phase: "runtime" | "detector" | "pose" | "ready"; message: string };

type LiteRtModule = typeof import("@litertjs/core");
type Model = Awaited<ReturnType<LiteRtModule["loadAndCompile"]>>;

export class ModelsMissingError extends Error {
  constructor(public file: string) { super(`The model file ${file} is not installed on this server.`); this.name = "ModelsMissingError"; }
}

async function exists(url: string): Promise<boolean> {
  try { const r = await fetch(url, { method: "HEAD", cache: "no-store" }); return r.ok; } catch { return false; }
}

export class MotionEstimator {
  private detIn = new Float32Array(DET_SIZE * DET_SIZE * 3);
  private poseIn = new Float32Array(3 * POSE_SIZE * POSE_SIZE);
  private detCtx: CanvasRenderingContext2D;
  private poseCtx: CanvasRenderingContext2D;
  private track: Box | null = null;
  private frame = 0;
  private lost = 0;
  detectEvery = 5;

  private constructor(private lit: LiteRtModule, private det: Model, private poseModel: Model, readonly info: EstimatorInfo) {
    const mk = (n: number) => {
      const c = document.createElement("canvas"); c.width = n; c.height = n;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas 2D is not available in this browser.");
      return ctx;
    };
    this.detCtx = mk(DET_SIZE); this.poseCtx = mk(POSE_SIZE);
  }

  static async create(accelerator: "wasm" | "webgpu", onStatus?: (s: Status) => void): Promise<MotionEstimator> {
    const t0 = performance.now();
    for (const f of [DETECTOR_FILE, POSE_FILE]) if (!(await exists(`${MODEL_BASE}/${f}`))) throw new ModelsMissingError(f);
    onStatus?.({ phase: "runtime", message: "Starting the on-device runtime" });
    const lit = await import("@litertjs/core");
    await lit.loadLiteRt(WASM_BASE);
    const options = { accelerator } as const;
    onStatus?.({ phase: "detector", message: "Loading the horse detector (2 MB)" });
    const det = await lit.loadAndCompile(`${MODEL_BASE}/${DETECTOR_FILE}`, options);
    onStatus?.({ phase: "pose", message: "Loading the pose model (27 MB)" });
    const pose = await lit.loadAndCompile(`${MODEL_BASE}/${POSE_FILE}`, options);
    const info: EstimatorInfo = { runtime: "LiteRT.js 2.6.0", accelerator, detector: "YOLOX-Nano COCO (Apache-2.0)", pose: "RTMPose-m AP-10K (Apache-2.0)", loadMs: performance.now() - t0 };
    onStatus?.({ phase: "ready", message: "Ready" });
    return new MotionEstimator(lit, det, pose, info);
  }

  /** Forget the tracked animal (after a seek, a new video, or a pause). */
  reset() { this.track = null; this.lost = 0; this.frame = 0; }

  private async run(model: Model, data: Float32Array, shape: number[]): Promise<Float32Array[]> {
    const input = new this.lit.Tensor(data, shape);
    const outs = await model.run(input);
    input.delete();
    const read: Float32Array[] = [];
    for (const o of outs) {
      const w = o.accelerator === "wasm" ? o : await o.moveTo("wasm");
      read.push(Float32Array.from(w.toTypedArray() as Float32Array));
      w.delete();
    }
    return read;
  }

  private async detect(src: Source, w: number, h: number): Promise<Box[]> {
    const { scale, w: lw, h: lh } = letterbox(w, h);
    const ctx = this.detCtx;
    ctx.fillStyle = "rgb(114,114,114)"; ctx.fillRect(0, 0, DET_SIZE, DET_SIZE);
    ctx.drawImage(src, 0, 0, w, h, 0, 0, lw, lh);
    rgbaToYoloInput(ctx.getImageData(0, 0, DET_SIZE, DET_SIZE).data, this.detIn);
    const [raw] = await this.run(this.det, this.detIn, [1, DET_SIZE, DET_SIZE, 3]);
    return decodeHorses(raw, scale, w, h);
  }

  private async estimate(src: Source, w: number, h: number, box: Box): Promise<Pose> {
    const crop = cropFor(box);
    const a = cropDrawArgs(crop, w, h);
    const ctx = this.poseCtx;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, POSE_SIZE, POSE_SIZE);
    if (a.sw > 0 && a.sh > 0) ctx.drawImage(src, a.sx, a.sy, a.sw, a.sh, a.dx, a.dy, a.dw, a.dh);
    rgbaToPoseInput(ctx.getImageData(0, 0, POSE_SIZE, POSE_SIZE).data, this.poseIn);
    const [sx, sy] = await this.run(this.poseModel, this.poseIn, [1, 3, POSE_SIZE, POSE_SIZE]);
    return decodeSimcc(sx, sy, crop);
  }

  /** One frame: detect (when due), estimate the pose, and return the measurement. `t` is the session time in milliseconds. */
  async process(src: Source, w: number, h: number, t: number): Promise<FrameResult> {
    const t0 = performance.now();
    let boxes: Box[] = [];
    let detMs = 0;
    let box = this.track;
    const due = !this.track || this.frame % this.detectEvery === 0;
    if (due) {
      const d0 = performance.now();
      boxes = await this.detect(src, w, h);
      detMs = performance.now() - d0;
      if (boxes.length) {
        const pick = this.track
          ? boxes.map((b) => ({ b, o: iou(b, this.track as Box) })).sort((p, q) => q.o - p.o)[0]
          : null;
        box = pick && pick.o > 0.25 ? pick.b : [...boxes].sort((p, q) => q.score * area(q) - p.score * area(p))[0];
      } else if (this.lost >= 2) box = null;
    }
    this.frame++;
    let pose: Pose | null = null, poseMs = 0, det = 0;
    if (box) {
      const p0 = performance.now();
      pose = await this.estimate(src, w, h, box);
      poseMs = performance.now() - p0;
      const next = boxFromPose(pose, VISIBLE_SCORE, w, h);
      let visible = 0;
      for (let k = 0; k < KP_COUNT; k++) if (pose.score[k] >= VISIBLE_SCORE) visible++;
      if (next && visible >= 5) { this.track = { ...next, score: box.score }; this.lost = 0; det = box.score; }
      else { this.track = null; this.lost++; pose = null; }
    } else { this.track = null; this.lost++; }
    const kp: number[] = [];
    if (pose) for (let k = 0; k < KP_COUNT; k++) kp.push(round(pose.x[k]), round(pose.y[k]), Math.round(pose.score[k] * 1000) / 1000);
    const totalMs = performance.now() - t0;
    const sample: Sample = { t, det, box: pose && box ? [round(box.x1), round(box.y1), round(box.x2), round(box.y2)] : null, kp, detMs, poseMs, totalMs };
    return { sample, pose, primary: pose ? box : null, boxes, detected: !!pose };
  }

  dispose() { try { this.det.delete(); this.poseModel.delete(); } catch { /* already released */ } }
}

const area = (b: Box) => (b.x2 - b.x1) * (b.y2 - b.y1);
const round = (v: number) => Math.round(v * 10) / 10;
