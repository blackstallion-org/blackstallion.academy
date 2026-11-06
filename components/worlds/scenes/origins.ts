import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CameraPath, key, orbit, type CameraKey, type V3 } from "../core/camera";
import { disposeTree } from "../core/assets";
import { Motes, Sun, smoothstep, span } from "../core/kit";
import type { QualitySettings } from "../core/quality";
import type { Grade, ShotPose, World, WorldContext } from "../core/types";
import { AERIAL, patchAerial } from "./origins/aerial";
import { Grass } from "./origins/grass";
import { Mist } from "./origins/mist";
import { River } from "./origins/river";
import { SkyDome } from "./origins/sky";
import { terrainMaterial } from "./origins/terrain";
import { Trees } from "./origins/trees";

/**
 * WORLD 01 · ORIGINS · the living world.
 * A green valley at golden hour seen from a grassy, rocky promontory: the river winding out of the haze, layered ranges, the
 * academy's white disc on the valley floor, and a small black Marwari on the hilltop, facing the low sun.
 *
 * Assets (public/worlds/origins, built by tools/blender/12_worlds/origins, sources in SOURCES.md there):
 *   sky-hi/lo.webp + sky-env.hdr  Poly Haven kloppenheim_06_puresky (CC0), encoded HDR sky + small HDR for the light
 *   origins-terrain(-lo).glb      Blender heightfield with masks; origins-height.bin near heights; origins-layout.json
 *   origins-academy.glb           Blender model of the academy; origins-rocks.glb two Poly Haven rock scans (CC0)
 *   ground-*.webp                 ambientCG Grass004, Poly Haven aerial_grass_rock / aerial_rocks_02 (CC0)
 *
 * Camera (local p): A establishing extreme-wide over the hill (0-0.15) -> B push in (to 0.36) -> C orbit round the hilltop
 * (0.36-0.585) -> D medium on the horse, held (0.585-0.68) -> E head close-up (0.75) and the left eye (1.0), where the iris
 * opens into World 02. Everything here is local to `root`, which is turned so the low sun sits left of the valley axis.
 */
const BASE = "/worlds/origins";
/** yaw of the whole valley under the fixed sky (puts the sun ~32 degrees left of the view down the valley) */
const YAW = 0.309;
const HEADING = Math.PI / 2; // the horse faces +x (toward the sun); its left side faces -z, the camera's side

type Layout = { hillTop: number; academy: { x: number; z: number; y: number }; river: number[][]; trees: number[][] };

export const createOrigins = (): World => new Origins();

class Origins implements World {
  readonly id = "origins" as const;
  readonly scene = new THREE.Scene();
  readonly usesHorse = true;
  readonly grade: Grade = { exposure: 1.05, bloom: [0.34, 0.6, 1.6], lift: "#e9eefa", gain: "#ffeedb", saturation: 1.12, vignette: 0.45, grain: 0.03 };

  private root = new THREE.Group();
  private ctx!: WorldContext;
  private heights!: Uint16Array;
  private layout!: Layout;
  private top = 70;
  private path: CameraPath | null = null;
  private sky!: SkyDome;
  private sun!: Sun;
  private grass!: Grass;
  private trees!: Trees;
  private river!: River;
  private motes!: Motes;
  private mist!: Mist;
  /** a soft warm fill that rises for the head and eye close-ups (the lit side of the head faces the sun, away from the lens) */
  private fill = new THREE.PointLight(0xffd2a0, 0, 4, 2);
  private envRT: THREE.WebGLRenderTarget | null = null;
  private textures: THREE.Texture[] = [];
  private rockSpots: { x: number; z: number; r: number }[] = [];
  private eye0 = new THREE.Vector3();
  private eyeNow = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private inv = new THREE.Matrix4();
  private sunDirW = new THREE.Vector3();
  private sunLight = { dir: new THREE.Vector3(), color: new THREE.Color(1.0, 0.7, 0.42).multiplyScalar(3.0), ambient: new THREE.Color(0.26, 0.32, 0.42) };

