import { boxFromPose, cropDrawArgs, cropFor, decodeSimcc, POSE_SIZE, rgbaToPoseInput } from "./pose";
import { DET_SIZE, decodeAnimals, letterbox, rgbaToYoloInput } from "./detect";
import { KP_COUNT, VISIBLE_SCORE } from "./skeleton";
import { poseSupported, type SpeciesKey } from "./species";
import { AnimalTracker, colourHistogram, type Hist, type Track } from "./tracker";
import type { Box, Pose, Sample } from "./types";

/**
 * In-browser inference with LiteRT.js (Google, Apache-2.0): YOLOX-Nano finds animals (horses, dogs, cats and six other COCO species),
 * a tracker gives each one a stable ID and a species, and RTMPose-m (AP-10K) reads 17 keypoints inside each box of a species that has
 * been tested. Both models run on the visitor's device (WebAssembly/XNNPACK by default, WebGPU when asked for); no frame leaves the
 * browser. The detector runs every few frames (every frame while nothing is tracked or an animal was just lost); in between, each
 * box follows its own pose.
 */
export const MODEL_BASE = process.env.NEXT_PUBLIC_MOTION_MODEL_BASE || "/models/motion-lab";
export const WASM_BASE = process.env.NEXT_PUBLIC_MOTION_WASM_BASE || "/motion-lab/wasm/";
export const DETECTOR_FILE = "yolox_nano.tflite";
export const POSE_FILE = "rtm_animal_fp16.tflite";

