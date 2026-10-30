"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { ErrorBoundary } from "@/components/3d/ErrorBoundary";
import type { QualityTier } from "@/lib/3d/device-tier";
import type { CampusModule, CampusTier } from "@/lib/content/campus";
import { FOV, overviewPose, poseToPosition, clamp } from "@/lib/content/campus-camera";
import { warmUp } from "../scene-kit";
import { ArenaModel } from "./ArenaModel";
import { CampusCameraController, type CameraApi, type CameraView } from "./CampusCameraController";
import { CampusHotspot, type Highlight } from "./CampusHotspot";
import { CampusTerrain } from "./CampusTerrain";
import { createCampusEnvironment, createMaterials, disposeMaterials, tintMaterials } from "./campus-materials";
import { FacilityModel } from "./FacilityModel";
import { StableBlock } from "./StableBlock";

export type CampusSceneHandle = {
  overview: () => void;
  top: () => void;
  focus: (id: string) => void;
  zoomBy: (factor: number) => void;
  orbitBy: (radians: number) => void;
  /** Takes the current campus down (and starts the camera towards `next`). Resolves when it is gone. */
  playOut: (next: CampusTier) => Promise<void>;
};

export type CampusSceneProps = {
  tier: CampusTier;
  quality: QualityTier;
  reduced: boolean;
  /** Off screen or tab hidden: no frames are drawn. */
  paused: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onView: (v: CameraView) => void;
  /** Shaders compiled and the first frame is about to draw. */
  onReady: () => void;
  onError: (e: Error) => void;
};

/* Pixel-ratio ceiling per tier. The monitor lowers it if frames run long. */
const DPR_MAX: Record<QualityTier, number> = { high: 2, low: 1.5 };
const SHADOW_MAP: Record<QualityTier, number> = { high: 2048, low: 1024 };
/** Fine detail (louvres, fence caps) appears inside this camera distance, metres. Phones never draw it. */
const NEAR: Record<QualityTier, number> = { high: 80, low: 0 };

const smooth = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

/* ------------------------------------------------------------------ lighting */

function Lighting({ tier, quality }: { tier: CampusTier; quality: QualityTier }) {
  const R = Math.hypot(tier.site.w, tier.site.d) / 2 + 8;
  const sun = useMemo(() => new THREE.Vector3(-0.62, 0.78, 0.3).normalize().multiplyScalar(R * 2.4), [R]);
  const fill = useMemo(() => new THREE.Vector3(0.8, 0.35, -0.7).normalize().multiplyScalar(R * 2), [R]);
  return (
    <>
      <hemisphereLight args={[0xf6efe0, 0xc8b99d, 0.62]} />
      <directionalLight
        position={sun}
        intensity={2.5}
        color={0xfff0d9}
        castShadow
        shadow-mapSize={[SHADOW_MAP[quality], SHADOW_MAP[quality]]}
        shadow-camera-left={-R}
        shadow-camera-right={R}
        shadow-camera-top={R}
        shadow-camera-bottom={-R}
        shadow-camera-near={1}
        shadow-camera-far={R * 6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
        shadow-radius={3}
      />
      <directionalLight position={fill} intensity={0.45} color={0xe9eef5} />
    </>
  );
}

function StudioEnvironment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene, invalidate } = get();
    const target = createCampusEnvironment(gl);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.55;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [get]);
  return null;
}

/**
 * Pixel ratio that follows the device. The loop draws on demand, so only frames drawn during motion are timed (a long gap is
 * an idle stretch, not a slow frame). A run of slow frames steps the ratio down a quarter at a time, never below 1, and it
 * does not come back up afterwards; a long run of fast ones may raise it to the tier's ceiling.
 */
function AdaptiveDpr({ max, onDpr }: { max: number; onDpr: (dpr: number) => void }) {
  const s = useRef({ slow: 0, fast: 0, dpr: max, declined: false });
  useFrame((_, dt) => {
    if (dt <= 0 || dt > 0.12) return;
    const a = s.current;
    if (dt > 0.026) {
      a.slow++;
      a.fast = 0;
    } else {
      a.slow = Math.max(0, a.slow - 1);
      a.fast = dt < 0.019 ? a.fast + 1 : 0;
    }
    if (a.slow >= 24 && a.dpr > 1) {
      a.dpr = Math.max(1, +(a.dpr - 0.25).toFixed(2));
      a.slow = 0;
      a.declined = true;
      onDpr(a.dpr);
    } else if (!a.declined && a.fast >= 150 && a.dpr < max) {
      a.dpr = Math.min(max, +(a.dpr + 0.25).toFixed(2));
      a.fast = 0;
      onDpr(a.dpr);
    }
  });
  return null;
}

