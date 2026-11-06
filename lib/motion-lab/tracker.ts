import { iou } from "./detect";
import { speciesOfClass, type SpeciesKey } from "./species";
import type { Box } from "./types";

/**
 * Multi-animal tracker. The detector gives boxes every few frames; between them each animal's box follows its own pose. This module
 * keeps one identity per animal across frames:
 *
 *  - association: boxes from a detector run are matched to existing tracks by overlap with the track's predicted box, plus a colour
 *    histogram of the animal as a tie-breaker, so two animals that cross keep their own IDs when their coats differ;
 *  - species: a track's species is a weighted vote over everything the detector said about it (runner-up class included), so one
 *    frame calling a dog "cat" cannot rename it, and a track whose vote is split stays "unsure" instead of being named;
 *  - lifetime: a new track must be seen twice before it is reported; a lost track is kept for a while and revived by a nearby box of
 *    the same species and a similar look, which is how an animal that walks behind a fence keeps its ID.
 *
 * Nothing here looks at pixels except through the histograms handed in; it is plain arithmetic and is tested without a browser.
 */

export const HIST_BINS = 64;           // 4 x 4 x 4 colour cells
export type Hist = Float32Array;

export type Track = {
  id: number;
  box: Box;
  /** Detector score of the last matching box, smoothed. */
  score: number;
  votes: Map<number, number>;
  hits: number;
  missed: number;               // consecutive frames without a pose or detection
  firstT: number;
  lastT: number;
  lastSeenT: number;
  vx: number; vy: number;       // pixels per millisecond
  hist: Hist | null;
  confirmed: boolean;
  lost: boolean;
};

export type SpeciesCall = { key: SpeciesKey | null; cls: number | null; share: number; unsure: boolean };

export type TrackerOptions = { minHits: number; maxLostMs: number; iouMin: number; speciesShare: number; speciesScore: number; crowdSize: number; crowdShare: number; crowdScore: number };
/** An animal is named only when its votes agree (speciesShare) AND the detector is confident about it (speciesScore): a weak box is "unsure". */
export const DEFAULT_TRACKER: TrackerOptions = { minHits: 3, maxLostMs: 6000, iouMin: 0.1, speciesShare: 0.7, speciesScore: 0.4, crowdSize: 4, crowdShare: 0.85, crowdScore: 0.55 };
/** Four or more animals in view at once (a herd, a pack, overlapping animals) is where the detector confuses species most, so naming needs more agreement and a surer box. */

const area = (b: Box) => Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
const centre = (b: Box) => ({ x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 });
const diag = (b: Box) => Math.hypot(b.x2 - b.x1, b.y2 - b.y1);

/** Histogram intersection of two normalised colour histograms: 1 = identical, 0 = nothing in common. */
export function histSimilarity(a: Hist | null, b: Hist | null): number {
  if (!a || !b) return 0.5;     // unknown: neither helps nor hurts
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.min(a[i], b[i]);
  return s;
}

/** Normalised 4x4x4 RGB histogram of the pixels inside `box` of an RGBA image (`scale` maps frame pixels to image pixels). */
export function colourHistogram(rgba: Uint8ClampedArray | Uint8Array, imgW: number, imgH: number, box: Box, scale: number): Hist {
  const h = new Float32Array(HIST_BINS);
  const x1 = Math.max(0, Math.floor(box.x1 * scale)), x2 = Math.min(imgW, Math.ceil(box.x2 * scale));
  const y1 = Math.max(0, Math.floor(box.y1 * scale)), y2 = Math.min(imgH, Math.ceil(box.y2 * scale));
  // Use the middle of the box: its edges are mostly background.
  const mx = (x2 - x1) * 0.2, my = (y2 - y1) * 0.2;
  let n = 0;
  for (let y = Math.floor(y1 + my); y < y2 - my; y += 2) {
    for (let x = Math.floor(x1 + mx); x < x2 - mx; x += 2) {
      const i = (y * imgW + x) * 4;
      h[((rgba[i] >> 6) << 4) | ((rgba[i + 1] >> 6) << 2) | (rgba[i + 2] >> 6)]++; n++;
    }
  }
  if (n) for (let i = 0; i < HIST_BINS; i++) h[i] /= n;
  return h;
}

export class AnimalTracker {
  tracks: Track[] = [];
  private nextId = 1;
  constructor(public opt: TrackerOptions = DEFAULT_TRACKER) {}

  reset() { this.tracks = []; this.nextId = 1; }

