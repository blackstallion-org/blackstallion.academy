/** Round to 3 decimals so trig-computed SVG attributes serialise identically on server and client (avoids hydration mismatches). */
export const r3 = (n: number) => Math.round(n * 1000) / 1000;
