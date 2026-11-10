"use client";

import { useEffect, useState } from "react";

type Dot = [number, number, number];

const W = 1000;
const LINE = 260;
const CELL = 11;

/**
 * Oversized title drawn as a halftone: the text is painted to an offscreen canvas in the site's heavy sans, then each
 * cell becomes a dot sized by how much ink it holds. Decorative; the real words are in the page heading.
 */
export function Halftone({ lines, className }: { lines: readonly string[]; className?: string }) {
  const [dots, setDots] = useState<Dot[]>([]);
  const H = LINE * lines.length;

  useEffect(() => {
    let alive = true;
    const run = () => {
      const probe = document.createElement("span");
      probe.style.fontFamily = "var(--font-sans)";
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily;
      probe.remove();
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      if (!g) return;
      g.fillStyle = "#000";
      g.textBaseline = "alphabetic";
      let size = 300;
      g.font = `800 ${size}px ${family}`;
      const widest = Math.max(...lines.map((l) => g.measureText(l).width));
      size = Math.floor(Math.min((size * (W - 10)) / widest, LINE * 1.02));
      g.font = `800 ${size}px ${family}`;
      lines.forEach((l, i) => g.fillText(l, 0, LINE * i + LINE * 0.86));
      const data = g.getImageData(0, 0, W, H).data;
      const out: Dot[] = [];
      for (let y = 0; y < H; y += CELL)
        for (let x = 0; x < W; x += CELL) {
          let ink = 0;
          for (let sy = 1; sy < CELL; sy += 3) for (let sx = 1; sx < CELL; sx += 3) ink += data[((y + sy) * W + x + sx) * 4 + 3] > 100 ? 1 : 0;
          const cov = ink / 16;
          if (cov > 0.05) out.push([x + CELL / 2, y + CELL / 2, (CELL / 2) * Math.sqrt(cov) * 0.96]);
        }
      if (alive) setDots(out);
    };
    if (document.fonts?.ready) document.fonts.ready.then(run);
    else run();
    return () => {
      alive = false;
    };
  }, [lines, H]);

  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false">
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} />
      ))}
    </svg>
  );
}
