import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { loadRunner, type Runner } from "./runner";
import { siteFonts } from "./canvas-text";

export type StationCtx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** A studio reflection map for metal and glass. */
  env: THREE.Texture;
  mobile: boolean;
  fonts: ReturnType<typeof siteFonts>;
  /** Seconds since start. */
  time: number;
  /** Current run speed factor (1 at rest, higher while scrolling fast). */
  pace: number;
  /** Smoothed page progress, 0 to 1. */
  progress: number;
  /** World z of the horse (it runs toward -z). */
  horseZ: number;
  /** Runway length: the horse is at z = -progress * length. */
  length: number;
};

/** One stop along the runway. `local` is its own progress (0 to 1 across `range`; below 0 before, above 1 after). */
export type Station = {
  id: string;
  range: [number, number];
  build: (ctx: StationCtx) => THREE.Object3D;
  update?: (local: number, ctx: StationCtx, dt: number) => void;
  dispose?: () => void;
};

export type RunwayOptions = {
  canvas: HTMLCanvasElement;
  model: string;
  stations: ((ctx: StationCtx) => Station)[];
  background: string;
  mobile: boolean;
  /** Runway length in metres covered from progress 0 to 1. */
  length?: number;
  /** Camera offsets from the horse (and look-at offsets) at evenly spaced progress points. */
  shots?: { eye: [number, number, number]; look: [number, number, number] }[];
};

const DEFAULT_SHOTS: RunwayOptions["shots"] = [
  { eye: [6.6, 1.4, 0.2], look: [0, 1.15, 1.25] }, // hero: side profile, horse on the right of the frame
  { eye: [-2.2, 2.4, 6.8], look: [0, 1.2, -4] }, // chasing from the rear left: card stacks
  { eye: [0.4, 1.7, 7.4], look: [0, 1.6, -6] }, // straight behind, under the HUD arch
  { eye: [2.6, 3.1, 5.2], look: [-1.6, 0.9, -3.5] }, // high right, looking across at the knob console on the left
  { eye: [-0.6, 2.0, 5.8], look: [0, 1.3, -6] }, // through the glass
  { eye: [0, 3.8, 13], look: [0, 3.2, -14] }, // pulled back high: the mark ahead
];

/**
 * A scroll-driven runway: a running horse, a camera that follows it along a path, and stations it passes. Plain three.js;
 * the page owns scroll and UI and calls `setProgress`. Rendering pauses whenever `setActive(false)` is called.
 */