  /** Track boxes moved forward to time t by their own velocity (a short step), so a fast animal still overlaps its new detection. */
  predicted(t: Track, tMs: number): Box {
    const dt = Math.min(500, Math.max(0, tMs - t.lastT));
    const dx = t.vx * dt, dy = t.vy * dt;
    return { ...t.box, x1: t.box.x1 + dx, x2: t.box.x2 + dx, y1: t.box.y1 + dy, y2: t.box.y2 + dy };
  }

  /** What the votes say this animal is. Split votes give `unsure: true` and no species: it is never named on a coin flip. */
  species(t: Track): SpeciesCall {
    let total = 0, best = -1, bw = 0;
    for (const [c, w] of t.votes) { total += w; if (w > bw) { bw = w; best = c; } }
    if (best < 0 || total <= 0) return { key: null, cls: null, share: 0, unsure: true };
    const share = bw / total;
    const prof = speciesOfClass(best);
    const crowd = this.tracks.reduce((n, o) => n + (o.confirmed && !o.lost ? 1 : 0), 0) >= this.opt.crowdSize;
    const needShare = crowd ? Math.max(this.opt.speciesShare, this.opt.crowdShare) : this.opt.speciesShare;
    const needScore = crowd ? Math.max(this.opt.speciesScore, this.opt.crowdScore) : this.opt.speciesScore;
    if (share < needShare || t.score < needScore || !prof) return { key: null, cls: best, share, unsure: true };
    return { key: prof.key, cls: best, share, unsure: false };
  }

  private vote(t: Track, d: Box) {
    for (const [c, w] of t.votes) t.votes.set(c, w * 0.97);
    if (d.cls !== undefined) t.votes.set(d.cls, (t.votes.get(d.cls) ?? 0) + (d.p ?? d.score));
    if (d.alt) t.votes.set(d.alt.cls, (t.votes.get(d.alt.cls) ?? 0) + 0.5 * d.alt.p);
  }

  private touch(t: Track, box: Box, tMs: number) {
    const dt = tMs - t.lastT;
    if (dt > 0 && dt < 1000) {
      const a = centre(t.box), b = centre(box);
      const k = 0.5;
      t.vx = t.vx * (1 - k) + ((b.x - a.x) / dt) * k;
      t.vy = t.vy * (1 - k) + ((b.y - a.y) / dt) * k;
    }
    t.box = box; t.lastT = tMs; t.lastSeenT = tMs; t.missed = 0; t.lost = false;
  }

  /**
   * One detector run. `dets` are this frame's boxes and `hists` their colour histograms (same order). Returns the track each box
   * ended up in. Existing tracks that nothing matched are left alone (they coast on their pose box and are pruned by `prune`).
   */
  associate(dets: Box[], hists: (Hist | null)[], tMs: number): Track[] {
    const out: (Track | undefined)[] = new Array(dets.length).fill(undefined);
    const used = new Set<number>();
    type Pair = { di: number; track: Track; s: number };
    const pairs: Pair[] = [];
    for (let di = 0; di < dets.length; di++) {
      const d = dets[di];
      for (const t of this.tracks) {
        if (t.lost) continue;
        const o = iou(this.predicted(t, tMs), d);
        const c1 = centre(this.predicted(t, tMs)), c2 = centre(d);
        const near = Math.hypot(c1.x - c2.x, c1.y - c2.y) / Math.max(1, Math.max(diag(t.box), diag(d)));
        if (o < this.opt.iouMin && near > 0.35) continue;
        // A track already named confidently does not jump to a box of another species unless the boxes nearly coincide.
        const sp = this.species(t);
        const dsp = d.cls !== undefined ? speciesOfClass(d.cls)?.key : undefined;
        if (!sp.unsure && dsp && sp.key !== dsp && o < 0.5) continue;
        const look = histSimilarity(t.hist, hists[di]);
        pairs.push({ di, track: t, s: o + 0.35 * look + (o < this.opt.iouMin ? -0.1 : 0) });
      }
    }
    pairs.sort((a, b) => b.s - a.s);
    for (const p of pairs) {
      if (out[p.di] || used.has(p.track.id)) continue;
      out[p.di] = p.track; used.add(p.track.id);
    }
    for (let di = 0; di < dets.length; di++) {
      const d = dets[di];
      let t = out[di];
      if (!t) t = this.revive(d, hists[di], tMs, used);
      if (t) { used.add(t.id); this.vote(t, d); t.score = t.score * 0.6 + d.score * 0.4; t.hits++; t.hist = mix(t.hist, hists[di]); this.touch(t, { ...d }, tMs); t.confirmed = t.confirmed || t.hits >= this.opt.minHits; out[di] = t; continue; }
      t = { id: this.nextId++, box: { ...d }, score: d.score, votes: new Map(), hits: 1, missed: 0, firstT: tMs, lastT: tMs, lastSeenT: tMs, vx: 0, vy: 0, hist: hists[di], confirmed: d.score >= 0.55, lost: false };
      this.vote(t, d);
      this.tracks.push(t); out[di] = t; used.add(t.id);
    }
    return out as Track[];
  }

