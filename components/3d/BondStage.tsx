"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HERO_MODEL, addLights, createGaze, createTimer, daylight, disposeObject, loadMarwari, releaseRenderer, type Marwari } from "@/components/3d/marwari";
import { createStudioEnv } from "@/components/3d/studio";
import { asset } from "@/lib/content/asset";
import { cn } from "@/lib/utils";

const HAND_MODEL = asset("/models/bond-human-hand.glb");

/**
 * The bond (R01, 2 Nov 2026): the academy's canonical Marwari (marwari-hero.glb, the same horse as the home film and the ear study)
 * and a cadet's hand come in from opposite edges, stop, and meet. Replaces the single Tripo sculpt in which a grey horse's head was
 * cut off at the poll and fused with a hand. Beats, in seconds:
 *   0.0–2.6  the horse walks in from the left; the hand comes in from the right a little later and slower
 *   2.6–3.6  pause: both still, the horse's ears come forward onto the hand
 *   3.6–5.4  the horse lowers its head and reaches; the hand turns its palm and closes the last few centimetres
 *   5.4–     touch at the bridge of the nose, then breathing and blinking
 * It plays once when the scene is well in view; Replay runs it again. Reduced motion: the touch, held still.
 */
const T = { enter: 2.6, pause: 3.6, reach: 5.4 };
const ease = (x: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(x, 0, 1), 3);
const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Placement, found by rendering and adjusting (see the implementation log, R01). Model space: horse faces +Z, metres. */
export const BOND = {
  horseFrom: -1.1,
  /** the hand's resting place relative to the muzzle, in metres, and its orientation (Euler, radians) */
  hand: { x: 0.0, y: -0.02, z: 0.16, rx: 0, ry: -Math.PI / 2, rz: 0.95, scale: 1 },
  handFrom: 0.75,
  gazeReach: { yaw: 0, pitch: 0.32 },
  /** camera direction from the subject (x: horse's left, y: up, z: in front) and the share of the frame left free around it */
  camera: { side: -1, front: 0.38, up: 0.05, fov: 24, margin: 1.3, shiftX: 0.0 },
};

/** Soft edges where the neck leaves the stage: "bottom" when the stage runs off the page at the side, "both" when it sits in a column. */
const BOTTOM = "linear-gradient(to top, transparent 0, #000 22%)";
const LEFT = "linear-gradient(to right, transparent 0, #000 24%)";
const FADES: Record<"bottom" | "both", CSSProperties> = {
  bottom: { maskImage: BOTTOM, WebkitMaskImage: BOTTOM },
  both: { maskImage: `${LEFT}, ${BOTTOM}`, maskComposite: "intersect", WebkitMaskImage: `${LEFT}, ${BOTTOM}`, WebkitMaskComposite: "source-in" },
};

