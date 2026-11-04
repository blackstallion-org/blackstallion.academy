import * as THREE from "three";
import { disposeObject, loadMarwari, releaseRenderer, type Marwari } from "@/components/3d/marwari";
import { framing, lerpFactor, orbit, type Framing } from "./choreography";
import { WAVE_FRAGMENT, WAVE_VERTEX } from "./shaders";

/**
 * The WebGL half of "Bronze and Time": a bronze statue on a black stage, lit like a foundry (one hard key, a cold rim, a faint
 * warm fill), a camera that circles it once as the page scrolls, forge sparks that speed up and swirl when you scroll fast,
 * and a liquid-bronze wave on a plane that rides on the camera.
 *
 * The statue is the academy's own rigged Marwari (the model the home hero already downloads), posed from one of its clips and
 * cast in a bronze material: nothing is loaded from anywhere else. The engine has no timers of its own: whoever owns the
 * page's animation frame calls `frame()` with the time since the last call and the scroll progress, so the scene, the text
 * and the grid stay on one clock.
 */

export type Quality = "high" | "low";

const SETTINGS: Record<Quality, { pixelRatio: number; sparks: number; shadow: number }> = {
  high: { pixelRatio: 2, sparks: 450, shadow: 2048 },
  low: { pixelRatio: 1.5, sparks: 260, shadow: 1024 },
};

/** A pose is one instant of one of the model's clips (the statue is a still: a cast catches a single moment). */
export type PoseSpec = { clip: string; time: number };

/** The cast: a metal takes its colour from its specular reflection, so these are reflectance colours, not paint. */
export const BRONZE = { body: "#b3834a", hair: "#8f5f2c", eye: "#7a5228", metalness: 0.92, roughness: 0.42 } as const;

/** Where the statue is placed: scaled so its largest dimension is 3.5 units, centred, and lowered a little. */
const STATUE_SIZE = 2.7;
const STATUE_DROP = -0.4;

