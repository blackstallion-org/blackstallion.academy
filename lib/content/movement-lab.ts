import { asset } from "./asset";

/**
 * The Movement Laboratory (15 Nov 2026, owner's reference "Movement Laboratory: Horse & Rider Biomechanics"), on /stride and
 * /anatomy. Revised 16 Nov 2026 after the biomechanics honesty audit (docs/BIOMECHANICS_AUDIT.md): every figure on the page is
 * now either measured from the side film, taken from published research (cited below), or labelled an educational simulation.
 *
 * What is real, what is not:
 *  - MEASURED from the side film: the stride period (182 frames hold exactly six strides at 24 fps, so one stride takes
 *    182 / 6 / 24 = 1.264 s, about 47.5 strides a minute) and therefore the "% of the stride" clock.
 *  - PUBLISHED (typical of the walk, not measured here): the four-beat lateral footfall order LH → LF → RH → RF, footfalls about a
 *    quarter-stride apart, each hoof on the ground for more than half the stride, so support alternates between two and three
 *    hooves; the back flexes and extends twice a stride and bends and twists once; the saddle pitches twice a stride and the
 *    rider's pelvis tilts against it.
 *  - SIMULATED (drawn, not tracked): the overlay over the side film (topline wave, seat trace, limb pendulums, joint arcs, hoof
 *    ripples) and the two joint diagrams. They are timed to the measured stride but are not read from the footage, which is a
 *    generated film. The start of the stride (phase 0 = left hind lands) is a convention, not detected in the film.
 *
 * Sources: Hildebrand M (1965) Symmetrical gaits of horses. Science 150:701-708. Robilliard JJ, Pfau T, Wilson AM (2007) Gait
 * characterisation and classification in horses. J Exp Biol 210:187-197. Faber M, Schamhardt H, van Weeren R, Johnston C,
 * Roepstorff L, Barneveld A (2000) Basic three-dimensional kinematics of the vertebral column of horses walking on a treadmill.
 * Am J Vet Res 61:399-406. Byström A, Rhodin M, von Peinen K, Weishaupt MA, Roepstorff L (2010) Kinematics of saddle and rider in
 * high-level dressage horses performing collected walk on a treadmill. Equine Vet J 42:340-345. Back W, Clayton HM (eds) (2013)
 * Equine Locomotion, 2nd ed. Saunders Elsevier.
 */

/** The side film (the generator's ✦ mark removed with `delogo`, frames 26–208 kept: six strides, crossfaded at a stride-matched seam). */
export const LAB_FILM = {
  desktop: asset("/video/stride-lab.mp4"),
  mobile: asset("/video/stride-lab-mobile.mp4"),
  poster: asset("/video/stride-lab-poster.jpg"),
  posterMobile: asset("/video/stride-lab-poster-mobile.jpg"),
  alt: "A black horse and its rider walk in place on a dark reflective floor, gold waveforms behind them.",
  /** seconds per stride, measured from the film (182 frames / 6 strides / 24 fps) */
  period: 182 / 6 / 24,
  /** frames per second of the film: one "frame" step */
  fps: 24,
  /** the film's frame size: every landmark below is in these pixels */
  width: 1920,
  height: 1080,
};

/** Strides a minute, from the measured period (47.5). */
export const LAB_STRIDES_PER_MIN = 60 / LAB_FILM.period;

export const LAB_CAVEAT =
  "Educational simulation: the drawing over the side film is timed to its measured stride (one every 1.26 s) but is not tracked from the footage. Footfall timing is the typical walk pattern.";

export const LAB_JOINT_NOTE = "Educational simulation: illustrates how the joints fold, not a measurement.";

/* ------------------------------------------------------------------------------------------------------------------------------ */
/* Camera views                                                                                                                    */
/* ------------------------------------------------------------------------------------------------------------------------------ */

export type Camera = "side" | "three-quarter" | "behind" | "front" | "above";

