"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import * as THREE from "three";
import { FilmImage } from "@/components/film/FilmImage";
import { addLights, createTimer, daylight, disposeObject, loadMarwari, releaseRenderer, type Daylight, type Marwari } from "@/components/3d/marwari";
import { HERO_MODEL, HERO_MODEL_MOBILE } from "@/components/3d/marwari-paths";
import { createStudioEnv } from "@/components/3d/studio";
import { ambienceDebug, setAmbience, setMusicWanted, startMusic, stopMusic } from "@/lib/audio/mixer";
import { fleetWorlds, type FleetWorldId } from "@/lib/content/fleet";
import { cn } from "@/lib/utils";

/**
 * R32 (2 Nov 2026): the /fleet opening. The academy's rigged Marwari (marwari-hero.glb, the horse of the home film, the bond and the
 * ear study) stands in front of one of three photographic worlds: cavalry under a hill fort, a Marwar village, the feeding rack beside
 * a tent-pegging lane. A button changes the plate (a cross-fade), the light on the horse (sun direction, colour, exposure, shadow) and
 * the location sound together. This replaces the glass "cloak" exhibit.
 *
 * Sound: the world's ambience plays only while the scene is on screen, only once the visitor has turned sound on (the mixer creates
 * nothing before a gesture), and is stopped when the scene scrolls away or the page is left, so it never doubles up.
 * Graphics: one renderer, created on mount and fully released on unmount; the loop runs only while the scene is visible.
 * Reduced motion: the horse stands still, the light and plate change without a fade.
 */

type Look = { hour: number; sun: [number, number, number]; exposure: number; env: number; shadow: number };
/** The sun for each plate, in the horse's space (it faces +Z; the camera sits on its left side, +X, so it faces screen left). */
const LOOKS: Record<FleetWorldId, Look> = {
  // low sun behind the horse, at the left of the frame: a gold rim, a long shadow toward the viewer
  cavalry: { hour: 18, sun: [-3.2, 1.25, 2.6], exposure: 0.95, env: 0.32, shadow: 0.46 },
  // mid-morning from the upper left, shadows falling right
  village: { hour: 9.5, sun: [-0.6, 3.6, 3.0], exposure: 1.08, env: 0.5, shadow: 0.42 },
  // late afternoon, low from the left behind the trees
  field: { hour: 17, sun: [-2.4, 1.9, 2.8], exposure: 1.0, env: 0.42, shadow: 0.44 },
};

/** Where the horse stands in the frame (fractions of the stage): centre x, hoof line, and height from hoof to ear tip. */
const FRAME = {
  wide: { cx: 0.66, foot: 0.9, height: 0.58 },
  narrow: { cx: 0.5, foot: 0.655, height: 0.28 },
};
const VIEW = new THREE.Vector3(1, 0.07, 0.62).normalize();

const lit = (look: Look): Daylight => ({ ...daylight(look.hour), dir: new THREE.Vector3(...look.sun) });
const mixLight = (a: Daylight, b: Daylight, t: number): Daylight => ({
  key: a.key.clone().lerp(b.key, t),
  rim: a.rim.clone().lerp(b.rim, t),
  fill: a.fill.clone().lerp(b.fill, t),
  dir: a.dir.clone().lerp(b.dir, t),
  intensity: THREE.MathUtils.lerp(a.intensity, b.intensity, t),
  rimK: THREE.MathUtils.lerp(a.rimK, b.rimK, t),
  hemi: THREE.MathUtils.lerp(a.hemi, b.hemi, t),
  exposure: THREE.MathUtils.lerp(a.exposure, b.exposure, t),
  name: b.name,
});
const smooth = (x: number) => x * x * (3 - 2 * x);

/** The reel's own sound choice: theme music (the default), the location's house sounds, or silence. Independent of the site's SOUND switch in the nav. */
export type FleetSound = "theme" | "house" | "none";
const FLEET_SOUNDS: { id: FleetSound; label: string }[] = [
  { id: "theme", label: "Theme music" },
  { id: "house", label: "House sounds" },
  { id: "none", label: "No sound" },
];

/** Applies the reel's sound choice through the shared mixer. Browsers only start audio after a visitor gesture, so a scroll-in can be blocked. */
function playFor(sound: FleetSound, world: FleetWorldId, gesture: boolean) {
  if (sound === "theme") {
    void setAmbience(null);
    if (gesture) void startMusic();
    return;
  }
  if (sound === "house") {
    setMusicWanted(true);
    stopMusic(true);
    void setAmbience(world);
    return;
  }
  void setAmbience(null);
  stopMusic(true);
}

