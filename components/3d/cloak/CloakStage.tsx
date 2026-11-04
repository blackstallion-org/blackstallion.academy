"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three/webgpu";
import type { WebGLRenderer } from "three";
import { createCloak, type Cloak } from "./cloak-material";
import { createStudioEnvironment } from "./studio-environment";
import { CloakEffects } from "./CloakEffects";

/**
 * The cloak scene: a Marwari stallion on a plinth whose coat dissolves into glass under the pointer. This is the
 * "Predator cloak" demo's scene (WebGPU renderer with TSL materials; the same renderer falls back to WebGL 2 where
 * WebGPU is missing) with the character swapped for the site's Marwari and the rainforest HDR for a built-in studio.
 */
export type CloakInput = {
  /** Pointer is over the horse. */
  hovered: boolean;
  /** Pointer or finger is held down on the stage. */
  holding: boolean;
  /** Pinned on by the button. */
  pinned: boolean;
};

type StageProps = {
  model: string;
  input: MutableRefObject<CloakInput>;
  quality: "high" | "low";
  reduced: boolean;
  visible: boolean;
  onReady: () => void;
  onProgress: (progress: number) => void;
  /** Pointer entered or left the horse. The parent owns the input ref, so it is the one that writes it. */
  onHover: (hovered: boolean) => void;
};

const HORSE_HEIGHT = 1.9;
const LIVING = ["Idle_Breathing", "Tail_Sway", "Blink", "Ear_Rotate"];

function isCoat(mesh: THREE.Mesh): boolean {
  const material = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
  if (Array.isArray(material)) return false;
  if (material.name === "Marwari_Coat") return true;
  // Not the supplied rig (no named coat): cloak every opaque textured surface except hair cards and eyes.
  return !!material.map && material.alphaTest === 0 && !/hair|eye/i.test(material.name);
}

function Stallion({ model, input, quality, reduced, onReady, onProgress }: Omit<StageProps, "visible" | "onHover">) {
  const gltf = useGLTF(model, "/draco/");
  const root = gltf.scene;
  const cloaks = useRef<Cloak[]>([]);
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(gltf.animations, root);

  // Fit: stand the horse on y = 0, centred, at a fixed height.
  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const scale = HORSE_HEIGHT / Math.max(size.y, 0.001);
    root.scale.setScalar(scale);
    const centre = box.getCenter(new THREE.Vector3());
    root.position.set(-centre.x * scale, -box.min.y * scale, -centre.z * scale);
  }, [root]);

  // Swap the coat for the cloak material; put everything back on unmount.
  useEffect(() => {
    const swapped: { mesh: THREE.Mesh; original: THREE.Material | THREE.Material[] }[] = [];
    const made: Cloak[] = [];
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !isCoat(mesh)) return;
      const cloak = createCloak(mesh.material as THREE.Material, { name: "Marwari-Cloak", quality, gridWidth: 40, gridHeight: 40 });
      swapped.push({ mesh, original: mesh.material });
      made.push(cloak);
      mesh.material = cloak.material;
      mesh.castShadow = true;
    });
    cloaks.current = made;
    onReady();
    return () => {
      swapped.forEach(({ mesh, original }) => (mesh.material = original));
      made.forEach((cloak) => cloak.dispose());
      cloaks.current = [];
    };
  }, [root, quality, onReady]);

  // Quiet life: breathing, a swishing tail, a blink. Still under reduced motion.
  useEffect(() => {
    if (reduced) return;
    const playing = LIVING.map((name) => actions[name]).filter((a): a is THREE.AnimationAction => !!a);
    playing.forEach((a) => a.reset().fadeIn(0.4).play());
    return () => playing.forEach((a) => a.fadeOut(0.2));
  }, [actions, reduced]);

  useFrame((_, dt) => {
    const { hovered, holding, pinned } = input.current;
    const active = hovered || holding || pinned;
    let progress = 0;
    for (const cloak of cloaks.current) {
      cloak.step(dt, active, reduced);
      progress = Math.max(progress, cloak.progress);
    }
    onProgress(progress);
  });

  return (
    <group ref={group}>
      <primitive object={root} />
    </group>
  );
}

/**
 * A ring of lit pointed-arch niches around the stage, drawn once into a small canvas. The glass needs something to
 * bend: against a black void a dissolved coat would be invisible, while the niches give it vertical edges and warm
 * light to refract (and the closed black coat a soft silhouette). Brand colours only: charcoal, leather, caramel.
 */
function archModule(): HTMLCanvasElement {
  const w = 256;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  g.fillStyle = "#14100d";
  g.fillRect(0, 0, w, h);
  const left = 34;
  const right = w - 34;
  const spring = 190;
  const niche = new Path2D();
  niche.moveTo(left, h);
  niche.lineTo(left, spring);
  niche.quadraticCurveTo(left, 70, w / 2, 24);
  niche.quadraticCurveTo(right, 70, right, spring);
  niche.lineTo(right, h);
  niche.closePath();
  const glow = g.createLinearGradient(0, 24, 0, h);
  glow.addColorStop(0, "#5b3b22");
  glow.addColorStop(0.55, "#b88a62");
  glow.addColorStop(1, "#6b4a30");
  g.fillStyle = glow;
  g.fill(niche);
  // A stone lattice (jali) in the upper half: thin dark bars that the glass will bend.
  g.save();
  g.clip(niche);
  g.strokeStyle = "rgba(20,16,13,0.85)";
  g.lineWidth = 3;
  for (let x = left; x <= right; x += 22) {
    g.beginPath();
    g.moveTo(x, 30);
    g.lineTo(x, 330);
    g.stroke();
  }
  for (let y = 60; y <= 330; y += 30) {
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(right, y);
    g.stroke();
  }
  g.restore();
  g.lineWidth = 6;
  g.strokeStyle = "#3a2a1d";
  g.stroke(niche);
  return canvas;
}

