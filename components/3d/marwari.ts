/**
 * The rigged Marwari (built in Blender from the supplied sculpt; sources and scripts in docs/reference/3d/marwari).
 * Shared by the hero stage and the anatomy viewer: loading, the coat material, named clips,
 * time-of-day light, gaze and the anatomy highlight. Model space is glTF: +Y up, the horse faces +Z, metres.
 *
 * Clips (all loop in place): Idle_Breathing, Head_Turn, Ear_Rotate, Blink, Weight_Shift, Walk, Trot, Tail_Sway.
 * Each clip only animates the bones it needs, so several can play at once (breathing + tail + ears + blink).
 *
 * The shader work lives next to this file: `marwari-coat.ts` (coat grade, region roughness, anatomy glow),
 * `contact.ts` (hoof contact shadows, the hero's ground), `studio.ts` (the studio reflections).
 */
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HoofContacts } from "./contact";
import { installCoat, type Highlight } from "./marwari-coat";
import { installEye, reseatEyes, type EyeCentres } from "./marwari-eye";
import { installHair, type Hair as RibbonHair } from "./marwari-hair";
import { hairLodForDevice, installHairLocks, type HairLocks, type HairLod } from "./marwari-hair-locks";

export { ANATOMY_MODEL, HERO_MODEL } from "./marwari-paths";
export type { Highlight } from "./marwari-coat";

export type ClipName = "Idle_Breathing" | "Head_Turn" | "Ear_Rotate" | "Blink" | "Weight_Shift" | "Walk" | "Trot" | "Tail_Sway";

export type Marwari = {
  root: THREE.Object3D;
  mesh: THREE.SkinnedMesh;
  bones: Record<string, THREE.Bone>;
  clips: Map<string, THREE.AnimationClip>;
  material: THREE.MeshStandardMaterial;
  highlight: Highlight;
  /** Soft contact shadows under the four hooves. Add `contacts.group` to the scene next to `root`. */
  contacts: HoofContacts;
  /** Mane, forelock and tail: shading controls (flutter amplitude, strand highlight) and the quality tier of the hair. */
  hair: Hair;
};

/** What the rest of the site sees of the hair: the exported controls plus the tier and the reduced-motion switch of the new locks. */
export type Hair = RibbonHair & {
  /** The new procedural hair, or null when it could not be built and the exported ribbons are showing. */
  locks: HairLocks | null;
  readonly lod: HairLod;
  /** 0 every lock and the soft fringe pass, 1 about two thirds in one pass, 2 about a third. The film's quality governor calls this. */
  setLod(lod: HairLod): void;
  /** True switches off the hair's own movement (lag, flutter, lift). The system setting is also honoured by itself. */
  setReducedMotion(reduced: boolean): void;
};

/** Loads a GLB with the bundled local Draco decoder (public/draco). The caller disposes the returned loader. */
export function loadMarwari(url: string, onProgress?: (fraction: number) => void) {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const promise = new Promise<Marwari>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        try {
          resolve(prepare(gltf));
        } catch (error) {
          reject(error);
        }
      },
      (e) => e.total > 0 && onProgress?.(e.loaded / e.total),
      reject,
    );
  });
  return { promise, dispose: () => draco.dispose() };
}

