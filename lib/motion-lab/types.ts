import type { AngleId } from "./skeleton";
import type { SpeciesKey } from "./species";

/**
 * One detected animal box in source-frame pixels. `cls` is the detector's COCO class (the species), `alt` the runner-up animal class
 * with its probability, so a dog that looks a little like a cat can be flagged as unsure instead of being named confidently.
 */
export type Box = { x1: number; y1: number; x2: number; y2: number; score: number; cls?: number; p?: number; alt?: { cls: number; p: number } };

/** One pose: 17 keypoints in source-frame pixels with the model's per-point score. */
export type Pose = { x: Float32Array; y: Float32Array; score: Float32Array };

/** A timestamped measurement. `t` is milliseconds on the session clock (video media time for uploads, wall clock for the camera). */
export type Sample = {
  t: number;
  /** Track ID of the animal this measurement belongs to. Absent in older sessions (one horse, ID 1); 0 marks a frame with no animal. */
  id?: number;
  /** Species key of the animal when the measurement was taken (see species.ts); empty while it was unsure. */
  sp?: string;
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

export type GaitName = "standing" | "walk" | "trot" | "canter" | "gallop" | "run" | "moving" | "unclear";

/** Why an estimate is "unclear" (or "moving"), so a report can say what to change instead of just failing. */
export type UnclearReason = "short" | "hidden" | "foreshortened" | "no-rhythm" | "pattern" | "slow-frames" | "range" | "untested";

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
  /** Set when the label is "unclear" or "moving". */
  reason?: UnclearReason;
  /** Which signal carried the estimate: the paw's position along the body, or how high the paw is lifted. */
  signal?: "along" | "lift";
  /** Share of the window's frames in which the animal was seen end-on (neck and tail nearly overlapping in the picture). */
  foreshortened?: number;
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
  /** For windows that came out unclear: how many, by reason. */
  unclearReasons?: Partial<Record<UnclearReason, number>>;
  dominantGait: GaitName;
  strideHzMedian: number | null;
  angleRanges: Partial<Record<AngleId, { min: number; max: number; mean: number }>>;
};

/** One tracked animal of a session: who it is, how well it was seen, how it moved, and annotated frames for its report. */
export type AnimalInfo = {
  id: number;
  /** Null while the detector's vote stayed split (the animal is reported as "species unsure", never as a guess). */
  species: SpeciesKey | null;
  label: string;
  /** Share of the detector's weighted vote the winning species held (1 = unanimous). */
  speciesShare: number;
  /** Whether skeleton and movement analysis are offered for this species (see species.ts). */
  supported: boolean;
  firstMs: number;
  lastMs: number;
  /** Frames between its first and last appearance, and how many of them carried a skeleton. */
  lifeFrames: number;
  skeletonFrames: number;
  /** Share of the whole session this animal was in view. */
  presencePct: number;
  summary: SessionSummary;
  /** Up to three small JPEG data URLs of this animal with its skeleton drawn, from different moments. */
  frames?: string[];
};

export type SessionMeta = {
  id: string;
  name: string;
  createdAt: string;
  source: "camera" | "upload";
  videoWidth: number;
  videoHeight: number;
  hasVideo: boolean;
  /** Summary of the main animal (the longest-tracked one with a skeleton); older sessions have only this. */
  summary: SessionSummary;
  /** Every tracked animal. Absent in sessions made before multi-animal tracking: those are one horse, ID 1. */
  animals?: AnimalInfo[];
  /** Tracks that lived under ten frames: counted but not reported as animals (detector flicker, or an identity lost and restarted). */
  fleetingTracks?: number;
  /** Seconds the analysis took on this device (wall clock), and the number of distinct frames it ran on. */
  wallMs?: number;
  frameCount?: number;
  /** Small JPEG (data URL) of the clearest moment, with the skeleton drawn on it. */
  thumbnail?: string;
  models: { detector: string; pose: string; runtime: string; accelerator: string };
};
