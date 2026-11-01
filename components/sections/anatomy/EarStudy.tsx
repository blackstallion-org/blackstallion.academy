"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HERO_MODEL, addLights, createTimer, daylight, disposeObject, loadMarwari, releaseRenderer, type Marwari } from "@/components/3d/marwari";
import { createStudioEnv } from "@/components/3d/studio";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";

/**
 * The ear study (2 Nov 2026, R12): the academy's canonical rigged Marwari (marwari-hero.glb, the horse of the home film), framed on
 * the head. Each ear is its own bone and turns about its own long axis, the way a horse swivels the opening of the ear toward a sound;
 * the clip `Ear_Rotate` in the model uses the same axis (+Y on the left ear, -Y on the right). The visitor chooses what the horse is
 * listening to (buttons, so keyboard and touch work), or, with a mouse, moves the pointer around the head as a sound source.
 * Small idle flicks keep the ears alive. Reduced motion: no idle flicks or breathing; a choice moves the ears straight to their pose.
 *
 * Copy stays with what is observable: each ear turns on its own. No angles or ranges are claimed.
 */

type Source = "ahead" | "left" | "behind" | "split";
const SOURCES: { id: Source; label: string; line: string }[] = [
  { id: "ahead", label: "Ahead", line: "Both ears forward: something in front has its full attention." },
  { id: "left", label: "To the left", line: "The left ear turns to the instructor's voice; the right stays on the path ahead." },
  { id: "behind", label: "The rider", line: "Both ears swivel back toward the rider in the saddle." },
  { id: "split", label: "Two at once", line: "One ear forward, one back: it listens to two things at the same time." },
];
/** Ear turn per source, 0 = forward, 1 = fully swivelled out and back. [left, right] */
const POSE: Record<Source, [number, number]> = { ahead: [0, 0], left: [0.85, 0.08], behind: [0.75, 0.75], split: [0.05, 0.85] };
/** Largest swivel in radians (within what the model's own Ear_Rotate clip already does, plus a margin). */
const MAX_TURN = 1.2;
const AXIS_L = new THREE.Vector3(0, 1, 0);
const AXIS_R = new THREE.Vector3(0, -1, 0);
/** The sculpt hooks its ear tips inward more than a living Marwari: ease the tip bones out (radians about local X and Z). */
const TIP = { x: 0, z: -0.3 }; // compared at 0, ±0.35 on each axis (docs/claude-site-brief-2026-11-02/IMPLEMENTATION_LOG.md, R12)
/** Camera direction from the head (x: toward the horse's left, y: up, z: in front) and how much room around it. */
const VIEW = { x: 0.42, y: 0.08, fit: 1.3 };

