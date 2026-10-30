import gsap from "gsap";
import * as THREE from "three";
import { mapPalette } from "@/lib/content/india-map";
import type { Meta, River, Terrain } from "./data";
import { HeightField } from "./heightfield";
import { buildRivers, createOceanMaterials, createRiverMaterial, createTerrainMaterial } from "./materials";
import { CameraRig, FOV, type Pose } from "./rig";

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  meta: Meta;
  terrain: Terrain;
  rivers: River[];
  coast: HTMLImageElement;
  quality: "high" | "low";
  reducedMotion: boolean;
  /** Pixels at the top and bottom of the canvas the picture keeps clear (the site's navigation, the controls). */
  inset?: { top: number; bottom: number };
  /** Called after every drawn frame (the overlay follows the camera from here). */
  onFrame?: () => void;
  onContextLost?: () => void;
};

export type Projected = { id: string; x: number; y: number; visible: boolean };

const KEY_DIRECTION = new THREE.Vector3(-0.8, 0.52, 0.36).normalize(); // from the west and a little from the camera, 28° up: the faces the camera sees are lit, the shadows fall away to the east

/**
 * The sculpture: one slab of land (India in sandstone, its neighbours muted), the sea around it, the rivers on it, a warm key
 * light with real shadows. It draws only when something changes (a drag, a camera move, the river light) and slows down when idle.
 */
