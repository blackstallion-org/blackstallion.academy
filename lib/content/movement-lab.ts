import { asset } from "./asset";

/**
 * The Movement Laboratory (15 Nov 2026, owner's reference "Movement Laboratory: Horse & Rider Biomechanics"). It replaces the 3D
 * stride laboratory (components/stride) on /stride and /anatomy. The picture in the middle is the owner's film of a horse and rider
 * walking (public/video/Horse_and_rider_walking_video_c9663dac_1080p.mp4), and every effect is drawn over it, synced to the film.
 *
 * The film: the generator's ✦ mark (bottom right) removed with ffmpeg `delogo`; frames 26 to 208 kept (exactly six strides, found by
 * comparing every frame of the leg region), with a 10-frame crossfade at a stride-matched seam so the loop has no jump (the
 * difference across the seam, 2.4, is in line with ordinary frame-to-frame motion, 2.0); audio dropped. 1920 × 1080 (2.7 MB) and
 * 1280 × 720 (1.3 MB), H.264, faststart. 182 frames at 24 fps: 7.583 s.
 *
 * The figures are the academy's stride model's (the walk as authored for the 3D rig), not measurements of this film: the page
 * says "Illustrative" next to every number, and no figure is a health claim (Blueprint Part 9).
 */
export const LAB_FILM = {
  desktop: asset("/video/stride-lab.mp4"),
  mobile: asset("/video/stride-lab-mobile.mp4"),
  poster: asset("/video/stride-lab-poster.jpg"),
  posterMobile: asset("/video/stride-lab-poster-mobile.jpg"),
  alt: "A black horse and its rider walk in place on a dark reflective floor, gold waveforms behind them.",
  /** seconds per stride in the film (182 frames / 6 strides / 24 fps) */
  period: 182 / 6 / 24,
  /** the film's frame size: every landmark below is in these pixels */
  width: 1920,
  height: 1080,
};

export const LAB_CAVEAT = "Illustrative: from the academy's stride model, not measured on this film.";

export type PartId = "01" | "02" | "03" | "04" | "05" | "06";

export type LabPart = {
  id: PartId;
  name: string;
  badge: string;
  lead: string;
  body: string[];
  focus: string;
  /** where the numbered marker sits on the film (film pixels) */
  at: { x: number; y: number };
};

export const LAB_PARTS: LabPart[] = [
  {
    id: "01", name: "Horse spine", badge: "The bridge", at: { x: 760, y: 392 },
    lead: "The back carries the rider between the engine and the forehand.",
    body: ["The spine is a bridge from the hindquarters to the shoulders. At the walk it rises and falls twice in each stride and swings from side to side once.", "The saddle sits on the quietest part of that bridge."],
    focus: "Under the saddle the back moves about 3.2 mm up and down twice a stride, and about 14 mm from side to side once.",
  },
  {
    id: "02", name: "Horse pelvis", badge: "The engine", at: { x: 590, y: 500 },
    lead: "The walk is driven from behind.",
    body: ["The pelvis turns and tilts as each hind leg reaches under the body.", "The rider's pelvis answers a fraction of a beat later."],
    focus: "The horse's pelvis rocks from side to side once a stride as the hind legs take turns to push.",
  },
  {
    id: "03", name: "Shoulder", badge: "Forelimb pendulum", at: { x: 1170, y: 505 },
    lead: "The forelimb swings from the shoulder.",
    body: ["The foreleg swings forward and back from the shoulder, and the head and neck move in rhythm with it. The neck is the horse's balancing pole: it lets the shoulder swing without the body lurching.", "The shoulder, elbow and knee fold in turn as each fore hoof is carried forward."],
    focus: "Over a stride the elbow opens from 102° to 137° and the knee from 107° to 180° (straight).",
  },
  {
    id: "04", name: "Hindquarters", badge: "Hip, stifle, hock", at: { x: 720, y: 650 },
    lead: "Three joints fold and open like a spring.",
    body: ["Hip, stifle and hock bend and straighten in turn, carrying the body forward with very little bounce.", "The left hind lands at the start of the stride, the right hind halfway through."],
    focus: "Left hind at 0 %, right hind at 50 % of the stride: the hind legs set the four-beat rhythm.",
  },
  {
    id: "05", name: "Rider pelvis", badge: "The following seat", at: { x: 935, y: 395 },
    lead: "A good seat follows; it does not grip.",
    body: ["The rider's pelvis tracks the saddle about 95 times a minute, up and down, side to side and forward and back.", "Absorbing that motion without bracing is what a cadet learns first."],
    focus: "The seat moves about 3.1 mm up and down, 15.7 mm side to side and 12.5 mm forward and back each stride.",
  },
  {
    id: "06", name: "Hoof and ground", badge: "Four beats", at: { x: 1330, y: 945 },
    lead: "Two or three hooves are always on the ground.",
    body: ["The walk is a four-beat gait: left hind, left fore, right hind, right fore, a quarter of a stride apart.", "A planted hoof barely moves over the ground while the body passes over it."],
    focus: "Landing order LH → LF → RH → RF, each a quarter of a stride after the last; a planted hoof slips 0.2 cm at most.",
  },
];

