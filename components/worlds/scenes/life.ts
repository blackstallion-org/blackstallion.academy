import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { asset } from "@/lib/content/asset";
import { vnoise } from "@/components/stallion-film/noise";
import { disposeTree } from "../core/assets";
import { CameraPath, key, type CameraKey } from "../core/camera";
import { Motes, smoothstep, span } from "../core/kit";
import { TailHair } from "./life/tail";
import type { QualitySettings } from "../core/quality";
import type { Grade, ShotPose, World, WorldContext } from "../core/types";
import { cellMaterial, fiberMaterial, fogUniforms, sparkTexture, tissueMaterial, xrayMaterial } from "./life/shaders";

/**
 * WORLD 02 — LIFE, the inner world.
 * The camera arrives through the horse's eye (the iris transition from Origins), flies down a living corridor of cells, vesicles
 * and glowing pathways, finds a horse made of light galloping in a clearing, and studies it: first the shell, then the muscles,
 * then the skeleton, then all of it at once before the light dissolves into sand (the dust transition to Legacy).
 *
 * The anatomy is the academy's own exhibit model (public/models/anatomy-exhibit.glb: 80 bones, 30 muscles and tendons on the
 * Marwari rig). The light is storytelling, not a measurement, and the page says so.
 *
 * Layout (metres): the flight corridor runs along +Z from z = -66 to z ≈ 24 (a gentle S, see corridor()); the clearing is centred
 * on the horse at (0, 0, 45); the horse faces -X so, seen from the corridor side, it gallops to the right of the frame.
 */
const HORSE = new THREE.Vector3(0, 0, 45);
const CLEAR_R = 17;

function corridor(z: number, out = new THREE.Vector3()) {
  return out.set(6 * Math.sin(z * 0.045), 1.2 + 1.8 * Math.sin(z * 0.06 + 1), z);
}

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fbm2 = (x: number, z: number) => 0.5 * vnoise(x, z, 3) + 0.3 * vnoise(x * 2.1, z * 2.1, 4) + 0.2 * vnoise(x * 4.3, z * 4.3, 5);

/** The floor: low organic swells everywhere, flattened into a broad clearing where the horse gallops. */
function floorHeight(x: number, z: number) {
  const d = Math.hypot(x - HORSE.x, z - HORSE.z);
  const flat = smoothstep(CLEAR_R * 0.7, CLEAR_R * 2.2, d);
  const hills = -7.5 + 5.5 * fbm2(x * 0.03, z * 0.03);
  return THREE.MathUtils.lerp(-0.02 + 0.08 * fbm2(x * 0.4, z * 0.4), hills, flat);
}

function buildPath() {
  const keys: CameraKey[] = [];
  const c = new THREE.Vector3();
  const l = new THREE.Vector3();
  // A–C: through the eye and down the corridor (local p 0..0.4), the look running ahead along the curve
  const flight: [number, number, number][] = [
    [0.0, -66, 62],
    [0.06, -58, 58],
    [0.13, -46, 54],
    [0.2, -32, 50],
    [0.27, -18, 46],
    [0.33, -4, 42],
  ];
  for (const [t, z, fov] of flight) {
    corridor(z, c);
    corridor(z + 14, l);
    keys.push({ name: t === 0 ? "eye" : `fly${t}`, t, pos: [c.x, c.y, c.z], look: [l.x, l.y - 0.4, l.z], fov });
  }
  // D: out of the corridor, the clearing and the horse of light ahead
  keys.push(key("approach", 0.39, [4.5, 2.6, 14], [1.5, 1.2, 40], 44));
  keys.push(key("reveal", 0.45, [-1.2, 2.1, 27], [1.6, 1.1, 45], 36));
  // the hold (global 0.37 = local 0.51): the whole horse in profile, galloping to the right of frame (look target offset
  // toward +X, i.e. screen left, so the horse sits right of centre, clear of the chapter card)
  keys.push(key("profile", 0.5, [1.5, 1.35, 37.2], [1.0, 1.15, 45], 34, { hold: 0.55 }));
  keys.push(key("profile.out", 0.56, [2.1, 1.3, 37.9], [1.3, 1.15, 45], 33));
  // E: muscles of the hindquarter and back (the horse faces -X, so its quarters are toward +X)
  keys.push(key("muscles", 0.64, [2.2, 1.55, 40.6], [0.75, 1.3, 45], 30));
  keys.push(key("shoulder", 0.71, [-1.5, 1.75, 40.4], [-0.75, 1.45, 45], 30));
  // the skeleton, low along the forelegs
  keys.push(key("bones", 0.79, [-0.9, 0.55, 41.0], [-0.6, 0.7, 45], 34));
  keys.push(key("bones.out", 0.85, [0.4, 0.9, 39.5], [0, 0.9, 45], 38));
  // pull back: the whole body lit, the light starting to scatter
  keys.push(key("wide", 0.93, [4.5, 3.2, 33], [0, 1.2, 45], 40));
  keys.push(key("scatter", 1.0, [7.5, 5.2, 27], [0, 1.6, 46], 44));
  return new CameraPath(keys);
}

