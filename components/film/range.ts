/**
 * Scroll-linked transforms can run as native (WAAPI) animations, which reject
 * offsets outside 0–1. Clamp every input range into [0, 1] and keep it strictly increasing.
 */
export function r(...stops: number[]): number[] {
  const out: number[] = [];
  for (const s of stops) {
    let v = Math.min(1, Math.max(0, s));
    const prev = out.at(-1);
    if (prev !== undefined && v <= prev) v = prev + 0.0001;
    out.push(v);
  }
  // If nudging pushed past 1, walk back from the end.
  for (let i = out.length - 1; i >= 0; i--) {
    const next = out[i + 1];
    if (out[i] > 1) out[i] = 1;
    if (next !== undefined && out[i] >= next) out[i] = next - 0.0001;
  }
  return out;
}