export type CameraMedia = {
  label: string;
  /**
   * false until the footage exists: the option stays in the menu, disabled, with `pendingNote`. To enable a view, drop its files
   * at the paths below and flip this to true (and `kind` to "video" if it is a film).
   */
  available: boolean;
  kind: "video" | "still";
  /** desktop: 1920 × 1080; mobile: 1280 × 720. Every view is framed alike: the horse centred, about the same size. */
  src: { desktop: string; mobile: string };
  /** a video's first frame (a still uses its own image) */
  poster: string;
  alt: string;
  objectPosition: string;
  /** the short line under the stage: what this angle shows */
  caption: string;
  /** the measured overlay and part markers are drawn only where the landmarks were placed: the side film */
  overlay: boolean;
  pendingNote?: string;
};

export const CAMERA_ORDER: Camera[] = ["side", "three-quarter", "behind", "front", "above"];

/**
 * Front and above: the owner's generated clips (public/video/stills/Horse_and_rider_walking_animation_08123068_1080p.mp4 and
 * ~/Downloads/Horse_and_rider_top-down_view_9e02613f_1080p.mp4). ✦ mark removed (delogo), audio dropped, scaled (front 0.9,
 * above 0.7) so the horse is centred and about the size it is in the side film, edges feathered into a blurred copy of the
 * same frame; seamless loops cut at gait-matched frames (front 81→269, above 79→261) with a 14-frame (0.58 s) crossfade of the
 * tail into the head. H.264 yuv420p, CRF 23/24, faststart. Three-quarter: the academy photograph
 * public/images/academy-uniforms/navy-mounted.webp, unretouched, centred on a blurred, darkened band of its own background.
 */
export const CAMERA_MEDIA: Record<Camera, CameraMedia> = {
  side: {
    label: "Side",
    available: true,
    kind: "video",
    src: { desktop: LAB_FILM.desktop, mobile: LAB_FILM.mobile },
    poster: LAB_FILM.poster,
    alt: LAB_FILM.alt,
    objectPosition: "50% 50%",
    caption: "Side · the stride drawn over the film is an educational simulation, timed to the film's measured stride.",
    overlay: true,
  },
  "three-quarter": {
    label: "Three-quarter",
    available: true,
    kind: "still",
    src: { desktop: asset("/video/lab/lab-three-quarter.webp"), mobile: asset("/video/lab/lab-three-quarter-mobile.webp") },
    poster: asset("/video/lab/lab-three-quarter.webp"),
    alt: "A cadet in the academy's navy uniform and black helmet rides a black horse across a dusty arena, seen from the front and side at once.",
    objectPosition: "50% 50%",
    caption: "Three-quarter · a photograph: a cadet on a black horse, seen from the front and side at once.",
    overlay: false,
  },
  behind: {
    label: "Behind",
    available: false,
    kind: "still",
    src: { desktop: asset("/video/lab/lab-behind.webp"), mobile: asset("/video/lab/lab-behind-mobile.webp") },
    poster: asset("/video/lab/lab-behind.webp"),
    alt: "A horse and rider seen from behind.",
    objectPosition: "50% 50%",
    caption: "Behind · the hindquarters and the rider's seat, seen from behind.",
    overlay: false,
    pendingNote: "Footage to follow",
  },
  front: {
    label: "Front",
    available: true,
    kind: "video",
    src: { desktop: asset("/video/lab/lab-front.mp4"), mobile: asset("/video/lab/lab-front-mobile.mp4") },
    poster: asset("/video/lab/lab-front-poster.jpg"),
    alt: "A dark bay horse and its rider walk towards the camera across a dark reflective floor, gold light waves behind them.",
    objectPosition: "50% 50%",
    caption: "Front · the horse walks towards you: the forelegs swing under the shoulders and the rider sits square over the back.",
    overlay: false,
  },
  above: {
    label: "Above",
    available: true,
    kind: "video",
    src: { desktop: asset("/video/lab/lab-above.mp4"), mobile: asset("/video/lab/lab-above-mobile.mp4") },
    poster: asset("/video/lab/lab-above-poster.jpg"),
    alt: "Seen from directly overhead, a dark horse and its rider walk from right to left over a dark floor laced with gold light.",
    objectPosition: "50% 50%",
    caption: "Above · from overhead: the horse's length from poll to tail, and the rider centred over the middle of the back.",
    overlay: false,
  },
};

/* ------------------------------------------------------------------------------------------------------------------------------ */
/* The parts                                                                                                                       */
/* ------------------------------------------------------------------------------------------------------------------------------ */

