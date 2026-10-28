"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import * as THREE from "three";
import { groundPatch } from "@/components/3d/contact";
import { ANATOMY_MODEL, addLights, createTimer, daylight, disposeObject, loadMarwari, releaseRenderer, type Marwari } from "@/components/3d/marwari";
import { createStudioEnv } from "@/components/3d/studio";
import { createBackdrop, createStudioFloor, type StudioFloor } from "@/components/3d/studio-floor";
import { detectQualityTier } from "@/lib/3d/device-tier";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Point = { id: string; name: string; title: string };

interface Anatomy3DHorseProps {
  activeId: string;
  /** Changes on every selection (also of the current point), so the camera refocuses; 0 = still on the overview. */
  focusKey: number;
  /** The hotspots to mark on the horse (the plate's points). */
  points: Point[];
  onSelectHotspot?: (id: string) => void;
  /**
   * The detail panel for the chosen point. When given (even as an empty fragment) a slot is laid over the canvas on large
   * screens and in full screen, and the camera shifts the focused part clear of it; below `lg` the caller shows the detail itself.
   */
  detail?: ReactNode;
  className?: string;
  onUnavailable: (message: string) => void;
}

type Gait = "stand" | "walk" | "trot";

const motionQuery_reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    // the fetlock sits at the head of the pastern bone, the hoof at the coronet below it
    spheres: (b) => ["F_L", "F_R", "B_L", "B_R"].map((n) => ({ center: b(`Pastern_${n}`).lerp(b(`Hoof_${n}`), 0.5), radius: 0.19 })),
    view: [1, 0.25, 0.55],
    distance: 3.5,
  },
};
const FOV = 34;
/** The overview looks at the horse's left side, a little from the front, from just above the floor, as a studio photograph would. */
const OVERVIEW = { focus: new THREE.Vector3(0, 0.96, 0.2), view: new THREE.Vector3(1, 0.14, 0.6).normalize() };
/**
 * How far the camera stands for the whole horse (its length in profile, its height with the ears) to fit the plate, whatever its
 * shape: a wide plate is limited by the height, a phone's nearly square one by the length.
 */
function overviewDistance(aspect: number) {
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return Math.max(1.5 / tanHalf, 1.5 / (tanHalf * Math.max(aspect, 0.1)));
}
/** On its own the horse turns back and forth through this angle (radians) once every 2π / SWAY_RATE seconds, so the side that reads best stays toward the visitor. */
const SWAY = 0.27;
const SWAY_RATE = 0.33;

/** World position of a joint; "Muzzle" is the corner of the mouth, where the bit sits. */
type Bones = (name: string) => THREE.Vector3;
/** The mouth corner in the rest pose (model space, from the Blender build), carried by the Head bone. */
const MUZZLE_REST = new THREE.Vector3(0.016, 1.62, 1.27);

