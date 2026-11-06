import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { TransitionMode } from "./timeline";
import type { Grade } from "./types";

/**
 * The image chain: scene (linear HDR, half float) -> bloom -> grade + transition -> ACES tone map + sRGB.
 * Inside a boundary the second world is rendered into its own half-float target with its own camera and mixed here, so the eye,
 * the dust and the clouds are real dissolves between two live worlds, not fades over a still.
 * Exposure lives in the grade (not the renderer) so two worlds with different exposures can be mixed in linear light.
 */
const GRADE_FS = /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D tB;
uniform float uMix;
uniform int uMode;          // 0 none, 1 iris, 2 dust, 3 cloud, 4 colour fade (cheap)
uniform float uTime;
uniform float uAspect;
uniform vec2 uCenter;       // iris centre (uv)
uniform float uExpA; uniform float uExpB;
uniform vec3 uLiftA; uniform vec3 uGainA; uniform float uSatA;
uniform vec3 uLiftB; uniform vec3 uGainB; uniform float uSatB;
uniform float uVignette; uniform float uGrain;
uniform vec3 uFadeColor;
varying vec2 vUv;

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }

vec3 grade(vec3 c, float exposure, vec3 lift, vec3 gain, float sat) {
  c *= exposure;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, sat);
  // lift the darks toward a tint, push the lights toward another (both multiplicative in linear light)
  float w = clamp(l / (l + 0.35), 0.0, 1.0);
  c *= mix(lift, gain, w);
  return c;
}

