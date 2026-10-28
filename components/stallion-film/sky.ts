import * as THREE from "three";
import { GLSL_NOISE } from "./noise";

/** Everything that defines the light and air of one place: sky, sun, haze, exposure. */
export type Atmosphere = {
  top: THREE.ColorRepresentation;
  horizon: THREE.ColorRepresentation;
  ground: THREE.ColorRepresentation;
  sunDir: THREE.Vector3;
  sunColor: THREE.ColorRepresentation;
  sunIntensity: number;
  hemiSky: THREE.ColorRepresentation;
  hemiGround: THREE.ColorRepresentation;
  hemiIntensity: number;
  fog: THREE.ColorRepresentation;
  fogDensity: number;
  exposure: number;
  haze: number;
  cirrus: number;
  envIntensity: number;
};

const VS = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w * 0.9999;
}`;

const FS = /* glsl */ `
${GLSL_NOISE}
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGround; uniform vec3 uSunDir; uniform vec3 uSunColor;
uniform float uHaze; uniform float uCirrus; uniform float uTime;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float up = clamp(d.y, -1.0, 1.0);
  vec3 col = mix(uHorizon, uTop, pow(clamp(up, 0.0, 1.0), 0.55));
  col = mix(col, uGround, smoothstep(0.0, -0.08, up));
  float sun = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(sun, 900.0) * 6.0 + pow(sun, 24.0) * 0.45 + pow(sun, 5.0) * 0.12);
  col += uHorizon * uHaze * exp(-abs(up) * 7.0);
  if (uCirrus > 0.0 && up > 0.02) {
    vec2 p = d.xz / (up + 0.25) * 2.2;
    float c = vnoise(vec2(p.x * 0.8, p.y * 3.5) + uTime * 0.004, 51) * 0.6 + vnoise(vec2(p.x * 1.9, p.y * 7.0), 52) * 0.4;
    c = smoothstep(0.55, 0.95, c) * uCirrus * smoothstep(0.02, 0.4, up);
    col = mix(col, uSunColor * 0.9 + uHorizon * 0.4, c * 0.55);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class Sky {
  readonly mesh: THREE.Mesh;
  readonly uniforms: Record<string, THREE.IUniform>;
  constructor() {
    this.uniforms = {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGround: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 0.3, 1) },
      uSunColor: { value: new THREE.Color() },
      uHaze: { value: 0.3 },
      uCirrus: { value: 0 },
      uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, fog: false });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    this.mesh.name = "sky";
  }
  set(atm: Atmosphere) {
    (this.uniforms.uTop.value as THREE.Color).set(atm.top);
    (this.uniforms.uHorizon.value as THREE.Color).set(atm.horizon);
    (this.uniforms.uGround.value as THREE.Color).set(atm.ground);
    (this.uniforms.uSunDir.value as THREE.Vector3).copy(atm.sunDir).normalize();
    (this.uniforms.uSunColor.value as THREE.Color).set(atm.sunColor);
    this.uniforms.uHaze.value = atm.haze;
    this.uniforms.uCirrus.value = atm.cirrus;
  }
  follow(camera: THREE.Camera, time: number) {
    this.mesh.position.copy(camera.position);
    this.uniforms.uTime.value = time;
  }
  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

export const ATMOSPHERES: Record<"desert" | "village" | "campus", Atmosphere> = {
  // Rajasthan, an hour before sunset: low gold sun, dusty rose horizon
  desert: {
    top: "#4f6f93", horizon: "#e9b985", ground: "#b98f62", sunDir: new THREE.Vector3(0.62, 0.34, 0.5), sunColor: "#ffd9a8", sunIntensity: 3.4,
    hemiSky: "#aebdcc", hemiGround: "#5d4c3a", hemiIntensity: 0.55, fog: "#dcb68a", fogDensity: 0.0042, exposure: 1.0, haze: 0.45, cirrus: 0.5, envIntensity: 0.38,
  },
  // the village mid-afternoon: warm, high-ish sun, lime-plaster bounce
  village: {
    top: "#6b8db3", horizon: "#f0d2a6", ground: "#bda27c", sunDir: new THREE.Vector3(0.52, 0.72, 0.38), sunColor: "#ffecd0", sunIntensity: 3.5,
    hemiSky: "#b9c7d6", hemiGround: "#65523e", hemiIntensity: 0.6, fog: "#e8cfa6", fogDensity: 0.0032, exposure: 1.0, haze: 0.3, cirrus: 0.2, envIntensity: 0.4,
  },
  // the academy, clean morning light
  campus: {
    top: "#4a83c6", horizon: "#d9e3ea", ground: "#8a8f72", sunDir: new THREE.Vector3(0.85, 0.62, -0.3), sunColor: "#fff3dc", sunIntensity: 3.6,
    hemiSky: "#c3d3e6", hemiGround: "#5d6648", hemiIntensity: 0.65, fog: "#dbe0d4", fogDensity: 0.0026, exposure: 1.0, haze: 0.2, cirrus: 0.35, envIntensity: 0.42,
  },
};
