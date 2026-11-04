"use client";

import { Component, useCallback, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Headline } from "@/components/film/Headline";
import { useReducedMotion } from "@/lib/motion/reduced";
import type { UniformControl } from "./UniformCanvas";
import { asset } from "@/lib/content/asset";

// WebGL only runs in the browser.
const UniformCanvas = dynamic(() => import("./UniformCanvas").then((m) => m.UniformCanvas), { ssr: false });

class ViewerBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const STEP = 0.4;

/** The navy ceremonial uniform as a 3D model: drag sideways, use the arrow keys or the two buttons to turn it. */
export function UniformViewer() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const control = useRef<UniformControl>({ yaw: 0.35, pausedUntil: 0 });
  const drag = useRef<{ x: number; yaw: number } | null>(null);

  const hold = () => {
    control.current.pausedUntil = performance.now() + 2500;
  };
  const turn = (by: number) => {
    control.current.yaw += by;
    hold();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, yaw: control.current.yaw };
    control.current.pausedUntil = Number.POSITIVE_INFINITY;
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current) control.current.yaw = drag.current.yaw + (e.clientX - drag.current.x) * 0.012;
  };
  const onPointerEnd = () => {
    if (!drag.current) return;
    drag.current = null;
    hold();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      turn(-STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      turn(STEP);
    }
  };
  const onReady = useCallback(() => setReady(true), []);

  return (
    <section id="uniform-3d" aria-labelledby="uniform-3d-h" className="tone-dark bg-night py-20 md:py-28">
      <div className="gutter grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <Headline id="uniform-3d-h" inscription="TURN IT IN YOUR HANDS" voice="the full ceremonial uniform." size="3" />
          <p className="mt-6 max-w-lg text-lede leading-relaxed text-sand">
            Tunic, breeches and boots, from the gold braid at the collar to the polished toe. Drag to turn it, or use the arrow keys.
          </p>
          <div className="mt-8 flex gap-4">
            <button type="button" onClick={() => turn(-STEP)} className="label border border-brass/60 px-5 py-3 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Turn left
            </button>
            <button type="button" onClick={() => turn(STEP)} className="label border border-brass/60 px-5 py-3 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Turn right
            </button>
          </div>
          <p className="mt-8 text-sm text-dust">3D model generated from the academy’s uniform reference. AI-generated.</p>
        </div>

        <div
          role="group"
          aria-label="3D model of the navy ceremonial uniform. Drag sideways or use the left and right arrow keys to turn it."
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          style={{ touchAction: "pan-y" }}
          className="relative mx-auto aspect-[4/5] w-full max-w-xl cursor-grab touch-pan-y select-none active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          {/* The studio photograph holds the place until the model has loaded, and stands in if WebGL is unavailable. */}
          {(!ready || failed) && (
            <Image src={asset("/images/academy-uniforms/uniform-mannequin.webp")} alt="The navy ceremonial uniform on a mannequin" fill sizes="(min-width: 1024px) 36rem, 100vw" className="object-contain" />
          )}
          {!failed && (
            <ViewerBoundary onFailure={() => setFailed(true)}>
              <div className={ready ? "absolute inset-0 opacity-100 transition-opacity duration-700" : "absolute inset-0 opacity-0"}>
                <UniformCanvas control={control} idleTurn={!reduced} onReady={onReady} />
              </div>
            </ViewerBoundary>
          )}
        </div>
      </div>
    </section>
  );
}
