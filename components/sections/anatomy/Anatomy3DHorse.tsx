"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useReducedMotion } from "@/lib/motion/reduced";

interface Anatomy3DHorseProps {
  activeId: string;
  onSelectHotspot?: (id: string) => void;
  className?: string;
  onUnavailable: (message: string) => void;
}

// Camera framing targets for the 6 anatomical hotspots
const CAMERA_PRESETS: Record<string, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [2.6, 0.4, 3.4], look: [0, 0.1, 0] },
  ears: { pos: [1.3, 1.0, 1.8], look: [0.35, 0.75, 0.7] },
  neck: { pos: [1.6, 0.7, 2.1], look: [0.2, 0.5, 0.4] },
  saddle: { pos: [1.8, 0.5, 2.2], look: [0, 0.25, -0.05] },
  flank: { pos: [1.9, 0.2, 1.8], look: [-0.15, 0.05, -0.4] },
  mouth: { pos: [1.1, 0.65, 1.6], look: [0.3, 0.45, 0.85] },
  hoof: { pos: [1.6, -0.5, 2.3], look: [0.1, -0.7, 0.2] },
};

export function Anatomy3DHorse({ activeId, onSelectHotspot, onUnavailable, className = "" }: Anatomy3DHorseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const reducedMotion = useReducedMotion();
  const requestRenderRef = useRef<() => void>(() => {});
  const unavailableRef = useRef(onUnavailable);
  useEffect(() => { unavailableRef.current = onUnavailable; }, [onUnavailable]);
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    requestRenderRef.current();
  }, [autoRotate]);

  // Interaction refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ y: -0.65, targetY: -0.65, x: 0, targetX: 0 });
  const activePresetRef = useRef(CAMERA_PRESETS.overview);
  const lastActiveRef = useRef(activeId);

  // Update camera preset when activeId changes
  useEffect(() => {
    if (lastActiveRef.current === activeId) return;
    lastActiveRef.current = activeId;
    activePresetRef.current = CAMERA_PRESETS[activeId] || CAMERA_PRESETS.overview;
    requestRenderRef.current();
  }, [activeId]);

  // Pointer event handlers
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
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    rotationRef.current.targetY += deltaX * 0.007;
    rotationRef.current.targetX = Math.max(-0.35, Math.min(0.35, rotationRef.current.targetX + deltaY * 0.005));

    dragStartRef.current = { x: clientX, y: clientY };
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
    let loadSettled = false;
    let mixer: THREE.AnimationMixer | null = null;
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
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let modelGroup: THREE.Group | null = null;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x13110f);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    const initPreset = activePresetRef.current;
    camera.position.set(...initPreset.pos);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.65;
      renderer.shadowMap.enabled = false; // Baked contact disc avoids a shadow render pass.
      renderer.shadowMap.type = THREE.PCFShadowMap;
    } catch {
      renderer?.dispose();
      fail();
      return () => { disposed = true; };
    }

    const environmentRoom = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let environment: THREE.WebGLRenderTarget;
    try {
      environment = pmrem.fromScene(environmentRoom, 0.04);
    } catch {
      environmentRoom.dispose();
      pmrem.dispose();
      renderer.dispose();
      fail();
      return () => { disposed = true; };
    }
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.35;
    environmentRoom.dispose();
    pmrem.dispose();

    // =========================================================================
    // MULTI-ANGLE EQUESTRIAN STUDIO LIGHTING
    // Illuminates the Midnight Stallion so muscles, ears, coat, and sinew are visible
    // =========================================================================

    // 1. Luminous warm ambient light — lifts deep shadow areas across the entire anatomy
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.8);
    scene.add(ambientLight);

    // 2. High-intensity Key Light (Front-Right, 45 degrees)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.8);
    keyLight.position.set(3.6, 3.4, 3.2);
    keyLight.castShadow = false;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // 3. Front-Left Fill Light — ensures the left flank, shoulder, and face are bright
    const fillLight = new THREE.DirectionalLight(0xf5eedb, 2.8);
    fillLight.position.set(-3.4, 2.6, 2.8);
    scene.add(fillLight);

    // 6. Brilliant Rim Backlight (Upper Rear-Left) — chisels sharp equestrian silhouette
    const rimLight = new THREE.DirectionalLight(0xffeed4, 4.2);
    rimLight.position.set(-2.8, 3.8, -3.2);
    scene.add(rimLight);

    // Circular contact shadow disc
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext("2d");
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.75)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.3)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.85;
    scene.add(shadowMesh);

    // Model group
    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestRender();
      else cancelRender();
    });
    observer.observe(container);
    // Load compressed geometry and right-sized textures with local decoder.
    const loadingManager = new THREE.LoadingManager();
    const draco = new DRACOLoader(loadingManager);
    draco.setDecoderPath("/draco/");
    const loader = new GLTFLoader(loadingManager);
    loader.setDRACOLoader(draco);
    loader.load(
      "/models/marwari-animated-home.glb",
      (gltf) => {
        loadSettled = true;
        const root = gltf.scene;
        if (disposed || failed) { disposeScene(root); draco.dispose(); return; }
        window.clearTimeout(loadTimeout);

        // The supplied horse's long axis is X; existing hotspot cameras use +Z
        // for the head. Normalize orientation before computing its fitted bounds.
        root.rotation.y -= Math.PI / 2;

        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.9 / maxDim;

        root.scale.setScalar(targetScale);
        root.position.x = -center.x * targetScale;
        root.position.y = -center.y * targetScale;
        root.position.z = -center.z * targetScale;
        shadowMesh.position.y = -size.y * targetScale / 2 - 0.015;

        // Optimize materials for midnight black coat
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat) => {
                const stdMat = mat as THREE.MeshStandardMaterial;
                // Keep the supplied model visibly black while preserving its coat texture.
                if ("emissive" in stdMat) {
                  stdMat.emissive = new THREE.Color(0x080604);
                }
                stdMat.roughness = 0.48;
                stdMat.metalness = 0.08;
                stdMat.envMapIntensity = 0.85;
                stdMat.needsUpdate = true;
              });
            }
          }
        });

        modelGroup?.add(root);
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(root);
          const clip = THREE.AnimationClip.findByName(gltf.animations, "Idle_Breathing") ?? gltf.animations[0];
          mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
        }
        ready = true;
        setIsLoaded(true);
        requestRender();
      },
      (xhr) => {
        if (!disposed && !failed && xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      () => { loadSettled = true; draco.dispose(); fail(); }
    );

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
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

    // Current camera position for smooth lerp
    const currentCamPos = new THREE.Vector3(...initPreset.pos);
    const currentCamLook = new THREE.Vector3(...initPreset.look);

    const targetPos = new THREE.Vector3();
    const targetLook = new THREE.Vector3();
    const epsilon = 0.0001;

    function requestRender() {
      if (disposed || failed || !ready || !visible || document.hidden || animId !== null) return;
      animId = requestAnimationFrame(render);
    }

    function render() {
      animId = null;
      if (disposed || failed || !ready || !visible || document.hidden) return;
      const delta = Math.min(clock.getDelta(), .05);
      if (!motionQuery.matches) mixer?.update(delta);
      const rotation = rotationRef.current;
      const orbit = autoRotateRef.current && !motionQuery.matches && !isDraggingRef.current;
      if (orbit) rotation.targetY += 0.0015;
      // A still 3D view remains usable with reduced motion; user changes apply directly.
      const lerp = motionQuery.matches ? 1 : 0.08;
      rotation.y += (rotation.targetY - rotation.y) * lerp;
      rotation.x += (rotation.targetX - rotation.x) * lerp;
      modelGroup!.rotation.set(rotation.x, rotation.y, 0);
      targetPos.set(...activePresetRef.current.pos);
      targetLook.set(...activePresetRef.current.look);
      currentCamPos.lerp(targetPos, motionQuery.matches ? 1 : 0.06);
      currentCamLook.lerp(targetLook, motionQuery.matches ? 1 : 0.06);
      camera!.position.copy(currentCamPos);
      camera!.lookAt(currentCamLook);
      try {
        renderer!.render(scene!, camera!);
      } catch {
        fail();
        return;
      }
      const settling = Math.abs(rotation.targetY - rotation.y) > epsilon ||
        Math.abs(rotation.targetX - rotation.x) > epsilon ||
        currentCamPos.distanceToSquared(targetPos) > epsilon * epsilon ||
        currentCamLook.distanceToSquared(targetLook) > epsilon * epsilon;
      if (orbit || settling || (mixer && !motionQuery.matches)) requestRender();
    }

    const handleVisibility = () => {
      if (document.hidden) cancelRender();
      else requestRender();
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
      // Three's FileLoader shares in-flight requests by URL. Aborting on a Strict
      // Mode/Activity cleanup can also cancel the replacement viewer's request.
      // Let the request settle; its callback disposes the abandoned scene/decoder.
      if (loadSettled) draco.dispose();
      environment.dispose();
      if (scene) disposeScene(scene);
      cancelRender();
      window.clearTimeout(loadTimeout);
      requestRenderRef.current = () => {};
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", requestRender);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "pan-y" }}
      className={`relative w-full h-full bg-[#13110f] cursor-grab active:cursor-grabbing select-none overflow-hidden ${className}`}
    >
      {/* Real-time WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{ touchAction: "pan-y" }}
        className={`absolute inset-0 h-full w-full block transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Preloader Overlay */}
      <div
        role={isLoaded ? undefined : "status"}
        aria-hidden={isLoaded}
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#13110f] transition-opacity duration-500 pointer-events-none ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-gold">
Loading 3D Midnight Stallion
          </p>
          <span className="font-mono text-[0.65rem] text-sand/50">
{loadingProgress}% loaded
          </span>
        </div>
      </div>

      {/* Plate Markings / Museum HUD */}
      <div aria-hidden className="pointer-events-none absolute inset-3 border border-line/40 z-10" />
      <div className="pointer-events-none absolute bottom-4 left-5 z-10 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
        <p className="font-mono text-[0.62rem] tracking-[0.16em] uppercase text-gold/90">
          3D Specimen · Marwari<span className="hidden sm:inline"> · 15.2 hh</span>
        </p>
      </div>

      {/* Top Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          disabled={!isLoaded || reducedMotion}
          aria-pressed={autoRotate && !reducedMotion}
          onClick={() => setAutoRotate((prev) => !prev)}
          className="min-h-11 rounded-full border border-gold/30 bg-black/60 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-sand backdrop-blur-md transition-colors hover:border-gold hover:text-gold"
        >
          {reducedMotion ? "Motion reduced" : autoRotate ? "Pause Orbit" : "Auto Orbit"}
        </button>
        <button
          type="button"
          onClick={() => {
            activePresetRef.current = CAMERA_PRESETS.overview;
            rotationRef.current.targetY = -0.65;
            rotationRef.current.targetX = 0;
            requestRenderRef.current();
            if (onSelectHotspot) onSelectHotspot("overview");
          }}
          className="min-h-11 rounded-full border border-white/20 bg-black/60 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-sand/80 backdrop-blur-md transition-colors hover:border-white/50 hover:text-white"
        >
          Reset View
        </button>
      </div>

      {/* Drag Hint on Desktop */}
      <div className="pointer-events-none absolute bottom-4 right-5 z-10 hidden sm:block">
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-sand/40">
          Drag to Rotate 360° · Click Hotspots to Focus
        </span>
      </div>
    </div>
  );
}

function disposeScene(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    }
  });
  textures.forEach((texture) => texture.dispose());
}
