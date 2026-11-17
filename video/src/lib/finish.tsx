import React, { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { H, W, img } from "./stage";

/**
 * The film finish over every frame: the parchment grain (sh01) multiplied in so paper shows through the paintings,
 * a moving fine grain, and a soft vignette.
 */
export function Finish({ frame }: { frame: number }) {
  return (
    <g pointerEvents="none">
      <defs>
        <pattern id="fin-paper" patternUnits="userSpaceOnUse" width={1024} height={1024}>
          <image href={img("images/history/shared/sh01.webp")} width={1024} height={1024} />
        </pattern>
        <filter id="fin-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={frame % 9} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.9 0" />
        </filter>
        <radialGradient id="fin-vig" cx="50%" cy="52%" r="72%">
          <stop offset="0.55" stopColor="#120c08" stopOpacity={0} />
          <stop offset="1" stopColor="#120c08" stopOpacity={0.62} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#fin-paper)" style={{ mixBlendMode: "multiply" }} opacity={0.42} />
      <rect width={W} height={H} filter="url(#fin-grain)" style={{ mixBlendMode: "overlay" }} opacity={0.16} />
      <rect width={W} height={H} fill="url(#fin-vig)" />
    </g>
  );
}

/** Every still the film uses, decoded before the first frame so SVG <image> layers never render blank. */
export function usePreload(paths: string[]) {
  const [handle] = useState(() => delayRender("preload artwork"));
  useEffect(() => {
    let alive = true;
    Promise.all(
      paths.map(
        (p) =>
          new Promise<void>((resolve) => {
            const im = new Image();
            im.onload = () => im.decode().then(() => resolve(), () => resolve());
            im.onerror = () => {
              console.warn("missing artwork", p);
              resolve();
            };
            im.src = img(p);
          }),
      ),
    ).then(() => {
      if (alive) continueRender(handle);
    });
    return () => {
      alive = false;
    };
  }, [handle, paths]);
}