class LifeWorld implements World {
  readonly id = "life" as const;
  readonly usesHorse = false;
  readonly scene = new THREE.Scene();
  readonly grade: Grade = { exposure: 0.9, bloom: [0.7, 0.55, 0.88], lift: "#fff0dc", gain: "#fff3df", saturation: 1.05, vignette: 0.55, grain: 0.035 };
  private shared: Record<string, THREE.IUniform> = { uTime: { value: 0 }, ...fogUniforms() };
  private path = buildPath();
  private root = new THREE.Group();
  private horse = new THREE.Group();
  private mixer: THREE.AnimationMixer | null = null;
  private layers: Record<"shell" | "hair" | "muscle" | "tendon" | "bone", THREE.ShaderMaterial[]> = { shell: [], hair: [], muscle: [], tendon: [], bone: [] };
  private cells: THREE.InstancedMesh | null = null;
  private cellCount = 0;
  private motes: Motes[] = [];
  private trail: Motes | null = null;
  private tail: TailHair | null = null;
  private tailBone: THREE.Object3D | null = null;
  private readonly tailAt = new THREE.Vector3();
  private sparks: THREE.Points | null = null;
  private fibers: THREE.Mesh[] = [];
  private q: QualitySettings | null = null;

  async load(ctx: WorldContext) {
    this.q = ctx.quality;
    const s = this.scene;
    s.background = new THREE.Color("#1a0e05");
    s.add(this.root);
    const rnd = mulberry(202);
    const samples = Array.from({ length: 240 }, (_, i) => this.path.at(i / 239, { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, roll: 0 }).pos);
    const clearOfPath = (p: THREE.Vector3, r: number) => samples.every((c) => c.distanceTo(p) > r);

    // the floor of the inner world
    const fg = new THREE.PlaneGeometry(520, 520, 200, 200).rotateX(-Math.PI / 2);
    const fp = fg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) fp.setY(i, floorHeight(fp.getX(i), fp.getZ(i) + 20));
    fg.translate(0, 0, 20);
    fg.computeVertexNormals();
    this.root.add(new THREE.Mesh(fg, tissueMaterial(this.shared, { displace: 0, freq: 0.05, vein: 0.3 })));

    // large organic structures: walls of the corridor and far forms in the murk
    const blobGeo = new THREE.IcosahedronGeometry(1, 5);
    for (let i = 0; i < 16; i++) {
      const z = -80 + rnd() * 170;
      const side = rnd() < 0.5 ? -1 : 1;
      const r = 9 + rnd() * 26;
      const c = corridor(z);
      const p = new THREE.Vector3(c.x + side * (r + 9 + rnd() * 30), -4 + rnd() * 14 - (rnd() < 0.3 ? r * 0.6 : 0), z);
      if (p.distanceTo(HORSE) < r + CLEAR_R + 6 || !clearOfPath(p, r * 1.25 + 3)) continue;
      const m = new THREE.Mesh(blobGeo, tissueMaterial(this.shared, { displace: 0.55, freq: 0.9 + rnd() * 0.6 }));
      m.position.copy(p);
      m.scale.set(r, r * (0.6 + rnd() * 0.6), r * (0.8 + rnd() * 0.5));
      m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      this.root.add(m);
    }

