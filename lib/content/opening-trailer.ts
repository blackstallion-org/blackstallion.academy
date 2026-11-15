import { asset } from "./asset";
import type { Ambient } from "./marwari-journey";

/**
 * The opening trailer (15 Nov 2026, owner's brief): about 25 s cut from the painted Marwari journey (the same three-layer paintings
 * as /legend, lib/content/marwari-journey.ts), shown once per session over the home page in place of the Marwar Journey video,
 * which stays mid-page. Seven shots in four beats: the land, the horse, war and legend, the fall and the return.
 *
 * Every line is copy already on /legend or the Blueprint's big idea ("An 800-year lineage, handed to your child"); nothing from the
 * "No" rows of the claims ledger. The paintings are illustrations, and the frame says so.
 */

/** A from → to move for one layer, in percent of the layer (x, y) and plain scale; phones take a lighter share of x and y. */
export type LayerMove = { x?: [number, number]; y?: [number, number]; scale?: [number, number] };

export type TrailerShot = {
  /** painting id in LAYERS / SCENES */
  scene: string;
  /** seconds from the start of the trailer */
  at: number;
  /** seconds on screen */
  len: number;
  /** how this shot arrives */
  cut: "hard" | "dip" | "whip" | "dissolve";
  /** where the 16:9 painting is anchored when the screen crops it (0..1, 0.5 = centre), so the subject stays in frame on phones */
  focus: [number, number];
  b?: LayerMove;
  s?: LayerMove;
  f?: LayerMove;
  /** a slow push (or pull, < 1) on the whole painting */
  push?: { scale: [number, number]; origin: string };
  /** colour drains to sepia over the shot (the fall) */
  drain?: boolean;
  /** a short camera shake on arrival (the charge) */
  shake?: boolean;
  ambient?: Ambient;
  /** the two-voice card; `blood` marks the one word set in the war colour */
  card: { inscription: string; voice: string; blood?: string; final?: boolean };
};

/** The cold open before the first painting: black, the bars close, a quiet line. */
export const TRAILER_OPEN = { len: 1.4, line: "The Black Stallion Academy presents" };

export const TRAILER_SHOTS: TrailerShot[] = [
  {
    scene: "01", at: 1.4, len: 3.4, cut: "hard", focus: [0.42, 0.5], ambient: "desert",
    b: { x: [1.5, -1.5] }, s: { x: [-9, 6] }, f: { x: [8, -10] },
    card: { inscription: "Marwar, 1193", voice: "driven into the desert." },
  },
  {
    scene: "04", at: 4.8, len: 3.2, cut: "hard", focus: [0.6, 0.35], ambient: "palace",
    push: { scale: [1.02, 1.12], origin: "60% 38%" },
    card: { inscription: "Bred by law", voice: "only the finest kept." },
  },
  {
    scene: "05", at: 8.0, len: 3.4, cut: "whip", focus: [0.3, 0.5], ambient: "battle", shake: true,
    b: { x: [-1, 1] }, s: { x: [8, -8] }, f: { x: [-6, 9] },
    card: { inscription: "They rode", voice: "into every war.", blood: "war." },
  },
  {
    scene: "16", at: 11.4, len: 2.4, cut: "hard", focus: [0.52, 0.4], ambient: "battle",
    push: { scale: [1, 1.08], origin: "50% 30%" }, s: { y: [2, -3] },
    card: { inscription: "In the legends,", voice: "it leapt." },
  },
  {
    scene: "07", at: 13.8, len: 3.6, cut: "dip", focus: [0.52, 0.55], drain: true,
    s: { x: [2, -2] }, push: { scale: [1.06, 1], origin: "55% 55%" },
    card: { inscription: "Then the world", voice: "forgot it." },
  },
  {
    scene: "08", at: 17.4, len: 3.2, cut: "hard", focus: [0.26, 0.4], ambient: "palace",
    s: { y: [1.5, 0] }, f: { y: [3, -2] }, push: { scale: [1, 1.05], origin: "35% 40%" },
    card: { inscription: "One line", voice: "refused to end." },
  },
  {
    scene: "09", at: 20.6, len: 4.6, cut: "dissolve", focus: [0.36, 0.45], ambient: "palace",
    b: { scale: [1.06, 1] }, s: { y: [2, 0] }, push: { scale: [1.08, 1], origin: "36% 40%" },
    card: { inscription: "An 800-year lineage,", voice: "handed to your child.", final: true },
  },
];

/** total running time in seconds (the reveal starts here) */
export const TRAILER_LENGTH = TRAILER_SHOTS.reduce((end, s) => Math.max(end, s.at + s.len), 0);

/**
 * The score: 25.4 s cut from "Epic Indian Orchestral Fusion" by vjgalaxy (Pixabay Content License: free for commercial use, no
 * attribution required; credited anyway). Taken from 0:02.85 so the quiet opening sits under the cold open and the build peaks on
 * the charge (8 s); loudness-normalised, ducked to 20 % for "Then the world forgot it" (13.6–17.2 s), faded out under the reveal.
 * See public/audio/LICENSES.md.
 */
export const TRAILER_MUSIC: { src: string; title: string; author: string; licence: string; url: string } | null = {
  src: asset("/audio/music/opening-trailer.mp3"),
  title: "Epic Indian Orchestral Fusion",
  author: "vjgalaxy",
  licence: "Pixabay Content License",
  url: "https://pixabay.com/music/india-epic-indian-orchestral-fusion-570933/",
};

export const TRAILER_NOTE = "Painted illustrations";