export function BondStage({ theme = "light", className, label, fade }: { theme?: "light" | "dark"; className?: string; label: string; fade?: "bottom" | "both" }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const replay = useRef<() => void>(() => {});
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setStatus("failed"));
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BOND.camera.fov, 1, 0.05, 30);
    const look = new THREE.Vector3();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);
    let env: THREE.WebGLRenderTarget | null = null;
    try { env = createStudioEnv(renderer); scene.environment = env.texture; scene.environmentIntensity = theme === "dark" ? 0.4 : 0.6; } catch { /* lights only */ }
    const light = daylight(theme === "dark" ? 18.4 : 8.5);
    const rig = addLights(scene);
    rig(light);
    renderer.toneMappingExposure = light.exposure * (theme === "dark" ? 0.9 : 1.05);

    let horse: Marwari | null = null;
    let hand: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let walk: THREE.AnimationAction | null = null;
    let gaze: ReturnType<typeof createGaze> | null = null;
    const muzzle = new THREE.Vector3();
    const timer = createTimer();
    let t = 0;
    let started = false;
    let raf = 0;
    let visible = false;
    const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      place();
    };
    /** Points the frame must hold (ear tips, poll, muzzle, the hand), measured once the models are in; the camera fits them at any aspect. */
    const frameBox: THREE.Vector3[] = [];
    const place = () => {
      if (!frameBox.length) return;
      const dir = new THREE.Vector3(BOND.camera.side, BOND.camera.up, BOND.camera.front).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(up, dir).normalize().negate();
      const camUp = new THREE.Vector3().crossVectors(dir, right).negate();
      const centre = frameBox.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / frameBox.length);
      let w = 0;
      let hgt = 0;
      for (const p of frameBox) {
        const d = p.clone().sub(centre);
        w = Math.max(w, Math.abs(d.dot(right)) * 2);
        hgt = Math.max(hgt, Math.abs(d.dot(camUp)) * 2);
      }
      const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
      const hf = Math.atan(Math.tan(vf) * camera.aspect);
      const dist = Math.max(hgt / (2 * Math.tan(vf)), w / (2 * Math.tan(hf))) * BOND.camera.margin;
      look.copy(centre).addScaledVector(right, -BOND.camera.shiftX * w);
      camera.position.copy(look).addScaledVector(dir, dist);
      camera.lookAt(look);
    };
    resize();
    const ro = new ResizeObserver(() => { resize(); kick(); });
    ro.observe(container);

    const pose = (time: number) => {
      if (!horse || !hand) return;
      // the horse walks in and stops
      const enter = ease(time / T.enter);
      horse.root.position.x = 0;
      horse.root.position.z = THREE.MathUtils.lerp(BOND.horseFrom, 0, enter);
      if (walk) walk.setEffectiveWeight(1 - smooth(T.enter - 0.8, T.enter, time));
      // reach: head lowers toward the hand
      const reach = smooth(T.pause, T.reach, time);
      gaze?.undo();
      mixer?.update(0);
      gaze?.apply(BOND.gazeReach.yaw * reach, BOND.gazeReach.pitch * reach);
      horse.root.updateMatrixWorld(true);
      // the hand comes in from the right, waits, then closes the last few centimetres as the horse reaches
      const handIn = ease((time - 0.4) / (T.enter + 0.2));
      const close = smooth(T.pause, T.reach, time);
      const head = horse.bones.Head;
      const nose = head ? head.localToWorld(muzzle.clone()) : new THREE.Vector3(0, 1.5, 1.3);
      const rest = new THREE.Vector3(nose.x + BOND.hand.x, nose.y + BOND.hand.y, nose.z + BOND.hand.z + 0.06 * (1 - close));
      hand.position.set(rest.x, rest.y, rest.z + BOND.handFrom * (1 - handIn));
      // the hand waits off the stage until the horse has started to walk in (no floating hand before the scene plays)
      hand.visible = time > 0.05 || !!still();
      hand.rotation.set(BOND.hand.rx, BOND.hand.ry, BOND.hand.rz + 0.25 * (1 - close));
    };

    const frame = () => {
      raf = 0;
      if (disposed || !horse) return;
      const dt = Math.min(0.05, timer.delta());
      const s = still();
      if (s) t = T.reach + 1;
      else if (started) t += dt;
      if (mixer && !s) { gaze?.undo(); mixer.update(dt); }
      pose(t);
      camera.lookAt(look);
      renderer.render(scene, camera);
      if (visible && !s) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    replay.current = () => { t = 0; started = true; setPlayed(true); kick(); };

    let ratio = 0;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      ratio = e.intersectionRatio;
      if (visible && ratio > 0.45 && !started && horse && hand) { started = true; setPlayed(true); }
      if (visible) { timer.delta(); kick(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: [0, 0.45] });
    io.observe(container);

    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    const gl = new GLTFLoader();
    gl.setDRACOLoader(draco);
    const handLoad = new Promise<THREE.Object3D>((resolve, reject) => gl.load(HAND_MODEL, (g) => resolve(g.scene), undefined, reject));
    const { promise, dispose: disposeLoader } = loadMarwari(HERO_MODEL);
    Promise.all([promise, handLoad]).then(([m, h]) => {
      if (disposed) { disposeObject(m.root); disposeObject(h); return; }
      horse = m;
      m.hair.sheen.value *= 0.4;
      scene.add(m.root);
      const handGroup = new THREE.Group();
      h.scale.multiplyScalar(BOND.hand.scale);
      handGroup.add(h);
      hand = handGroup;
      scene.add(handGroup);
      mixer = new THREE.AnimationMixer(m.root);
      for (const name of ["Idle_Breathing", "Blink", "Mane_Sway", "Tail_Sway"]) {
        const clip = m.clips.get(name);
        if (clip) mixer.clipAction(clip).play();
      }
      const walkClip = m.clips.get("Walk");
      if (walkClip) { walk = mixer.clipAction(walkClip); walk.play(); }
      gaze = createGaze(m);
      mixer.update(0);
      m.root.updateMatrixWorld(true);
      // the muzzle in the head bone's space (measured for this rig by the anatomy viewer)
      muzzle.copy(m.bones.Head.worldToLocal(m.root.localToWorld(new THREE.Vector3(0.016, 1.62, 1.27))));
      // camera: from the horse's right side and a little in front (the horse faces right), fitted to ears, muzzle and hand
      pose(T.reach + 1);
      const at = (b?: THREE.Object3D) => (b ? b.getWorldPosition(new THREE.Vector3()) : null);
      frameBox.length = 0;
      // the tip bones sit a little inside the ear tips, so the frame keeps a few centimetres of air above them
      const aboveEar = (b?: THREE.Object3D) => at(b)?.add(new THREE.Vector3(0, 0.08, 0)) ?? null;
      for (const p of [aboveEar(m.bones.Ear_Tip_L), aboveEar(m.bones.Ear_Tip_R), at(m.bones.Head), m.bones.Head.localToWorld(muzzle.clone()), at(m.bones.Neck_2), hand ? hand.position.clone().add(new THREE.Vector3(0, -0.05, 0.12)) : null]) if (p) frameBox.push(p);
      place();
      pose(0);
      setStatus("ready");
      // already well in view when the models arrive (the stage at the top of /curriculum): no further observer event will come
      if (visible && ratio > 0.45 && !started) { started = true; setPlayed(true); }
      if (process.env.NODE_ENV !== "production") (window as unknown as { __bond?: unknown }).__bond = { seek: (x: number) => { t = x; started = false; kick(); }, BOND, camera, look, place: () => { place(); kick(); } };
      kick();
    }).catch(() => { if (!disposed) setStatus("failed"); }).finally(() => { disposeLoader(); draco.dispose(); });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mixer?.stopAllAction();
      if (horse) disposeObject(horse.root);
      if (hand) disposeObject(hand);
      env?.dispose();
      renderer.domElement.remove();
      releaseRenderer(renderer);
    };
  }, [theme]);

  return (
    <div className={cn("relative", className)}>
      <div ref={host} role="img" aria-label={label} className="absolute inset-0" style={fade ? FADES[fade] : undefined} />
      {status !== "ready" && (
        <p className={cn("label absolute inset-0 grid place-items-center", theme === "dark" ? "text-sand" : "text-dust")} role="status">
          {status === "failed" ? "This scene needs WebGL." : "Loading…"}
        </p>
      )}
      {status === "ready" && played && (
        <button
          type="button"
          onClick={() => replay.current()}
          className={cn("label absolute bottom-4 right-4 min-h-11 border px-4 py-2 motion-reduce:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold", theme === "dark" ? "border-line text-sand hover:text-bone" : "border-line text-dust hover:text-bone")}
        >
          Replay
        </button>
      )}
    </div>
  );
}
