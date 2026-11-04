"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";

// three.js, the model and the decoder load only when the frame is about to be seen, and only where WebGL 2 works.
const GalleryModelStage = dynamic(() => import("./GalleryModelStage").then((mod) => mod.GalleryModelStage), { ssr: false });

export function GalleryModel({ url, label }: { url: string; label: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const near = useNearViewport(frame);
  const visible = useOnScreen(frame);
  const capabilities = useCapabilities();
  const canDraw = capabilities?.webgl === true;
  return (
    <div ref={frame} role="group" aria-label={`${label}. 3D model: drag to turn it.`} className="tone-dark relative aspect-[4/3] w-full overflow-hidden bg-night">
      {near && canDraw && <GalleryModelStage url={url} active={visible} />}
      <p className="label pointer-events-none absolute left-4 top-4 text-brass">3D model · drag to turn</p>
      {capabilities && !capabilities.webgl && (
        <p className="t-ui absolute inset-x-4 bottom-4 text-sm text-sand">
          This device cannot show 3D. <a href={url} className="underline hover:text-bone" download>Download the model</a>
        </p>
      )}
    </div>
  );
}