export class RunwayEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  private ctx: StationCtx;
  private stations: Station[] = [];
  private runner: Runner | null = null;
  private floor: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private eyeCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;
  private target = 0;
  private lastTarget = 0;
  private raf = 0;
  private active = true;
  private clock = new THREE.Clock();
  private length: number;
  private pmrem: THREE.PMREMGenerator;
  private ro: ResizeObserver;
  private eye = new THREE.Vector3();
  private look = new THREE.Vector3();
  onReady?: () => void;

  constructor(private o: RunwayOptions) {
    this.length = o.length ?? 118;
    this.renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.mobile ? 1.25 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 8, 6);
    this.scene.add(key);

    const shots = o.shots ?? DEFAULT_SHOTS!;
    this.eyeCurve = new THREE.CatmullRomCurve3(shots.map((s) => new THREE.Vector3(...s.eye)));
    this.lookCurve = new THREE.CatmullRomCurve3(shots.map((s) => new THREE.Vector3(...s.look)));

    this.floor = this.makeFloor();
    this.scene.add(this.floor);

    this.ctx = { scene: this.scene, camera: this.camera, env, mobile: o.mobile, fonts: siteFonts(), time: 0, pace: 1, progress: 0, horseZ: 0, length: this.length };
    for (const make of o.stations) {
      const s = make(this.ctx);
      this.scene.add(s.build(this.ctx));
      this.stations.push(s);
    }
    this.setBackground(o.background);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(o.canvas);
    this.resize();

    loadRunner(o.model)
      .then((r) => {
        this.runner = r;
        r.root.rotation.y = Math.PI; // the model's head points +z; the runway runs toward -z
        this.scene.add(r.root);
        this.onReady?.();
      })
      .catch((e) => console.error("runway: model", e));

    this.clock.start();
    this.loop();
  }

  private makeFloor() {
    const geo = new THREE.PlaneGeometry(60, this.length + 120, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uScroll: { value: 0 }, uBg: { value: new THREE.Color() }, uHorse: { value: 0 } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `
        varying vec3 vW; uniform float uScroll; uniform float uHorse;
        float grid(float v, float s){ float d = abs(fract(v / s - 0.5) - 0.5) * s; return 1.0 - smoothstep(0.0, fwidth(v) * 1.2, d); }
        void main(){
          float z = vW.z + uScroll;
          float minor = max(grid(vW.x, 1.0), grid(z, 1.0)) * 0.22;
          float major = max(grid(vW.x, 4.0), grid(z, 4.0)) * 0.55;
          float lane = (1.0 - smoothstep(0.02, 0.05, abs(abs(vW.x) - 1.6))) * 0.9;
          float a = max(max(minor, major), lane);
          float fade = 1.0 - smoothstep(10.0, 46.0, length(vec2(vW.x, vW.z - uHorse)));
          gl_FragColor = vec4(vec3(1.0), a * fade);
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.z = -this.length / 2;
    return m;
  }

  setBackground(color: string) {
    const c = new THREE.Color(color);
    this.scene.background = c;
    this.scene.fog = new THREE.Fog(c, 26, 70);
    this.floor.material.uniforms.uBg.value.copy(c);
  }

  /** Page progress, 0 to 1. The engine eases toward it. */
  setProgress(p: number) {
    this.target = THREE.MathUtils.clamp(p, 0, 1);
  }

  /** Jump straight to a progress value (no easing): used for RESTART and reduced motion. */
  jump(p: number) {
    this.target = this.ctx.progress = this.lastTarget = THREE.MathUtils.clamp(p, 0, 1);
  }

  setActive(on: boolean) {
    this.active = on;
    if (on && !this.raf) {
      this.clock.getDelta();
      this.loop();
    }
  }

  /** Render one still frame and stop (reduced motion). */
  still() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.step(0);
  }

  private resize() {
    const c = this.o.canvas;
    const w = c.clientWidth || 1;
    const h = c.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Narrow screens: widen the lens so the horse stays in frame.
    this.camera.fov = w / h < 0.8 ? 58 : 38;
    this.camera.updateProjectionMatrix();
    if (!this.active) this.step(0);
  }

  private loop = () => {
    this.raf = this.active ? requestAnimationFrame(this.loop) : 0;
    if (!this.active) return;
    this.step(Math.min(this.clock.getDelta(), 0.05));
  };

  private step(dt: number) {
    const c = this.ctx;
    c.time += dt;
    c.progress += (this.target - c.progress) * (1 - Math.exp(-dt * 3.2));
    if (dt === 0) c.progress = this.target;
    const speed = dt > 0 ? Math.abs(this.target - this.lastTarget) / dt : 0;
    this.lastTarget = this.target;
    c.pace += (1 + Math.min(speed * 6, 0.9) - c.pace) * (1 - Math.exp(-dt * 4));

    c.horseZ = -c.progress * this.length;
    if (this.runner) {
      this.runner.root.position.set(0, 0, c.horseZ);
      this.runner.mixer.timeScale = c.pace;
      this.runner.mixer.update(dt);
    }
    // The ground streams under the hooves even when the page is still: a treadmill.
    this.floor.material.uniforms.uScroll.value += dt * 7 * c.pace;
    this.floor.material.uniforms.uHorse.value = c.horseZ;

    this.eyeCurve.getPoint(c.progress, this.eye);
    this.lookCurve.getPoint(c.progress, this.look);
    this.camera.position.set(this.eye.x, this.eye.y, this.eye.z + c.horseZ);
    this.camera.lookAt(this.look.x, this.look.y, this.look.z + c.horseZ);

    for (const s of this.stations) s.update?.((c.progress - s.range[0]) / (s.range[1] - s.range[0]), c, dt);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.runner?.dispose();
    this.stations.forEach((s) => s.dispose?.());
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => {
        Object.values(mat).forEach((v) => (v as THREE.Texture)?.isTexture && (v as THREE.Texture).dispose());
        mat.dispose();
      });
    });
    this.ctx.env.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}
