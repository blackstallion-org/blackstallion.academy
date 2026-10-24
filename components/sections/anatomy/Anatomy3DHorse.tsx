"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ANATOMY_MODEL, addLights, contactShadow, daylight, disposeObject, loadMarwari, type Marwari } from "@/components/3d/marwari";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

type Point = { id: string; name: string; title: string };

interface Anatomy3DHorseProps {
  activeId: string;
  /** Changes on every selection (also of the current point), so the camera refocuses; 0 = still on the overview. */
  focusKey: number;
  /** The hotspots to mark on the horse (the plate's points). */
  points: Point[];
  onSelectHotspot?: (id: string) => void;
  className?: string;
  onUnavailable: (message: string) => void;
}

type Gait = "stand" | "walk" | "trot";

/**
 * Where each hotspot lives on the skeleton (so the glow, the marker and the camera follow the pose),
 * and the direction the camera looks from. Model space: +Y up, the horse faces +Z, its left side is +X.
 */
const REGIONS: Record<string, { spheres: (b: Bones) => { center: THREE.Vector3; radius: number }[]; view: [number, number, number]; distance: number }> = {
  ears: { spheres: (b) => [{ center: b("Ear_Tip_L"), radius: 0.14 }, { center: b("Ear_Tip_R"), radius: 0.14 }], view: [0.55, 0.35, 1], distance: 1.5 },
  neck: { spheres: (b) => [{ center: b("Neck_2").lerp(b("Neck_3"), 0.4), radius: 0.36 }], view: [1, 0.2, 0.5], distance: 2.3 },
  saddle: { spheres: (b) => [{ center: b("Spine_Thoracic").add(new THREE.Vector3(0, 0.17, 0)), radius: 0.36 }], view: [1, 0.65, 0.25], distance: 2.6 },
  flank: { spheres: (b) => [{ center: b("Ribcage").add(new THREE.Vector3(0.25, -0.14, -0.25)), radius: 0.32 }], view: [1, 0.1, -0.1], distance: 2.6 },
  reins: {
    spheres: (b) => [
      { center: b("Muzzle"), radius: 0.15 },
      { center: b("Neck_1").add(new THREE.Vector3(0, 0.22, 0)), radius: 0.2 },
    ],
    view: [1, 0.3, 0.9],
    distance: 2.5,
  },
  mouth: { spheres: (b) => [{ center: b("Muzzle"), radius: 0.15 }], view: [0.8, 0.2, 1], distance: 1.4 },
  hoof: {
    spheres: (b) => ["Hoof_F_L", "Hoof_F_R", "Hoof_B_L", "Hoof_B_R"].map((n) => ({ center: b(n), radius: 0.15 })),
    view: [1, 0.25, 0.55],
    distance: 3.1,
  },
};
const OVERVIEW = { focus: new THREE.Vector3(0, 1.05, 0.25), view: new THREE.Vector3(1, 0.22, 0.85).normalize(), distance: 5.6 };

/** World position of a joint; "Muzzle" is the corner of the mouth, where the bit sits. */
type Bones = (name: string) => THREE.Vector3;
/** The mouth corner in the rest pose (model space, from the Blender build), carried by the Head bone. */
const MUZZLE_REST = new THREE.Vector3(0.016, 1.62, 1.27);