  /** A box that matched no live track may be a lost animal returning: same species, close to where it vanished, similar look. */
  private revive(d: Box, hist: Hist | null, tMs: number, used: Set<number>): Track | undefined {
    let best: Track | undefined, bs = 0;
    for (const t of this.tracks) {
      if (!t.lost || used.has(t.id) || !t.confirmed) continue;
      const gap = tMs - t.lastSeenT;
      if (gap > this.opt.maxLostMs) continue;
      const sp = this.species(t);
      const dsp = d.cls !== undefined ? speciesOfClass(d.cls)?.key : undefined;
      if (!sp.unsure && dsp && sp.key !== dsp) continue;
      const ratio = Math.sqrt(area(d) / Math.max(1, area(t.box)));
      if (ratio < 0.5 || ratio > 2) continue;
      const c1 = centre(t.box), c2 = centre(d);
      const reach = Math.max(diag(t.box), diag(d)) * (1 + gap / 1000);
      const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y) / reach;
      if (dist > 1.2) continue;
      const look = histSimilarity(t.hist, hist);
      if (look < 0.35 && t.hist && hist) continue;
      const s = 1 - dist / 1.2 + look;
      if (s > bs) { bs = s; best = t; }
    }
    return best;
  }

  /** Report the box a track's pose produced this frame (the box that follows the animal between detector runs). */
  applyPose(t: Track, box: Box, tMs: number) {
    const a = t.box;
    const k = 0.6;
    const smooth: Box = { ...box, x1: a.x1 + (box.x1 - a.x1) * k, y1: a.y1 + (box.y1 - a.y1) * k, x2: a.x2 + (box.x2 - a.x2) * k, y2: a.y2 + (box.y2 - a.y2) * k, score: t.score, cls: t.box.cls, p: t.box.p, alt: t.box.alt };
    this.touch(t, smooth, tMs);
    t.hits++; t.confirmed = t.confirmed || t.hits >= this.opt.minHits;
  }

  /** The pose found too little: the track coasts; after `maxLostMs` without being seen it is dropped. */
  miss(t: Track, tMs: number) {
    t.missed++;
    if (tMs - t.lastSeenT > 400) t.lost = true;
  }

  /**
   * Two live tracks that sit on the same animal (their boxes overlap almost completely) are one: the younger is dropped. Without this
   * a second detector box on one animal starts a second ID that never goes away while the animal is in view.
   */
  dedupe(minIou = 0.6) {
    const live = this.tracks.filter((t) => !t.lost).sort((a, b) => b.hits - a.hits);
    const drop = new Set<number>();
    for (let i = 0; i < live.length; i++) {
      if (drop.has(live[i].id)) continue;
      for (let j = i + 1; j < live.length; j++) {
        if (drop.has(live[j].id)) continue;
        if (iou(live[i].box, live[j].box) >= minIou) {
          for (const [c, w] of live[j].votes) live[i].votes.set(c, (live[i].votes.get(c) ?? 0) + w * 0.5);
          drop.add(live[j].id);
        }
      }
    }
    if (drop.size) this.tracks = this.tracks.filter((t) => !drop.has(t.id));
  }

  prune(tMs: number) {
    this.tracks = this.tracks.filter((t) => (t.confirmed || tMs - t.lastSeenT < 600) && tMs - t.lastSeenT <= this.opt.maxLostMs);
  }

  /** Tracks that should be given a pose this frame: confirmed and not lost. */
  live(): Track[] { return this.tracks.filter((t) => t.confirmed && !t.lost); }
}

function mix(a: Hist | null, b: Hist | null): Hist | null {
  if (!b) return a;
  if (!a) return b;
  const o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) o[i] = a[i] * 0.8 + b[i] * 0.2;
  return o;
}
