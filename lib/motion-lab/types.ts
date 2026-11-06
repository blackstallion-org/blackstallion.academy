import type { AngleId } from "./skeleton";

/** One detected animal box in source-frame pixels. */
export type Box = { x1: number; y1: number; x2: number; y2: number; score: number };

/** One pose: 17 keypoints in source-frame pixels with the model's per-point score. */
export type Pose = { x: Float32Array; y: Float32Array; score: Float32Array };

/** A timestamped measurement. `t` is milliseconds on the session clock (video media time for uploads, wall clock for the camera). */
export type Sample = {
  t: number;
  /** Detector confidence of the tracked animal, 0 when nothing was found this frame. */
  det: number;
  box: [number, number, number, number] | null;
  /** x, y, score for each keypoint, flattened: [x0, y0, s0, x1, ...]; empty when no animal. */
  kp: number[];
  /** Milliseconds the models took on this frame. */
  detMs: number;
  poseMs: number;
  totalMs: number;
};

export type GaitName = "standing" | "walk" | "trot" | "canter" | "gallop" | "unclear";

export type GaitEstimate = {
  gait: GaitName;
  /** 0 to 1: how much the evidence supports the label (signal strength, limb agreement, visible joints). Not a probability. */
  confidence: number;
  /** Strides per second (one stride = every leg has stepped once). Null when no periodic movement was found. */
  strideHz: number | null;
  /** Phase offsets between limbs, in cycles (0 to 0.5). Null when not measurable. */
  phases: { front: number; hind: number; diagA: number; diagB: number } | null;
  /** Seconds of signal the estimate used. */
  windowS: number;
  visibleJoints: number;
  note: string;
};

export type Angles = Partial<Record<AngleId, number>>;

export type SessionSummary = {
  durationMs: number;
  frames: number;
  framesWithHorse: number;
  coveragePct: number;
  meanDetScore: number;
  meanVisibleJoints: number;
  meanFps: number;
  meanLatencyMs: number;
  p95LatencyMs: number;
  gaitShares: Partial<Record<GaitName, number>>;
  dominantGait: GaitName;
  strideHzMedian: number | null;
  angleRanges: Partial<Record<AngleId, { min: number; max: number; mean: number }>>;
};

export type SessionMeta = {
  id: string;
  name: string;
  createdAt: string;
  source: "camera" | "upload";
  videoWidth: number;
  videoHeight: number;
  hasVideo: boolean;
  summary: SessionSummary;
  /** Small JPEG (data URL) of the clearest moment, with the skeleton drawn on it. */
  thumbnail?: string;
  models: { detector: string; pose: string; runtime: string; accelerator: string };
};
