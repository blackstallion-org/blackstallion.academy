import * as THREE from "three";
import { disposeTree } from "../core/assets";
import { CameraPath, key } from "../core/camera";
import { Motes, Sun, smoothstep, span, applySky } from "../core/kit";
import type { QualitySettings } from "../core/quality";
import type { Grade, ShotPose, World, WorldContext } from "../core/types";
import { Cavalry, TRACK_Z } from "./legacy/cavalry";
import { Dust } from "./legacy/dust";
import { createSkyFog, skyRotationT } from "./legacy/skyfog";
import { buildTerrainGeometry, Heightfield, terrainMaterial, type HeightMeta } from "./legacy/terrain";
import { createWater } from "./legacy/water";

/**
 * WORLD 03 — LEGACY: the memory world.
 * Late afternoon in the cavalry country of Marwar: a sandstone hill fort along a rocky ridge, a plain of sand and scrub, a column
 * of riders cantering through the dust, and the black Marwari standing on wet sand in the foreground with the fort beyond.
 * The fort is generic Rajasthan hill-fort architecture (battered walls, round bastions, a palace with jharokhas and chhatris)
 * modelled in Blender (tools/blender/12_worlds/legacy); it is not a model of any real fort and the riders are not a particular
 * battle. No flags, banners or standards.
 *
 * Camera (local p): fly out of the golden dust (0-0.15) -> the fort appears (0.15-0.35) -> across the plain (0.35-0.5) -> beside
 * the cavalry (0.5-0.58) -> the black Marwari in the foreground (hold ~0.62) -> orbit toward the sun on the horizon (0.66-0.85)
 * -> rise and tilt into the bright cloud (0.85-1), where the cloud transition to World 04 begins.
 */
const BASE = "/worlds/legacy/";
/** The sky's rotation about Y and the sun's direction in the sky texture (tools/blender/12_worlds/legacy/make_sky.py -> sky.json). */
const SKY_ROT = -2.36;
const SKY_SUN = new THREE.Vector3(0.6404, 0.1262, 0.7576);
const SKY_INTENSITY = 0.82;
/** the aerial-perspective colour is the sky's, a little darker and warmer (dust in the air) */
const FOG_GAIN = new THREE.Color(0.78, 0.66, 0.52);

const PATH = new CameraPath([
  key("dust", 0.0, [-14, 1.5, -238], [-11, 2.6, -190], 52),
  key("dust-thin", 0.08, [-11, 3.0, -214], [-60, 40, 420], 44),
  key("fort", 0.17, [-8, 6.5, -192], [-190, 92, 760], 30, { hold: 0.35 }),
  key("plain", 0.32, [10, 5.0, -165], [-140, 62, 700], 33),
  key("approach", 0.43, [28, 3.4, -134], [-2, 2.2, -106], 40),
  key("cavalry", 0.5, [9, 2.3, -124], [-6, 2.0, -104], 36),
  key("rise", 0.565, [9, 4.5, -62], [0, 2.4, 0], 34),
  key("hero", 0.618, [3.0, 1.8, -7.6], [-0.5, 1.8, 8], 33, { hold: 0.45 }),
  key("orbit-1", 0.7, [7.4, 2.0, -5.2], [-60, 14, 240], 36),
  key("orbit-2", 0.78, [9.6, 2.4, 0.5], [-180, 24, 260], 38),
  key("lift", 0.86, [9.0, 7.5, 2.0], [-160, 70, 300], 42),
  key("climb", 0.93, [7.5, 22, 4.0], [-300, 230, 220], 50),
  key("cloud", 1.0, [4.0, 48, 6.0], [-220, 480, 140], 56),
]);

class LegacyWorld implements World {
  readonly id = "legacy" as const;
  readonly scene = new THREE.Scene();
  readonly usesHorse = true;
  readonly grade: Grade = { exposure: 1.0, bloom: [0.32, 0.6, 1.05], lift: "#c9b6a8", gain: "#ffeed4", saturation: 1.12, vignette: 0.5, grain: 0.035 };
  private hf!: Heightfield;
  private sun!: Sun;
  private fog = createSkyFog();
  private disposeSky: (() => void) | null = null;
  private cavalry!: Cavalry;
  private water!: ReturnType<typeof createWater>;
  private ambient!: Motes;
  private cloud!: Dust;
  private sparks!: Motes;
  private kicked!: Dust;
  private deck!: Dust;
  private loaded: THREE.Object3D[] = [];
  private props: THREE.InstancedMesh[] = [];
  private textures: THREE.Texture[] = [];
  private focus = new THREE.Vector3();
  private heroPos = new THREE.Vector3();
  private dpr = 1;
  private ctx: WorldContext | null = null;

