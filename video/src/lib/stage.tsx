import React from "react";
import { Easing, interpolate, staticFile } from "remotion";

export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** The house curve from the website (lib/motion/tokens.ts): slow, weighted. */
export const house = Easing.bezier(0.16, 1, 0.3, 1);
export const glide = Easing.bezier(0.45, 0, 0.55, 1);

/** Progress 0..1 of `frame` through [a, b], clamped and eased. */
export const prog = (frame: number, a: number, b: number, ease = glide) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export const img = (p: string) => staticFile(p.replace(/^\//, ""));

/**
 * The camera of one scene: a horizontal glide (`x`, px at depth 1) and a push (`push`, extra scale at depth 1),
 * both driven by the scene's own eased progress.
 */
export type Camera = { x: number; y?: number; push: number };

/**
 * One painted plane at a depth. `p` is its parallax: 0 never moves (the sky), 1 moves with the subject, above 1 is in
 * front of it and moves faster (foreground bands, occluders). Positions are in frame pixels at rest.
 */
export function Plane({
  href,
  x,
  y,
  w,
  h,
  p,
  cam,
  opacity = 1,
  filter,
  blend,
  flip,
}: {
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  cam: Camera;
  opacity?: number;
  filter?: string;
  blend?: React.CSSProperties["mixBlendMode"];
  flip?: boolean;
}) {
  const s = 1 + cam.push * p;
  const tx = cam.x * p;
  const ty = (cam.y ?? 0) * p;
  // Scale about the frame centre, so a push draws the eye inward and near planes grow faster than far ones.
  const transform = `translate(${W / 2 + tx} ${H / 2 + ty}) scale(${s}) translate(${-W / 2} ${-H / 2})${flip ? ` translate(${2 * x + w} 0) scale(-1 1)` : ""}`;
  return (
    <image
      href={img(href)}
      x={x}
      y={y}
      width={w}
      height={h}
      preserveAspectRatio="xMidYMid slice"
      transform={transform}
      opacity={opacity}
      filter={filter}
      style={blend ? { mixBlendMode: blend } : undefined}
    />
  );
}

/** A full-frame painted plate, slightly oversize so the glide never shows an edge. */
export function Plate({ href, cam, p = 0.35, over = 1.16, opacity }: { href: string; cam: Camera; p?: number; over?: number; opacity?: number }) {
  const w = W * over;
  const h = H * over;
  return <Plane href={href} x={(W - w) / 2} y={(H - h) / 2} w={w} h={h} p={p} cam={cam} opacity={opacity} />;
}