void main() {
  vec2 uv = vUv;
  vec3 a0 = texture2D(tDiffuse, uv).rgb;
  // a stray NaN or infinity in either world (a shader dividing by zero at a grazing angle) must not black out the frame
  a0 = any(isnan(a0)) || any(isinf(a0)) ? vec3(0.0) : min(a0, vec3(64.0));
  vec3 a = grade(a0, uExpA, uLiftA, uGainA, uSatA);
  vec3 col = a;
  if (uMode > 0) {
    vec3 b0 = uMode == 4 ? vec3(0.0) : texture2D(tB, uv).rgb;
    b0 = any(isnan(b0)) || any(isinf(b0)) ? vec3(0.0) : min(b0, vec3(64.0));
    vec3 b = grade(b0, uExpB, uLiftB, uGainB, uSatB);
    vec2 q = vec2((uv.x - uCenter.x) * uAspect, uv.y - uCenter.y);
    float m = 0.0;
    vec3 glow = vec3(0.0);
    if (uMode == 1) {
      // through the eye: the new world opens from the pupil outward, a soft gold rim at the edge
      float r = pow(uMix, 1.6) * 1.9;
      float edgeN = (fbm(normalize(q + 1e-4) * 3.0 + uTime * 0.15) - 0.5) * 0.08 * (0.3 + uMix);
      float d = length(q) + edgeN;
      m = 1.0 - smoothstep(r - 0.06, r + 0.01, d);
      float rim = exp(-pow((d - r) / 0.012, 2.0)) * smoothstep(0.0, 0.12, uMix) * (1.0 - smoothstep(0.7, 1.0, uMix));
      glow = vec3(1.0, 0.7, 0.3) * rim * 0.9;
      // and the old world darkens toward the pupil as we go in
      a *= mix(1.0, 0.25, smoothstep(0.0, 0.6, uMix));
    } else if (uMode == 2) {
      // the light dissolves into drifting grains: a warm noise dissolve that sweeps upward like wind-blown sand
      float n = fbm(vec2(uv.x * uAspect, uv.y) * 5.0 + vec2(uTime * 0.18, -uTime * 0.05)) * 0.75 + (1.0 - uv.y) * 0.25;
      float t = uMix * 1.35 - 0.15;
      m = smoothstep(n - 0.06, n + 0.06, t);
      float edge = exp(-pow((t - n) / 0.05, 2.0));
      glow = vec3(1.0, 0.68, 0.30) * edge * 1.6 * (1.0 - smoothstep(0.85, 1.0, uMix));
    } else if (uMode == 3) {
      // rising through cloud: the old world whites out into moving cloud, then the cloud thins over the new one
      vec2 cq = vec2(uv.x * uAspect * 1.3, uv.y * 1.3 - uMix * 3.0);
      float n = fbm(cq + vec2(uTime * 0.02, -uTime * 0.05));
      float n2 = fbm(cq * 2.7 + 11.0 - vec2(0.0, uMix * 2.0));
      float billow = smoothstep(0.25, 0.85, n * 0.7 + n2 * 0.45);
      // lit cloud tops, warm-grey undersides: the shapes read as cloud, not a white fade
      vec3 cloud = mix(vec3(0.52, 0.46, 0.42), vec3(1.05, 0.98, 0.9), billow) * 1.15;
      float inA = smoothstep(0.0, 0.5, uMix + (n - 0.5) * 0.35);
      float outB = smoothstep(0.5, 1.0, uMix + (n - 0.5) * 0.35);
      vec3 left = mix(a, cloud, inA);
      col = mix(left, b, outB);
      m = -1.0;
    } else if (uMode == 4) {
      float f = 1.0 - abs(uMix * 2.0 - 1.0);
      col = mix(a, uFadeColor, smoothstep(0.0, 1.0, f));
      m = -1.0;
    }
    if (m >= 0.0) col = mix(a, b, m) + glow;
  }
  // vignette and grain (after the mix, so both worlds share the lens)
  vec2 vq = (uv - 0.5) * vec2(uAspect, 1.0);
  col *= 1.0 - uVignette * smoothstep(0.35, 1.25, length(vq));
  col += (h21(uv * 1024.0 + fract(uTime * 7.13) * 91.7) - 0.5) * uGrain * (0.25 + 0.75 * smoothstep(0.0, 0.3, dot(col, vec3(0.33))));
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

/**
 * Runs before the bloom. A single NaN or infinite pixel in the scene (a sun disc overflowing half float, a shader dividing by zero at
 * a grazing angle) is spread over the whole frame by the bloom's blurs on some GPUs (Apple Metal in particular) and the picture
 * goes black. The test reads the exponent bits, so it still works when the driver compiles with fast-math (where isnan() is
 * folded away), and the values are capped well above anything the grade needs.
 */
const SANITIZE_FS = /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
float clean(float v) {
  uint b = floatBitsToUint(v);
  return (b & 0x7f800000u) == 0x7f800000u ? 0.0 : clamp(v, 0.0, 64.0);
}
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  gl_FragColor = vec4(clean(c.r), clean(c.g), clean(c.b), 1.0);
}`;

const VS = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const MODE: Record<TransitionMode | "none" | "fade", number> = { none: 0, iris: 1, dust: 2, cloud: 3, fade: 4 };

export class PostChain {
  readonly composer: EffectComposer;
  private render: RenderPass;
  private bloom: UnrealBloomPass;
  private sanitize: ShaderPass;
  private gradePass: ShaderPass;
  private rtB: THREE.WebGLRenderTarget;
  private size = new THREE.Vector2();

  constructor(private renderer: THREE.WebGLRenderer) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.render = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.6, 0.9);
    this.gradePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null }, tB: { value: null }, uMix: { value: 0 }, uMode: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 },
        uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uExpA: { value: 1 }, uExpB: { value: 1 },
        uLiftA: { value: new THREE.Color(1, 1, 1) }, uGainA: { value: new THREE.Color(1, 1, 1) }, uSatA: { value: 1 },
        uLiftB: { value: new THREE.Color(1, 1, 1) }, uGainB: { value: new THREE.Color(1, 1, 1) }, uSatB: { value: 1 },
        uVignette: { value: 0.35 }, uGrain: { value: 0.03 }, uFadeColor: { value: new THREE.Color("#171513") },
      },
      vertexShader: VS,
      fragmentShader: GRADE_FS,
    });
    this.sanitize = new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: VS, fragmentShader: SANITIZE_FS });
    this.composer.addPass(this.render);
    this.composer.addPass(this.sanitize);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.gradePass);
    this.composer.addPass(new OutputPass());
    this.rtB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 });
  }

  setSize(w: number, h: number, dpr: number) {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.renderer.getDrawingBufferSize(this.size);
    this.rtB.setSize(this.size.x, this.size.y);
    this.bloom.resolution.set(this.size.x / 2, this.size.y / 2);
    this.gradePass.uniforms.uAspect.value = w / Math.max(1, h);
  }

  set bloomEnabled(v: boolean) {
    this.bloom.enabled = v;
    this.sanitize.enabled = v; // without bloom nothing spreads a bad pixel; the grade shader guards the rest
  }

  /**
   * Draw a frame. `b` (optional) is the second world inside a boundary; `mix` 0..1; `mode` its transition;
   * `center` the iris centre in uv (the eye on screen).
   */
  draw(
    a: { scene: THREE.Scene; camera: THREE.Camera; grade: Grade },
    b: { scene: THREE.Scene; camera: THREE.Camera; grade: Grade } | null,
    mix: number,
    mode: TransitionMode | "fade" | null,
    time: number,
    center?: THREE.Vector2,
  ) {
    const u = this.gradePass.uniforms;
    this.render.scene = a.scene;
    this.render.camera = a.camera;
    const blend = (k: keyof Grade) => {
      const ga = a.grade[k] as number;
      const gb = (b?.grade[k] as number) ?? ga;
      return ga + (gb - ga) * mix;
    };
    const ga = a.grade;
    // bloom follows the world that dominates the frame
    const g = b && mix > 0.5 ? b.grade : ga;
    this.bloom.strength = g.bloom[0];
    this.bloom.radius = g.bloom[1];
    this.bloom.threshold = g.bloom[2];
    u.uExpA.value = ga.exposure;
    (u.uLiftA.value as THREE.Color).set(ga.lift);
    (u.uGainA.value as THREE.Color).set(ga.gain);
    u.uSatA.value = ga.saturation;
    u.uVignette.value = blend("vignette");
    u.uGrain.value = blend("grain");
    u.uTime.value = time;
    u.uMix.value = mix;
    if (center) (u.uCenter.value as THREE.Vector2).copy(center);
    if (b && mode) {
      u.uMode.value = MODE[mode];
      if (mode !== "fade") {
        this.renderer.setRenderTarget(this.rtB);
        this.renderer.clear();
        this.renderer.render(b.scene, b.camera);
        this.renderer.setRenderTarget(null);
        u.tB.value = this.rtB.texture;
      }
      u.uExpB.value = b.grade.exposure;
      (u.uLiftB.value as THREE.Color).set(b.grade.lift);
      (u.uGainB.value as THREE.Color).set(b.grade.gain);
      u.uSatB.value = b.grade.saturation;
    } else u.uMode.value = 0;
    this.composer.render();
  }

  dispose() {
    this.rtB.dispose();
    this.bloom.dispose();
    this.sanitize.dispose();
    this.composer.dispose();
  }
}