export function FleetWorlds({ children }: { children?: ReactNode }) {
  const [sound, setSound] = useState<FleetSound>("theme");
  const soundRef = useRef<FleetSound>("theme");
  const [world, setWorld] = useState<FleetWorldId>(fleetWorlds[0].id);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const section = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const go = useRef<(id: FleetWorldId) => void>(() => {});
  const worldRef = useRef(world);
  const onScreen = useRef(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // the horse and its light
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
    const narrow = () => container.clientWidth / Math.max(1, container.clientHeight) < 0.9;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    let env: THREE.WebGLRenderTarget | null = null;
    try { env = createStudioEnv(renderer); scene.environment = env.texture; } catch { /* lights only */ }
    const rig = addLights(scene);
    const sun = rig.lights[0] as THREE.DirectionalLight;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.1, far: 20 });
    sun.shadow.camera.updateProjectionMatrix();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: 0x1a120c, opacity: 0.45 }));
    ground.receiveShadow = true;
    scene.add(ground);

    let look = lit(LOOKS[worldRef.current]);
    let from = look;
    let to = look;
    let fromLook = LOOKS[worldRef.current];
    let toLook = fromLook;
    let tween = 1;
    const applyLight = (t: number) => {
      look = mixLight(from, to, t);
      rig(look);
      renderer.toneMappingExposure = look.exposure * THREE.MathUtils.lerp(fromLook.exposure, toLook.exposure, t);
      scene.environmentIntensity = THREE.MathUtils.lerp(fromLook.env, toLook.env, t);
      (ground.material as THREE.ShadowMaterial).opacity = THREE.MathUtils.lerp(fromLook.shadow, toLook.shadow, t);
    };
    applyLight(1);

    let horse: Marwari | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    const size = { height: 2.1, cx: 0, cz: 0 };
    const timer = createTimer();
    let raf = 0;
    let visible = false;
    let nextEar = 6;
    const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const place = () => {
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      const f = narrow() ? FRAME.narrow : FRAME.wide;
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const dist = size.height / (f.height * 2 * tan);
      const target = new THREE.Vector3(size.cx, size.height / 2, size.cz);
      camera.position.copy(target).addScaledVector(VIEW, dist);
      camera.lookAt(target);
      // move the horse from the middle of the frame to its place without turning the camera
      camera.setViewOffset(w, h, (0.5 - f.cx) * w, (0.5 - (f.foot - f.height / 2)) * h, w, h);
      camera.updateProjectionMatrix();
    };
    place();

    const once = (name: string, weight: number) => {
      const clip = horse?.clips.get(name);
      if (!clip || !mixer) return;
      const action = mixer.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.setEffectiveWeight(weight);
      action.fadeIn(0.35).play();
    };

    const frame = () => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min(0.05, timer.delta());
      const s = still();
      if (tween < 1) {
        tween = s ? 1 : Math.min(1, tween + dt / 1.1);
        applyLight(smooth(tween));
      }
      if (mixer && !s) {
        mixer.update(dt);
        nextEar -= dt;
        if (nextEar <= 0) { once("Ear_Rotate", 0.7); nextEar = 7 + Math.random() * 6; }
      }
      renderer.render(scene, camera);
      if (visible && (!s || tween < 1)) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    go.current = (id) => {
      fromLook = toLook;
      from = look;
      toLook = LOOKS[id];
      to = lit(toLook);
      tween = 0;
      once("Attention_Response", 0.8);
      kick();
    };

    const ro = new ResizeObserver(() => { place(); kick(); });
    ro.observe(container);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { timer.delta(); kick(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(container);

    const { promise, dispose: disposeLoader } = loadMarwari(narrow() ? HERO_MODEL_MOBILE : HERO_MODEL);
    promise.then((m) => {
      if (disposed) { disposeObject(m.root); return; }
      horse = m;
      m.hair.sheen.value *= 0.5;
      m.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
      m.contacts.strength = 0.55;
      scene.add(m.root, m.contacts.group);
      mixer = new THREE.AnimationMixer(m.root);
      for (const name of ["Idle_Breathing", "Blink", "Mane_Sway", "Tail_Sway"]) {
        const clip = m.clips.get(name);
        if (clip) mixer.clipAction(clip).play();
      }
      mixer.update(0);
      m.root.updateMatrixWorld(true);
      // the frame is fitted to the standing horse: hoof line at y = 0, ear tips at the top, centred on its barrel
      const box = new THREE.Box3().setFromObject(m.mesh);
      const tip = (b?: THREE.Object3D) => (b ? b.getWorldPosition(new THREE.Vector3()).y : 0);
      size.height = Math.max(box.max.y, tip(m.bones.Ear_Tip_L), tip(m.bones.Ear_Tip_R)) + 0.04;
      size.cx = (box.min.x + box.max.x) / 2;
      size.cz = (box.min.z + box.max.z) / 2;
      place();
      setStatus("ready");
      if (process.env.NODE_ENV !== "production") (window as unknown as { __fleetWorlds?: unknown }).__fleetWorlds = { LOOKS, FRAME, VIEW, ambience: ambienceDebug, place: () => { place(); kick(); }, relight: () => { from = to = lit(toLook); fromLook = toLook; applyLight(1); kick(); } };
      kick();
    }).catch(() => { if (!disposed) setStatus("failed"); }).finally(() => disposeLoader());

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mixer?.stopAllAction();
      if (horse) disposeObject(horse.root);
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      sun.shadow.map?.dispose();
      env?.dispose();
      renderer.domElement.remove();
      releaseRenderer(renderer);
    };
  }, []);

  // the location sound follows the world while the scene is on screen
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      const on = e.isIntersecting && e.intersectionRatio >= 0.35;
      if (on === onScreen.current) return;
      onScreen.current = on;
      if (on) playFor(soundRef.current, worldRef.current, false);
      else void setAmbience(null);
    }, { threshold: [0, 0.35] });
    io.observe(el);
    return () => { io.disconnect(); onScreen.current = false; void setAmbience(null); };
  }, []);

  const choose = (id: FleetWorldId) => {
    if (id === worldRef.current) return;
    worldRef.current = id;
    setWorld(id);
    go.current(id);
    if (onScreen.current && soundRef.current === "house") void setAmbience(id);
  };

  const chooseSound = (s: FleetSound) => {
    soundRef.current = s;
    setSound(s);
    if (onScreen.current) playFor(s, worldRef.current, true);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = fleetWorlds.findIndex((w) => w.id === world);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = fleetWorlds[(i + step + fleetWorlds.length) % fleetWorlds.length];
    choose(next.id);
    buttons.current[fleetWorlds.indexOf(next)]?.focus();
  };

  const active = fleetWorlds.find((w) => w.id === world) ?? fleetWorlds[0];

  return (
    <div ref={section} className="relative min-h-[100svh] max-sm:min-h-[54rem]">
      {/* the three plates, cross-faded */}
      <div className="absolute inset-0">
        {fleetWorlds.map((w, i) => (
          <div key={w.id} aria-hidden={w.id !== world} className={cn("absolute inset-0 transition-opacity duration-[900ms] ease-out motion-reduce:transition-none", w.id === world ? "opacity-100" : "opacity-0")}>
            <FilmImage name={w.image} priority={i === 0} grade="film" sizes="100vw" />
          </div>
        ))}
      </div>
      {/* scrims that hold the copy: left on wide screens, top and bottom on phones */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(14_10_8/0.86)_0%,rgb(14_10_8/0.6)_26%,rgb(14_10_8/0)_44%,rgb(14_10_8/0)_58%,rgb(14_10_8/0.55)_70%,rgb(14_10_8/0.92)_100%)] sm:bg-[linear-gradient(90deg,rgb(14_10_8/0.8)_0%,rgb(14_10_8/0.5)_32%,rgb(14_10_8/0)_58%),linear-gradient(0deg,rgb(14_10_8/0.55)_0%,rgb(14_10_8/0)_30%)]" />

      {/* the horse */}
      <div ref={host} role="img" aria-label={`The academy's black Marwari stallion standing in the scene: ${active.title.replace(/\.$/, "")}`} className="pointer-events-none absolute inset-0" />
      {status === "failed" && (
        <p className="label absolute right-6 top-24 text-sand" role="status">The horse needs WebGL; the photograph shows the place.</p>
      )}

      <div className="gutter relative z-10 flex min-h-[100svh] flex-col justify-between pb-10 pt-24 max-sm:min-h-[54rem] sm:pb-14 md:pt-32">
        <div className="max-w-[40rem]">{children}</div>

        <div className="max-w-[34rem]">
          <p id="fleet-worlds-label" className="label text-gold">Choose his world</p>
          <div role="radiogroup" aria-labelledby="fleet-worlds-label" onKeyDown={onKey} className="mt-3 flex flex-wrap gap-2">
            {fleetWorlds.map((w, i) => (
              <button
                key={w.id}
                ref={(el) => { buttons.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={w.id === world}
                tabIndex={w.id === world ? 0 : -1}
                onClick={() => choose(w.id)}
                className={cn(
                  "label min-h-11 border px-4 py-2.5 backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                  w.id === world ? "border-gold bg-[rgb(14_10_8/0.55)] text-gold" : "border-line bg-[rgb(14_10_8/0.35)] text-sand hover:text-bone",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Sound" className="mt-3 flex flex-wrap gap-2">
            {FLEET_SOUNDS.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={sound === o.id}
                onClick={() => chooseSound(o.id)}
                className={cn(
                  "label min-h-11 border px-4 py-2.5 backdrop-blur-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                  sound === o.id ? "border-gold bg-[rgb(14_10_8/0.55)] text-gold" : "border-line bg-[rgb(14_10_8/0.35)] text-sand hover:text-bone",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="sr-only">{active.title}</p>
        </div>
      </div>
    </div>
  );
}