export function EarStudy({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<Source>("ahead");
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const reduced = useReducedMotion();
  const target = useRef<[number, number]>(POSE.ahead);
  const pointer = useRef<{ x: number; y: number; at: number } | null>(null);
  const kick = useRef<() => void>(() => {});

  useEffect(() => { target.current = POSE[source]; pointer.current = null; kick.current(); }, [source]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setStatus("failed")); // not synchronously inside the effect
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.05, 20);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");

    let env: THREE.WebGLRenderTarget | null = null;
    try { env = createStudioEnv(renderer); scene.environment = env.texture; scene.environmentIntensity = 0.45; } catch { /* lights alone */ }
    const light = daylight(17.2); // late-afternoon gold on the rim, a near-white key: the hour of the ear still on /legend
    const rig = addLights(scene);
    rig(light);
    renderer.toneMappingExposure = light.exposure;

    let horse: Marwari | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    const turn: [number, number] = [0, 0];
    const flick: [number, number] = [0, 0];
    let nextFlick = 2;
    const q = new THREE.Quaternion();
    const timer = createTimer();
    let raf = 0;
    let visible = true;
    let lookAt = new THREE.Vector3();

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(() => { resize(); kick.current(); });
    ro.observe(container);

    const frame = () => {
      raf = 0;
      if (disposed || !horse) return;
      const dt = Math.min(0.05, timer.delta());
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (mixer && !still) mixer.update(dt);
      // where the ears want to be: the chosen source, or the pointer as a moving sound source
      let want: [number, number] = target.current;
      const p = pointer.current;
      if (p && performance.now() - p.at < 4000) {
        // pointer left of the head (x < 0) pulls the horse's left ear out; behind the head (y high) pulls both back
        const left = THREE.MathUtils.clamp(-p.x * 1.2, 0, 1);
        const right = THREE.MathUtils.clamp(p.x * 1.2, 0, 1);
        const back = THREE.MathUtils.clamp(p.y * 0.6, 0, 0.6);
        want = [Math.max(left, back), Math.max(right, back)];
      }
      if (!still) {
        nextFlick -= dt;
        if (nextFlick <= 0) {
          const side = Math.random() < 0.5 ? 0 : 1;
          flick[side] = (Math.random() * 0.25 + 0.1) * (Math.random() < 0.5 ? 1 : -1);
          nextFlick = 2.5 + Math.random() * 3.5;
        }
        for (const i of [0, 1] as const) {
          flick[i] *= Math.pow(0.08, dt); // a flick decays in about a second
          turn[i] += (want[i] - turn[i]) * (1 - Math.pow(0.002, dt)); // ears move quickly but not instantly
        }
      } else {
        turn[0] = want[0];
        turn[1] = want[1];
      }
      const L = horse.bones.Ear_L;
      const R = horse.bones.Ear_R;
      if (L) L.quaternion.multiply(q.setFromAxisAngle(AXIS_L, THREE.MathUtils.clamp(turn[0] + flick[0], -0.2, 1) * MAX_TURN));
      if (R) R.quaternion.multiply(q.setFromAxisAngle(AXIS_R, THREE.MathUtils.clamp(turn[1] + flick[1], -0.2, 1) * MAX_TURN));
      const TL = horse.bones.Ear_Tip_L;
      const TR = horse.bones.Ear_Tip_R;
      const tipL = new THREE.Quaternion().setFromEuler(new THREE.Euler(TIP.x, 0, TIP.z));
      const tipR = new THREE.Quaternion().setFromEuler(new THREE.Euler(TIP.x, 0, -TIP.z));
      if (TL) TL.quaternion.multiply(tipL);
      if (TR) TR.quaternion.multiply(tipR);
      horse.root.updateMatrixWorld(true);
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      if (TL) TL.quaternion.multiply(tipL.invert());
      if (TR) TR.quaternion.multiply(tipR.invert());
      // undo this frame's ear turn so the next mixer update starts from the clip pose (no accumulation)
      if (L) L.quaternion.multiply(q.setFromAxisAngle(AXIS_L, -THREE.MathUtils.clamp(turn[0] + flick[0], -0.2, 1) * MAX_TURN));
      if (R) R.quaternion.multiply(q.setFromAxisAngle(AXIS_R, -THREE.MathUtils.clamp(turn[1] + flick[1], -0.2, 1) * MAX_TURN));
      const settling = Math.abs(want[0] - turn[0]) + Math.abs(want[1] - turn[1]) > 0.002;
      if (visible && (!still || settling)) raf = requestAnimationFrame(frame);
    };
    kick.current = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { timer.delta(); kick.current(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } });
    io.observe(container);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = container.getBoundingClientRect();
      pointer.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1, at: performance.now() };
      kick.current();
    };
    container.addEventListener("pointermove", onMove);

    const { promise, dispose: disposeLoader } = loadMarwari(HERO_MODEL);
    promise.then((m) => {
      if (disposed) return disposeObject(m.root);
      horse = m;
      scene.add(m.root);
      // A close-up of the face: the rim would turn the forelock and the crest pale, so the hair keeps a quieter sheen here.
      m.hair.sheen.value *= 0.3;
      mixer = new THREE.AnimationMixer(m.root);
      for (const name of ["Idle_Breathing", "Blink", "Mane_Sway"]) {
        const clip = m.clips.get(name);
        if (clip) mixer.clipAction(clip).play().setEffectiveWeight(name === "Mane_Sway" ? 0.5 : 1);
      }
      mixer.update(0);
      m.root.updateMatrixWorld(true);
      // frame the whole head (muzzle to ear tips): three-quarter front from the horse's left, at eye level
      const head = m.bones.Head.getWorldPosition(new THREE.Vector3());
      const tipL = m.bones.Ear_Tip_L?.getWorldPosition(new THREE.Vector3()) ?? head;
      const tipR = m.bones.Ear_Tip_R?.getWorldPosition(new THREE.Vector3()) ?? head;
      const ears = tipL.clone().add(tipR).multiplyScalar(0.5);
      // The muzzle in model space, as measured for the same rig by the anatomy viewer (Anatomy3DHorse MUZZLE_REST).
      let muzzle = m.root.localToWorld(new THREE.Vector3(0.016, 1.62, 1.27));
      if (muzzle.distanceTo(head) > 1.2 || muzzle.distanceTo(head) < 0.2) muzzle = head.clone().add(new THREE.Vector3(0, -0.35, 0.45));
      lookAt = ears.clone().lerp(muzzle, 0.4);
      const span = ears.distanceTo(muzzle);
      const dist = (span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * VIEW.fit;
      camera.position.copy(lookAt).add(new THREE.Vector3(VIEW.x, VIEW.y, 1).normalize().multiplyScalar(dist));
      camera.lookAt(lookAt);
      setStatus("ready");
      timer.delta();
      kick.current();
      if (process.env.NODE_ENV !== "production") (window as unknown as { __earStudy?: unknown }).__earStudy = {
        setPose: (l: number, r: number) => { target.current = [l, r]; kick.current(); },
        setTip: (x: number, z: number) => { TIP.x = x; TIP.z = z; kick.current(); },
      };
    }).catch(() => { if (!disposed) setStatus("failed"); }).finally(disposeLoader);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      container.removeEventListener("pointermove", onMove);
      mixer?.stopAllAction();
      if (horse) disposeObject(horse.root);
      env?.dispose();
      renderer.domElement.remove();
      releaseRenderer(renderer);
    };
  }, []);

  const current = SOURCES.find((s) => s.id === source)!;
  return (
    <div className={cn("relative", className)}>
      <div ref={host} className="relative aspect-[4/5] w-full overflow-hidden bg-[radial-gradient(ellipse_at_45%_30%,#8a725f,#4a3a2e_55%,#231b16_100%)] sm:aspect-[16/11]">
        {status !== "ready" && (
          <p className="label absolute inset-0 grid place-items-center text-sand" role="status">
            {status === "failed" ? "The 3D study needs WebGL. The ears turn independently: see the photograph on The Legend." : "Loading the stallion…"}
          </p>
        )}
      </div>
      <fieldset className="mt-5">
        <legend className="label text-dust">What is the horse listening to?</legend>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Sound source">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={source === s.id}
              data-sound="off"
              onClick={() => setSource(s.id)}
              className={cn(
                "label min-h-11 border px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                source === s.id ? "border-gold bg-gold text-night" : "border-line text-sand hover:border-gold hover:text-bone",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="t-story mt-4 min-h-[3.5rem] text-sand" aria-live="polite">{current.line}</p>
        <p className="label mt-1 hidden text-dust md:block">{reduced ? "" : "Or move your pointer around the head."}</p>
      </fieldset>
    </div>
  );
}
