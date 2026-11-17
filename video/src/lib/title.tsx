import React from "react";
import { DISPLAY, SANS } from "./fonts";
import { InkLineDefs } from "./ink";

export const IVORY = "#F6EFE2";
export const ANTIQUE = "#C9A66B";
export const CHESTNUT = "#78472F";
export const LEATHER = "#493126";

/**
 * A scene title in the site's two-voice headline (components/film/Headline.tsx): a small place-and-date label, the
 * INSCRIPTION in upright tracked caps, and the voice in italic gold set along a gentle arc. The whole block inks in
 * from the left with the same torn edge as the scene reveals, and inks out the same way. Copy comes only from the
 * website (lib/content/site.ts reels and the history scene labels).
 */
export function PathTitle({
  id,
  kicker,
  inscription,
  voice,
  x0,
  x1,
  y,
  bend = 36,
  size = 104,
  inAmt,
  outAmt = 0,
  ink = IVORY,
  gold = ANTIQUE,
  align = "start",
}: {
  id: string;
  kicker?: string;
  inscription: string;
  voice: string;
  x0: number;
  x1: number;
  y: number;
  bend?: number;
  size?: number;
  inAmt: number;
  outAmt?: number;
  ink?: string;
  gold?: string;
  align?: "start" | "middle";
}) {
  const amount = Math.max(0, inAmt - outAmt);
  if (amount <= 0) return null;
  const path = `M ${x0} ${y} Q ${(x0 + x1) / 2} ${y - bend} ${x1} ${y}`;
  const anchor = align === "middle" ? "middle" : "start";
  const lx = align === "middle" ? (x0 + x1) / 2 : x0 + 6;
  const capSize = size * 0.5;
  return (
    <g>
      <InkLineDefs id={`${id}-m`} amount={amount} x0={x0} x1={x1} y={y - size * 0.6} />
      <defs>
        <path id={`${id}-p`} d={path} />
        <filter id={`${id}-s`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <g mask={`url(#${id}-m)`}>
        {/* soft ink shadow so the words hold on any painting, as the site's shade gradients do */}
        <g filter={`url(#${id}-s)`} opacity={0.6} fill="#120d09">
          <Words />
        </g>
        <g>
          <Words colors />
        </g>
      </g>
    </g>
  );

  function Words({ colors }: { colors?: boolean }) {
    return (
      <>
        {kicker && (
          <text x={lx} y={y - bend / 2 - size * 1.55} textAnchor={anchor} fontFamily={SANS} fontWeight={600} fontSize={21} letterSpacing={6.5} fill={colors ? gold : undefined}>
            {kicker.toUpperCase()}
          </text>
        )}
        <text x={lx} y={y - bend / 2 - size * 0.82} textAnchor={anchor} fontFamily={DISPLAY} fontWeight={400} fontSize={capSize} letterSpacing={capSize * 0.14} fill={colors ? ink : undefined}>
          {inscription.toUpperCase()}
        </text>
        <text fontFamily={DISPLAY} fontStyle="italic" fontWeight={420} fontSize={size} fill={colors ? gold : undefined}>
          <textPath href={`#${id}-p`} startOffset={align === "middle" ? "50%" : "0%"} textAnchor={anchor}>
            {voice}
          </textPath>
        </text>
      </>
    );
  }
}

/** A dark gradient that holds the title, like the site's `shade-l` / `shade-b` (no cards on paintings). */
export function Shade({ id, side = "l", strength = 0.62 }: { id: string; side?: "l" | "r" | "t" | "b"; strength?: number }) {
  const v = { l: [0, 0, 1, 0], r: [1, 0, 0, 0], t: [0, 0, 0, 1], b: [0, 1, 0, 0] }[side];
  return (
    <g>
      <defs>
        <linearGradient id={id} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]}>
          <stop offset="0" stopColor="#140e0a" stopOpacity={strength} />
          <stop offset="0.55" stopColor="#140e0a" stopOpacity={strength * 0.35} />
          <stop offset="1" stopColor="#140e0a" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id})`} />
    </g>
  );
}