export function Anatomy3DHorse({ activeId, focusKey, points, onSelectHotspot, onUnavailable, className = "" }: Anatomy3DHorseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [gait, setGait] = useState<Gait>("stand");

  const reducedMotion = useReducedMotion();
  const requestRenderRef = useRef<() => void>(() => {});
  const unavailableRef = useRef(onUnavailable);
  useEffect(() => { unavailableRef.current = onUnavailable; }, [onUnavailable]);
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    requestRenderRef.current();
  }, [autoRotate]);
  const gaitRef = useRef<(g: Gait) => void>(() => {});
  useEffect(() => { gaitRef.current(gait); }, [gait]);
  // The markers mount after the first frame; with motion reduced nothing else would draw them in place.
  useEffect(() => { if (isLoaded) requestRenderRef.current(); }, [isLoaded]);
  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; requestRenderRef.current(); }, [points]);

  // Interaction refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ y: 0, targetY: 0 });
  // The camera opens on the whole horse and moves only when a point is chosen.
  const activeRef = useRef("overview");
  useEffect(() => {
    if (!focusKey) return;
    activeRef.current = activeId;
    // turn the horse back to the angle the hotspot views were composed for (shortest way round)
    const r = rotationRef.current;
    r.targetY = Math.round(r.y / (Math.PI * 2)) * Math.PI * 2;
    requestRenderRef.current();
  }, [activeId, focusKey]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || (e.target as HTMLElement).closest("button")) return;
    isDraggingRef.current = true;
    setAutoRotate(false);
    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    rotationRef.current.targetY += (x - dragStartRef.current.x) * 0.007;
    dragStartRef.current = { x, y: e.clientY - rect.top };
    requestRenderRef.current();
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId: number | null = null;
    let disposed = false;
    let failed = false;
    let visible = false;
    let ready = false;
    let marwari: Marwari | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    const actions: Partial<Record<string, THREE.AnimationAction>> = {};
    let blinkAt = 2;
    const clock = new THREE.Clock();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancelRender = () => {
      if (animId !== null) cancelAnimationFrame(animId);
      animId = null;
    };
    const fail = () => {
      if (disposed || failed) return;
      failed = true;
      cancelRender();
      window.clearTimeout(loadTimeout);
      // Defer notifications from setup failures until the effect can clean up.
      queueMicrotask(() => {
        if (!disposed) unavailableRef.current("The 3D view is unavailable. Showing the interactive archive plate.");
      });
    };
    const loadTimeout = window.setTimeout(fail, 20_000);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(getComputedStyle(container).getPropertyValue("--color-night").trim() || "#171513");
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 60);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    } catch {
      fail();
      return () => { disposed = true; };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let environment: THREE.WebGLRenderTarget;
    try {
      environment = pmrem.fromScene(room, 0.04);
    } catch {
      room.dispose();
      pmrem.dispose();
      renderer.dispose();
      fail();
      return () => { disposed = true; };
    }
    room.dispose();
    pmrem.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.5;
    // A museum plate keeps one even, warm studio light (midday) rather than the visitor's clock.
    addLights(scene)(daylight(12));
    scene.add(contactShadow());

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { clock.getDelta(); requestRender(); }
      else cancelRender();
    });
    observer.observe(container);

    const tmp = new THREE.Vector3();
    let muzzleLocal: THREE.Vector3 | null = null;
    const bone: Bones = (name) => {
      if (name === "Muzzle") {
        const head = marwari?.bones.Head;
        return head && muzzleLocal ? head.localToWorld(muzzleLocal.clone()) : new THREE.Vector3();
      }
      const b = marwari?.bones[name];
      return b ? b.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
    };
    const regionFocus = (id: string) => {
      const r = REGIONS[id];
      if (!r) return null;
      const spheres = r.spheres(bone);
      const focus = spheres.reduce((acc, s) => acc.add(s.center), new THREE.Vector3()).multiplyScalar(1 / spheres.length);
      if (id === "hoof") focus.y = 0.45;
      return { spheres, focus, view: new THREE.Vector3(...r.view).normalize(), distance: r.distance };
    };

    const { promise, dispose: disposeLoader } = loadMarwari(ANATOMY_MODEL, (f) => {
      if (!disposed && !failed) setLoadingProgress(Math.round(f * 100));
    });
    promise
      .then((m) => {
        if (disposed || failed) return disposeObject(m.root);
        window.clearTimeout(loadTimeout);
        marwari = m;
        modelGroup.add(m.root);
        m.root.updateMatrixWorld(true);
        muzzleLocal = m.bones.Head?.worldToLocal(MUZZLE_REST.clone()) ?? null;
        mixer = new THREE.AnimationMixer(m.root);
        for (const name of ["Idle_Breathing", "Tail_Sway", "Ear_Rotate", "Walk", "Trot", "Blink"]) {
          const clip = m.clips.get(name);
          if (clip) actions[name] = mixer.clipAction(clip);
        }
        actions.Blink?.setLoop(THREE.LoopOnce, 1);
        applyGait("stand", 0);
        mixer.update(0);
        ready = true;
        setIsLoaded(true);
        requestRender();
      })
      .catch(fail)
      .finally(disposeLoader);

    const GAITS: Record<Gait, string[]> = {
      stand: ["Idle_Breathing", "Tail_Sway", "Ear_Rotate"],
      walk: ["Walk", "Idle_Breathing"],
      trot: ["Trot"],
    };
    function applyGait(g: Gait, fade = 0.6) {
      if (!mixer) return;
      const on = new Set(GAITS[g]);
      for (const name of ["Idle_Breathing", "Tail_Sway", "Ear_Rotate", "Walk", "Trot"]) {
        const a = actions[name];
        if (!a) continue;
        if (on.has(name)) {
          if (!a.isRunning()) a.reset().setEffectiveWeight(1).fadeIn(fade).play();
        } else if (a.isRunning()) a.fadeOut(fade);
      }
      requestRender();
    }
    gaitRef.current = (g) => applyGait(g);

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const camPos = new THREE.Vector3().copy(OVERVIEW.focus).addScaledVector(OVERVIEW.view, OVERVIEW.distance);
    const camLook = OVERVIEW.focus.clone();
    const targetPos = new THREE.Vector3();
    const targetLook = new THREE.Vector3();
    let glow = 0;
    const epsilon = 0.0001;

    function requestRender() {
      if (disposed || failed || !ready || !visible || document.hidden || animId !== null) return;
      animId = requestAnimationFrame(render);
    }

    function placeMarkers() {
      const rect = { w: container!.clientWidth, h: container!.clientHeight };
      for (const p of pointsRef.current) {
        const el = markerRefs.current[p.id];
        const region = regionFocus(p.id);
        if (!el || !region) continue;
        const s = region.spheres[0];
        tmp.copy(p.id === "hoof" ? region.spheres[0].center : region.spheres.length > 1 && p.id === "ears" ? region.focus : s.center);
        tmp.project(camera);
        const onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
        el.style.transform = `translate(${((tmp.x + 1) / 2) * rect.w}px, ${((1 - tmp.y) / 2) * rect.h}px)`;
        el.style.visibility = onScreen ? "visible" : "hidden";
      }
    }

    function render() {
      animId = null;
      if (disposed || failed || !ready || !visible || document.hidden) return;
      const still = motionQuery.matches;
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!still && mixer) {
        mixer.update(delta);
        const t = clock.elapsedTime;
        if (t > blinkAt && actions.Blink) {
          actions.Blink.reset().play();
          blinkAt = t + 3 + Math.random() * 4;
        }
      }
      const rotation = rotationRef.current;
      const orbit = autoRotateRef.current && !still && !isDraggingRef.current && activeRef.current === "overview";
      if (orbit) rotation.targetY += 0.0015;
      // A still 3D view remains usable with reduced motion; user changes apply directly.
      const lerp = still ? 1 : 0.08;
      rotation.y += (rotation.targetY - rotation.y) * lerp;
      modelGroup.rotation.set(0, rotation.y, 0);
      modelGroup.updateMatrixWorld(true);

      const region = regionFocus(activeRef.current);
      if (region) {
        targetLook.copy(region.focus);
        targetPos.copy(region.focus).addScaledVector(region.view, region.distance);
        marwari?.highlight.set(region.spheres);
      } else {
        targetLook.copy(OVERVIEW.focus);
        targetPos.copy(OVERVIEW.focus).addScaledVector(OVERVIEW.view, OVERVIEW.distance);
      }
      const glowTarget = region ? 1 : 0;
      glow += (glowTarget - glow) * (still ? 1 : 0.08);
      if (marwari) marwari.highlight.strength.value = glow * (0.75 + 0.25 * Math.sin(clock.elapsedTime * 2.4) * (still ? 0 : 1));
      camPos.lerp(targetPos, still ? 1 : 0.06);
      camLook.lerp(targetLook, still ? 1 : 0.06);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      try {
        renderer.render(scene, camera);
      } catch {
        fail();
        return;
      }
      placeMarkers();
      const settling = Math.abs(rotation.targetY - rotation.y) > epsilon ||
        camPos.distanceToSquared(targetPos) > epsilon * epsilon ||
        camLook.distanceToSquared(targetLook) > epsilon * epsilon ||
        Math.abs(glowTarget - glow) > 0.002;
      if (orbit || settling || (mixer && !still)) requestRender();
    }

    const handleVisibility = () => {
      if (document.hidden) cancelRender();
      else { clock.getDelta(); requestRender(); }
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    requestRenderRef.current = requestRender;
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", requestRender);
    canvas.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      disposed = true;
      mixer?.stopAllAction();
      observer.disconnect();
      environment.dispose();
      disposeObject(scene);
      cancelRender();
      window.clearTimeout(loadTimeout);
      requestRenderRef.current = () => {};
      gaitRef.current = () => {};
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", requestRender);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  const select = (id: string) => {
    setAutoRotate(false);
    activeRef.current = id;
    rotationRef.current.targetY = Math.round(rotationRef.current.y / (Math.PI * 2)) * Math.PI * 2;
    requestRenderRef.current();
    onSelectHotspot?.(id);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "pan-y" }}
      className={`relative h-full w-full cursor-grab select-none overflow-hidden bg-night active:cursor-grabbing ${className}`}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A rotatable 3D model of a black Marwari stallion. Choose a point to focus the camera on it."
        style={{ touchAction: "pan-y" }}
        className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Hotspot markers, projected from the skeleton every frame */}
      {isLoaded && (
        <ul aria-label="Points on the horse" className="pointer-events-none absolute inset-0 z-10">
          {points.map((p) => (
            <li key={p.id}>
              <button
                ref={(el) => { markerRefs.current[p.id] = el; }}
                type="button"
                onClick={() => select(p.id)}
                aria-pressed={p.id === activeId}
                aria-label={`${p.name}: ${p.title}`}
                style={{ visibility: "hidden" }}
                className="group pointer-events-auto absolute left-0 top-0 -ml-5 -mt-5 grid h-10 w-10 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <span className={cn("absolute h-4 w-4 rounded-full border border-gold animate-pulse-ring", p.id === activeId ? "opacity-100" : "opacity-50")} style={{ animationDuration: "1.4s" }} />
                <span className={cn("relative h-2.5 w-2.5 rounded-full transition-colors", p.id === activeId ? "bg-gold" : "bg-bone/70 group-hover:bg-gold")} />
                <span
                  className={cn(
                    "label pointer-events-none absolute top-9 whitespace-nowrap text-[0.6rem] transition-opacity",
                    p.id === activeId ? "text-gold opacity-100" : "text-sand opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                  )}
                >
                  {p.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Preloader */}
      <div
        role={isLoaded ? undefined : "status"}
        aria-hidden={isLoaded}
        className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-night transition-opacity duration-500 ${isLoaded ? "opacity-0" : "opacity-100"}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
          <p className="font-mono text-xs uppercase tracking-widest text-gold">Saddling the stallion</p>
          <span className="font-mono text-[0.65rem] text-sand/60">{loadingProgress}% loaded</span>
        </div>
      </div>

      {/* Plate markings */}
      <div aria-hidden className="pointer-events-none absolute inset-3 z-10 border border-line/40" />
      <div className="pointer-events-none absolute bottom-4 left-5 z-10 hidden items-center gap-2 sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-gold/90">
          3D Specimen · Marwari<span className="hidden sm:inline"> · 15 hh</span>
        </p>
      </div>

      {/* Gait */}
      <div role="group" aria-label="Gait" className="absolute bottom-4 left-4 z-20 flex sm:bottom-auto sm:top-4 items-center gap-1 rounded-full border border-line bg-night/80 p-1 backdrop-blur-md">
        {(["stand", "walk", "trot"] as const).map((g) => (
          <button
            key={g}
            type="button"
            disabled={!isLoaded || reducedMotion}
            aria-pressed={gait === g}
            onClick={() => setGait(g)}
            className={cn(
              "min-h-9 rounded-full px-3 font-mono text-[0.6rem] uppercase tracking-wider transition-colors disabled:opacity-50",
              gait === g ? "bg-gold text-night" : "text-sand hover:text-gold",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {/* View controls */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          disabled={!isLoaded || reducedMotion}
          aria-pressed={autoRotate && !reducedMotion}
          onClick={() => setAutoRotate((prev) => !prev)}
          className="min-h-11 rounded-full border border-gold/30 bg-night/70 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-sand backdrop-blur-md transition-colors hover:border-gold hover:text-gold"
        >
          {reducedMotion ? "Motion reduced" : autoRotate ? "Pause Orbit" : "Auto Orbit"}
        </button>
        <button
          type="button"
          onClick={() => {
            rotationRef.current.targetY = 0;
            activeRef.current = "overview";
            onSelectHotspot?.("overview");
            requestRenderRef.current();
          }}
          className="min-h-11 rounded-full border border-line bg-night/70 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-sand backdrop-blur-md transition-colors hover:text-bone"
        >
          Reset View
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-4 right-5 z-10 hidden sm:block">
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-sand/50">Drag to rotate · Choose a point to focus</span>
      </div>
    </div>
  );
}
