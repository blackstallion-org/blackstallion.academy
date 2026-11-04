"use client";

import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import type { WebGLRenderer } from "three";
import { LANTERN_TUNING, MARBLE_TUNING, createRelight, type RelightTuning } from "./relight-material";

/** Named light presets, so server components can choose one without importing three. */
export type RelightPreset = "lantern" | "marble";
const PRESETS: Record<RelightPreset, RelightTuning> = { lantern: LANTERN_TUNING, marble: MARBLE_TUNING };

/** Where the visitor has asked for the light: the pointer over the stage, or the arrow keys. */
export type RelightInput = {
  /** Offset from the keyboard, in normalised stage units (−1…1). Null until an arrow key is used. */
  key: { x: number; y: number } | null;
};

type StageProps = {
  image: string;
  depth: string;
  input: MutableRefObject<RelightInput>;
  quality: "high" | "low";
  reduced: boolean;
  /** Pauses the render loop while the stage is off screen. */
  visible: boolean;
  preset?: RelightPreset;
  onReady: () => void;
  onError: (error: Error) => void;
};

/** World height of the view in the original (the plane and the light tuning are in these units). */
const VIEW_HEIGHT = 4;

const loader = new THREE.TextureLoader();

function Relit({ image, depth, input, reduced, preset = "lantern", onReady, onError }: Omit<StageProps, "quality" | "visible">) {
  const relight = useMemo(() => createRelight(PRESETS[preset]), [preset]);
  const target = useRef(1);
  const pending = useRef<{ map: THREE.Texture; depth: THREE.Texture } | null>(null);
  const pointerSeen = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const time = useRef(0);
  const fadeNow = useRef(0);

  useEffect(() => () => relight.dispose(), [relight]);

  // Load a new photograph and its depth map, fade the old picture out, swap, fade in.
  useEffect(() => {
    let cancelled = false;
    target.current = 0;
    Promise.all([loader.loadAsync(image), loader.loadAsync(depth)])
      .then(([map, depthMap]) => {
        if (cancelled) {
          map.dispose();
          depthMap.dispose();
          return;
        }
        pending.current = { map, depth: depthMap };
      })
      .catch((error: unknown) => {
        if (!cancelled) onError(error instanceof Error ? error : new Error("Relight textures failed to load"));
      });
    return () => {
      cancelled = true;
    };
  }, [image, depth, onError]);

  useFrame(({ camera, size, pointer }, dt) => {
    const ortho = camera as THREE.OrthographicCamera;
    const zoom = size.height / VIEW_HEIGHT;
    if (ortho.zoom !== zoom) {
      ortho.zoom = zoom;
      ortho.updateProjectionMatrix();
    }
    const halfW = size.width / 2 / zoom;
    const halfH = VIEW_HEIGHT / 2;

    // Light: the pointer once it has moved over the stage, then the arrow keys, otherwise a slow drift (a fixed
    // resting place under reduced motion).
    time.current += dt;
    if (pointer.x !== lastPointer.current.x || pointer.y !== lastPointer.current.y) {
      pointerSeen.current = true;
      lastPointer.current = { x: pointer.x, y: pointer.y };
    }
    const key = input.current.key;
    let nx: number;
    let ny: number;
    if (key) {
      nx = key.x;
      ny = key.y;
    } else if (pointerSeen.current) {
      nx = pointer.x;
      ny = pointer.y;
    } else if (reduced) {
      nx = 0.35;
      ny = 0.3;
    } else {
      nx = Math.sin(time.current * 0.35) * 0.55;
      ny = 0.15 + Math.cos(time.current * 0.27) * 0.35;
    }
    fadeNow.current = relight.update({ dt, halfWidth: halfW, viewHeight: VIEW_HEIGHT, fadeTarget: target.current, x: nx * halfW, y: ny * halfH, reduced });

    // Photograph swap: once the old picture has faded out, put the new one in and fade up.
    if (pending.current && fadeNow.current < 0.04) {
      relight.setImages(pending.current.map, pending.current.depth);
      pending.current = null;
      target.current = 1;
      onReady();
    }
  });

  return (
    <>
      <primitive object={relight.mesh} />
      <primitive object={relight.light} />
      <primitive object={relight.ambient} />
    </>
  );
}

export default function RelightStage({ image, depth, input, quality, reduced, visible, preset, onReady, onError }: StageProps) {
  const dpr = useMemo<[number, number]>(() => (quality === "high" ? [1, 1.5] : [1, 1]), [quality]);
  return (
    <Canvas
      orthographic
      dpr={dpr}
      frameloop={visible ? "always" : "never"}
      camera={{ position: [0, 0, 5], near: 0.1, far: 20 }}
      gl={async (props) => {
        extend(THREE as unknown as Parameters<typeof extend>[0]);
        const renderer = new THREE.WebGPURenderer({ ...(props as object), antialias: true } as ConstructorParameters<typeof THREE.WebGPURenderer>[0]);
        renderer.toneMapping = THREE.AgXToneMapping;
        await renderer.init();
        return renderer as unknown as WebGLRenderer;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        <Relit image={image} depth={depth} input={input} reduced={reduced} preset={preset} onReady={onReady} onError={onError} />
      </Suspense>
    </Canvas>
  );
}