  async load(ctx: WorldContext) {
    this.ctx = ctx;
    const hi = ctx.quality.textures === "hi";
    const sfx = hi ? "" : "-lo";
    const A = ctx.assets;
    const tex = (n: string, srgb: boolean) => A.texture(`${BASE}/${n}${sfx}.webp`, { srgb, repeat: true, anisotropy: 8 });
    const [skyTex, envHdr, terrain, academy, rocks, heightBuf, layout, grass, grassN, meadow, meadowN, rock, rockN] = await Promise.all([
      A.texture(`${BASE}/sky-${hi ? "hi" : "lo"}.webp`),
      A.hdri(`${BASE}/sky-env.hdr`),
      A.glb(`${BASE}/origins-terrain${sfx}.glb`),
      A.glb(`${BASE}/origins-academy.glb`),
      A.glb(`${BASE}/origins-rocks.glb`),
      fetch(A.url(`${BASE}/origins-height.bin`)).then((r) => r.arrayBuffer()),
      fetch(A.url(`${BASE}/origins-layout.json`)).then((r) => r.json() as Promise<Layout>),
      tex("ground-grass-color", true),
      tex("ground-grass-normal", false),
      tex("ground-meadow-color", true),
      tex("ground-meadow-normal", false),
      tex("ground-rock-color", true),
      tex("ground-rock-normal", false),
    ]);
    this.textures.push(skyTex, envHdr, grass, grassN, meadow, meadowN, rock, rockN);
    this.heights = new Uint16Array(heightBuf);
    this.layout = layout;
    this.top = this.height(0, 0);

    const scene = this.scene;
    scene.add(this.root);
    this.root.rotation.y = YAW;
    this.root.updateMatrixWorld(true);

    // sky: visible panorama + image-based light from the small HDR
    this.sky = new SkyDome(skyTex);
    scene.add(this.sky.mesh);
    const pmrem = new THREE.PMREMGenerator(ctx.renderer);
    this.envRT = pmrem.fromEquirectangular(envHdr);
    pmrem.dispose();
    scene.environment = this.envRT.texture;
    scene.environmentIntensity = 0.6;

    // the sun as the panorama has it (low, ahead-left), lifted a few degrees for the key light so the valley reads
    const lon = 0.7033;
    this.sunDirW.set(Math.cos(lon) * 0.997, 0.08, Math.sin(lon) * 0.997).normalize();
    AERIAL.uAerialSunDir.value.copy(this.sunDirW);
    const keyDir = this.sunDirW.clone().setY(0.2).normalize();
    this.sunLight.dir.copy(keyDir);
    this.sun = new Sun(scene, keyDir, new THREE.Color(1.0, 0.72, 0.46), 4.2, 14);
    this.sun.setShadowSize(ctx.quality.shadowSize, ctx.quality.shadows);
    const hemi = new THREE.HemisphereLight(0x9fb4d0, 0x3a3a22, 0.25);
    scene.add(hemi, this.fill);

    // terrain
    const tmat = terrainMaterial({ grass, grassN, meadow, meadowN, rock, rockN });
    terrain.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.material = tmat; m.receiveShadow = true; m.castShadow = false; m.frustumCulled = false; }
    });
    this.root.add(terrain.scene);

    // academy on its levelled site, facing the hill (merged per material)
    const acad = this.mergeByMaterial(academy.scene);
    acad.position.set(layout.academy.x, layout.academy.y - 0.05, layout.academy.z);
    acad.rotation.y = Math.atan2(-layout.academy.x, -layout.academy.z) - Math.PI / 2;
    acad.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat.name === "Academy_Glass") { mat.roughness = 0.04; mat.envMapIntensity = 1.6; }
      if (mat.name === "Academy_Interior") mat.emissiveIntensity = 1.4;
      patchAerial(mat, undefined, "std");
    });
    this.root.add(acad);

    // rocks on the hill: scanned boulders and a craggy face on the valley-facing brow
    this.placeRocks(rocks.scene);

    // river, trees, grass, pollen
    this.river = new River(layout.river, -0.1, skyTex, this.sunDirW, this.sunLight.color);
    this.root.add(this.river.mesh);
    this.trees = new Trees(layout.trees, this.sunLight, ctx.quality.density);
    this.root.add(this.trees.mesh);
    this.grass = new Grass(
      (x, z) => this.height(x, z),
      (x, z) => this.slope(x, z),
      (x, z) => x * x + z * z < 0.8 || this.rockSpots.some((r) => (x - r.x) ** 2 + (z - r.z) ** 2 < r.r * r.r),
      this.sunLight,
    );
    this.grass.build(ctx.quality.density);
    this.root.add(this.grass.group);
    // low mist round the foot of the hill and along the river
    let ms = 5;
    const mr = () => ((ms = (ms * 16807) % 2147483647) / 2147483647);
    const mistSpots: { x: number; y: number; z: number; w: number; h: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (0.05 + 0.9 * (i / 11)) + (mr() - 0.5) * 0.2;
      const rr = 150 + mr() * 140;
      mistSpots.push({ x: Math.cos(a) * rr, y: 2, z: Math.sin(a) * rr, w: 240 + mr() * 220, h: 26 + mr() * 22 });
    }
    for (let i = 40; i < layout.river.length; i += 34) {
      const [x, z] = layout.river[i];
      if (z < 120) continue;
      mistSpots.push({ x: x + (mr() - 0.5) * 120, y: 1, z, w: 380 + mr() * 380, h: 36 + mr() * 30 });
    }
    this.mist = new Mist(mistSpots, this.sunDirW, this.sunLight.color);
    this.root.add(this.mist.mesh);
    this.motes = new Motes({ count: Math.round(420 * ctx.quality.density) + 60, box: [26, 7, 26], center: { x: 0, y: this.top + 2.5, z: 0 }, size: 0.03, color: new THREE.Color(1.6, 1.15, 0.6), drift: [0.35, 0.04, 0.22], swirl: 0.4, additive: true, opacity: 0.55, seed: 11 });
    this.root.add(this.motes.points);
  }

  /* ------------------------------------------------------------------ ground */
  height(x: number, z: number) {
    const n = 257;
    const gx = x + 128;
    const gz = z + 128;
    if (gx < 0 || gz < 0 || gx >= n - 1 || gz >= n - 1) return 0;
    const ix = Math.floor(gx);
    const iz = Math.floor(gz);
    const fx = gx - ix;
    const fz = gz - iz;
    const h = this.heights;
    const a = h[iz * n + ix];
    const b = h[iz * n + ix + 1];
    const c = h[(iz + 1) * n + ix];
    const d = h[(iz + 1) * n + ix + 1];
    return ((a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz) * 0.01;
  }
  slope(x: number, z: number) {
    const e = 0.75;
    const hx = (this.height(x + e, z) - this.height(x - e, z)) / (2 * e);
    const hz = (this.height(x, z + e) - this.height(x, z - e)) / (2 * e);
    return Math.hypot(hx, hz);
  }
  /** ground height under a WORLD position (for the hoof contact shadows) */
  private groundWorld = (x: number, z: number) => {
    const c = Math.cos(-YAW);
    const s = Math.sin(-YAW);
    return this.height(c * x + s * z, -s * x + c * z);
  };

  private placeRocks(src: THREE.Object3D) {
    const boulder = src.getObjectByName("Rock_Boulder") as THREE.Mesh | undefined;
    if (!boulder) return;
    patchAerial(boulder.material as THREE.Material, undefined, "std");
    let s = 31;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const spots: { x: number; z: number; size: number; yaw: number; sink: number }[] = [];
    // outcrops: big scanned boulders half-buried on the valley-facing brow and the shoulders
    for (const [x, z, size] of [[7.5, 9, 5.5], [-8, 13, 6.5], [15, 20, 8], [-17, 24, 7], [3, 26, 9]]) spots.push({ x, z, size, yaw: r() * 6.28, sink: 0.5 });
    spots.push({ x: 2.6, z: 3.4, size: 0.9, yaw: 1.2, sink: 0.25 }); // one stone near the hooves, for scale
    const small = Math.round(8 + 18 * this.ctx.quality.density);
    for (let i = 0; i < small; i++) {
      const a = (r() - 0.5) * Math.PI * 1.6 + Math.PI / 2; // mostly on the valley side (+z)
      const rr = 5 + r() * 48;
      spots.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, size: 0.5 + r() * r() * 3.5, yaw: r() * 6.28, sink: 0.25 + r() * 0.2 });
    }
    // two instanced draws: the full scan for the big and near stones, the light copy for the small ones
    const lo = (src.getObjectByName("Rock_Boulder_Lo") as THREE.Mesh | undefined) ?? boulder;
    const big = spots.filter((sp) => sp.size >= 1.6 || sp.x * sp.x + sp.z * sp.z < 36);
    const little = spots.filter((sp) => !big.includes(sp));
    const o = new THREE.Object3D();
    for (const [list, mesh, shadow] of [[big, boulder, true], [little, lo, false]] as const) {
      const inst = new THREE.InstancedMesh(mesh.geometry, boulder.material, list.length);
      list.forEach((sp, i) => {
        o.position.set(sp.x, this.height(sp.x, sp.z) - sp.size * 0.55 * sp.sink, sp.z);
        o.rotation.set((r() - 0.5) * 0.2, sp.yaw, (r() - 0.5) * 0.2);
        o.scale.setScalar(sp.size);
        o.updateMatrix();
        inst.setMatrixAt(i, o.matrix);
        this.rockSpots.push({ x: sp.x, z: sp.z, r: sp.size * 0.42 });
      });
      inst.castShadow = shadow;
      inst.receiveShadow = true;
      inst.computeBoundingSphere();
      this.root.add(inst);
    }
  }

  /** The academy GLB as one mesh per material (about 8 draws instead of 30). */
  private mergeByMaterial(src: THREE.Object3D) {
    src.updateMatrixWorld(true);
    const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
    src.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
      const mat = m.material as THREE.Material;
      if (!groups.has(mat)) groups.set(mat, []);
      groups.get(mat)!.push(g.index ? g.toNonIndexed() : g);
    });
    const out = new THREE.Group();
    for (const [mat, list] of groups) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (merged) out.add(new THREE.Mesh(merged, mat));
    }
    return out;
  }

  /* ------------------------------------------------------------------ camera */
  private buildPath() {
    const y0 = this.top;
    // the left eye, in this world's local frame
    this.inv.copy(this.root.matrixWorld).invert();
    this.ctx.horse.m.root.updateWorldMatrix(true, true);
    this.ctx.horse.bone("Eye_L", this.eye0).applyMatrix4(this.inv);
    const e = this.eye0;
    const at = (dx: number, dy: number, dz: number): V3 => [e.x + dx, e.y + dy, e.z + dz];
    const keys: CameraKey[] = [
      key("establish", 0.0, [22, y0 + 24, -112], [-26, y0 + 2, 160], 40),
      key("establish.drift", 0.15, [18, y0 + 18, -84], [-9, y0 - 2, 120], 37),
      key("approach", 0.27, [12, y0 + 10, -48], [-1, y0 + 0.5, 40], 34),
      ...orbit("orbit", 0.36, 0.585, { center: [0.3, y0 + 1.25, 0], radius: [19, 6.6], from: Math.PI + 0.38, to: Math.PI - 0.4, height: [5.8, 0.55], look: [0.4, y0 + 1.3, 0.2] }, [33, 30], 6),
      key("medium", 0.585, [6.6 * Math.sin(Math.PI - 0.4) + 0.3, y0 + 1.8, 6.6 * Math.cos(Math.PI - 0.4)], [0.4, y0 + 1.3, 0.2], 30, { hold: 0.6 }),
      key("head", 0.76, at(0.62, 0.1, -1.3), at(0.22, -0.1, 0.08), 26),
      key("eye.near", 0.89, at(0.3, 0.04, -0.66), at(0.06, -0.02, 0.02), 20),
      key("eye", 1.0, at(0.07, 0.015, -0.31), at(0.0, 0.0, 0.0), 16),
    ];
    // the orbit's last key and "medium" coincide: drop the duplicate time
    this.path = new CameraPath(keys.filter((k, i, a) => !(k.name === "orbit.6" && a.some((o) => o.name === "medium"))));
  }

  enter(ctx: WorldContext) {
    this.ctx = ctx;
    ctx.horse.attach(this.root, { x: 0, y: this.top, z: 0 }, HEADING, { ground: this.groundWorld, contactStrength: 0.45 });
    ctx.horse.m.root.updateWorldMatrix(true, true);
    if (!this.path) this.buildPath();
  }

  exit() {}

  update(p: number, _dt: number, time: number, out: ShotPose) {
    if (!this.path) this.buildPath();
    const path = this.path!;
    const horse = this.ctx.horse;
    // the horse looks out over the valley, turns toward the lens as it comes round, and is still for the eye
    const lookYaw = -0.32 * (1 - smoothstep(0.3, 0.55, p)) + 0.12 * span(p, 0.45, 0.62) * (1 - smoothstep(0.7, 0.8, p));
    const lookPitch = 0.06 * (1 - smoothstep(0.6, 0.8, p));
    horse.look(lookYaw, lookPitch);

    path.at(p, out);
    // in the close-ups follow the live eye (breathing moves the head a few centimetres)
    const w = smoothstep(0.66, 0.82, p);
    if (w > 0) {
      horse.bone("Eye_L", this.eyeNow).applyMatrix4(this.inv.copy(this.root.matrixWorld).invert());
      this.tmp.subVectors(this.eyeNow, this.eye0).multiplyScalar(w);
      out.pos.add(this.tmp);
      out.look.add(this.tmp);
    }
    out.pos.applyMatrix4(this.root.matrixWorld);
    out.look.applyMatrix4(this.root.matrixWorld);
    // fill: just above and beside the lens, only in the close-ups
    this.fill.intensity = 2.2 * smoothstep(0.62, 0.8, p);
    this.fill.position.copy(out.pos).lerp(out.look, 0.15);
    this.fill.position.y += 0.25;

    horse.group.getWorldPosition(this.tmp);
    this.sun.follow(this.tmp);
    this.grass.update(time);
    this.river.update(time);
    this.motes.update(time, this.ctx.renderer.getPixelRatio());
    this.mist.update(time);
  }

  setQuality(q: QualitySettings) {
    this.sun.setShadowSize(q.shadowSize, q.shadows);
    this.grass.build(q.density);
  }

  dispose() {
    this.grass?.dispose();
    this.trees?.dispose();
    this.river?.dispose();
    this.motes?.dispose();
    this.mist?.dispose();
    this.sky?.dispose();
    if (this.ctx?.horse && this.ctx.horse.group.parent === this.root) this.ctx.horse.detach();
    disposeTree(this.root);
    this.envRT?.dispose();
    for (const t of this.textures) t.dispose();
    this.sun?.light.dispose();
  }
}
