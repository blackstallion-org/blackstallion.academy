"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { hotspotCopy } from "@/lib/content/stride";
import type { StrideClock } from "@/lib/stride/clock";
import { HOTSPOTS, type StrideRig } from "@/lib/stride/rig";
import type { HotspotId, StrideStore } from "@/lib/stride/store";
import { releaseRenderer } from "@/components/3d/marwari";
import { StageController } from "./stage-controller";
import { cn } from "@/lib/utils";

type StageProps = {
  rig: StrideRig;
  clock: StrideClock;
  store: StrideStore;
  reduced: boolean;
  wide: boolean;
  quality: "high" | "low";
  /** On screen: the loop runs only while this is true. */
  active: boolean;
  markers: Map<HotspotId, HTMLElement>;
  onFail: () => void;
  onController?: (c: StageController | null) => void;
};

/** The single render loop of the page. Every frame: the clock, the pose, the floor, the camera, the markers. */
function Loop({ rig, clock, store, reduced, wide, quality, markers, onController }: Omit<StageProps, "active" | "onFail">) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const controller = useRef<StageController | null>(null);

  useEffect(() => {
    const render = () => invalidate();
    clock.bindRender(render);
    store.bindRender(render);
    const ctrl = new StageController({ gl, scene, camera, rig, clock, store, reduced, wide, quality, markers });
    controller.current = ctrl;
    onController?.(ctrl);
    invalidate();
    return () => {
      onController?.(null);
      ctrl.dispose();
      controller.current = null;
      clock.bindRender(() => {});
      store.bindRender(() => {});
      scene.remove(rig.root);
    };
  }, [gl, scene, camera, rig, clock, store, reduced, wide, quality, markers, invalidate, onController]);

  // the viewport changed (or the layout moved the stage): draw again
  const size = useThree((s) => s.size);
  useEffect(() => {
    invalidate();
  }, [size, invalidate]);

  useFrame((state, delta) => {
    const ctrl = controller.current;
    if (!ctrl) return;
    if (ctrl.frame(delta)) state.invalidate();
  });
  return null;
}

class Boundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[stride] 3D stage failed", error.message, info.componentStack);
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function StrideStage(props: StageProps) {
  const { active, quality, wide, onFail } = props;
  const [dpr, setDpr] = useState(() => (quality === "high" ? Math.min(2, typeof window === "undefined" ? 1.5 : window.devicePixelRatio || 1) : 1.25));
  const ceiling = quality === "high" ? 2 : 1.5;
  const decline = useCallback(() => setDpr((d) => Math.max(1, d - 0.25)), []);
  const incline = useCallback(() => setDpr((d) => Math.min(ceiling, Math.min(window.devicePixelRatio || 1, d + 0.25))), [ceiling]);
  const camera = useMemo(() => ({ fov: wide ? 28 : 34, near: 0.1, far: 80, position: [-5, 2, 2] as [number, number, number] }), [wide]);

  return (
    <Boundary onFail={onFail}>
      <Canvas
        frameloop={active ? "demand" : "never"}
        dpr={dpr}
        camera={camera}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 120 } }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.style.touchAction = "pan-y";
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onFail();
          });
        }}
        className="!absolute inset-0"
        aria-hidden="true"
      >
        <PerformanceMonitor onDecline={decline} onIncline={incline} flipflops={3} />
        <Loop {...props} />
        <ReleaseOnUnmount />
      </Canvas>
    </Boundary>
  );
}

function ReleaseOnUnmount() {
  const gl = useThree((s) => s.gl);
  useEffect(() => () => releaseRenderer(gl), [gl]);
  return null;
}

/* ------------------------------------------------------------------------------------------------ hotspot markers */

type MarkerProps = {
  markers: Map<HotspotId, HTMLElement>;
  selected: HotspotId | null;
  onSelect: (id: HotspotId) => void;
  className?: string;
};

/** Buttons that the stage keeps on their points of the rig. They are also reachable from the list in the laboratory. */
export function HotspotMarkers({ markers, selected, onSelect, className }: MarkerProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {HOTSPOTS.map((spot) => {
        const copy = hotspotCopy.find((c) => c.id === spot.id)!;
        const on = selected === spot.id;
        return (
          <button
            key={spot.id}
            type="button"
            ref={(el) => {
              if (el) markers.set(spot.id, el);
              else markers.delete(spot.id);
            }}
            onClick={() => onSelect(spot.id)}
            aria-pressed={on}
            aria-label={`${copy.label}: ${copy.title}`}
            data-hotspot={spot.id}
            style={{ opacity: 0 }}
            className="group absolute left-0 top-0 -ml-[18px] -mt-[18px] flex h-9 w-9 items-center justify-center rounded-full will-change-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span
              aria-hidden
              className={cn(
                "block h-2.5 w-2.5 rounded-full border border-gold bg-night/90 transition-[transform,background-color] duration-300 group-hover:scale-125 motion-reduce:transition-none",
                on && "scale-125 bg-gold",
              )}
            />
            <span
              aria-hidden
              className={cn(
                "label pointer-events-none absolute left-full top-1/2 ml-1 -translate-y-1/2 whitespace-nowrap bg-night/80 px-2 py-1 text-[0.62rem] text-bone opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100",
                on && "opacity-100",
              )}
            >
              {copy.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
