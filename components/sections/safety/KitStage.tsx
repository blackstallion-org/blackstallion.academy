"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ModelBoundary } from "@/components/three/ModelBoundary";
import { useReducedMotion } from "@/lib/motion/reduced";
import { asset } from "@/lib/content/asset";

/** The pieces in the order they are shown; each is a named node of tack-parts.glb (see SafetyKitScroll for the copy). */
const NODES = ["helmet", "bridle", "saddle", "stirrups", "whip", "gloves", "boots"] as const;
const TACK_URL = asset("/models/tack-parts.glb");
/** Brightness of the piece in focus, and of the pieces already shown but not in focus. */
const LIT = 1;
const DIM = 0.22;
/** The camera looks at each piece from the front, a little from above. */
const VIEW_DIR = new THREE.Vector3(0.18, 0.22, 1).normalize();

function Kit({ activeRef }: { activeRef: RefObject<number> }) {
  const { scene } = useGLTF(TACK_URL, "/draco/");
  const gl = useThree((s) => s.gl);
  const threeScene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const reduced = useReducedMotion();

  // A private copy of the kit (its own materials, so dimming one piece leaves the others alone), centred on the origin.
  const root = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh) o.material = (o.material as THREE.Material).clone();
    });
    const box = new THREE.Box3().setFromObject(clone);
    clone.position.sub(box.getCenter(new THREE.Vector3()));
    const wrap = new THREE.Group();
    wrap.add(clone);
    wrap.updateMatrixWorld(true);
    return wrap;
  }, [scene]);

  // Where each piece sits and how far the camera must stand to frame it.
  const parts = useMemo(
    () =>
      NODES.map((name) => {
        const node = root.getObjectByName(name);
        if (!node) return null;
        const box = new THREE.Box3().setFromObject(node);
        const size = box.getSize(new THREE.Vector3());
        const meshes: THREE.Mesh[] = [];
        node.traverse((o) => {
          if (o instanceof THREE.Mesh) meshes.push(o);
        });
        return {
          node,
          meshes,
          center: box.getCenter(new THREE.Vector3()),
          dist: THREE.MathUtils.clamp(Math.max(size.x, size.y, size.z) * 2.1, 0.8, 3),
        };
      }),
    [root],
  );

  // Studio reflections from a room built on the spot (no file to download), as the kit's metal needs.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    // eslint-disable-next-line react-hooks/immutability -- a three.js scene is a mutable object owned by the canvas, set up and torn down here
    threeScene.environment = env;
    return () => {
      // eslint-disable-next-line react-hooks/immutability -- as above
      threeScene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, threeScene]);

  const brightness = useRef(NODES.map(() => DIM));
  const look = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3());
  const started = useRef(false);

  useFrame(() => {
    const i = Math.min(NODES.length - 1, Math.max(0, activeRef.current ?? 0));
    const ease = reduced ? 1 : 0.09;

    parts.forEach((p, n) => {
      if (!p) return;
      p.node.visible = n <= i;
      const target = n === i ? LIT : DIM;
      brightness.current[n] += (target - brightness.current[n]) * ease;
      for (const m of p.meshes) (m.material as THREE.MeshStandardMaterial).color.setScalar(brightness.current[n]);
    });

    const focus = parts[i];
    if (!focus) return;
    const goalLook = focus.center;
    const goalPos = focus.center.clone().addScaledVector(VIEW_DIR, focus.dist);
    if (!started.current) {
      look.current.copy(goalLook);
      pos.current.copy(goalPos);
      started.current = true;
    }
    look.current.lerp(goalLook, ease);
    pos.current.lerp(goalPos, ease);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });

  return <primitive object={root} />;
}

/** The kit's WebGL stage. Mounted only near the viewport (see SafetyKitScroll); pixel ratio capped at 1.5 on phones. */
export function KitStage({ activeRef }: { activeRef: RefObject<number> }) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
  return (
    <Canvas
      dpr={[1, maxDpr]}
      frameloop="always"
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ touchAction: "pan-y" }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.2, 2]} fov={32} near={0.05} far={50} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[-3, 4, 3]} intensity={1.4} color="#fff0db" />
      <directionalLight position={[4, 2, -3]} intensity={0.9} color="#e8c898" />
      <ModelBoundary>
        <Suspense fallback={null}>
          <Kit activeRef={activeRef} />
        </Suspense>
      </ModelBoundary>
    </Canvas>
  );
}