function Backdrop() {
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(archModule());
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(19, 1);
    t.anisotropy = 4;
    return t;
  }, []);
  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ map: texture, side: THREE.BackSide });
    m.color = new THREE.Color(0.5, 0.5, 0.5);
    return m;
  }, [texture]);
  useEffect(() => () => { texture.dispose(); material.dispose(); }, [texture, material]);
  return (
    <mesh position={[0, 2.7, 0]} material={material}>
      <cylinderGeometry args={[9, 9, 6.4, 72, 1, true]} />
    </mesh>
  );
}

function Plinth() {
  const stone = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: new THREE.Color("#241b15"), roughness: 0.62, metalness: 0.15 }), []);
  const brass = useMemo(() => new THREE.MeshBasicNodeMaterial({ color: new THREE.Color("#c9a66b") }), []);
  useEffect(() => () => { stone.dispose(); brass.dispose(); }, [stone, brass]);
  return (
    <group>
      <mesh position={[0, -0.06, 0]} receiveShadow material={stone}>
        <cylinderGeometry args={[1.2, 1.28, 0.12, 72]} />
      </mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={brass}>
        <ringGeometry args={[1.12, 1.14, 96]} />
      </mesh>
    </group>
  );
}

/** Lights, the studio environment and the gentle pointer-led camera. */
function Rig({ quality, reduced }: { quality: "high" | "low"; reduced: boolean }) {
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer;
  const get = useThree((s) => s.get);
  const sway = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const { scene } = get();
    const environment = createStudioEnvironment(gl);
    scene.environment = environment;
    scene.environmentIntensity = 0.95;
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, get]);

  useFrame(({ camera, pointer, size }, dt) => {
    const k = reduced ? 0 : 1;
    // Wide screens keep the caption in the lower left: the stage is nudged right so the plinth stays clear of it.
    const shift = size.width / Math.max(1, size.height) > 1.3 ? -0.22 : 0;
    sway.current.x = THREE.MathUtils.damp(sway.current.x, pointer.x * k, 3, dt);
    sway.current.y = THREE.MathUtils.damp(sway.current.y, pointer.y * k, 3, dt);
    // Narrow (portrait) stages stand further back so the whole horse fits across the width.
    const aspect = size.width / Math.max(1, size.height);
    const radius = Math.min(6.8, Math.max(5.3, 3.7 / aspect));
    const azimuth = 0.62 + sway.current.x * 0.45;
    const polar = Math.PI / 2 - 0.1 - sway.current.y * 0.18;
    camera.position.set(
      Math.sin(azimuth) * Math.sin(polar) * radius,
      0.95 + Math.cos(polar) * radius,
      Math.cos(azimuth) * Math.sin(polar) * radius,
    );
    // On a portrait stage the caption covers the lower part, so the scene is lifted a little.
    camera.lookAt(shift, aspect < 1 ? 0.5 : 0.92, 0);
  });

  return (
    <>
      <directionalLight position={[-3.2, 3.6, 4.2]} intensity={4.2} color="#ffe0b8" castShadow={quality === "high"} shadow-mapSize={[1024, 1024]} shadow-bias={-0.001} shadow-normalBias={0.03} />
      <directionalLight position={[3.6, 2.4, -3.4]} intensity={2.2} color="#bcd0ff" />
    </>
  );
}

export default function CloakStage({ model, input, quality, reduced, visible, onReady, onProgress, onHover }: StageProps) {
  const dpr: [number, number] = quality === "high" ? [1, 1.5] : [1, 1];
  return (
    <Canvas
      shadows={quality === "high"}
      dpr={dpr}
      frameloop={visible ? "always" : "never"}
      camera={{ position: [2.8, 1.3, 3.6], fov: 35, near: 0.1, far: 40 }}
      gl={async (props) => {
        extend(THREE as unknown as Parameters<typeof extend>[0]);
        const renderer = new THREE.WebGPURenderer({ ...(props as object), antialias: true } as ConstructorParameters<typeof THREE.WebGPURenderer>[0]);
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 0.78;
        await renderer.init();
        return renderer as unknown as WebGLRenderer;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <color attach="background" args={["#171513"]} />
      <Suspense fallback={null}>
        <Stallion model={model} input={input} quality={quality} reduced={reduced} onReady={onReady} onProgress={onProgress} />
        <Backdrop />
        <Plinth />
        <Rig quality={quality} reduced={reduced} />
        <HitProxy onHover={onHover} />
      </Suspense>
      {quality === "high" ? <CloakEffects /> : null}
    </Canvas>
  );
}

/** An invisible volume around the horse that catches the pointer (the demo's "hit target"). */
function HitProxy({ onHover }: { onHover: (hovered: boolean) => void }) {
  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial();
    m.transparent = true;
    m.opacity = 0;
    m.depthWrite = false;
    return m;
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh
      position={[0, HORSE_HEIGHT * 0.5, 0]}
      scale={[1.1, HORSE_HEIGHT * 0.55, 1.9]}
      material={material}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.cursor = "";
      }}
    >
      <sphereGeometry args={[1, 16, 16]} />
    </mesh>
  );
}