export function Anatomy3DHorse({ activeId, focusKey, points, onSelectHotspot, detail, onUnavailable, className = "" }: Anatomy3DHorseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const detailRef = useRef<HTMLDivElement>(null);

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
  const attentionRef = useRef<() => void>(() => {});
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
    if (!motionQuery_reduced()) {
      if (activeId === "ears") attentionRef.current();
      if (activeId === "hoof") queueMicrotask(() => setGait("walk"));
    }
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
    const clock = createTimer();
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
    const tokens = getComputedStyle(container);
    const night = new THREE.Color(tokens.getPropertyValue("--color-night").trim() || "#171513");
    const warm = new THREE.Color(tokens.getPropertyValue("--color-brass").trim() || "#B88A62");
    const backdrop = createBackdrop(night, warm);
    scene.background = backdrop;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 60);

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

    let environment: THREE.WebGLRenderTarget;
    try {
      environment = createStudioEnv(renderer);
    } catch {
      renderer.dispose();
      fail();
      return () => { disposed = true; };
    }
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.75;
    // A museum plate keeps one studio light (midday's colours) rather than the visitor's clock, set low-key: a modest key so the
    // face reads, no flat fill, and strong edge lights from behind on both sides that draw the crest, croup and legs of a black coat.
    const noon = daylight(12);
    const rig = addLights(scene);
    rig(noon);
    const [key, rim, fill, sky] = rig.lights as THREE.Light[];
    key.intensity *= 0.42;
    fill.intensity *= 0.2;
    sky.intensity *= 0.2;
    rim.intensity *= 1.5;
    const rimNear = new THREE.DirectionalLight(noon.rim, noon.rimK);
    rimNear.position.set(3, 3.2, -4.2); // behind and to the horse's left, the side the camera sees
    scene.add(rimNear);
    renderer.toneMappingExposure = noon.exposure * 0.95;
    scene.add(groundPatch());
    // Phones and tablets keep the soft contact shadow only; anything stronger also gets the glossy floor.
    let floor: StudioFloor | null = null;
    if (detectQualityTier() === "high") {
      floor = createStudioFloor(width, height);
      scene.add(floor.mesh);
    }

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { clock.delta(); requestRender(); }
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
      if (id === "hoof") focus.y = 0.4;
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
        scene.add(m.contacts.group);
        // Seen from the side the tail would read as one stiff plank, since only a few bones drive it: a livelier flutter per ribbon breaks it up.
        m.hair.wind.value.set(0.045, 0, -0.03);
        m.hair.sheen.value *= 0.5; // the edge lights would otherwise turn the near edge of each ribbon pale
        m.root.updateMatrixWorld(true);
        muzzleLocal = m.bones.Head?.worldToLocal(MUZZLE_REST.clone()) ?? null;
        mixer = new THREE.AnimationMixer(m.root);
        for (const name of ["Idle_Breathing", "Tail_Sway", "Ear_Rotate", "Mane_Sway", "Walk", "Trot", "Blink", "Attention_Response"]) {
          const clip = m.clips.get(name);
          if (clip) actions[name] = mixer.clipAction(clip);
        }
        actions.Blink?.setLoop(THREE.LoopOnce, 1);
        actions.Attention_Response?.setLoop(THREE.LoopOnce, 1);
        applyGait("stand", 0);
        mixer.update(0);
        ready = true;
        setIsLoaded(true);
        requestRender();
      })
      .catch(fail)
      .finally(disposeLoader);

    const GAITS: Record<Gait, string[]> = {
      stand: ["Idle_Breathing", "Tail_Sway", "Ear_Rotate", "Mane_Sway"],
      walk: ["Walk", "Idle_Breathing", "Mane_Sway"],
      trot: ["Trot", "Mane_Sway"],
    };
    function applyGait(g: Gait, fade = 0.6) {
      if (!mixer) return;
      const on = new Set(GAITS[g]);
      for (const name of ["Idle_Breathing", "Tail_Sway", "Ear_Rotate", "Mane_Sway", "Walk", "Trot"]) {
        const a = actions[name];
        if (!a) continue;
        if (on.has(name)) {
          if (!a.isRunning()) a.reset().setEffectiveWeight(1).fadeIn(fade).play();
        } else if (a.isRunning()) a.fadeOut(fade);
      }
      requestRender();
    }
    gaitRef.current = (g) => applyGait(g);
    attentionRef.current = () => {
      if (actions.Attention_Response) actions.Attention_Response.reset().play();
      requestRender();
    };

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      floor?.resize(w, h);
      requestRender();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const camPos = new THREE.Vector3().copy(OVERVIEW.focus).addScaledVector(OVERVIEW.view, overviewDistance(width / height));
    const camLook = OVERVIEW.focus.clone();
    const targetPos = new THREE.Vector3();
    const targetLook = new THREE.Vector3();
    let glow = 0;
    const epsilon = 0.0001;
    // The detail panel covers part of the canvas; the view slides so the chosen part sits in the clear area.
    const shift = new THREE.Vector2();
    const shiftTarget = new THREE.Vector2();

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
      const delta = Math.min(clock.delta(), 0.05);
      if (!still && mixer) {
        mixer.update(delta);
        const t = clock.elapsed;
        if (t > blinkAt && actions.Blink) {
          actions.Blink.reset().play();
          blinkAt = t + 3 + Math.random() * 4;
        }
      }
      const rotation = rotationRef.current;
      const orbit = autoRotateRef.current && !still && !isDraggingRef.current && activeRef.current === "overview";
      if (orbit) rotation.targetY = SWAY * Math.sin(clock.elapsed * SWAY_RATE);
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
        targetPos.copy(OVERVIEW.focus).addScaledVector(OVERVIEW.view, overviewDistance(camera.aspect));
      }
      shiftTarget.set(0, 0);
      const slot = detailRef.current;
      if (region && slot?.offsetParent) {
        const w = container!.clientWidth;
        const h = container!.clientHeight;
        // wide slot = a bottom sheet (full screen on a phone); narrow slot = a side panel
        if (slot.offsetWidth > w * 0.8) shiftTarget.y = h * 0.2;
        else shiftTarget.x = (slot.offsetWidth + 16) / 2;
      }
      shift.lerp(shiftTarget, still ? 1 : 0.06);
      if (shift.lengthSq() > 0.25) camera.setViewOffset(container!.clientWidth, container!.clientHeight, shift.x, shift.y, container!.clientWidth, container!.clientHeight);
      else if (camera.view?.enabled) camera.clearViewOffset();
      const glowTarget = region ? 1 : 0;
      glow += (glowTarget - glow) * (still ? 1 : 0.08);
      if (marwari) marwari.highlight.strength.value = glow * (0.75 + 0.25 * Math.sin(clock.elapsed * 2.4) * (still ? 0 : 1));
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
        shift.distanceToSquared(shiftTarget) > 0.01 ||
        Math.abs(glowTarget - glow) > 0.002;
      if (orbit || settling || (mixer && !still)) requestRender();
    }

    const handleVisibility = () => {
      if (document.hidden) cancelRender();
      else { clock.delta(); requestRender(); }
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
      floor?.dispose();
      backdrop.dispose();
      disposeObject(scene);
      cancelRender();
      window.clearTimeout(loadTimeout);
      requestRenderRef.current = () => {};
      gaitRef.current = () => {};
      attentionRef.current = () => {};
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", requestRender);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      releaseRenderer(renderer);
    };
  }, []);

  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void containerRef.current?.requestFullscreen?.().catch(() => {});
  };

  const reset = () => {
    rotationRef.current.targetY = 0;
    activeRef.current = "overview";
    onSelectHotspot?.("overview");
    requestRenderRef.current();
  };

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
      onKeyDown={(e) => {
        if (e.key === "Escape" && activeId !== "overview") reset();
      }}
      data-fullscreen={fullscreen ? "" : undefined}
      style={{ touchAction: "pan-y" }}
      className={`group/plate relative h-full w-full cursor-grab select-none overflow-hidden bg-night active:cursor-grabbing ${className}`}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A rotatable 3D model of a black Marwari stallion. Choose a point to focus the camera on it."
        style={{ touchAction: "pan-y" }}
        className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Hotspot markers, projected from the skeleton every frame. Above the view controls (z-20) so a marker that lands under one stays tappable; below the detail panel (z-30). */}
      {isLoaded && (
        <ul aria-label="Points on the horse" className="pointer-events-none absolute inset-0 z-[25]">
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
                {p.id === activeId && (
                  <motion.span
                    aria-hidden
                    className="absolute h-8 w-8 rounded-full border border-gold/80"
                    initial={reducedMotion ? false : { scale: 0.45, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: ease.citadel }}
                  />
                )}
                <span className={cn("relative h-2.5 w-2.5 rounded-full transition-colors", p.id === activeId ? "bg-gold" : "bg-bone/70 group-hover:bg-gold")} />
                <span
                  className={cn(
                    "label pointer-events-none absolute top-9 whitespace-nowrap text-[0.6rem] transition-opacity [text-shadow:0_0_6px_var(--color-night),0_0_2px_var(--color-night)]",
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
      <div className={cn("pointer-events-none absolute bottom-4 left-5 z-10 hidden items-center gap-2 transition-opacity", activeId === "overview" && "sm:flex")}>
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
          onClick={reset}
          className="min-h-11 rounded-full border border-line bg-night/70 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-sand backdrop-blur-md transition-colors hover:text-bone"
        >
          Reset View
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-pressed={fullscreen}
          className="min-h-11 rounded-full border border-line bg-night/70 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-sand backdrop-blur-md transition-colors hover:text-bone"
        >
          {fullscreen ? "Exit Full Screen" : "Full Screen"}
        </button>
      </div>

      {activeId === "overview" && (
        <div className="pointer-events-none absolute bottom-4 right-5 z-10 hidden sm:block">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-sand/50">Drag to rotate · Choose a point to focus</span>
        </div>
      )}

      {/* Detail slot: a side panel from lg up, a bottom sheet in full screen on small screens; below lg the caller shows the detail under the plate */}
      {detail !== undefined && (
        <div
          ref={detailRef}
          className="pointer-events-none absolute inset-x-3 bottom-[4.75rem] z-30 hidden max-h-[48%] flex-col justify-end group-data-[fullscreen]/plate:flex sm:bottom-3 lg:inset-x-auto lg:bottom-4 lg:right-4 lg:flex lg:max-h-[calc(100%-5.5rem)] lg:w-[21rem] xl:w-[23rem]"
        >
          {detail}
        </div>
      )}
    </div>
  );
}
