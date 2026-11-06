import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { SKYFOG_PARS, type SkyFog } from "./skyfog";

/**
 * The shallow sheet of water on the wet sand around the hero horse (the reference's mirror-flat foreground). Patches of standing
 * water come and go with a world-space noise mask, so the sheet reads as puddles on wet sand, not as a lake.
 * High tier: a real planar reflection (three's Reflector renders the scene mirrored: the horse, the fort, the sky).
 * Other tiers: the sky is reflected from the sky texture only (no second render).
 */
const VS = /* glsl */ `
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vW;
varying vec3 vSkyFogPos;
void main() {
  vUv = textureMatrix * vec4(position, 1.0);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vSkyFogPos = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FS = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec3 color;
uniform float uTime;
uniform float uReal;
uniform float uRadius;
uniform sampler2D tSky;
varying vec4 vUv;
varying vec3 vW;
${SKYFOG_PARS}
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.07 + 13.1; a *= 0.5; } return s; }
void main() {
  float r = length(vW.xz);
  // puddles: larger and more connected close to the horse, sparser and smaller toward the edge
  float n = fbm(vW.xz * 0.055) * 0.75 + fbm(vW.xz * 0.21) * 0.25;
  float bias = 0.16 * (1.0 - smoothstep(6.0, uRadius * 0.6, r));
  float wet = smoothstep(0.5, 0.56, n + bias) * (1.0 - smoothstep(uRadius * 0.55, uRadius, r));
  // a damp darker margin round each puddle is drawn by the wet-sand ring (alpha), the mirror only where the water stands
  float margin = smoothstep(0.43, 0.5, n + bias) * (1.0 - smoothstep(uRadius * 0.55, uRadius, r));
  if (margin < 0.003) discard;
  vec3 V = normalize(cameraPosition - vW);
  // tiny wind ripples
  vec2 rp = vec2(vn(vW.xz * 1.3 + uTime * vec2(0.35, 0.1)), vn(vW.xz * 1.3 - uTime * vec2(0.12, 0.3))) - 0.5;
  vec3 N = normalize(vec3(rp.x * 0.05, 1.0, rp.y * 0.05));
  vec3 refl;
  if (uReal > 0.5) {
    vec4 uv = vUv;
    uv.xy += rp * 0.025 * uv.w;
    refl = texture2DProj(tDiffuse, uv).rgb;
  } else {
    vec3 d = uSkyRotT * reflect(-V, N);
    vec2 suv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
    refl = textureLod(tSky, suv, 1.0).rgb * uFogGain;
  }
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(V, N), 0.0), 5.0);
  vec3 damp = color;   // dark wet sand seen through the water
  vec3 col = mix(damp, refl, clamp(0.3 + 0.75 * fres, 0.0, 1.0) * wet);
  float alpha = max(wet, margin * 0.55);
  float sfa = skyFogAmount(cameraPosition, vW);
  col = mix(col, skyFogColor(-V), sfa);
  gl_FragColor = vec4(col, alpha);
}`;

export function createWater(scene: THREE.Scene, opts: { real: boolean; size: number; res: number; fog: SkyFog; sky: THREE.Texture; y: number }) {
  const geo = new THREE.PlaneGeometry(opts.size, opts.size, 1, 1);
  const uniforms = {
    color: { value: new THREE.Color(0.09, 0.065, 0.045) },
    tDiffuse: { value: null as THREE.Texture | null },
    textureMatrix: { value: new THREE.Matrix4() },
    uTime: { value: 0 },
    uReal: { value: opts.real ? 1 : 0 },
    uRadius: { value: opts.size / 2 },
    tSky: { value: opts.sky },
    ...opts.fog.uniforms,
  };
  const shader = { name: "LegacyWater", uniforms, vertexShader: VS, fragmentShader: FS };
  let mesh: THREE.Mesh;
  if (opts.real) {
    mesh = new Reflector(geo, { shader, textureWidth: opts.res, textureHeight: opts.res, clipBias: 0.002, multisample: 0 });
    // Reflector clones the uniforms: point the shared fog uniforms back at the live objects
    const mu = (mesh.material as THREE.ShaderMaterial).uniforms;
    Object.assign(mu, opts.fog.uniforms, { tSky: { value: opts.sky } });
    uniforms.uTime = mu.uTime;
  } else {
    mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: FS }));
  }
  const mat = mesh.material as THREE.ShaderMaterial;
  mat.transparent = true;
  mat.depthWrite = false;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = opts.y;
  mesh.renderOrder = 1;
  mesh.name = "legacy-water";
  scene.add(mesh);
  return {
    mesh,
    update(time: number) {
      (mat.uniforms.uTime as THREE.IUniform<number>).value = time;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      (mesh as Reflector).dispose?.();
    },
  };
}