/** A frame is requested when the page tells the loop to run again (it is set to "never" while off screen). */
function Wake({ paused }: { paused: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!paused) invalidate();
  }, [paused, invalidate]);
  return null;
}

/* ------------------------------------------------------------- module host */

type HostProps = {
  module: CampusModule;
  quality: QualityTier;
  selectedId: string | null;
  hoveredId: string | null;
  interactive: boolean;
  showMarker: boolean;
  register: (id: string, g: THREE.Group | null) => void;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

/** One building: its own materials (so it can be tinted alone), the model, and its hotspot. */
function ModuleHost({ module: m, quality, selectedId, hoveredId, interactive, showMarker, register, onHover, onSelect }: HostProps) {
  const mats = useMemo(() => createMaterials(), []);
  useEffect(() => () => disposeMaterials(mats), [mats]);
  const amount = useRef<Highlight>({ hover: 0, dim: 0 });
  const invalidate = useThree((s) => s.invalidate);
  const hovered = hoveredId === m.id;
  const selected = selectedId === m.id;
  const dimmed = selectedId !== null && !selected;

  useFrame((_, dt) => {
    const a = amount.current;
    const goalHover = selected ? 1 : hovered ? 0.55 : 0;
    const goalDim = dimmed ? 1 : 0;
    if (Math.abs(goalHover - a.hover) < 0.002 && Math.abs(goalDim - a.dim) < 0.002) {
      if (a.hover !== goalHover || a.dim !== goalDim) {
        a.hover = goalHover;
        a.dim = goalDim;
        tintMaterials(mats, a.hover, a.dim);
      }
      return;
    }
    const k = 1 - Math.exp(-dt * 9);
    a.hover += (goalHover - a.hover) * k;
    a.dim += (goalDim - a.dim) * k;
    tintMaterials(mats, a.hover, a.dim);
    invalidate();
  });

  const setGroup = useCallback((g: THREE.Group | null) => register(m.id, g), [register, m.id]);
  const near = NEAR[quality];
  return (
    <>
      <group ref={setGroup} position={[m.rect.x, 0, m.rect.z]}>
        {m.kind === "arena" && <ArenaModel module={m} mats={mats} near={near} quality={quality} />}
        {m.kind === "stable-block" && <StableBlock module={m} mats={mats} near={near} quality={quality} />}
        {m.kind !== "arena" && m.kind !== "stable-block" && <FacilityModel module={m} mats={mats} near={near} quality={quality} />}
      </group>
      <CampusHotspot module={m} amount={amount} hovered={hovered} selected={selected} interactive={interactive} showMarker={showMarker} onHover={onHover} onSelect={onSelect} />
    </>
  );
}

/* ----------------------------------------------------------------- content */

type Transition = { playOut: (next: CampusTier) => Promise<void> };

function Content({ props, cameraRef, transitionRef }: { props: CampusSceneProps; cameraRef: React.MutableRefObject<CameraApi | null>; transitionRef: React.MutableRefObject<Transition | null> }) {
  const { tier, quality, reduced, selectedId, hoveredId, onHover, onSelect, onView, onReady } = props;
  const { gl, scene, camera: cam, invalidate } = useThree();
  const modules = useRef(new Map<string, THREE.Group>());
  const base = useRef<THREE.Group>(null);
  const reveal = useRef({ v: reduced ? 1 : 0 });
  const ready = useRef(false);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("in");
  const order = useMemo(() => tier.modules.map((m) => m.id), [tier]);

  const register = useCallback((id: string, g: THREE.Group | null) => {
    if (g) modules.current.set(id, g);
    else modules.current.delete(id);
  }, []);

  const apply = useCallback(() => {
    const v = reveal.current.v;
    if (base.current) {
      const e = smooth(v * 1.25);
      base.current.position.y = -(1 - e) * 5;
      base.current.visible = e > 0.001;
    }
    const gap = 0.16;
    const n = order.length;
    order.forEach((id, i) => {
      const g = modules.current.get(id);
      if (!g) return;
      const p = (v * (1 + gap * n) - (i + 1) * gap) / 1;
      const e = smooth(p);
      g.scale.y = Math.max(0.0001, e);
      g.visible = e > 0.001;
    });
  }, [order]);

  useFrame(apply);

  const playIn = useCallback(() => {
    setPhase("in");
    gsap.killTweensOf(reveal.current);
    if (reduced) {
      reveal.current.v = 1;
      apply();
      invalidate();
      setPhase("idle");
      return;
    }
    gsap.to(reveal.current, { v: 1, duration: 1.3, ease: "power2.out", onUpdate: invalidate, onComplete: () => setPhase("idle") });
  }, [reduced, apply, invalidate]);

  useEffect(() => {
    transitionRef.current = {
      playOut: (next) => {
        setPhase("out");
        gsap.killTweensOf(reveal.current);
        const flight = cameraRef.current?.flyTo(cameraRef.current.poseFor(next), reduced ? 0 : 0.8);
        if (reduced) {
          reveal.current.v = 0;
          apply();
          invalidate();
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          gsap.to(reveal.current, {
            v: 0,
            duration: 0.7,
            ease: "power2.in",
            onUpdate: invalidate,
            onComplete: () => {
              void flight?.then(() => resolve());
            },
          });
        });
      },
    };
    return () => {
      transitionRef.current = null;
    };
  }, [transitionRef, cameraRef, reduced, apply, invalidate]);

  // Compile every shader in the background, then show the first campus.
  useEffect(() => {
    let alive = true;
    const r = reveal.current;
    void (async () => {
      await warmUp(gl, scene, cam);
      if (!alive) return;
      ready.current = true;
      onReady();
      playIn();
    })();
    return () => {
      alive = false;
      gsap.killTweensOf(r);
    };
    // Runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new tier has been swapped in: build it up.
  const firstTier = useRef(tier.id);
  useEffect(() => {
    if (!ready.current || firstTier.current === tier.id) {
      firstTier.current = tier.id;
      return;
    }
    firstTier.current = tier.id;
    playIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier.id]);

  const interactive = phase === "idle";
  return (
    <>
      <Lighting tier={tier} quality={quality} />
      <StudioEnvironment />
      <CampusTerrain key={tier.id} ref={base} tier={tier} trees={quality === "high" ? 18 : 8} />
      {tier.modules.map((m) => (
        <ModuleHost
          key={`${tier.id}:${m.id}`}
          module={m}
          quality={quality}
          selectedId={selectedId}
          hoveredId={hoveredId}
          interactive={interactive}
          showMarker={interactive}
          register={register}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      <CampusCameraController tier={tier} reduced={reduced} apiRef={cameraRef} onView={onView} />
    </>
  );
}

/* ------------------------------------------------------------------- canvas */

export const CampusScene = forwardRef<CampusSceneHandle, CampusSceneProps>(function CampusScene(props, ref) {
  const { tier, quality, paused, onError } = props;
  const camera = useRef<CameraApi | null>(null);
  const transition = useRef<Transition | null>(null);
  const ceiling = Math.min(DPR_MAX[quality], typeof window === "undefined" ? 1 : window.devicePixelRatio);
  const [dpr, setDpr] = useState(ceiling);

  useImperativeHandle(
    ref,
    () => ({
      overview: () => void camera.current?.overview(),
      top: () => void camera.current?.top(),
      focus: (id) => void camera.current?.focus(id),
      zoomBy: (f) => void camera.current?.zoomBy(f),
      orbitBy: (r) => void camera.current?.orbitBy(r),
      playOut: (next) => transition.current?.playOut(next) ?? Promise.resolve(),
    }),
    [],
  );

  const start = useMemo(() => poseToPosition(overviewPose(tier)), [tier]);
  return (
    <ErrorBoundary fallback={null} onError={onError}>
      <Canvas
        frameloop={paused ? "never" : "demand"}
        dpr={dpr}
        shadows="percentage"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: FOV, near: 2, far: 900, position: start }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1;
          gl.setClearColor(0x000000, 0);
          const canvas = gl.domElement;
          // The picture is decorative; the pins (real buttons) live beside the canvas and must stay reachable.
          canvas.setAttribute("aria-hidden", "true");
          canvas.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            window.setTimeout(() => {
              if (canvas.isConnected && gl.getContext().isContextLost()) onError(new Error("WebGL context lost"));
            }, 2500);
          });
        }}
      >
        <AdaptiveDpr max={ceiling} onDpr={setDpr} />
        <Wake paused={paused} />
        <Content props={props} cameraRef={camera} transitionRef={transition} />
      </Canvas>
    </ErrorBoundary>
  );
});