  async load(ctx: WorldContext) {
    this.ctx = ctx;
    this.dpr = Math.min(window.devicePixelRatio || 1, ctx.quality.dpr);
    const hi = ctx.quality.textures === "hi";
    const A = ctx.assets;
    const q = hi ? "hi" : "lo";
    const tex = (n: string, srgb: boolean) => A.texture(`${BASE}tex/${n}-${q}.webp`, { srgb, repeat: true, anisotropy: 8 });
    const [sky, env, fortG, cavG, propsG, meta, sand, sandN, rock, rockN, stone, stoneN] = await Promise.all([
      A.texture(`${BASE}${hi ? "sky-4k" : "sky-2k"}.webp`, { srgb: true }),
      A.hdri(`${BASE}env.hdr`),
      A.glb(`${BASE}fort.glb`),
      A.glb(`${BASE}cavalry.glb`),
      A.glb(`${BASE}props.glb`),
      fetch(A.url(`${BASE}terrain-height.json`)).then((r) => r.json() as Promise<HeightMeta>),
      tex("sand-diff", true), tex("sand-nor", false), tex("rock-diff", true), tex("rock-nor", false), tex("stone-diff", true), tex("stone-nor", false),
    ]);
    this.textures.push(sky, env, sand, sandN, rock, rockN, stone, stoneN);
    this.hf = new Heightfield(meta);
    await this.hf.load(A.url(`${BASE}terrain-height.png`));
    const scene = this.scene;
    const dens = ctx.quality.density;

    // ---- sky, light and air
    sky.generateMipmaps = true;
    sky.minFilter = THREE.LinearMipmapLinearFilter;
    this.disposeSky = applySky(scene, ctx.renderer, sky, { rotation: SKY_ROT, intensity: SKY_INTENSITY, envIntensity: 0.85, envFrom: env });
    this.fog.uniforms.tSkyFog.value = sky;
    skyRotationT(SKY_ROT, this.fog.uniforms.uSkyRotT.value);
    this.fog.uniforms.uFogGain.value.copy(FOG_GAIN);
    this.fog.uniforms.uFogFalloff.value = 1 / 70;
    scene.fog = new THREE.FogExp2("#c79f78", 0.0011); // the hero horse's own (standard) fog
    const sunDir = SKY_SUN.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), SKY_ROT);
    this.sun = new Sun(scene, sunDir, "#ffc88c", 3.1, 22);
    this.sun.setShadowSize(ctx.quality.shadowSize, ctx.quality.shadows);
    scene.add(new THREE.HemisphereLight("#f2c79a", "#5a3f2a", 0.25));

    // ---- ground
    const terrain = new THREE.Mesh(buildTerrainGeometry(this.hf, hi ? 1 : 1.8), terrainMaterial({ sand, sandN, rock, rockN }));
    terrain.name = "legacy-terrain";
    terrain.receiveShadow = true;
    this.fog.apply(terrain.material as THREE.Material, "terrain");
    scene.add(terrain);
    this.heroPos.set(0, this.hf.height(0, 0), 0);
    this.water = createWater(scene, { real: ctx.quality.tier === "high", size: 150, res: hi ? 1024 : 512, fog: this.fog, sky, y: this.heroPos.y + 0.035 });
    // the mirror only needs what stands above the water near the horse: the column and the scrub stay out of the reflection pass
    const mirror = this.water.mesh;
    const reflect = mirror.onBeforeRender;
    mirror.onBeforeRender = (...a: Parameters<THREE.Object3D["onBeforeRender"]>) => {
      const hidden: THREE.Object3D[] = [this.cavalry?.group, ...this.props].filter((o): o is NonNullable<typeof o> => !!o && o.visible);
      hidden.forEach((o) => (o.visible = false));
      reflect.apply(mirror, a);
      hidden.forEach((o) => (o.visible = true));
    };

    // ---- the fort
    const fort = fortG.scene;
    fort.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = false;
      m.receiveShadow = false;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat.name === "Fort_Stone" || mat.name === "Fort_Plaster") {
        mat.map = stone;
        mat.normalMap = stoneN;
        mat.normalScale.setScalar(mat.name === "Fort_Plaster" ? 0.4 : 1);
        mat.color.set(mat.name === "Fort_Plaster" ? "#f3e2c8" : "#e9c39b");
        mat.roughness = 0.9;
        mat.vertexColors = true;
      }
      this.fog.apply(mat, `fort-${mat.name}`);
    });
    scene.add(fort);
    this.loaded.push(fort);

    // ---- scrub and rocks
    this.scatterProps(propsG.scene, dens);
    this.loaded.push(propsG.scene);

    // ---- the cavalry
    const count = Math.round(THREE.MathUtils.clamp(24 * dens, 9, 24));
    this.cavalry = new Cavalry(cavG, count, this.hf.height);
    this.cavalry.materials.forEach((m, i) => this.fog.apply(m, `cav-${i}`));
    scene.add(this.cavalry.group);
    this.loaded.push(cavG.scene);

    // ---- dust: the golden cloud we fly out of, the motes in the air, the dust kicked up by the column
    const D = Math.max(0.45, dens);
    this.cloud = new Dust({ groundFade: [0.5, 4], count: Math.round(800 * D), box: [70, 14, 96], center: { x: -12, y: 7, z: -206 }, size: [2.5, 9], color: "#d6a76f", drift: [0.9, 0.2, 0.5], swirl: 1.4, opacity: 0.45, seed: 3, fog: this.fog, sunDir });
    this.kicked = new Dust({ groundFade: [-0.2, 2.2], count: Math.round(320 * D), box: [130, 4, 14], center: { x: 0, y: 2.8, z: TRACK_Z }, size: [1.8, 5], color: "#c99f78", drift: [-1.8, 0.3, 0], swirl: 0.9, opacity: 0.32, seed: 13, fog: this.fog, sunDir });
    this.sparks = new Motes({ count: Math.round(1600 * D), box: [60, 20, 80], center: { x: -12, y: 6, z: -210 }, size: 0.05, color: "#ffd38a", drift: [0.5, 0.2, 0.3], swirl: 0.6, additive: true, opacity: 1, seed: 9 });
    this.ambient = new Motes({ count: Math.round(1400 * dens), box: [90, 26, 90], size: 0.035, color: "#f6d7aa", drift: [1.1, 0.06, 0.35], swirl: 0.5, opacity: 0.6, seed: 5 });
    // the cloud deck the camera climbs into at the end (the cloud transition to World 04 picks up from it)
    this.deck = new Dust({ groundFade: [-1e4, -1e4 + 1], count: Math.round(220 * D), box: [520, 60, 520], center: { x: -170, y: 125, z: 110 }, size: [45, 120], color: "#f6e2c8", drift: [2.5, 0, 0.8], swirl: 3, opacity: 0, seed: 31, fog: this.fog, sunDir });
    scene.add(this.cloud.mesh, this.kicked.mesh, this.deck.mesh, this.sparks.points, this.ambient.points);
  }

  private scatterProps(src: THREE.Object3D, dens: number) {
    const find = (n: string) => src.getObjectByName(n) as THREE.Mesh | undefined;
    const rock = find("Prop_Rock");
    const shrub = find("Prop_Shrub");
    let seed = 41;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const place = (mesh: THREE.Mesh | undefined, n: number, pick: () => { x: number; z: number; s: number; sy: number; sink: number } | null, key: string) => {
      if (!mesh) return;
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      mat.vertexColors = true;
      this.fog.apply(mat, key);
      const im = new THREE.InstancedMesh(mesh.geometry, mat, n);
      const m4 = new THREE.Matrix4();
      const qq = new THREE.Quaternion();
      let k = 0;
      for (let i = 0; i < n * 4 && k < n; i++) {
        const c = pick();
        if (!c) continue;
        const y = this.hf.height(c.x, c.z) - c.sink * c.s * c.sy;
        qq.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.3, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.3));
        m4.compose(new THREE.Vector3(c.x, y, c.z), qq, new THREE.Vector3(c.s, c.s * c.sy, c.s * (0.8 + rnd() * 0.4)));
        im.setMatrixAt(k++, m4);
      }
      im.count = k;
      // no shadow casting: the sun's shadow box only covers the horse or the column, and the flats there are kept clear of props
      im.castShadow = false;
      im.receiveShadow = true;
      im.frustumCulled = false;
      im.name = `props-${key}`;
      this.props.push(im);
      this.scene.add(im);
    };
    // keep the flats, the track and the camera's flight line clear of props
    const corridor = (x: number, z: number) => {
      const pts = [[-14, -240], [-8, -192], [10, -165], [28, -134], [9, -124], [9, -62], [5, -8]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
        const t = THREE.MathUtils.clamp(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2), 0, 1);
        if (Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)) < 14) return true;
      }
      return false;
    };
    const avoid = (x: number, z: number) => Math.hypot(x, z) < 48 || Math.abs(z - TRACK_Z) < 11 || corridor(x, z);
    place(shrub, Math.round(420 * dens), () => {
      const x = (rnd() - 0.5) * 700;
      const z = -320 + rnd() * 900;
      if (avoid(x, z)) return null;
      const r = this.hf.rockAt(x, z);
      if (r > 0.5 && rnd() < 0.7) return null;
      return { x, z, s: 0.35 + rnd() * rnd() * 1.3, sy: 0.6 + rnd() * 0.5, sink: 0.15 };
    }, "shrub");
    place(rock, Math.round(360 * dens), () => {
      // small stones everywhere, big boulders at the foot of the ridge
      const big = rnd() < 0.3;
      const x = big ? -700 + rnd() * 900 : (rnd() - 0.5) * 600;
      const z = big ? 470 + rnd() * 220 : -300 + rnd() * 700;
      if (avoid(x, z)) return null;
      const s = big ? 3 + rnd() * 9 : 0.15 + rnd() * rnd() * 1.6;
      return { x, z, s, sy: 0.8 + rnd() * 0.5, sink: 0.25 };
    }, "rock");
  }

  enter(ctx: WorldContext) {
    ctx.horse.setGait(null);
    ctx.horse.attach(this.scene, this.heroPos, 0, { ground: this.hf.height, contactStrength: 0.45 });
  }

  exit() {}

  update(p: number, dt: number, time: number, out: ShotPose) {
    PATH.at(p, out);
    // a slow handheld drift so held shots breathe (ambient: does not change where the shot is)
    out.pos.x += Math.sin(time * 0.31) * 0.06;
    out.pos.y += Math.sin(time * 0.23 + 1.3) * 0.04;
    // the column is only ever in shot before the horse is revealed (afterwards it is behind the camera)
    this.cavalry.group.visible = p < 0.66;
    this.cavalry.castShadow = p < 0.6;
    if (this.cavalry.group.visible) this.cavalry.update(p, time);
    this.water.update(time);
    // dust: dense at the start, thinning as we fly out of it
    const thick = 1 - smoothstep(0.02, 0.17, p);
    this.cloud.opacity = 0.45 * thick;
    this.deck.opacity = 0.8 * span(p, 0.84, 0.99);
    this.sparks.uniforms.uOpacity.value = 0.9 * thick + 0.06;
    this.ambient.uniforms.uCenter.value.copy(out.pos);
    this.kicked.opacity = 0.32 * span(p, 0.15, 0.3) * (1 - span(p, 0.6, 0.7));
    for (const m of [this.cloud, this.kicked, this.deck]) m.update(time);
    for (const m of [this.sparks, this.ambient]) m.update(time, this.dpr);
    this.fog.uniforms.uFogDensity.value = 0.00085 * (1 + 4 * thick);
    // the sun's shadow map follows what the shot is about: the column, then the horse
    const toHero = span(p, 0.52, 0.6);
    this.focus.set(this.cavalry.centroid.x, this.hf.height(this.cavalry.centroid.x, TRACK_Z), TRACK_Z).lerp(this.heroPos, toHero);
    this.sun.follow(this.focus);
    // the horse watches the plain, then turns his head a little toward the sun as the camera circles
    const turn = span(p, 0.64, 0.82);
    this.ctx?.horse.look(-0.22 * turn, 0.04 - 0.1 * turn);
    void dt;
  }

  setQuality(q: QualitySettings) {
    this.sun.setShadowSize(q.shadowSize, q.shadows);
  }

  dispose() {
    this.disposeSky?.();
    this.water?.dispose();
    this.cavalry?.dispose();
    for (const m of [this.cloud, this.sparks, this.ambient, this.kicked, this.deck]) m?.dispose();
    disposeTree(this.scene);
    for (const o of this.loaded) disposeTree(o);
    for (const t of this.textures) t.dispose();
    this.scene.clear();
  }
}

export const createLegacy = (): World => new LegacyWorld();
