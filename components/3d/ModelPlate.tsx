"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type ReactNode } from "react";
import { ModelBoundary } from "@/components/three/ModelBoundary";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { cn } from "@/lib/utils";

const ModelPlateCanvas = dynamic(() => import("./ModelPlateCanvas").then((m) => m.ModelPlateCanvas), { ssr: false });

export type ModelPlateProps = {
  /** The model, through asset(). */
  src: string;
  /** What the model shows, for screen readers. */
  label: string;
  /** What fills the frame until the model is on screen, and when it cannot be drawn (no WebGL, a failed download, reduced data). */
  fallback: ReactNode;
  /** "turn" revolves slowly all the way round (statues, tack); "sway" swings a few degrees either side (a flat piece such as a medal); "still" holds the model facing as set by yaw, with no motion and no dragging. */
  mode?: "turn" | "sway" | "still";
  /** A held turn of the model, in degrees about the vertical axis, for pieces that should face a particular way at rest. */
  yaw?: number;
  /** How far a swaying piece turns either side, in radians (default 0.5). A piece with a cut face on one side swings less. */
  swing?: number;
  /** How much of the frame the model fills (0 to 1). */
  fill?: number;
  /** Lets a parent that fades or stacks several plates stop one from drawing while it is not seen. */
  paused?: boolean;
  className?: string;
};

/**
 * One supplied 3D piece in a frame of its own (4 Nov 2026). The picture it replaces stays underneath as the fallback, so a visitor
 * without WebGL, or a model that fails to download, sees exactly what the page showed before. The three.js layer (and the model, 1 to 2 MB)
 * loads only when the frame nears the screen, and stops drawing when it leaves it. With reduced motion the model stands still, facing
 * front, and can still be turned by dragging it. Touch scrolls the page instead of turning the model.
 */
export function ModelPlate({ src, label, fallback, mode = "turn", yaw = 0, swing = 0.5, fill = 0.9, paused = false, className }: ModelPlateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref, "200% 0px");
  const onScreen = useOnScreen(ref);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div ref={ref} role="img" aria-label={label} className={cn("relative isolate overflow-hidden", className)}>
      <div className={cn("absolute inset-0 transition-opacity duration-700", ready && !failed ? "opacity-0" : "opacity-100")}>{fallback}</div>
      {near && !failed && (
        <ModelBoundary onFailure={() => setFailed(true)}>
          <ModelPlateCanvas
            src={src}
            mode={mode}
            yaw={yaw}
            swing={swing}
            fill={fill}
            reduced={reduced}
            active={onScreen && !paused}
            onReady={() => setReady(true)}
            className={cn("absolute inset-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}
          />
        </ModelBoundary>
      )}
    </div>
  );
}
