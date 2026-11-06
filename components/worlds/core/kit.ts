import * as THREE from "three";

/**
 * Shared building blocks for the world modules: an image-based sky (HDRI or a Blender-rendered panorama) that also lights the
 * scene, a sun that keeps its shadow map on the subject, and soft GPU particles (dust, spores, sand, stars, light motes).
 */

/** Uses an equirectangular texture as both the visible sky and the image-based light. Returns a disposer. */
export function applySky(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  tex: THREE.Texture,
  opts: { rotation?: number; intensity?: number; envIntensity?: number; blur?: number; envFrom?: THREE.Texture } = {},
) {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = tex;
  scene.backgroundRotation.set(0, opts.rotation ?? 0, 0);
  scene.backgroundIntensity = opts.intensity ?? 1;
  scene.backgroundBlurriness = opts.blur ?? 0;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envSrc = opts.envFrom ?? tex;
  envSrc.mapping = THREE.EquirectangularReflectionMapping;
  const rt = pmrem.fromEquirectangular(envSrc);
  scene.environment = rt.texture;
  scene.environmentRotation.set(0, opts.rotation ?? 0, 0);
  scene.environmentIntensity = opts.envIntensity ?? 1;
  pmrem.dispose();
  return () => { rt.dispose(); };
}

/** A directional sun whose shadow frustum follows a focus point (the horse), so a 2K map stays sharp on the subject. */
export class Sun {
  readonly light: THREE.DirectionalLight;
  private dir = new THREE.Vector3();
  constructor(scene: THREE.Scene, dir: THREE.Vector3Like, color: THREE.ColorRepresentation, intensity: number, radius = 12) {
    this.light = new THREE.DirectionalLight(color, intensity);
    this.dir.set(dir.x, dir.y, dir.z).normalize();
    this.light.castShadow = true;
    const s = this.light.shadow;
    s.mapSize.set(2048, 2048);
    s.bias = -0.0003;
    s.normalBias = 0.02;
    s.camera.near = 0.5;
    s.camera.far = 400;
    s.camera.left = s.camera.bottom = -radius;
    s.camera.right = s.camera.top = radius;
    scene.add(this.light, this.light.target);
  }
  follow(p: THREE.Vector3Like) {
    this.light.target.position.set(p.x, p.y, p.z);
    this.light.position.set(p.x + this.dir.x * 120, p.y + this.dir.y * 120, p.z + this.dir.z * 120);
  }
  setShadowSize(n: number, enabled: boolean) {
    this.light.castShadow = enabled;
    if (this.light.shadow.mapSize.x !== n) {
      this.light.shadow.mapSize.set(n, n);
      this.light.shadow.map?.dispose();
      this.light.shadow.map = null as unknown as THREE.WebGLRenderTarget;
    }
  }
}

/**
 * Soft round particles drifting in a box around a centre (wraps, so the volume never empties). Additive or normal blending.
 * Positions animate on the GPU from `uTime`; `uOpacity` fades the whole cloud.
 */
export class Motes {
  readonly points: THREE.Points;
  readonly uniforms: Record<string, THREE.IUniform>;
  constructor(opts: {
    count: number;
    box: [number, number, number];
    center?: THREE.Vector3Like;
    size: number; // world units at 1 m (attenuated)
    color: THREE.ColorRepresentation;
    drift?: [number, number, number]; // m/s
    swirl?: number;
    additive?: boolean;
    opacity?: number;
    seed?: number;
  }) {
    const g = new THREE.BufferGeometry();
    const n = opts.count;
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n);
    let s = opts.seed ?? 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * opts.box[0];
      pos[i * 3 + 1] = (r() - 0.5) * opts.box[1];
      pos[i * 3 + 2] = (r() - 0.5) * opts.box[2];
      rnd[i] = r();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 1));
    this.uniforms = {
      uTime: { value: 0 },
      uBox: { value: new THREE.Vector3(...opts.box) },
      uCenter: { value: new THREE.Vector3(opts.center?.x ?? 0, opts.center?.y ?? 0, opts.center?.z ?? 0) },
      uDrift: { value: new THREE.Vector3(...(opts.drift ?? [0, 0, 0])) },
      uSwirl: { value: opts.swirl ?? 0.3 },
      uSize: { value: opts.size },
      uColor: { value: new THREE.Color(opts.color) },
      uOpacity: { value: opts.opacity ?? 1 },
      uPx: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: /* glsl */ `
        uniform float uTime; uniform vec3 uBox; uniform vec3 uCenter; uniform vec3 uDrift; uniform float uSwirl; uniform float uSize; uniform float uPx;
        attribute float aRnd; varying float vA;
        void main() {
          vec3 p = position + uDrift * uTime;
          p.x += sin(uTime * (0.3 + aRnd * 0.4) + aRnd * 40.0) * uSwirl;
          p.y += cos(uTime * (0.25 + aRnd * 0.3) + aRnd * 17.0) * uSwirl * 0.6;
          p = mod(p - uCenter + uBox * 0.5, uBox) - uBox * 0.5 + uCenter;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (0.5 + aRnd) * uPx * 300.0 / max(0.2, -mv.z);
          // fade near the box faces (no popping as particles wrap) and very close to the lens
          vec3 e = abs(p - uCenter) / (uBox * 0.5);
          vA = (1.0 - smoothstep(0.8, 1.0, max(e.x, max(e.y, e.z)))) * smoothstep(0.15, 0.8, -mv.z) * (0.4 + 0.6 * fract(aRnd * 7.3));
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacity; varying float vA;
        void main() {
          vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0;
          float a = exp(-r * 3.0) * vA * uOpacity;
          if (a < 0.004) discard;
          gl_FragColor = vec4(uColor, a);
        }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
  }
  update(time: number, pixelRatio = 1) {
    this.uniforms.uTime.value = time;
    this.uniforms.uPx.value = pixelRatio;
  }
  dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** p remapped from [a, b] to 0..1, clamped */
export const span = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
