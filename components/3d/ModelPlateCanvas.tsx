"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  src: string;
  mode: "turn" | "sway";
  yaw: number;
  swing: number;
  fill: number;
  reduced: boolean;
  active: boolean;
  onReady: () => void;
  className?: string;
};

/** A soft studio room as the reflection source, built on the spot: no environment file is downloaded. */
function Studio() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      target.dispose();
      generator.dispose();
    };
  }, [get]);
  return null;
}

function Piece({ src, mode, yaw, swing, fill, reduced, onReady }: Omit<Props, "active" | "className">) {
  const { scene } = useGLTF(src, "/draco/");
  const viewport = useThree((s) => s.viewport);
  const invalidate = useThree((s) => s.invalidate);
  const dom = useThree((s) => s.gl.domElement);
  const spin = useRef<THREE.Group>(null);
  const dragged = useRef(0);
  const velocity = useRef(0);

  // The model re-centred on its own middle, so it turns about itself, with the measurements the fit needs.
  const { object, width, height } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    // A turning piece sweeps a circle; a swaying one is seen up to half a radian off front, and perspective enlarges its near edge.
    const around = mode === "turn" ? Math.hypot(size.x, size.z) : size.x * 1.12 + size.z * 0.7;
    return { object: clone, width: Math.max(around, 0.001), height: Math.max(size.y * (mode === "turn" ? 1 : 1.1), 0.001) };
  }, [scene, mode]);
  const scale = fill * Math.min(viewport.width / width, viewport.height / height);

  useEffect(() => {
    onReady();
    invalidate();
  }, [onReady, invalidate]);

  // Drag to turn: a mouse only. Touch is left to the page, which scrolls.
  useEffect(() => {
    let down = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      lastX = e.clientX;
      velocity.current = 0;
      dom.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
      dragged.current += dx;
      velocity.current = dx;
      invalidate();
    };
    const onUp = () => {
      down = false;
    };
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    return () => {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointercancel", onUp);
    };
  }, [dom, invalidate]);

  useFrame((state) => {
    const group = spin.current;
    if (!group) return;
    // The throw of a drag settles instead of stopping dead.
    if (Math.abs(velocity.current) > 0.0004) {
      dragged.current += velocity.current;
      velocity.current *= 0.93;
      if (reduced) invalidate();
    }
    const t = reduced ? 0 : state.clock.elapsedTime;
    const base = mode === "turn" ? t * 0.32 : Math.sin(t * 0.55) * swing;
    group.rotation.y = THREE.MathUtils.degToRad(yaw) + base + dragged.current;
  });

  return (
    <group scale={scale}>
      <group ref={spin}>
        <primitive object={object} />
      </group>
    </group>
  );
}

export function ModelPlateCanvas({ src, mode, yaw, swing, fill, reduced, active, onReady, className }: Props) {
  return (
    <Canvas
      className={className}
      frameloop={active ? (reduced ? "demand" : "always") : "never"}
      dpr={[1, 1.5]}
      style={{ touchAction: "pan-y" }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      camera={{ fov: 30, near: 0.1, far: 50, position: [0, 0, 7] }}
    >
      <ambientLight intensity={0.5} color="#d9c3a5" />
      <directionalLight position={[2.5, 3, 4]} intensity={2.6} color="#fff0db" />
      <directionalLight position={[-3, 1.5, -3]} intensity={1.8} color="#e8c898" />
      <directionalLight position={[0, -1.5, 3]} intensity={0.7} color="#b9c4d4" />
      <Studio />
      <Suspense fallback={null}>
        <Piece src={src} mode={mode} yaw={yaw} swing={swing} fill={fill} reduced={reduced} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