export type PartId = "01" | "02" | "03" | "04" | "05" | "06";

export type LabPart = {
  id: PartId;
  name: string;
  badge: string;
  lead: string;
  body: string[];
  focus: string;
  /** where the numbered marker sits on the side film (film pixels), checked against frames at 0 s and 0.63 s */
  at: { x: number; y: number };
};

export const LAB_PARTS: LabPart[] = [
  {
    id: "01", name: "Back", badge: "Thoracolumbar spine", at: { x: 760, y: 392 },
    lead: "The back carries the rider between the hindquarters and the forehand.",
    body: [
      "Under the saddle lie the thoracic and lumbar vertebrae. At the walk the back flexes and extends twice in each stride, and bends and twists from side to side once.",
      "The gold line over the film follows the topline from tail to poll. In the neck the vertebrae themselves run lower, in an S-curve, not along the crest.",
    ],
    focus: "Flexion and extension: two cycles a stride; side-to-side bending and twist: one (Faber et al., 2000).",
  },
  {
    id: "02", name: "Pelvis and croup", badge: "Lumbosacral joint", at: { x: 630, y: 500 },
    lead: "The walk is driven from behind.",
    body: [
      "The pelvis is joined to the spine at the lumbosacral joint, under the croup. It rolls and turns as each hind leg reaches under the body.",
      "The rider's pelvis moves with the horse's in the same rhythm.",
    ],
    focus: "The horse's pelvis twists once a stride as the hind legs take turns to push; of the whole back, it twists the most (Faber et al., 2000).",
  },
  {
    id: "03", name: "Shoulder and forelimb", badge: "Forelimb pendulum", at: { x: 1178, y: 510 },
    lead: "The foreleg swings from the shoulder.",
    body: [
      "A horse has no collarbone: the shoulder blade is held to the body by muscle, and the foreleg swings forward and back beneath it. The head and neck nod in time with the steps.",
      "In the swing the shoulder, elbow and carpus (the horse's \"knee\", which matches our wrist) fold in turn, then straighten to take the weight.",
    ],
    focus: "While the hoof carries weight the carpus stays straight; it folds only once the hoof leaves the ground.",
  },
  {
    id: "04", name: "Hindquarters", badge: "Hip, stifle, hock", at: { x: 725, y: 640 },
    lead: "Three joints fold and open like a spring.",
    body: [
      "Hip, stifle and hock bend and straighten in turn. The stifle and hock are tied together by the reciprocal apparatus, so they bend and straighten together.",
      "The walk has no moment of suspension: the body rises and falls gently instead of bouncing.",
    ],
    focus: "By convention the stride starts as the left hind lands; the right hind lands half a stride later.",
  },
  {
    id: "05", name: "Rider's pelvis", badge: "The following seat", at: { x: 930, y: 396 },
    lead: "A good seat follows; it does not grip.",
    body: [
      "The saddle rises and falls twice in every walk stride, and the rider's seat goes with it: here about 95 times a minute.",
      "As the saddle tips forward, a skilled rider's pelvis tilts back, and the reverse, so the upper body stays quiet. Absorbing that motion without bracing is what a cadet learns first.",
    ],
    focus: "The saddle and rider follow the horse's movement in every direction, not only up and down (Byström et al., 2010).",
  },
  {
    id: "06", name: "Hoof and ground", badge: "Four beats", at: { x: 895, y: 955 },
    lead: "Two or three hooves are always on the ground.",
    body: [
      "The walk is a symmetrical four-beat gait: left hind, left fore, right hind, right fore, about a quarter of a stride apart.",
      "Each hoof stays down for more than half the stride, so the horse is held on two hooves, then three, in turn.",
    ],
    focus: "Landing order LH → LF → RH → RF; two-hoof support alternates between a lateral pair and a diagonal pair (Hildebrand, 1965; Robilliard et al., 2007).",
  },
];

/** What moves, and how often: published findings for the walk (no figure measured on this film). */
export const LAB_TABLE = {
  caption: "Published findings for the walk; nothing here is measured from this film",
  sources: "Faber et al. 2000 (the back) · Byström et al. 2010 (saddle and rider)",
  rows: [
    { metric: "Up and down", horse: "Back flexes and extends", rider: "Seat rises and falls with the saddle", cycles: "2" },
    { metric: "Side to side", horse: "Back bends left, then right", rider: "Moves with the horse", cycles: "1" },
    { metric: "Twist", horse: "Back rotates, most at the pelvis", rider: "Moves with the horse", cycles: "1" },
    { metric: "Tilt, front to back", horse: "Saddle tips forward, then back", rider: "Pelvis tilts the other way", cycles: "2" },
  ],
};

