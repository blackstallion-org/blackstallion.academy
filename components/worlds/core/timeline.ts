import type { WorldId } from "./types";

/**
 * The master timeline: one scroll progress (0..1) for the whole journey. Each world owns a span; neighbouring spans overlap,
 * and inside an overlap both worlds render and the post chain mixes them with that boundary's transition (the eye, the dust,
 * the clouds). Everything is a pure function of progress, so the journey runs backwards exactly as it runs forwards.
 */
export type TransitionMode = "iris" | "dust" | "cloud";

export type Span = { id: WorldId; start: number; end: number };
export type Boundary = { from: WorldId; to: WorldId; start: number; end: number; mode: TransitionMode };

/* 14 Nov 2026 (owner): two worlds. Each keeps its own camera path (local p 0..1 is unchanged); only where it sits on the
   global clock moved. Origins hands over through the eye (iris) into the memory world, which ends rising into the cloud. */
export const SPANS: Span[] = [
  { id: "origins", start: 0.0, end: 0.5 },
  { id: "legacy", start: 0.47, end: 1.0 },
];

export const BOUNDARIES: Boundary[] = [
  { from: "origins", to: "legacy", start: 0.47, end: 0.5, mode: "iris" },
];

/** Story beats the scroll eases onto when the reader stops nearby (the one hero moment of each world, and the final reveal). */
export const HOLDS: { at: number; label: string }[] = [
  { at: 0.0, label: "Origins" },
  { at: 0.29, label: "The horse" },
  { at: 0.8, label: "Legacy" },
  { at: 1.0, label: "The academy" },
];

/** Where the overlay places each world's title (global progress range in which the card is shown). */
export const CHAPTERS: { id: WorldId; n: string; title: string; subtitle: string; from: number; to: number }[] = [
  { id: "origins", n: "01", title: "Origins", subtitle: "The living world", from: 0.0, to: 0.377 },
  { id: "legacy", n: "02", title: "Legacy", subtitle: "The memory world", from: 0.537, to: 0.913 },
];
export type Frame = {
  /** the world drawn as the base image */
  a: { id: WorldId; p: number };
  /** the world mixed over it inside a boundary (null outside boundaries) */
  b: { id: WorldId; p: number } | null;
  /** 0..1 how far the transition has gone (0 = all a, 1 = all b) */
  mix: number;
  mode: TransitionMode | null;
};

const local = (s: Span, g: number) => Math.min(1, Math.max(0, (g - s.start) / (s.end - s.start)));

export function frameAt(progress: number): Frame {
  const g = Math.min(1, Math.max(0, progress));
  for (const b of BOUNDARIES) {
    if (g >= b.start && g <= b.end) {
      const sa = SPANS.find((s) => s.id === b.from)!;
      const sb = SPANS.find((s) => s.id === b.to)!;
      return { a: { id: b.from, p: local(sa, g) }, b: { id: b.to, p: local(sb, g) }, mix: (g - b.start) / (b.end - b.start), mode: b.mode };
    }
  }
  const s = SPANS.find((x) => g >= x.start && g <= x.end) ?? SPANS[SPANS.length - 1];
  return { a: { id: s.id, p: local(s, g) }, b: null, mix: 0, mode: null };
}

/** The world that should be loaded next from a given progress (preload one world ahead, either direction). */
export function neighbours(progress: number): WorldId[] {
  const f = frameAt(progress);
  const i = SPANS.findIndex((s) => s.id === (f.b?.id ?? f.a.id));
  return [SPANS[i - 1]?.id, SPANS[i]?.id, SPANS[i + 1]?.id].filter(Boolean) as WorldId[];
}

/** Gentle snap: only pulls the scroll onto a hold when it came to rest close to one. */
export function snapProgress(value: number, window = 0.018) {
  let best = value;
  let bd = window;
  for (const h of HOLDS) {
    const d = Math.abs(h.at - value);
    if (d < bd) { bd = d; best = h.at; }
  }
  return best;
}