export class IndiaEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 220);
  readonly rig: CameraRig;
  readonly heights: HeightField;
  private readonly river: ReturnType<typeof createRiverMaterial>;
  private readonly disposables: { dispose(): void }[] = [];
  private readonly places: { id: string; x: number; z: number }[];
  private readonly v3 = new THREE.Vector3();
  private tween: gsap.core.Tween | null = null;
  private width = 1;
  private height = 1;
  private dpr: number;
  private readonly dprCap: number;
  private dirty = true;
  private interacting = 0;
  private active = true;
  private reduced: boolean;
  private lastDraw = 0;
  private lastTick = 0;
  private slow = 0;
  private fast = 0;
  private frames = 0;
  private firstFrameDone = false;
  private lost = false;
  private flowLevel = 1;
  private cardShift = { sx: 0, sy: 0 };
  readonly stats = { frames: 0, avgMs: 0 };

  constructor(private readonly o: EngineOptions) {
    const { canvas, meta, terrain, rivers, quality } = o;
    this.reduced = o.reducedMotion;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.dprCap = Math.min(window.devicePixelRatio || 1, quality === "high" ? 2 : 1.5);
    this.dpr = this.dprCap;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(new THREE.Color(mapPalette.background));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    canvas.addEventListener("webglcontextlost", this.handleLost);
    this.scene.background = new THREE.Color(mapPalette.background);

    // ---- the slab
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(terrain.position, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(terrain.normal, 3));
    geometry.setAttribute("aAO", new THREE.BufferAttribute(terrain.ao, 1));
    geometry.setAttribute("aSd", new THREE.BufferAttribute(terrain.sd, 1));
    geometry.setIndex(new THREE.BufferAttribute(terrain.index, 1));
    geometry.computeBoundingSphere();
    const land = new THREE.Mesh(geometry, createTerrainMaterial(meta));
    land.castShadow = true;
    land.receiveShadow = true;
    land.name = "land";
    this.scene.add(land);
    this.disposables.push(geometry, land.material as THREE.Material);

    // ---- the sea and the sides of the block
    const coast = new THREE.Texture(o.coast);
    coast.needsUpdate = true;
    coast.minFilter = THREE.LinearFilter;
    coast.magFilter = THREE.LinearFilter;
    coast.generateMipmaps = false;
    const sea = createOceanMaterials(meta, coast);
    const [x0, x1] = meta.plate.x;
    const [z0, z1] = meta.plate.z;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0, (z0 + z1) / 2), sea.top);
    top.receiveShadow = false; // the land's shadow on the sea would trace the jagged coast as dark teeth; the coastal glow does the work
    top.name = "sea";
    this.scene.add(top);
    const inset = 0.004;
    const wall = (ax: number, az: number, bx: number, bz: number, nx: number, nz: number) => {
      const g = new THREE.BufferGeometry();
      const p = [ax, 0, az, bx, 0, bz, bx, meta.floor, bz, ax, meta.floor, az];
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute([nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz], 3));
      // wind the quad so its face looks outward
      const e1 = new THREE.Vector3(bx - ax, 0, bz - az);
      const e2 = new THREE.Vector3(0, meta.floor, 0);
      const face = e1.clone().cross(e2);
      g.setIndex(face.x * nx + face.z * nz >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
      const m = new THREE.Mesh(g, sea.side);
      this.scene.add(m);
      this.disposables.push(g);
    };
    wall(x0 + inset, z0, x0 + inset, z1, -1, 0);
    wall(x1 - inset, z0, x1 - inset, z1, 1, 0);
    wall(x0, z0 + inset, x1, z0 + inset, 0, -1);
    wall(x0, z1 - inset, x1, z1 - inset, 0, 1);
    this.disposables.push(top.geometry, coast, sea.top, sea.side);

    // ---- where things stand
    this.heights = HeightField.fromMesh(terrain.position, terrain.index, terrain.terrainTriangles, meta.plate);
    this.places = meta.places.map((p) => ({ id: p.id, x: p.x, z: p.z }));

    // ---- rivers
    this.river = createRiverMaterial();
    const ribbons = new THREE.Mesh(buildRivers(rivers, quality === "high" ? 0.012 : 0.03), this.river.material);
    ribbons.renderOrder = 2;
    ribbons.frustumCulled = false;
    ribbons.name = "rivers";
    this.scene.add(ribbons);
    this.disposables.push(ribbons.geometry, this.river.material);

    // ---- light
    const key = new THREE.DirectionalLight(0xffe9cc, 3.0);
    key.position.copy(KEY_DIRECTION).multiplyScalar(34);
    key.castShadow = true;
    const size = quality === "high" ? 2048 : 1024;
    key.shadow.mapSize.set(size, size);
    const cam = key.shadow.camera;
    cam.left = -11.5; cam.right = 11.5; cam.top = 11.5; cam.bottom = -11.5; cam.near = 4; cam.far = 80;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 2;
    this.scene.add(key, key.target);
    const fill = new THREE.HemisphereLight(0xb4c8cc, 0x575040, 0.8);
    this.scene.add(fill);
    // a faint cool light from the south-east so the shadow side keeps its form without going grey
    const kicker = new THREE.DirectionalLight(0xbcd0d2, 0.9);
    kicker.position.set(0.8, 0.35, 0.6).multiplyScalar(20);
    this.scene.add(kicker);

    this.rig = new CameraRig(this.camera, meta.plate, meta.india, this.heights);
    this.rig.setInset(o.inset?.top ?? 0, o.inset?.bottom ?? 0);
    this.setSize(canvas.clientWidth || 800, canvas.clientHeight || 500);
    this.rig.pose = this.rig.overviewPose();
    this.riverFlow(this.reduced ? 0 : 1);
    this.renderer.setAnimationLoop(this.tick);
  }

  // ------------------------------------------------------------------ public

  get placesList() { return this.places; }

  setReduced(reduced: boolean) {
    this.reduced = reduced;
    this.riverFlow(reduced ? 0 : 1);
    this.invalidate();
  }

  /** The picture is shifted to leave room for the information card (a fraction of the view). */
  setCardShift(sx: number, sy: number) {
    this.cardShift = { sx, sy };
  }

  setActive(active: boolean) {
    this.active = active;
    this.renderer.setAnimationLoop(active && !this.lost ? this.tick : null);
    if (active) this.invalidate();
  }

  /** Call before `setSize` when the clear margins change (they follow the breakpoint of the site's navigation). */
  setInset(top: number, bottom: number) {
    this.rig.setInset(top, bottom);
  }

  setSize(w: number, h: number) {
    this.width = Math.max(1, Math.round(w));
    this.height = Math.max(1, Math.round(h));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.rig.setAspect(this.camera.aspect, this.height);
    this.river.uniforms.uPixel.value = (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2)) / this.height;
    this.invalidate();
  }

  invalidate() { this.dirty = true; }

  beginInteraction() { this.interacting++; this.stopTween(); }
  endInteraction() { this.interacting = Math.max(0, this.interacting - 1); this.invalidate(); }

  stopTween() {
    this.tween?.kill();
    this.tween = null;
  }

  /** Camera to a pose: a smooth GSAP move, or one step under reduced motion. */
  moveTo(target: Pose, duration = 1.7) {
    this.stopTween();
    if (this.reduced || duration <= 0) {
      Object.assign(this.rig.pose, target);
      this.invalidate();
      return;
    }
    this.tween = gsap.to(this.rig.pose, { ...target, duration, ease: "power3.inOut", onUpdate: () => this.invalidate(), onComplete: () => { this.tween = null; } });
  }

  flyTo(id: string) {
    const p = this.places.find((q) => q.id === id);
    if (!p) return;
    this.moveTo(this.rig.focusPose(p.x, p.z, this.cardShift));
  }

  reset() {
    this.moveTo(this.rig.overviewPose(), 1.5);
  }

  zoomBy(factor: number) {
    this.stopTween();
    const to = { ...this.rig.pose, dist: THREE.MathUtils.clamp(this.rig.pose.dist * factor, this.rig.minDist, this.rig.maxDist) };
    if (this.reduced) { this.rig.pose.dist = to.dist; this.invalidate(); return; }
    this.tween = gsap.to(this.rig.pose, { dist: to.dist, duration: 0.5, ease: "power2.out", onUpdate: () => this.invalidate(), onComplete: () => { this.tween = null; } });
  }

  /** Screen position of each marker, in CSS pixels over the canvas. */
  project(): Projected[] {
    return this.places.map((p) => {
      const y = this.heights.maxNear(p.x, p.z, 0.05) + 0.05;
      this.v3.set(p.x, y, p.z).project(this.camera);
      const visible = this.v3.z < 1 && Math.abs(this.v3.x) < 1.04 && Math.abs(this.v3.y) < 1.04;
      return { id: p.id, x: (this.v3.x * 0.5 + 0.5) * this.width, y: (1 - (this.v3.y * 0.5 + 0.5)) * this.height, visible };
    });
  }

  /** Screen position of a world point on the surface (for the connector line). */
  projectPoint(x: number, z: number) {
    this.v3.set(x, this.heights.maxNear(x, z, 0.05) + 0.05, z).project(this.camera);
    return { x: (this.v3.x * 0.5 + 0.5) * this.width, y: (1 - (this.v3.y * 0.5 + 0.5)) * this.height };
  }

  getStats() {
    const i = this.renderer.info;
    return {
      drawCalls: i.render.calls,
      triangles: i.render.triangles,
      geometries: i.memory.geometries,
      textures: i.memory.textures,
      pixelRatio: this.dpr,
      canvas: [this.width, this.height],
      frames: this.stats.frames,
      avgFrameMs: this.stats.avgMs,
    };
  }

  dispose() {
    this.stopTween();
    this.renderer.setAnimationLoop(null);
    this.o.canvas.removeEventListener("webglcontextlost", this.handleLost);
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    if (!this.o.canvas.isConnected) this.renderer.forceContextLoss();
  }

  // ------------------------------------------------------------------ loop

  private riverFlow(level: number) {
    this.flowLevel = level;
    this.river.uniforms.uFlow.value = level;
  }

  private handleLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    this.renderer.setAnimationLoop(null);
    this.o.onContextLost?.();
  };

  private tick = (time: number) => {
    const dt = time - this.lastTick;
    this.lastTick = time;
    const moving = this.dirty || this.tween !== null || this.interacting > 0;
    const flowing = this.flowLevel > 0;
    if (!moving && !flowing) return;
    // idle with only the river light running: about 24 frames a second is plenty
    if (!moving && time - this.lastDraw < 41) return;
    this.river.uniforms.uTime.value = time / 1000;
    this.rig.apply(this.width, this.height);
    const t0 = performance.now();
    this.renderer.render(this.scene, this.camera);
    const cost = performance.now() - t0;
    this.lastDraw = time;
    this.dirty = false;
    this.stats.frames++;
    this.stats.avgMs += (cost - this.stats.avgMs) * 0.05;
    if (moving) this.adapt(dt);
    this.o.onFrame?.();
    if (!this.firstFrameDone) this.firstFrameDone = true;
  };

  /** Pixel ratio follows what the device can afford while the picture is moving. */
  private adapt(dt: number) {
    if (dt <= 0 || dt > 200) return;
    this.frames++;
    if (dt > 27) { this.slow++; this.fast = 0; } else if (dt < 19) { this.fast++; this.slow = Math.max(0, this.slow - 1); }
    if (this.slow >= 24 && this.dpr > 1) { this.dpr = Math.max(1, this.dpr - 0.25); this.renderer.setPixelRatio(this.dpr); this.slow = 0; }
    else if (this.fast >= 180 && this.dpr < this.dprCap) { this.dpr = Math.min(this.dprCap, this.dpr + 0.25); this.renderer.setPixelRatio(this.dpr); this.fast = 0; }
  }
}