function prepare(gltf: GLTF): Marwari {
  const root = gltf.scene;
  let mesh: THREE.SkinnedMesh | null = null;
  let ribbons: RibbonHair = { wind: { value: new THREE.Vector3() }, sheen: { value: 0 } };
  let ribbonMesh: THREE.SkinnedMesh | null = null;
  let ribbonMaterial: THREE.MeshStandardMaterial | null = null;
  let eyes: EyeCentres = { L: new THREE.Vector3(0.1, 1.89, 1.17), R: new THREE.Vector3(-0.1, 1.9, 1.16) };
  const bones: Record<string, THREE.Bone> = {};
  root.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (sm.isSkinnedMesh) {
      sm.frustumCulled = false; // skinned bounds move with the gait
      const m = sm.material as THREE.MeshStandardMaterial;
      if (m.name === "Marwari_Coat") mesh = sm;
      // hair cards: coverage-tested strands, double-sided, no sorting problems; eyes: wet, high reflection
      if (m.name === "Marwari_Hair") { ribbons = installHair(sm, m); ribbonMesh = sm; ribbonMaterial = m; }
      if (m.name === "Marwari_Eye") {
        // a wet cornea over the dark eye: a thin clear layer that carries the catch-light
        const eye = new THREE.MeshPhysicalMaterial();
        THREE.MeshStandardMaterial.prototype.copy.call(eye, m);
        eye.roughness = 0.08;
        eye.envMapIntensity = 1.6;
        eye.clearcoat = 1;
        eye.clearcoatRoughness = 0.03;
        eye.name = m.name;
        eyes = reseatEyes(sm); // the domes sit off the painted sockets in the exported model
        installEye(eye, eyes);
        sm.material = eye;
        m.dispose();
      }
    }
    if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone;
  });
  if (!mesh) throw new Error("Marwari: no coat mesh");
  const skinned = mesh as THREE.SkinnedMesh;
  // Kala coat: a fine short coat over black skin, a satin sheen rather than plastic (no metal, baked AO in the R channel).
  // The coat is a physical material so it can carry a soft, dark sheen at grazing angles (the "bloom" of a short coat).
  const base = skinned.material as THREE.MeshStandardMaterial;
  const material = new THREE.MeshPhysicalMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(material, base);
  material.name = base.name;
  material.metalness = 0;
  material.envMapIntensity = 0.9;
  material.side = THREE.FrontSide; // the body is a closed shell: no need to shade its inside
  material.sheen = 0.22;
  material.sheenRoughness = 0.6;
  material.sheenColor = new THREE.Color("#1a1a1c");
  skinned.material = material;
  base.dispose();
  const highlight = installCoat(skinned, material, muzzleTip(skinned.geometry), eyes);
  // The mane, forelock, tail and dock are rebuilt as soft locks on the real neck and tail bones; the exported ribbons stay hidden unless that fails.
  let locks: HairLocks | null = null;
  if (ribbonMesh && ribbonMaterial) {
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }) : null;
    const lod = hairLodForDevice({
      cores: nav?.hardwareConcurrency, memoryGb: nav?.deviceMemory, saveData: nav?.connection?.saveData,
      coarse: typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches, width: typeof window !== "undefined" ? window.innerWidth : undefined,
    });
    try {
      locks = installHairLocks(skinned, ribbonMesh, ribbonMaterial, bones, { lod, wind: ribbons.wind, sheen: ribbons.sheen, reducedMotion: false });
    } catch (error) {
      console.warn("[marwari] the new hair could not be built; showing the exported ribbons", error);
      locks = null;
    }
  }
  const hair: Hair = {
    ...ribbons,
    locks,
    get lod() { return locks?.lod ?? 2; },
    setLod(l: HairLod) { locks?.setLod(l); },
    setReducedMotion(r: boolean) { locks?.setReducedMotion(r); },
  };
  return { root, mesh: skinned, bones, clips: new Map(gltf.animations.map((c) => [c.name, c])), material, highlight, contacts: new HoofContacts(bones), hair };
}

/** Bind-pose position of the muzzle: the most forward vertex of the body mesh. */
function muzzleTip(geo: THREE.BufferGeometry) {
  const p = geo.attributes.position;
  let best = 0;
  for (let i = 1; i < p.count; i++) if (p.getZ(i) > p.getZ(best)) best = i;
  return new THREE.Vector3(p.getX(best), p.getY(best), p.getZ(best));
}

/** Frame timer (THREE.Clock is deprecated): `delta()` seconds since the last call, `elapsed` seconds since creation. */
export function createTimer() {
  const t0 = performance.now();
  let last = t0;
  return {
    delta() {
      const now = performance.now();
      const d = (now - last) / 1000;
      last = now;
      return d;
    },
    get elapsed() {
      return (performance.now() - t0) / 1000;
    },
  };
}

/* ---------------------------------------------------------------- gaze */
const GAZE_SHARE: [string, number][] = [["Neck_2", 0.28], ["Neck_3", 0.34], ["Head", 0.38]];

/**
 * Turns the neck and head toward a target ON TOP of whatever the clips are doing (so Attention_Response and
 * Head_Turn still read). Call `undo()` before `mixer.update()` and `apply(yaw, pitch)` after it; the offset applied
 * last frame is removed first, so nothing accumulates. yaw > 0 turns toward the horse's left (+X), pitch > 0 lowers
 * the nose (radians).
 */
export function createGaze(m: Marwari) {
  const applied = new Map<string, THREE.Quaternion>();
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3(1, 0, 0);
  const q = new THREE.Quaternion();
  const rq = new THREE.Quaternion();
  const pq = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const undo = () => {
    for (const [name, d] of applied) {
      const bone = m.bones[name];
      if (bone) bone.quaternion.premultiply(q.copy(d).invert());
    }
    applied.clear();
  };
  const apply = (yaw: number, pitch: number) => {
    m.root.updateWorldMatrix(true, true);
    m.root.getWorldQuaternion(rq);
    for (const [name, share] of GAZE_SHARE) {
      const bone = m.bones[name];
      if (!bone?.parent) continue;
      bone.parent.getWorldQuaternion(pq).invert();
      const d = new THREE.Quaternion();
      axis.copy(up).applyQuaternion(rq).applyQuaternion(pq);
      d.setFromAxisAngle(axis, yaw * share);
      axis.copy(side).applyQuaternion(rq).applyQuaternion(pq);
      d.premultiply(q.setFromAxisAngle(axis, pitch * share));
      bone.quaternion.premultiply(d);
      applied.set(name, d);
      bone.updateMatrixWorld(true);
    }
  };
  return { undo, apply };
}

/* ---------------------------------------------------------------- time of day */
export type Daylight = { key: THREE.Color; rim: THREE.Color; fill: THREE.Color; dir: THREE.Vector3; intensity: number; rimK: number; hemi: number; exposure: number; name: string };