export const LAB_TEMPO = [
  { label: "Tempo", value: `about ${Math.round(LAB_STRIDES_PER_MIN)} strides a minute`, sub: "measured from the side film: one stride every 1.26 s" },
  { label: "Seat cycles a minute", value: `about ${Math.round(LAB_STRIDES_PER_MIN * 2)}`, sub: "two rises a stride, at the measured tempo" },
  { label: "Hooves down at once", value: "2 to 3", sub: "typical walk: two-hoof and three-hoof support in turn" },
];

export const LAB_LANDINGS = [
  { code: "LH", name: "left hind" },
  { code: "LF", name: "left fore" },
  { code: "RH", name: "right hind" },
  { code: "RF", name: "right fore" },
] as const;

/** The support pattern that follows from the stance timing below (typical walk). */
export const LAB_SUPPORT = [
  { label: "Three hooves down", value: "just after each landing", note: "four times a stride" },
  { label: "Two hooves down", value: "a lateral pair, then a diagonal pair", note: "in turn, between landings" },
];

/**
 * When each hoof is on the ground, as fractions of a stride ([start, end) pairs; a range may wrap past 1). The typical walk:
 * landings a quarter-stride apart in lateral sequence, each hoof down for 62 % of the stride (duty factor above 0.5, so support
 * alternates 3, 2, 3, 2 …). Illustrative, timed to the measured stride; not read from the film.
 */
export const LAB_STANCE: Record<"LH" | "LF" | "RH" | "RF", [number, number][]> = {
  LH: [[0, 0.62]],
  LF: [[0.25, 0.87]],
  RH: [[0.5, 1], [0, 0.12]],
  RF: [[0.75, 1], [0, 0.37]],
};

/** When each hoof lands and lifts (fractions of a stride): the limb pendulums swing back in stance and forward in the swing. */
export const LAB_CONTACT: Record<"LH" | "LF" | "RH" | "RF", { on: number; off: number }> = {
  LH: { on: 0, off: 0.62 },
  LF: { on: 0.25, off: 0.87 },
  RH: { on: 0.5, off: 0.12 },
  RF: { on: 0.75, off: 0.37 },
};

/**
 * Anatomical landmarks on the side film (film pixels), checked against frames at 0 s and 0.63 s (16 Nov 2026): the withers moved
 * back to just in front of the pommel, the poll from the ear to behind it, the elbow to the back of the forearm, the rider's heel
 * from the stirrup to the boot heel, and a croup point added on the top of the hindquarters (the old "croup" was the tail head).
 * The legs move, so only the body's points are fixed.
 */
export const LAB_LANDMARKS = {
  tailHead: { x: 600, y: 432 }, croup: { x: 690, y: 402 }, loin: { x: 780, y: 396 }, withers: { x: 1066, y: 364 },
  crest: { x: 1222, y: 252 }, poll: { x: 1296, y: 214 },
  hip: { x: 653, y: 493 }, shoulder: { x: 1178, y: 510 }, elbow: { x: 1105, y: 636 },
  riderHead: { x: 920, y: 70 }, riderShoulder: { x: 915, y: 178 }, riderPelvis: { x: 935, y: 402 }, riderKnee: { x: 1013, y: 440 },
  riderHeel: { x: 932, y: 628 },
  /** the topline as drawn: tail head → croup → loin → over the saddle → withers → crest → poll */
  topline: [[600, 432], [650, 410], [690, 402], [740, 396], [790, 396], [850, 398], [910, 402], [980, 394], [1030, 380], [1066, 364], [1120, 330], [1190, 280], [1250, 238], [1296, 214]] as [number, number][],
  /** where the hooves meet the floor; a schematic spacing (hind pair behind, fore pair in front), not the hooves' tracked positions */
  ground: 945,
  hoofX: { LH: 600, RH: 790, LF: 985, RF: 1175 },
};
