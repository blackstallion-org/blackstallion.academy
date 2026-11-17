import React from "react";
import { H, W } from "./stage";

/**
 * Ink-bleed matte: a circle growing from (cx, cy), its edge torn by fractal noise and then tightened, so what it
 * reveals soaks into the paper with blotchy, feathered edges instead of fading in. `amount` 0 hides, 1 shows all.
 * Render <InkDefs id … /> once inside an <svg>, then put `mask={`url(#${id})`}` on the group to reveal.
 */
export function InkDefs({ id, amount, cx = W / 2, cy = H / 2, seed = 3, grain = 0.011, tear = 170, radius }: { id: string; amount: number; cx?: number; cy?: number; seed?: number; grain?: number; tear?: number; radius?: number }) {
  // The farthest corner from the centre, plus the tear, so amount 1 covers the whole frame.
  const far = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + tear * 1.4;
  const r = radius ?? Math.max(0.001, amount) * far;
  return (
    <defs>
      <filter id={`${id}-f`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={grain} numOctaves={4} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={tear} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feGaussianBlur in="d" stdDeviation={5} result="b" />
        <feComponentTransfer in="b">
          <feFuncA type="linear" slope={2.4} intercept={-0.55} />
        </feComponentTransfer>
      </filter>
      <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
        <g filter={`url(#${id}-f)`}>
          <circle cx={cx} cy={cy} r={r} fill="#fff" />
        </g>
      </mask>
    </defs>
  );
}

/** A shared ink edge for text: the same tear, smaller, so letters erode in along the line. */
export function InkLineDefs({ id, amount, x0, x1, y, seed = 9 }: { id: string; amount: number; x0: number; x1: number; y: number; seed?: number }) {
  // runs 320px past x1, so italic overhangs and long voices are never clipped once fully inked
  const x = x0 + (x1 + 320 - x0) * amount;
  return (
    <defs>
      <filter id={`${id}-f`} x="-10%" y="-60%" width="120%" height="220%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={0.03} numOctaves={3} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={60} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feGaussianBlur in="d" stdDeviation={2.5} />
      </filter>
      <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
        <g filter={`url(#${id}-f)`}>
          <rect x={x0 - 80} y={y - 260} width={Math.max(0, x - x0 + 80)} height={520} fill="#fff" />
        </g>
      </mask>
    </defs>
  );
}