/**
 * Light that follows the visitor's local hour: cool night, golden dawn and dusk, near-white noon. A black coat is a mirror more than a
 * painted surface, so the warmth of dawn and dusk is carried by the rim light (an edge of gold along the neck and back) while the key
 * stays close to white; and the coat's diffuse term only keeps a share of the light's chroma (see `marwari-coat.ts`). The horse
 * stays black at every hour and the hour shows in the edge light, the angle and the exposure.
 */
export function daylight(hour: number): Daylight {
  const stops = [
    { h: 0, key: "#93a3cc", rim: "#a8c0f0", rimK: 3.6, fill: "#2c3552", hemi: 0.3, elev: 0.55, k: 2.1, ex: 1.5, name: "night" },
    { h: 6, key: "#ffe6d2", rim: "#ffc383", rimK: 4.4, fill: "#4a4550", hemi: 0.3, elev: 0.22, k: 2.4, ex: 1.42, name: "dawn" },
    { h: 12, key: "#fff8f0", rim: "#f6e6c8", rimK: 3.4, fill: "#5c606c", hemi: 0.35, elev: 1.0, k: 2.8, ex: 1.35, name: "day" },
    { h: 18, key: "#ffe0c6", rim: "#ffbb72", rimK: 4.4, fill: "#463b3a", hemi: 0.3, elev: 0.18, k: 2.4, ex: 1.42, name: "dusk" },
    { h: 24, key: "#93a3cc", rim: "#a8c0f0", rimK: 3.6, fill: "#2c3552", hemi: 0.3, elev: 0.55, k: 2.1, ex: 1.5, name: "night" },
  ];
  const i = Math.max(0, stops.findIndex((s) => s.h > hour) - 1);
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const t = b.h === a.h ? 0 : (hour - a.h) / (b.h - a.h);
  const mix = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), t);
  const az = (hour / 24) * Math.PI * 2 - Math.PI / 2; // the sun travels around the horse through the day
  const elev = a.elev + (b.elev - a.elev) * t;
  const dir = new THREE.Vector3(Math.cos(az) * 3, 1.5 + elev * 4, 3.2);
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return { key: mix(a.key, b.key), rim: mix(a.rim, b.rim), fill: mix(a.fill, b.fill), dir, intensity: lerp(a.k, b.k), rimK: lerp(a.rimK, b.rimK), hemi: lerp(a.hemi, b.hemi), exposure: lerp(a.ex, b.ex), name: t < 0.5 ? a.name : b.name };
}

/** Studio lights for the stallion; returns a function that applies a Daylight (its `lights` array lists the light objects). */
export function addLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffffff, 3);
  const rim = new THREE.DirectionalLight(0xffffff, 3.4);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  const sky = new THREE.HemisphereLight(0xf3ede2, 0x2a211b, 0.7);
  rim.position.set(-2.8, 3.4, -3.4);
  fill.position.set(-3.5, 1.8, 2.5);
  scene.add(key, rim, fill, sky);
  let last: Daylight | null = null;
  let k = 1;
  let rimF = 1;
  const apply = (d: Daylight) => {
    last = d;
    key.color.copy(d.key);
    key.intensity = d.intensity * k;
    key.position.copy(d.dir);
    rim.color.copy(d.rim);
    rim.intensity = d.rimK * rimF * (0.4 + 0.6 * k);
    fill.color.copy(d.fill);
    fill.intensity = k;
    sky.intensity = d.hemi * k;
  };
  /**
   * Light level 0 to 1 (the hero's reveal sequence): the key, fill, sky and the environment go down, the rim keeps a thread of light.
   * `rimScale` is the shot's own rim: a close-up from the front looks at surfaces the rim grazes from behind, which turns pale.
   */
  let envBase = -1;
  const level = (v: number, rimScale = 1) => {
    if (v >= 1 && rimScale >= 1 && envBase < 0) return; // already at full light
    if (envBase < 0) envBase = scene.environmentIntensity;
    k = v;
    rimF = rimScale;
    if (last) apply(last);
    scene.environmentIntensity = envBase * (0.1 + 0.9 * v);
    if (v >= 1 && rimScale >= 1) envBase = -1;
  };
  return Object.assign(apply, { lights: [key, rim, fill, sky] as THREE.Object3D[], level });
}

/**
 * Frees a renderer and, when its canvas has left the page, its WebGL context too. `renderer.dispose()` alone leaves the context
 * alive until the garbage collector gets to it, and browsers keep about sixteen: enough route round trips reached that limit.
 * A canvas that is still in the document (a cached route, the effect run twice in development) keeps its context, because a
 * context that has been force-lost cannot be handed to a new renderer.
 */
export function releaseRenderer(renderer: THREE.WebGLRenderer) {
  const canvas = renderer.domElement;
  renderer.dispose();
  if (!canvas.isConnected) renderer.forceContextLoss();
}

export function disposeObject(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    }
  });
  textures.forEach((t) => t.dispose());
}