export class BronzeStage {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly pivot = new THREE.Group();
  private readonly uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 },
  };
  private readonly wave: THREE.Mesh;
  private readonly sparks: THREE.Points;
  private readonly spark: { vx: Float32Array; vy: Float32Array; vz: Float32Array; sway: Float32Array; radius: Float32Array; phase: Float32Array };
  private readonly sparkTexture: THREE.CanvasTexture;
  private readonly settings: (typeof SETTINGS)["high"];
  private readonly mouse = new THREE.Vector2();
  private readonly pointer = new THREE.Vector2();
  private marwari: Marwari | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private stopLoading: (() => void) | null = null;
  private view: Framing = framing(1);
  private pixelRatio: number;
  private progress = 0;
  private cameraProgress = 0;
  private time = 0;
  private snap = true;
  private slow = 0;
  private frames = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, quality: Quality, width: number, height: number) {
    this.settings = SETTINGS[quality];
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.settings.pixelRatio);

    this.scene.background = new THREE.Color("#000000");
    this.scene.fog = new THREE.FogExp2("#000000", 0.01);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    this.camera.position.set(0, 0.2, 3.0);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.8;

    // Liquid-bronze wave: a plane that is a child of the camera, far behind everything, drawn first, never depth tested.
    const material = new THREE.ShaderMaterial({ vertexShader: WAVE_VERTEX, fragmentShader: WAVE_FRAGMENT, uniforms: this.uniforms, depthWrite: false, depthTest: false });
    this.wave = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), material);
    this.wave.position.set(0, 0, -8);
    this.wave.renderOrder = -10;
    this.camera.add(this.wave);

    // Chiaroscuro: a hard white key from the upper right (it casts the shadows), a cold rim from behind left, a faint warm fill.
    this.scene.add(new THREE.AmbientLight("#ffffff", 0.1));
    const key = new THREE.SpotLight("#ffffff", 14.0);
    key.position.set(4, 6, 3);
    key.angle = Math.PI / 4;
    key.penumbra = 0.9;
    key.castShadow = true;
    key.shadow.mapSize.set(this.settings.shadow, this.settings.shadow);
    key.shadow.camera.near = 1.0;
    key.shadow.camera.far = 15;
    key.shadow.bias = -0.001;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight("#e3f2ff", 5.0);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    const fill = new THREE.DirectionalLight("#fff3e6", 0.8);
    fill.position.set(-2, -4, 2);
    this.scene.add(fill);

    // Forge sparks: additive points, 60 % molten orange and 40 % icy blue, each with its own drift and sway.
    const n = this.settings.sparks;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    this.spark = { vx: new Float32Array(n), vy: new Float32Array(n), vz: new Float32Array(n), sway: new Float32Array(n), radius: new Float32Array(n), phase: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;
      if (Math.random() < 0.6) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.15;
        colors[i * 3 + 2] = 0.05 + Math.random() * 0.1;
      } else {
        colors[i * 3] = 0.55 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.82 + Math.random() * 0.12;
        colors[i * 3 + 2] = 1.0;
      }
      this.spark.vx[i] = (Math.random() - 0.5) * 0.4;
      this.spark.vy[i] = 0.15 + Math.random() * 0.3;
      this.spark.vz[i] = (Math.random() - 0.5) * 0.4;
      this.spark.sway[i] = 0.5 + Math.random() * 1.5;
      this.spark.radius[i] = 0.05 + Math.random() * 0.15;
      this.spark.phase[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.sparkTexture = sparkTexture();
    this.sparks = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, map: this.sparkTexture }),
    );
    this.sparks.frustumCulled = false; // they move all the time, inside a box the initial bounds already cover
    this.scene.add(this.sparks);

    this.scene.add(this.pivot);
    this.resize(width, height);
  }

  /** Downloads the model (cached if the page already fetched it), casts it in bronze, poses it and puts it on the stage. */
  async load(url: string, pose: PoseSpec): Promise<void> {
    const loading = loadMarwari(url);
    this.stopLoading = loading.dispose;
    const marwari = await loading.promise;
    if (this.disposed) {
      disposeObject(marwari.root);
      return;
    }
    this.marwari = marwari;
    // a statue's mane and tail do not stir
    marwari.hair.flow.value = 0;
    marwari.hair.wind.value.set(0, 0, 0);
    marwari.hair.sheen.value = 0.01;
    this.castBronze(marwari);
    this.pivot.add(marwari.root);
    this.setPose(pose);
  }

  get ready() {
    return this.marwari !== null;
  }

  get clipNames(): string[] {
    return this.marwari ? [...this.marwari.clips.keys()] : [];
  }

  /** Sets the statue's pose to one instant of a clip, then scales and centres it (the pose changes its extents). */
  setPose({ clip, time }: PoseSpec) {
    const m = this.marwari;
    const source = m?.clips.get(clip);
    if (!m || !source) return;
    this.mixer ??= new THREE.AnimationMixer(m.root);
    this.mixer.stopAllAction();
    this.mixer.clipAction(source).play();
    this.mixer.setTime(time);
    m.root.scale.setScalar(1);
    m.root.position.set(0, 0, 0);
    m.root.updateMatrixWorld(true);
    m.mesh.skeleton.update();
    const size = new THREE.Box3().setFromObject(m.root, true).getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z);
    m.root.scale.setScalar(STATUE_SIZE / (longest > 0.0001 ? longest : 1));
    m.root.updateMatrixWorld(true);
    m.mesh.skeleton.update();
    const centre = new THREE.Box3().setFromObject(m.root, true).getCenter(new THREE.Vector3());
    m.root.position.sub(centre);
    this.pivot.position.y = STATUE_DROP;
    this.snap = true;
  }

  private castBronze(m: Marwari) {
    const cast = (source: THREE.MeshStandardMaterial, roughness: number, normal = 0.6) =>
      new THREE.MeshStandardMaterial({
        color: BRONZE.body,
        metalness: BRONZE.metalness,
        roughness,
        normalMap: source.normalMap,
        normalScale: new THREE.Vector2(normal, normal),
        aoMap: source.aoMap,
        aoMapIntensity: 0.85,
      });
    m.root.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material.name === "Marwari_Hair") {
        // The mane and tail are alpha-tested ribbons with their own strand shader: keep it, cast them in bronze.
        material.color.set(BRONZE.hair);
        material.metalness = 0.85;
        material.roughness = 0.45;
        // the atlas is near-black, so the colour alone would cast black hair: an emissive floor of the same bronze keeps it metal
        material.emissive.set(BRONZE.hair);
        material.emissiveIntensity = 0.3;
        // solid ribbons (no coverage dither): a cast is not see-through
        material.alphaToCoverage = false;
        material.alphaTest = 0.4;
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        return;
      }
      if (material.name === "Marwari_Eye") {
        // A cast has no painted eyes: a bronze dome, a little more polished than the body.
        const eye = cast(material, 0.3, 0);
        eye.color.set(BRONZE.eye);
        mesh.material = eye;
      } else {
        mesh.material = cast(material, BRONZE.roughness);
      }
      material.dispose();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }

  /** Where the pointer is, in the stage: -1..1 on both axes, y down (the same convention as the reference). */
  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height, false);
    this.view = framing(width / height);
    // The wave is laid out in drawing-buffer pixels, so it looks the same at every pixel ratio.
    this.renderer.getDrawingBufferSize(this.uniforms.uResolution.value);
  }

  /** The next frame jumps to the target instead of easing there (after the page was off screen, or a new pose). */
  jump() {
    this.snap = true;
  }

  /**
   * One frame. `dt` seconds since the last call, `target` the scroll progress (0..1) of the section. Returns the smoothed
   * progress the scene is drawn at (the page's text and grid follow it, not the raw scroll) and how far it still has to travel.
   */
  frame(dt: number, target: number): { progress: number; velocity: number } {
    this.measure(dt);
    dt = Math.min(dt, 0.05);
    this.time += dt;

    if (this.snap) {
      this.progress = target;
      this.cameraProgress = target;
      this.snap = false;
    }
    this.progress += (target - this.progress) * lerpFactor(0.025, dt);
    this.mouse.lerp(this.pointer, lerpFactor(0.05, dt));
    const velocity = Math.abs(target - this.progress);

    // The statue leans a little towards the pointer.
    this.pivot.rotation.y = this.mouse.x * 0.25;
    this.pivot.rotation.x = this.mouse.y * 0.15;

    this.moveSparks(dt, velocity);

    // The camera circles the statue once over the whole track and eases after the (already eased) progress. It eases along the
    // orbit, not along the straight line between two points of it: after a jump (the chapter index) the line would pass through the horse.
    this.cameraProgress += (this.progress - this.cameraProgress) * lerpFactor(0.025, dt);
    const pose = orbit(this.cameraProgress, this.view);
    this.camera.position.set(...pose.position);
    this.camera.lookAt(...pose.lookAt);

    this.uniforms.uTime.value = this.time;
    this.uniforms.uMouse.value.set(this.mouse.x, -this.mouse.y);
    this.uniforms.uScroll.value = this.progress;

    this.renderer.render(this.scene, this.camera);
    return { progress: this.progress, velocity };
  }

  private moveSparks(dt: number, velocity: number) {
    const positions = this.sparks.geometry.attributes.position.array as Float32Array;
    const speed = 1 + velocity * 9;
    const turbulence = velocity * 0.8;
    const s = this.spark;
    for (let i = 0; i < s.vx.length; i++) {
      const k = i * 3;
      positions[k] += s.vx[i] * dt * speed;
      positions[k + 1] += s.vy[i] * dt * speed;
      positions[k + 2] += s.vz[i] * dt * speed;
      const sway = s.radius[i] * (1 + turbulence * 4);
      positions[k] += Math.sin(this.time * s.sway[i] + s.phase[i]) * sway * dt;
      positions[k + 2] += Math.cos(this.time * s.sway[i] + s.phase[i]) * sway * dt;
      // out of bounds: back to the bottom, near the middle
      if (positions[k + 1] > 3.0 || Math.abs(positions[k]) > 3.5 || Math.abs(positions[k + 2]) > 3.5) {
        positions[k + 1] = -2.5;
        positions[k] = (Math.random() - 0.5) * 3.0;
        positions[k + 2] = (Math.random() - 0.5) * 3.0;
      }
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  /** Adaptive resolution: if frames keep arriving slower than 40 per second, draw fewer pixels (never fewer than one per CSS pixel). */
  private measure(rawDt: number) {
    if (rawDt <= 0 || rawDt > 0.25) return; // the first frame after a pause is not a measurement
    this.frames++;
    if (rawDt > 1 / 40) this.slow++;
    if (this.frames < 45) return;
    if (this.slow > 30 && this.pixelRatio > 1) {
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight, false);
      this.renderer.getDrawingBufferSize(this.uniforms.uResolution.value);
    }
    this.frames = 0;
    this.slow = 0;
  }

  get currentPixelRatio() {
    return this.pixelRatio;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoading?.();
    this.mixer?.stopAllAction();
    if (this.marwari) disposeObject(this.marwari.root);
    this.sparks.geometry.dispose();
    (this.sparks.material as THREE.Material).dispose();
    this.sparkTexture.dispose();
    this.wave.geometry.dispose();
    (this.wave.material as THREE.Material).dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.SpotLight || o instanceof THREE.DirectionalLight) o.shadow.map?.dispose();
    });
    releaseRenderer(this.renderer);
  }
}

/** A white core fading to transparent: the glow of one spark. */
function sparkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}