    // cells: instanced membranes with vesicles, along the corridor and around the clearing
    const cellGeo = new THREE.IcosahedronGeometry(1, 4);
    const max = 110;
    const cells = new THREE.InstancedMesh(cellGeo, cellMaterial(this.shared), max);
    const attr = new Float32Array(max * 4);
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (let tries = 0; tries < 2000 && n < max; tries++) {
      const z = -76 + rnd() * 150;
      const far = rnd() < 0.25;
      const r = far ? 5 + rnd() * 9 : 0.8 + Math.pow(rnd(), 1.6) * 4.2;
      const a = rnd() * Math.PI * 2;
      const d = far ? 22 + rnd() * 30 : r + 4 + rnd() * 13;
      const c = corridor(z);
      const p = new THREE.Vector3(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.65, z + (rnd() - 0.5) * 4);
      if (p.y - r < floorHeight(p.x, p.z) - r * 0.6) p.y = floorHeight(p.x, p.z) + r * 0.4;
      if (p.distanceTo(HORSE) < r + CLEAR_R - 2) continue;
      if (!clearOfPath(p, r + 3.6)) continue;
      m4.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, 0)), new THREE.Vector3(r, r * (0.92 + rnd() * 0.16), r));
      cells.setMatrixAt(n, m4);
      attr.set([rnd() * 100, 3.2 + rnd() * 2.2 + (r > 4 ? 1.8 : 0), rnd() < 0.62 ? rnd() * 0.25 : 0.55 + rnd() * 0.45, rnd()], n * 4);
      n++;
    }
    cellGeo.setAttribute("aCell", new THREE.InstancedBufferAttribute(attr, 4));
    cells.count = n;
    this.cellCount = n;
    cells.frustumCulled = false;
    this.cells = cells;
    this.root.add(cells);

    // energy pathways: long tubes curving through the space with pulses of light running along them
    for (let i = 0; i < 22; i++) {
      const pts: THREE.Vector3[] = [];
      const z0 = -80 + rnd() * 140;
      const side = rnd() < 0.5 ? -1 : 1;
      let p = corridor(z0).add(new THREE.Vector3(side * (5 + rnd() * 18), -3 + rnd() * 10, 0));
      for (let k = 0; k < 6; k++) {
        pts.push(p.clone());
        p = p.clone().add(new THREE.Vector3((rnd() - 0.5) * 12, (rnd() - 0.5) * 6, 6 + rnd() * 10));
      }
      if (!pts.every((x) => clearOfPath(x, 2.5) && x.distanceTo(HORSE) > CLEAR_R - 4)) continue;
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.05 + rnd() * 0.16, 6), fiberMaterial(this.shared, rnd(), rnd() < 0.7 ? "#ffb24a" : "#b8f060"));
      tube.renderOrder = 2;
      this.fibers.push(tube);
      this.root.add(tube);
    }

    // particles: gold motes everywhere, a few green, bright sparks
    const dens = ctx.quality.density;
    this.motes.push(new Motes({ count: Math.round(3200 * dens) + 400, box: [90, 34, 170], center: { x: 0, y: 3, z: -5 }, size: 0.05, color: "#ffc46a", drift: [0, 0.12, -0.25], swirl: 0.5, additive: true, opacity: 1.4 }));
    this.motes.push(new Motes({ count: Math.round(900 * dens) + 150, box: [70, 26, 140], center: { x: 0, y: 2, z: 5 }, size: 0.04, color: "#b6f06a", drift: [0.05, 0.08, -0.1], swirl: 0.4, additive: true, opacity: 0.9, seed: 31 }));
    for (const mo of this.motes) this.root.add(mo.points);
    const sg = new THREE.BufferGeometry();
    const sp: number[] = [];
    for (let i = 0; i < 46; i++) {
      const z = -70 + rnd() * 140;
      const c = corridor(z);
      const p = new THREE.Vector3(c.x + (rnd() - 0.5) * 50, c.y + (rnd() - 0.3) * 18, z);
      if (!clearOfPath(p, 3)) continue;
      sp.push(p.x, p.y, p.z);
    }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.sparks = new THREE.Points(sg, new THREE.PointsMaterial({ map: sparkTexture(), size: 2.6, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.6, 1.25, 0.8) }));
    this.root.add(this.sparks);

    // the horse of light
    const gltf = await ctx.assets.glb(asset("/models/anatomy-exhibit.glb"));
    // a copy: the loader caches the GLTF, and this world rebuilds its meshes (a revisit must find the original intact)
    const model = cloneSkinned(gltf.scene);
    this.buildHorse(model);
    this.horse.add(model);
    this.tail = new TailHair();
    this.tailBone = model.getObjectByName("Tail_1") ?? null;
    this.horse.add(this.tail.mesh);
    this.horse.position.copy(HORSE);
    this.horse.rotation.y = -Math.PI / 2;
    this.root.add(this.horse);
    this.mixer = new THREE.AnimationMixer(model);
    const gallop = gltf.animations.find((a) => a.name === "Gallop_R");
    if (gallop) {
      const a = this.mixer.clipAction(gallop);
      a.timeScale = 0.42; // slow motion: the anatomy reads, the gallop still carries
      a.play();
    }
    // the trail of light streaming off the horse (in the horse's frame: it runs toward local +Z, the light flows back)
    this.trail = new Motes({ count: Math.round(1400 * dens) + 300, box: [1.6, 1.4, 14], center: { x: 0, y: 1.2, z: -7.5 }, size: 0.035, color: "#ffcf7a", drift: [0, 0.05, -6], swirl: 0.15, additive: true, opacity: 1.6, seed: 77 });
    this.horse.add(this.trail.points);
    this.setQuality(ctx.quality);
  }

  /** Merges the exhibit's 120 skinned parts into one mesh per layer (one draw call each) and gives each layer its light. */
  private buildHorse(model: THREE.Object3D) {
    const groups: Record<string, THREE.SkinnedMesh[]> = {};
    const hide: THREE.Object3D[] = [];
    model.traverse((o) => {
      const sm = o as THREE.SkinnedMesh;
      if (!(sm as THREE.Mesh).isMesh) return;
      const mat = (Array.isArray(sm.material) ? sm.material[0] : sm.material) as THREE.Material;
      const name = mat?.name ?? "";
      const layer = name === "Marwari_Coat" ? "shell" : name === "Marwari_Hair" ? "hair" : name === "Muscle" ? "muscle" : name === "Tendon" ? "tendon" : name === "Bone" ? "bone" : null;
      if (!layer || !sm.isSkinnedMesh) { hide.push(o); return; }
      (groups[layer] ??= []).push(sm);
    });
    hide.forEach((o) => { o.visible = false; });
    const look = {
      shell: xrayMaterial("#ffb054", { rimPower: 2.6, body: 0.12, rim: 2.2 }),
      hair: xrayMaterial("#ffc46e", { rimPower: 1.6, body: 0.1, rim: 0.36, strands: 1 }),
      muscle: xrayMaterial("#ff5a24", { rimPower: 1.7, body: 0.55, rim: 1.3 }),
      tendon: xrayMaterial("#ffe3b0", { rimPower: 1.4, body: 0.7, rim: 1.0 }),
      bone: xrayMaterial("#fff0d2", { rimPower: 1.3, body: 0.95, rim: 1.1 }),
    } as const;
    for (const [layer, list] of Object.entries(groups) as [keyof typeof look, THREE.SkinnedMesh[]][]) {
      const first = list[0];
      const same = list.every((m) => m.skeleton.bones.length === first.skeleton.bones.length && m.bindMatrix.equals(first.bindMatrix));
      const mat = look[layer];
      this.layers[layer].push(mat);
      // the strand tail replaces the exhibit's hair on the tail bones
      if (layer === "hair") {
        const ids = ["Tail_1", "Tail_2", "Tail_3", "Tail_4"].map((n) => first.skeleton.bones.findIndex((b) => b.name === n));
        mat.uniforms.uCut.value.set(ids[0], ids[1], ids[2], ids[3]);
      }
      if (list.length > 1 && same) {
        const geos = list.map((m) => {
          const g = new THREE.BufferGeometry();
          for (const k of ["position", "normal", "skinIndex", "skinWeight"]) g.setAttribute(k, m.geometry.getAttribute(k));
          g.setIndex(m.geometry.getIndex());
          return g;
        });
        const merged = mergeGeometries(geos, false);
        if (merged) {
          const sm = new THREE.SkinnedMesh(merged, mat);
          sm.frustumCulled = false;
          sm.name = `light-${layer}`;
          first.parent!.add(sm);
          sm.bind(first.skeleton, first.bindMatrix);
          for (const m of list) { m.visible = false; m.parent?.remove(m); m.geometry.dispose(); }
          geos.forEach((g) => g.dispose());
          continue;
        }
      }
      for (const m of list) { m.material = mat; m.frustumCulled = false; }
    }
    // draw order: bones under muscles under the shell (all additive, so order only matters for the fog-free glow overlap)
    model.traverse((o) => {
      const n = o.name;
      if (n === "light-bone") o.renderOrder = 3;
      if (n === "light-tendon") o.renderOrder = 4;
      if (n === "light-muscle") o.renderOrder = 5;
      if (n === "light-shell") o.renderOrder = 6;
      if (n === "light-hair") o.renderOrder = 7;
    });
  }

  enter() {}
  exit() {}

  setQuality(q: QualitySettings) {
    this.q = q; // nothing is hidden at any tier: cells, fibres and trails always draw in full
  }

  update(p: number, dt: number, time: number, out: ShotPose) {
    this.path.at(p, out);
    // the horse really travels (toward world -X, its heading) and the camera travels with it, so the floor and the cells
    // slide past instead of the horse galloping on the spot
    const run = 5 - 10 * smoothstep(0.25, 1, p);
    this.horse.position.x = HORSE.x + run;
    out.pos.x += run;
    out.look.x += run;
    this.shared.uTime.value = time;
    // the murk thins as we leave the corridor so the clearing reads clearly
    this.shared.uFogDensity.value = THREE.MathUtils.lerp(0.02, 0.011, smoothstep(0.3, 0.45, p));
    for (const m of this.motes) m.update(time);
    this.trail?.update(time);
    this.mixer?.update(dt);
    if (this.tail && this.tailBone) {
      this.tailBone.getWorldPosition(this.tailAt);
      this.tail.mesh.position.copy(this.horse.worldToLocal(this.tailAt));
    }

    // which anatomical layer carries the light (deterministic from p)
    const reveal = smoothstep(0.36, 0.46, p);
    const muscle = smoothstep(0.55, 0.63, p) * (1 - 0.6 * smoothstep(0.73, 0.79, p)) + 0.25 * smoothstep(0.86, 0.95, p);
    const bone = smoothstep(0.7, 0.78, p) + 0.2 * smoothstep(0.86, 0.95, p);
    const shell = reveal * (1 - 0.6 * smoothstep(0.55, 0.62, p) + 0.5 * smoothstep(0.86, 0.95, p));
    const set = (k: keyof typeof this.layers, v: number) => this.layers[k].forEach((m) => { m.uniforms.uLevel.value = v; m.uniforms.uTime.value = time; m.uniforms.uFogDensity.value = this.shared.uFogDensity.value; });
    set("shell", shell);
    set("hair", shell * 0.8);
    this.tail?.update(time, shell);
    set("muscle", reveal * (0.18 + 0.82 * muscle));
    set("tendon", reveal * (0.12 + 0.88 * Math.max(muscle, bone) * 0.8));
    set("bone", reveal * (0.12 + 0.88 * Math.min(1, bone)));
    if (this.trail) this.trail.uniforms.uOpacity.value = 1.05 * reveal;
    // the light scatters into grains before the dust transition
    const scatter = span(p, 0.86, 1);
    this.motes[0].uniforms.uOpacity.value = 1.4 + 2.2 * scatter;
    this.motes[0].uniforms.uSize.value = 0.05 + 0.05 * scatter;
  }

  dispose() {
    this.mixer?.stopAllAction();
    for (const m of this.motes) m.dispose();
    this.trail?.dispose();
    disposeTree(this.root);
    this.scene.clear();
  }
}

export const createLife = (): World => new LifeWorld();
