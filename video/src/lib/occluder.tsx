import React from "react";
import { H, W, img } from "./stage";

/**
 * A foreground occluder wipe: one of the site's own cutouts (a rider, banners, a spear line), turned to a near-black
 * silhouette, scaled far larger than the frame and blurred as if it passes right in front of the lens. It sweeps across
 * in `t` 0..1; the scene behind it changes at t ≈ 0.5, when it covers the frame.
 */
export function Occluder({ id, href, t, dir = 1, w = W * 2.2, h = H * 1.9, y = -H * 0.45, blur = 14 }: { id: string; href: string; t: number; dir?: 1 | -1; w?: number; h?: number; y?: number; blur?: number }) {
  if (t <= 0 || t >= 1) return null;
  const from = dir > 0 ? -w : W;
  const to = dir > 0 ? W : -w;
  const x = from + (to - from) * t;
  return (
    <g>
      <defs>
        <filter id={`${id}-o`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.035  0 0 0 0 0.03  0 0 0 1 0" result="dark" />
          <feMorphology in="dark" operator="dilate" radius={14} result="fat" />
          <feGaussianBlur in="fat" stdDeviation={blur} />
        </filter>
      </defs>
      <image href={img(href)} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet" filter={`url(#${id}-o)`} />
    </g>
  );
}