export type Source = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
/** One tracked animal in one frame. `supported` says whether a skeleton is offered for its species; unsure or untested animals get a box only. */
export type AnimalFrame = { id: number; species: SpeciesKey | null; share: number; unsure: boolean; supported: boolean; sample: Sample; pose: Pose | null; box: Box };
export type FrameResult = { t: number; animals: AnimalFrame[]; boxes: Box[]; detected: boolean; detMs: number; poseMs: number; totalMs: number; skippedPose: number };
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
  private tracker = new AnimalTracker();
  private frame = 0;
  /** Detector runs every `detectEvery` frames when everything is steady (see `due`). */
  detectEvery = 5;
  /** Most animals given a pose per frame; the largest ones win. Keeps a crowded frame from stalling a phone. */
  maxPose = 4;
  /** Milliseconds of pose work allowed per frame: the number of animals given a pose shrinks when the device is slow (the rest are boxed only that frame). */
  budgetMs = 350;
  private poseEma = 0;

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
    onStatus?.({ phase: "detector", message: "Loading the animal detector (2 MB)" });
    const det = await lit.loadAndCompile(`${MODEL_BASE}/${DETECTOR_FILE}`, options);
    onStatus?.({ phase: "pose", message: "Loading the pose model (27 MB)" });
    const pose = await lit.loadAndCompile(`${MODEL_BASE}/${POSE_FILE}`, options);
    const info: EstimatorInfo = { runtime: "LiteRT.js 2.6.0", accelerator, detector: "YOLOX-Nano COCO (Apache-2.0)", pose: "RTMPose-m AP-10K (Apache-2.0)", loadMs: performance.now() - t0 };
    onStatus?.({ phase: "ready", message: "Ready" });
    return new MotionEstimator(lit, det, pose, info);
  }

  /** Forget every tracked animal (after a seek, a new video, or a pause). */
  reset() { this.tracker.reset(); this.frame = 0; }

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

  private async detect(src: Source, w: number, h: number): Promise<{ boxes: Box[]; hists: Hist[] }> {
    const { scale, w: lw, h: lh } = letterbox(w, h);
    const ctx = this.detCtx;
    ctx.fillStyle = "rgb(114,114,114)"; ctx.fillRect(0, 0, DET_SIZE, DET_SIZE);
    ctx.drawImage(src, 0, 0, w, h, 0, 0, lw, lh);
    const rgba = ctx.getImageData(0, 0, DET_SIZE, DET_SIZE).data;
    rgbaToYoloInput(rgba, this.detIn);
    const [raw] = await this.run(this.det, this.detIn, [1, DET_SIZE, DET_SIZE, 3]);
    const boxes = decodeAnimals(raw, scale, w, h);
    return { boxes, hists: boxes.map((b) => colourHistogram(rgba, DET_SIZE, DET_SIZE, b, scale)) };
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

  /** Is a detector run due this frame? Every frame while nothing is tracked or an animal was just lost, sooner when several are in view. */
  private due(): boolean {
    const live = this.tracker.live();
    if (!live.length || live.some((t) => t.missed > 0)) return true;
    const every = live.length > 1 ? Math.min(3, this.detectEvery) : this.detectEvery;
    return this.frame % every === 0;
  }

  /**
   * One frame: detect (when due), keep every animal's identity, give each tested species a pose, and return one measurement per
   * animal. `t` is the session time in milliseconds. A frame with no animal returns no entries.
   */
  async processFrame(src: Source, w: number, h: number, t: number): Promise<FrameResult> {
    const t0 = performance.now();
    let boxes: Box[] = [];
    let detMs = 0;
    if (this.due()) {
      const d0 = performance.now();
      const d = await this.detect(src, w, h);
      boxes = d.boxes;
      detMs = performance.now() - d0;
      this.tracker.associate(d.boxes, d.hists, t);
    }
    this.frame++;
    const live = this.tracker.live().sort((a, b) => boxArea(b.box) - boxArea(a.box));
    const animals: AnimalFrame[] = [];
    let poseTotal = 0, skipped = 0, posed = 0;
    for (const tr of live) {
      const sp = this.tracker.species(tr);
      const supported = !sp.unsure && poseSupported(sp.key);
      let pose: Pose | null = null, poseMs = 0;
      let box: Box = this.tracker.predicted(tr, t);
      const cap = Math.max(1, Math.min(this.maxPose, Math.floor(this.budgetMs / Math.max(30, this.poseEma || 100))));
      if (supported && posed < cap) {
        const p0 = performance.now();
        const p = await this.estimate(src, w, h, tr.box);
        poseMs = performance.now() - p0; poseTotal += poseMs; posed++;
        this.poseEma = this.poseEma ? this.poseEma * 0.8 + poseMs * 0.2 : poseMs;
        const next = boxFromPose(p, VISIBLE_SCORE, w, h);
        let visible = 0;
        for (let k = 0; k < KP_COUNT; k++) if (p.score[k] >= VISIBLE_SCORE) visible++;
        if (next && visible >= 5) { pose = p; this.tracker.applyPose(tr, { ...next, score: tr.score }, t); box = tr.box; }
        else this.tracker.miss(tr, t);
      } else if (supported) {
        skipped++;       // over the per-frame budget: the box coasts and no pose is invented for this animal this frame
      } else {
        // Untested or unsure species: the box follows the detector and its own motion only.
        tr.box = box; tr.lastT = t;
        if (!boxes.length && this.frame > 1 && t - tr.lastSeenT > 1500) this.tracker.miss(tr, t);
      }
      const kp: number[] = [];
      if (pose) for (let k = 0; k < KP_COUNT; k++) kp.push(round(pose.x[k]), round(pose.y[k]), Math.round(pose.score[k] * 1000) / 1000);
      animals.push({
        id: tr.id, species: sp.key, share: sp.share, unsure: sp.unsure, supported, pose, box,
        sample: { t, id: tr.id, sp: sp.key ?? "", det: tr.score, box: [round(box.x1), round(box.y1), round(box.x2), round(box.y2)], kp, detMs, poseMs, totalMs: 0 },
      });
    }
    this.tracker.prune(t);
    const totalMs = performance.now() - t0;
    for (const a of animals) a.sample.totalMs = totalMs;
    return { t, animals, boxes, detected: animals.length > 0, detMs, poseMs: poseTotal, totalMs, skippedPose: skipped };
  }

  /** Development and benchmarking only: the detector's boxes at a lower threshold, with the runner-up class, and the time it took. */
  async probeDetect(src: Source, w: number, h: number, conf = 0.05): Promise<{ boxes: Box[]; ms: number }> {
    const t0 = performance.now();
    const { scale, w: lw, h: lh } = letterbox(w, h);
    const ctx = this.detCtx;
    ctx.fillStyle = "rgb(114,114,114)"; ctx.fillRect(0, 0, DET_SIZE, DET_SIZE);
    ctx.drawImage(src, 0, 0, w, h, 0, 0, lw, lh);
    rgbaToYoloInput(ctx.getImageData(0, 0, DET_SIZE, DET_SIZE).data, this.detIn);
    const [raw] = await this.run(this.det, this.detIn, [1, DET_SIZE, DET_SIZE, 3]);
    return { boxes: decodeAnimals(raw, scale, w, h, conf, 0.5, 12), ms: performance.now() - t0 };
  }

  /** Development and benchmarking only: the pose of one box, with its timing. */
  async probePose(src: Source, w: number, h: number, box: Box): Promise<{ pose: Pose; ms: number }> {
    const t0 = performance.now();
    const pose = await this.estimate(src, w, h, box);
    return { pose, ms: performance.now() - t0 };
  }

  dispose() { try { this.det.delete(); this.poseModel.delete(); } catch { /* already released */ } }
}

export type { Track };
const boxArea = (b: Box) => (b.x2 - b.x1) * (b.y2 - b.y1);
const round = (v: number) => Math.round(v * 10) / 10;