export const LAB_TABLE = {
  caption: "Peak-to-peak movement of the horse's back at the saddle and of the rider's pelvis over one stride",
  rows: [
    { metric: "Up and down", horse: "3.2 mm", rider: "3.1 mm", cycles: "2" },
    { metric: "Side to side", horse: "14.0 mm", rider: "15.7 mm", cycles: "1" },
    { metric: "Forward and back", horse: "8.9 mm", rider: "12.5 mm", cycles: "2" },
    { metric: "Tilt forward and back", horse: "2.46°", rider: "2.39°", cycles: "2" },
    { metric: "Tilt side to side", horse: "1.66°", rider: "1.64°", cycles: "1" },
  ],
};

export const LAB_TEMPO = [
  { label: "Tempo", value: "48 strides a minute", sub: "as filmed (the model is authored at 50)" },
  { label: "Seat cycles a minute", value: "about 95", sub: "up and down: two per four-beat stride" },
  { label: "Hooves down at once", value: "2 to 3", sub: "two-legged and three-legged support in turn" },
];

export const LAB_LANDINGS = [
  { code: "LH", name: "left hind" },
  { code: "LF", name: "left fore" },
  { code: "RH", name: "right hind" },
  { code: "RF", name: "right fore" },
] as const;

export const LAB_PLANTED = [
  { label: "Planted hoof, distance moved over the ground", value: "0.2 cm at most", authored: "the clip as authored: 9.1 cm" },
  { label: "Planted hoof, speed over the ground", value: "3 cm/s at most", authored: "as authored: 131 cm/s" },
];

/** when each hoof is on the ground, as fractions of a stride ([start, end) pairs; a range may wrap past 1) */
export const LAB_STANCE: Record<"LH" | "LF" | "RH" | "RF", [number, number][]> = {
  LH: [[0, 0.62]],
  LF: [[0.25, 0.87]],
  RH: [[0.5, 1], [0, 0.12]],
  RF: [[0.75, 1], [0, 0.37]],
};

export const LAB_STAGES = [
  { pct: 0, label: "left hind" },
  { pct: 25, label: "left fore" },
  { pct: 50, label: "right hind" },
  { pct: 75, label: "right fore" },
  { pct: 100, label: "end of stride" },
];

/** anatomical landmarks on the film (film pixels), read from the frame grid; the legs move, so only the body's are fixed */
export const LAB_LANDMARKS = {
  croup: { x: 600, y: 427 }, lumbar: { x: 760, y: 392 }, withers: { x: 1087, y: 353 }, crest: { x: 1222, y: 252 }, poll: { x: 1333, y: 200 },
  hip: { x: 653, y: 493 }, shoulder: { x: 1173, y: 507 }, elbow: { x: 1133, y: 627 },
  riderHead: { x: 920, y: 70 }, riderShoulder: { x: 920, y: 182 }, riderPelvis: { x: 935, y: 402 }, riderKnee: { x: 1013, y: 440 }, riderHeel: { x: 980, y: 620 },
  /** where each hoof meets the floor */
  ground: 945,
  hoofX: { LH: 600, RH: 790, LF: 985, RF: 1175 },
};
