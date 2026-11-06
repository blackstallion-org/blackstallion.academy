import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * The observation platform, its terrace skyline and the gyroscope arcs (modelled in Blender:
 * tools/blender/12_worlds/beyond/build_station.py). The Blender materials are placeholders named by role; here each role gets
 * its runtime material: polished dark floor, brushed brass, gunmetal hull, smoked glass and the gold light, whose strips carry
 * slow pulses along their length (UV.x runs along every strip).
 */

/** Turns the platform so its terrace city sits to the right of the hero frame, clear of the view to the planet. */
export const PLATFORM_YAW = THREE.MathUtils.degToRad(-46);

/** The three arcs around the platform: radius (m), tilt (Euler, radians), the angle at which their open gap sits. */
export const ARCS: { name: string; radius: number; center: THREE.Vector3; rot: THREE.Euler }[] = [
  { name: "Arc_A", radius: 74, center: new THREE.Vector3(0, -6, -10), rot: new THREE.Euler(0.42, 0.35, -0.18) },
  { name: "Arc_B", radius: 52, center: new THREE.Vector3(6, 4, -6), rot: new THREE.Euler(-0.3, -1.1, 0.95) },
  { name: "Arc_C", radius: 36, center: new THREE.Vector3(-4, 2, 2), rot: new THREE.Euler(1.25, 0.6, 0.2) },
];

export type LightUniforms = { uTime: THREE.IUniform<number>; uGain: THREE.IUniform<number> };

export function lightMaterial(u: LightUniforms, color = new THREE.Color(1.0, 0.6, 0.26), base = 0.85, pulses = 3) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uTime: u.uTime, uGain: u.uGain, uColor: { value: color }, uBase: { value: base }, uPulses: { value: pulses } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uGain; uniform vec3 uColor; uniform float uBase; uniform float uPulses; varying vec2 vUv;
      void main() {
        // a few bright packets of light travelling along the strip, over a steady glow
        float x = fract(vUv.x * uPulses - uTime * 0.035);
        float pk = exp(-pow((x - 0.5) / 0.012, 2.0)) * 2.6 + exp(-pow((x - 0.5) / 0.08, 2.0)) * 0.35;
        gl_FragColor = vec4(uColor * (uBase + pk) * uGain, 1.0);
      }`,
  });
}

export function makeMaterials(u: LightUniforms, env: THREE.Texture | null) {
  return {
    Floor: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#060607"), roughness: 0.38, metalness: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.12, envMap: env, envMapIntensity: 0.3, side: THREE.DoubleSide,
    }),
    Seam: new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
    Trim: new THREE.MeshStandardMaterial({ color: new THREE.Color("#b8864a"), metalness: 1, roughness: 0.34, envMap: env, envMapIntensity: 1.1, side: THREE.DoubleSide }),
    Hull: new THREE.MeshStandardMaterial({ color: new THREE.Color("#25262b"), metalness: 0.85, roughness: 0.42, envMap: env, envMapIntensity: 1, side: THREE.DoubleSide }),
    Glass: new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#0b0f14"), metalness: 0.3, roughness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.25, envMap: env, envMapIntensity: 1.0, side: THREE.DoubleSide }),
    Light: lightMaterial(u),
  } as Record<string, THREE.Material>;
}

/** Swap every Blender placeholder material for the runtime one with the same name. */
export function applyMaterials(root: THREE.Object3D, mats: Record<string, THREE.Material>, shadows: boolean) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const swap = (x: THREE.Material) => {
      const name = x.name.replace(/\.\d+$/, "");
      const r = mats[name] ?? mats.Hull;
      x.dispose();
      return r;
    };
    m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material);
    m.castShadow = shadows;
    m.receiveShadow = true;
  });
}

export function buildStation(platform: GLTF, arcs: GLTF, mats: Record<string, THREE.Material>) {
  const group = new THREE.Group();
  group.name = "station";
  const plat = platform.scene;
  // the platform receives the horse's shadow but casts none of its own (no shot needs it; it would double the shadow pass)
  applyMaterials(plat, mats, false);
  plat.rotation.y = PLATFORM_YAW;
  group.add(plat);
  const arcGroup = new THREE.Group();
  for (const a of ARCS) {
    const src = arcs.scene.getObjectByName(a.name);
    if (!src) continue;
    applyMaterials(src, mats, false);
    src.removeFromParent();
    const holder = new THREE.Group();
    holder.position.copy(a.center);
    holder.rotation.copy(a.rot);
    src.position.set(0, 0, 0);
    src.rotation.set(0, 0, 0);
    src.scale.setScalar(a.radius);
    holder.add(src);
    arcGroup.add(holder);
  }
  group.add(arcGroup);
  return { group, arcGroup };
}

/** Distance from a point to the beams of the arcs (for checking that the camera path never clips them). */
export function arcClearance(p: THREE.Vector3, arcGroup: THREE.Object3D) {
  let best = Infinity;
  const v = new THREE.Vector3();
  arcGroup.updateMatrixWorld(true);
  arcGroup.children.forEach((holder, i) => {
    const spec = ARCS[i];
    v.copy(p);
    holder.worldToLocal(v);
    // local: arc in the XZ plane (glTF), radius spec.radius; the beam sits within ~0.05 R of the circle
    const r = Math.hypot(v.x, v.z);
    const d = Math.hypot(r - spec.radius * 1.03, v.y) - spec.radius * 0.06;
    best = Math.min(best, d);
  });
  return best;
}
