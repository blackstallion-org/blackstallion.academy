/**
 * The rigged Marwari (built in Blender from the supplied sculpt; sources and scripts in docs/reference/3d/marwari).
 * Shared by the hero stage and the anatomy viewer: loading, the coat material, named clips,
 * time-of-day light, gaze and the anatomy highlight. Model space is glTF: +Y up, the horse faces +Z, metres.
 *
 * Clips (all loop in place): Idle_Breathing, Head_Turn, Ear_Rotate, Blink, Weight_Shift, Walk, Trot, Tail_Sway.
 * Each clip only animates the bones it needs, so several can play at once (breathing + tail + ears + blink).
 */
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export { ANATOMY_MODEL, HERO_MODEL } from "./marwari-paths";

export type ClipName = "Idle_Breathing" | "Head_Turn" | "Ear_Rotate" | "Blink" | "Weight_Shift" | "Walk" | "Trot" | "Tail_Sway";

export type Marwari = {
  root: THREE.Object3D;
  mesh: THREE.SkinnedMesh;
  bones: Record<string, THREE.Bone>;
  clips: Map<string, THREE.AnimationClip>;
  material: THREE.MeshStandardMaterial;
  highlight: Highlight;
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
  const bones: Record<string, THREE.Bone> = {};
  root.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (sm.isSkinnedMesh) {
      sm.frustumCulled = false; // skinned bounds move with the gait
      const m = sm.material as THREE.MeshStandardMaterial;
      if (m.name === "Marwari_Coat") mesh = sm;
      // hair cards: alpha-tested, double-sided, no sorting problems; eyes: wet, high reflection
      if (m.name === "Marwari_Hair") {
        m.alphaTest = 0.45;
        m.transparent = false;
        m.depthWrite = true;
        m.side = THREE.DoubleSide;
        m.roughness = 0.45;
        m.envMapIntensity = 0.7;
      }
      if (m.name === "Marwari_Eye") {
        m.roughness = 0.05;
        m.envMapIntensity = 1.6;
      }
    }
    if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone;
  });
  if (!mesh) throw new Error("Marwari: no coat mesh");
  const skinned = mesh as THREE.SkinnedMesh;
  const material = skinned.material as THREE.MeshStandardMaterial;
  // Kala coat: a fine short coat over black skin, a satin sheen rather than plastic (no metal, baked AO in the R channel).
  material.metalness = 0;
  material.envMapIntensity = 0.9;
  material.side = THREE.FrontSide; // the body is a closed shell: no need to shade its inside
  const highlight = installHighlight(material);
  return { root, mesh: skinned, bones, clips: new Map(gltf.animations.map((c) => [c.name, c])), material, highlight };
}

/* ---------------------------------------------------------------- anatomy highlight */
export type Highlight = {
  /** Up to four world-space spheres (centre + radius) that glow; radius 0 switches a slot off. */
  set: (spheres: { center: THREE.Vector3; radius: number }[]) => void;
  /** 0..1 strength, eased by the caller. */
  strength: { value: number };
  color: { value: THREE.Color };
};

function installHighlight(material: THREE.MeshStandardMaterial): Highlight {
  const spheres = { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) };
  const strength = { value: 0 };
  const color = { value: new THREE.Color("#c9a66b") };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHi = spheres;
    shader.uniforms.uHiK = strength;
    shader.uniforms.uHiCol = color;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHiW;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvHiW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHiW; uniform vec4 uHi[4]; uniform float uHiK; uniform vec3 uHiCol;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float hi = 0.0;
        for (int i = 0; i < 4; i++) {
          if (uHi[i].w > 0.0) hi = max(hi, 1.0 - smoothstep(uHi[i].w * 0.35, uHi[i].w, distance(vHiW, uHi[i].xyz)));
        }
        totalEmissiveRadiance += uHiCol * hi * uHiK * 0.32;`,
      );
  };
  material.customProgramCacheKey = () => "marwari-highlight";
  return {
    set(list) {
      spheres.value.forEach((v, i) => {
        const s = list[i];
        if (s) v.set(s.center.x, s.center.y, s.center.z, s.radius);
        else v.set(0, 0, 0, 0);
      });
    },
    strength,
    color,
  };
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
export type Daylight = { key: THREE.Color; rim: THREE.Color; fill: THREE.Color; dir: THREE.Vector3; intensity: number; name: string };

/** Light that follows the visitor's local hour: blue night, amber dawn and dusk, white noon. */
export function daylight(hour: number): Daylight {
  const stops = [
    { h: 0, key: "#5a6888", rim: "#7286aa", fill: "#323c56", elev: 0.55, k: 1.6, name: "night" },
    { h: 6, key: "#ff9a5a", rim: "#f2a067", fill: "#5a4c52", elev: 0.22, k: 2.6, name: "dawn" },
    { h: 12, key: "#fff2dc", rim: "#dab577", fill: "#6a6c78", elev: 1.0, k: 3.0, name: "day" },
    { h: 18, key: "#ffa04a", rim: "#d4b04a", fill: "#4c3834", elev: 0.18, k: 2.6, name: "dusk" },
    { h: 24, key: "#5a6888", rim: "#7286aa", fill: "#323c56", elev: 0.55, k: 1.6, name: "night" },
  ];
  const i = Math.max(0, stops.findIndex((s) => s.h > hour) - 1);
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const t = b.h === a.h ? 0 : (hour - a.h) / (b.h - a.h);
  const mix = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), t);
  const az = (hour / 24) * Math.PI * 2 - Math.PI / 2; // the sun travels around the horse through the day
  const elev = a.elev + (b.elev - a.elev) * t;
  const dir = new THREE.Vector3(Math.cos(az) * 3, 1.5 + elev * 4, 3.2);
  return { key: mix(a.key, b.key), rim: mix(a.rim, b.rim), fill: mix(a.fill, b.fill), dir, intensity: a.k + (b.k - a.k) * t, name: t < 0.5 ? a.name : b.name };
}

/** Studio lights for the stallion; returns a function that applies a Daylight. */
export function addLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffffff, 3);
  const rim = new THREE.DirectionalLight(0xffffff, 3.4);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  const sky = new THREE.HemisphereLight(0xf3ede2, 0x2a211b, 0.7);
  rim.position.set(-2.8, 3.4, -3.4);
  fill.position.set(-3.5, 1.8, 2.5);
  scene.add(key, rim, fill, sky);
  return (d: Daylight) => {
    key.color.copy(d.key);
    key.intensity = d.intensity;
    key.position.copy(d.dir);
    rim.color.copy(d.rim);
    fill.color.copy(d.fill);
  };
}

/** A soft contact shadow under the hooves (no shadow pass). */
export function contactShadow(width = 2.2, depth = 3.2) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(0.55, "rgba(0,0,0,0.22)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.002, 0.35);
  return mesh;
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
