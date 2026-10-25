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
        // a wet cornea over the dark eye: a thin clear layer that carries the catch-light
        const eye = new THREE.MeshPhysicalMaterial();
        THREE.MeshStandardMaterial.prototype.copy.call(eye, m);
        eye.roughness = 0.08;
        eye.envMapIntensity = 1.6;
        eye.clearcoat = 1;
        eye.clearcoatRoughness = 0.03;
        eye.name = m.name;
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
  material.sheenColor = new THREE.Color("#1d1a18");
  skinned.material = material;
  base.dispose();
  const highlight = installHighlight(material, muzzleTip(skinned.geometry));
  return { root, mesh: skinned, bones, clips: new Map(gltf.animations.map((c) => [c.name, c])), material, highlight };
}

/* ---------------------------------------------------------------- anatomy highlight */
export type Highlight = {
  /** Up to four world-space spheres (centre + radius) that glow; radius 0 switches a slot off. */
  set: (spheres: { center: THREE.Vector3; radius: number }[]) => void;
  /** 0..1 strength, eased by the caller. */
  strength: { value: number };
  color: { value: THREE.Color };
  /** (desaturation 0..1, gain): the film grades the coat toward true black under warm light. (0, 1) leaves the baked colour alone. */
  coat: { value: THREE.Vector2 };
};

/** Bind-pose position of the muzzle: the most forward vertex of the body mesh. */
function muzzleTip(geo: THREE.BufferGeometry) {
  const p = geo.attributes.position;
  let best = 0;
  for (let i = 1; i < p.count; i++) if (p.getZ(i) > p.getZ(best)) best = i;
  return new THREE.Vector3(p.getX(best), p.getY(best), p.getZ(best));
}

function installHighlight(material: THREE.MeshStandardMaterial, muzzle: THREE.Vector3): Highlight {
  const spheres = { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) };
  const strength = { value: 0 };
  const color = { value: new THREE.Color("#c9a66b") };
  const coat = { value: new THREE.Vector2(0, 1) };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCoat = coat;
    shader.uniforms.uHi = spheres;
    shader.uniforms.uHiK = strength;
    shader.uniforms.uHiCol = color;
    shader.uniforms.uMuzzle = { value: muzzle };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHiW; varying vec3 vRest;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRest = position;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvHiW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vHiW; varying vec3 vRest; uniform vec4 uHi[4]; uniform float uHiK; uniform vec3 uHiCol; uniform vec3 uMuzzle; uniform vec2 uCoat;
        float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float vn3(vec3 x) {
          vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        { float l = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l), uCoat.x) * uCoat.y; }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        {
          // oiled hooves are glossier, the muzzle's skin is soft and matte, the coat's hair varies a little from patch to patch
          float hoofM = 1.0 - smoothstep(0.085, 0.125, vRest.y);
          float muzM = 1.0 - smoothstep(0.05, 0.15, distance(vRest, uMuzzle));
          float fade = 1.0 - smoothstep(1.0, 4.0, length(vViewPosition));
          roughnessFactor *= 1.0 + (vn3(vRest * 70.0) - 0.5) * 0.3 * fade;
          roughnessFactor = mix(roughnessFactor, 0.4, hoofM);
          roughnessFactor = mix(roughnessFactor, 0.78, muzM);
        }`,
      )
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
  material.customProgramCacheKey = () => "marwari-highlight-v3";
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
    coat,
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

/** Studio lights for the stallion; returns a function that applies a Daylight (its `lights` array lists the light objects). */
export function addLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffffff, 3);
  const rim = new THREE.DirectionalLight(0xffffff, 3.4);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  const sky = new THREE.HemisphereLight(0xf3ede2, 0x2a211b, 0.7);
  rim.position.set(-2.8, 3.4, -3.4);
  fill.position.set(-3.5, 1.8, 2.5);
  scene.add(key, rim, fill, sky);
  const apply = (d: Daylight) => {
    key.color.copy(d.key);
    key.intensity = d.intensity;
    key.position.copy(d.dir);
    rim.color.copy(d.rim);
    fill.color.copy(d.fill);
  };
  return Object.assign(apply, { lights: [key, rim, fill, sky] as THREE.Object3D[] });
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
  mesh.name = "contact-shadow";
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
