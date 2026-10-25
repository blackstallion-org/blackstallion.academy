/**
 * Puts the one black Marwari into three worlds without a second canvas or a second horse. It lives inside the existing viewer:
 * the viewer hands over its scene, camera, renderer, loaded horse and mixer, and calls `update(dt)` once per frame.
 *
 * What it owns: the treadmill (the horse's motion turned into scroll distance), the current world's layers, the lights that fall
 * on the horse, the guided camera, dust and hoof prints, and the one-at-a-time transition between worlds.
 */
import * as THREE from "three";
import { contactShadow, type Marwari } from "@/components/3d/marwari";
import { DustSystem, PrintSystem } from "@/components/stallion-film/effects";
import { LIMBS, type FootEvent } from "@/components/stallion-film/locomotion";
import { mulberry32 } from "@/components/stallion-film/noise";
import { CameraRig } from "./cameraRig";
import { hoofPressure, type HoofPress } from "./grass";
import { clamp, damp, lerp } from "./math";
import { createSkyEnvironment, rawColor, srgbVec3 } from "./materials";
import { WorldStage } from "./stage";
import { TransitionMachine } from "./transition";
import { Treadmill, type TreadmillTelemetry } from "./treadmill";
import { GAIT_SPEED, type GaitChoice, type LightRig, type WorldConfig, type WorldId } from "./types";
import { gaitFor, WORLDS } from "./worlds";

export type HorseWorldsOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  horse: Marwari;
  mixer: THREE.AnimationMixer;
  mobile: boolean;
  reduced: boolean;
  /** The night colour of the page (the world fades to it). */
  night: string;
  onSwap?: (world: WorldId) => void;
  onGait?: (gait: GaitChoice) => void;
  onBusy?: (busy: boolean) => void;
  onError?: (error: unknown) => void;
};

type Rig = {
  sunDir: THREE.Vector3; sunColor: THREE.Color; sunI: number; sky: THREE.Color; ground: THREE.Color; hemiI: number;
  rimDir: THREE.Vector3; rimColor: THREE.Color; rimI: number; fillDir: THREE.Vector3; fillColor: THREE.Color; fillI: number; exposure: number; env: number;
};

const parseRig = (l: LightRig): Rig => ({
  sunDir: new THREE.Vector3(...l.sunDir).normalize(), sunColor: new THREE.Color(l.sunColor), sunI: l.sunIntensity,
  sky: new THREE.Color(l.skyColor), ground: new THREE.Color(l.groundColor), hemiI: l.hemiIntensity,
  rimDir: new THREE.Vector3(...l.rimDir).normalize(), rimColor: new THREE.Color(l.rimColor), rimI: l.rimIntensity,
  fillDir: new THREE.Vector3(...l.fillDir).normalize(), fillColor: new THREE.Color(l.fillColor), fillI: l.fillIntensity, exposure: l.exposure, env: l.envIntensity,
});

const cloneRig = (r: Rig): Rig => ({
  ...r, sunDir: r.sunDir.clone(), sunColor: r.sunColor.clone(), sky: r.sky.clone(), ground: r.ground.clone(), rimDir: r.rimDir.clone(),
  rimColor: r.rimColor.clone(), fillDir: r.fillDir.clone(), fillColor: r.fillColor.clone(),
});

function mixRig(out: Rig, a: Rig, b: Rig, t: number) {
  out.sunDir.copy(a.sunDir).lerp(b.sunDir, t).normalize();
  out.sunColor.copy(a.sunColor).lerp(b.sunColor, t);
  out.sunI = lerp(a.sunI, b.sunI, t);
  out.sky.copy(a.sky).lerp(b.sky, t);
  out.ground.copy(a.ground).lerp(b.ground, t);
  out.hemiI = lerp(a.hemiI, b.hemiI, t);
  out.rimDir.copy(a.rimDir).lerp(b.rimDir, t).normalize();
  out.rimColor.copy(a.rimColor).lerp(b.rimColor, t);
  out.rimI = lerp(a.rimI, b.rimI, t);
  out.fillDir.copy(a.fillDir).lerp(b.fillDir, t).normalize();
  out.fillColor.copy(a.fillColor).lerp(b.fillColor, t);
  out.fillI = lerp(a.fillI, b.fillI, t);
  out.exposure = lerp(a.exposure, b.exposure, t);
  out.env = lerp(a.env, b.env, t);
}

/** The same deep black coat in every world: the grade is set once and never touched by the scenery. */
const COAT_GRADE = new THREE.Vector2(0.45, 0.9);
/** The mane and tail keep one tone too: the strand texture carries pale highlights that read as grey streaks under a bright sky. */
const HAIR_GRADE = 0.42;
const UP = new THREE.Vector3(0, 1, 0);

export class HorseWorlds {
  readonly rig = new CameraRig();
  readonly treadmill: Treadmill;
  readonly tm: TransitionMachine;
  /** The world on screen (or being faded out). */
  get world(): WorldId {
    return this.tm.current;
  }
  gait: GaitChoice = "stand";
  time = 0;

  private readonly o: HorseWorldsOptions;
  private reduced: boolean;
  private stages = new Map<WorldId, WorldStage>();
  private loading = new Map<WorldId, Promise<WorldStage>>();
  private envs = new Map<WorldId, THREE.Texture>();
  private envTargets: THREE.WebGLRenderTarget[] = [];
  private pmrem: THREE.PMREMGenerator;
  private readonly sun = new THREE.DirectionalLight(0xffffff, 3);
  private readonly rimLight = new THREE.DirectionalLight(0xffffff, 2);
  private readonly fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0x886644, 0.6);
  private readonly contact = contactShadow(2.6, 3.6);
  private readonly dust: DustSystem;
  private readonly ambient: DustSystem;
  private readonly prints: PrintSystem;
  private readonly wind = new THREE.Vector3();
  /** The four hooves as the grass sees them: where each is and how hard it presses (smoothed, so the blades rise over a moment). */
  private readonly hoofPress: HoofPress[] = LIMBS.map(() => ({ x: 0, z: 0, press: 0 }));
  private fromRig: Rig;
  private toRig: Rig;
  private shown: Rig;
  private activeStage: WorldStage | null = null;
  private mountedId: WorldId | null = null;
  private pendingGait: GaitChoice | null = null;
  private aspect = 1.6;
  private rng = mulberry32(5);
  private dustScale = 1;
  private ambientAcc = 0;
  private busyReported = false;
  /** Counts the requests made with motion reduced; only the newest one may put its place on stage. */
  private reducedTicket = 0;
  private disposed = false;
  private shadowsOn: boolean;
  private failed = false;
  private frameEma = 1 / 60;
  /** The world the lights are heading to (the one being switched to, else the current one). */
  private aimWorld: WorldId = "desert";

  constructor(o: HorseWorldsOptions) {
    this.o = o;
    this.reduced = o.reduced;
    this.treadmill = new Treadmill(o.horse, o.mixer);
    this.tm = new TransitionMachine("desert");
    this.pmrem = new THREE.PMREMGenerator(o.renderer);
    const first = parseRig(WORLDS.desert.light);
    this.fromRig = cloneRig(first);
    this.toRig = cloneRig(first);
    this.shown = cloneRig(first);
    this.dust = new DustSystem(o.mobile ? 360 : 720);
    this.ambient = new DustSystem(o.mobile ? 90 : 220);
    this.prints = new PrintSystem(o.mobile ? 70 : 140);
    this.dustScale = o.mobile ? 0.55 : 1;
    this.shadowsOn = true;
    const { scene, horse, renderer } = o;
    horse.highlight.coat.value.copy(COAT_GRADE);
    horse.root.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.isMesh) {
        // the mane and tail are layered hair cards: they cast shadows but must not shadow themselves (that reads as a lattice)
        const material = Array.isArray(m.material) ? m.material[0] : m.material;
        m.castShadow = true;
        m.receiveShadow = material?.name !== "Marwari_Hair";
        // The hair cards are alpha-tested: at this distance the card's mip levels average to less than the 0.45 cut-off the close-up
        // viewer uses, which strips the tail to a few threads. A lower cut-off keeps it full, and multisampling softens its edge.
        if (material?.name === "Marwari_Hair") {
          material.alphaTest = 0.2;
          material.alphaToCoverage = true;
          if (material instanceof THREE.MeshStandardMaterial) {
            material.color.setScalar(HAIR_GRADE);
            material.envMapIntensity = 0.35;
            material.roughness = 0.62;
          }
          material.needsUpdate = true;
        }
      }
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.025;
    const cam = this.sun.shadow.camera;
    cam.left = -9; cam.right = 9; cam.top = 9; cam.bottom = -9; cam.near = 1; cam.far = 90;
    this.sun.shadow.mapSize.set(o.mobile ? 1024 : 2048, o.mobile ? 1024 : 2048);
    this.sun.target.position.set(0, 0.9, 0);
    for (const d of [this.dust, this.ambient]) d.points.visible = false;
    this.prints.mesh.visible = false;
    scene.add(this.sun, this.sun.target, this.rimLight, this.rimLight.target, this.fillLight, this.fillLight.target, this.hemi, this.contact, this.dust.points, this.ambient.points, this.prints.mesh);
    this.contact.position.set(0, 0.004, 0.25);
    this.treadmill.onFoot = (e) => this.onFoot(e);
    this.rig.life = this.reduced ? 0 : 1;
  }

  /* ---------------------------------------------------------------- loading */
  /** Loads the first world and shows it. Resolves when the scene can be drawn. */
  async init(world: WorldId, gait: GaitChoice) {
    const stage = await this.ensure(world);
    if (this.disposed) return;
    this.tm.current = world;
    this.aimWorld = world;
    this.tm.fade = 1;
    this.tm.lightMix = 1;
    this.gait = gaitFor(WORLDS[world], gait);
    this.mount(world, stage);
    this.toRig = parseRig(WORLDS[world].light);
    this.fromRig = cloneRig(this.toRig);
    this.rig.setShot(WORLDS[world].shots[this.gait]);
    this.rig.snap();
    this.applyLights(1, 1);
    // pose: a few frames so the idle layers are in place before the first picture
    for (let i = 0; i < 3; i++) this.treadmill.step(1 / 60);
    if (!this.reduced) this.treadmill.setGait(this.gait);
    this.o.onGait?.(this.gait);
    this.o.onSwap?.(world);
  }

  private ensure(id: WorldId): Promise<WorldStage> {
    const have = this.stages.get(id);
    if (have) return Promise.resolve(have);
    let p = this.loading.get(id);
    if (!p) {
      const anisotropy = Math.min(this.o.renderer.capabilities.getMaxAnisotropy(), this.o.mobile ? 4 : 8);
      p = WorldStage.load(WORLDS[id], { mobile: this.o.mobile, anisotropy, shadows: true }).then((stage) => {
        this.loading.delete(id);
        if (this.disposed) {
          stage.dispose();
          return stage;
        }
        this.stages.set(id, stage);
        this.makeEnv(id, stage);
        // upload the pictures now, not on the first frame of the fade-in
        for (const t of stage.textureList) this.o.renderer.initTexture(t);
        return stage;
      });
      p.catch((e) => {
        this.loading.delete(id);
        this.fail(e);
      });
      this.loading.set(id, p);
    }
    return p;
  }

  /** Fetch a world's art ahead of time (on hover, focus or idle) so that switching does not wait. */
  prefetch(id: WorldId) {
    if (this.disposed || this.failed) return;
    void this.ensure(id).catch(() => {});
  }

  private makeEnv(id: WorldId, stage: WorldStage) {
    if (this.envs.has(id)) return;
    const tmp = new THREE.Scene();
    const mesh = createSkyEnvironment(stage.config.sky, stage.sunDir);
    tmp.add(mesh);
    try {
      const target = this.pmrem.fromScene(tmp, 0.02, 0.1, 100);
      this.envs.set(id, target.texture);
      this.envTargets.push(target);
    } catch (e) {
      this.fail(e);
    } finally {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  }

  /* ---------------------------------------------------------------- requests */
  /** Ask for a world. The switch plays out one at a time; the newest request wins. */
  requestWorld(id: WorldId) {
    if (this.failed || this.disposed) return;
    if (this.reduced) {
      // No fade and no travel, but the same rule as the animated switch: the place asked for last is the one that ends up on stage,
      // however long each one takes to load (a cold place can arrive after a cached one that was asked for later).
      const ticket = ++this.reducedTicket;
      if (id === this.tm.current) {
        this.o.onBusy?.(false); // asking for the place already on stage cancels a switch that was still loading
        return;
      }
      // nothing fades with motion reduced, but a place whose art is still on its way is reported as busy, as in the animated switch
      if (!this.stages.has(id)) this.o.onBusy?.(true);
      void this.ensure(id).then((stage) => {
        if (this.disposed || ticket !== this.reducedTicket) return;
        this.tm.current = id;
        this.aimWorld = id;
        this.tm.fade = 1;
        this.tm.lightMix = 1;
        this.gait = "stand";
        this.mount(id, stage);
        this.toRig = parseRig(WORLDS[id].light);
        this.fromRig = cloneRig(this.toRig);
        this.applyLights(1, 1);
        this.rig.setShot(WORLDS[id].shots.stand);
        this.rig.snap();
        this.o.onGait?.("stand");
        this.o.onSwap?.(id);
        this.o.onBusy?.(false);
      }).catch(() => {});
      return;
    }
    if (!this.tm.request(id)) return;
    void this.ensure(id).catch(() => {});
    this.beginSwitchEffects();
  }

  /** While a switch runs the horse settles to a stand and the camera relaxes to the standing shot. */
  private beginSwitchEffects() {
    this.treadmill.settleFast = true;
    this.treadmill.setGait("stand");
    this.rig.setShot(WORLDS[this.tm.target ?? this.tm.current].shots.stand);
  }

  requestGait(g: GaitChoice) {
    if (this.failed || this.disposed) return;
    const w = WORLDS[this.tm.target ?? this.tm.current];
    const next = gaitFor(w, g);
    if (this.tm.busy) {
      this.pendingGait = next;
      return;
    }
    this.applyGait(next);
  }

  private applyGait(g: GaitChoice) {
    this.gait = g;
    this.treadmill.settleFast = false;
    if (this.reduced) this.treadmill.stopNow();
    else this.treadmill.setGait(g);
    this.rig.setShot(WORLDS[this.tm.current].shots[g]);
    if (this.reduced) this.rig.snap();
    this.o.onGait?.(g);
  }

  setReduced(r: boolean) {
    if (r === this.reduced) return;
    this.reduced = r;
    this.rig.life = r ? 0 : 1;
    if (r) {
      this.treadmill.stopNow();
      this.rig.snap();
    } else {
      this.treadmill.setGait(this.gait);
    }
  }

  /* ---------------------------------------------------------------- view */
  resize(width: number, height: number) {
    const aspect = width / Math.max(height, 1);
    // The camera keeps the whole horse in frame at the picture's shape, so a new shape means a new distance. With motion reduced
    // the viewer's loop sleeps after one frame, so the camera has to jump there instead of gliding.
    if (this.reduced && Math.abs(aspect - this.aspect) > 1e-3) this.rig.snap();
    this.aspect = aspect;
    this.o.camera.aspect = this.aspect;
    this.o.camera.updateProjectionMatrix();
  }
  nudge(dx: number, dy: number, width: number) {
    this.rig.nudge(dx, dy, width);
  }
  releaseNudge() {
    this.rig.release();
  }
  resetView() {
    this.rig.resetNudge();
  }

  /* ---------------------------------------------------------------- frame */
  /**
   * Advance everything by `dt` seconds. Returns true while something is still moving (the viewer keeps asking for frames); with
   * reduced motion that is only while a camera move or a switch is settling.
   */
  update(dt: number): boolean {
    if (this.disposed || this.failed) return false;
    dt = clamp(dt, 0, 0.05);
    const wasBusy = this.tm.busy;
    this.frameEma = lerp(this.frameEma, dt || this.frameEma, 0.05);
    this.time += dt;

    // 1. the switch between worlds
    this.tm.update(dt, (id) => this.stages.has(id) && this.envs.has(id));
    this.syncLightAim();
    if (this.tm.busy) this.beginSwitchEffects();
    this.mountPending();
    if (wasBusy && !this.tm.busy) {
      // the new world is fully shown: the horse may move off
      this.treadmill.settleFast = false;
      this.applyGait(gaitFor(WORLDS[this.tm.current], this.pendingGait ?? this.gait));
      this.pendingGait = null;
    }
    if (this.tm.busy !== this.busyReported) {
      this.busyReported = this.tm.busy;
      this.o.onBusy?.(this.busyReported);
    }

    // 2. the horse and the ground
    const before = this.treadmill.distance;
    if (!this.reduced) this.treadmill.step(dt);
    const travelled = this.treadmill.distance - before;
    if (travelled > 0) {
      this.dust.shiftZ(-travelled);
      this.ambient.shiftZ(-travelled);
      this.prints.shiftZ(-travelled, this.time);
    }

    // 3. the world on screen
    const stage = this.activeStage;
    const fade = this.tm.fade;
    this.updateHooves(dt);
    if (stage) {
      stage.update(this.treadmill.distance, this.time, this.o.camera);
      stage.setFade(fade);
    }
    this.contact.visible = fade > 0.02;
    (this.contact.material as THREE.MeshBasicMaterial).opacity = fade * 0.9;

    // 4. light that falls on the horse, camera
    this.applyLights(this.tm.lightMix, fade);
    this.rig.update(dt, this.aspect, this.time);
    this.rig.apply(this.o.camera);

    // 5. dust, prints, drifting motes
    this.updateEffects(dt, fade);
    if (!this.reduced) this.adapt(dt);
    return !this.reduced || this.tm.busy || !this.rig.settled;
  }

  /**
   * Puts the world the machine has switched to on stage as soon as its art is here: on the frame of the swap, or a little later
   * if it was still loading (the old world has faded out by then and stays hidden meanwhile).
   */
  private mountPending() {
    const id = this.tm.current;
    if (this.tm.phase === "out" || this.mountedId === id) return;
    const stage = this.stages.get(id);
    if (!stage || !this.envs.has(id)) return;
    this.mount(id, stage);
    this.o.onSwap?.(id);
  }

  /** Re-aims the light mix whenever the world it is heading to changes (a new switch, a change of mind, a reversal). */
  private syncLightAim() {
    const want = this.tm.phase === "out" ? (this.tm.target ?? this.tm.current) : this.tm.current;
    if (want === this.aimWorld) return;
    this.aimWorld = want;
    this.fromRig = cloneRig(this.shown);
    this.toRig = parseRig(WORLDS[want].light);
    this.tm.lightMix = 0;
  }

  private mount(id: WorldId, stage: WorldStage) {
    const { scene } = this.o;
    const config = WORLDS[id];
    if (this.activeStage && this.activeStage !== stage) {
      this.activeStage.group.removeFromParent();
    }
    this.activeStage = stage;
    this.mountedId = id;
    scene.add(stage.group);
    scene.fog = new THREE.FogExp2(new THREE.Color(config.fog.color), config.fog.density);
    scene.background = new THREE.Color(this.o.night);
    const env = this.envs.get(id);
    if (env) scene.environment = env;
    this.treadmill.setSurface(config.surface);
    this.wind.set(...config.wind);
    this.dust.setLook(rawColor(config.surface.dustColor), rawColor("#fff1dc"));
    this.ambient.setLook(rawColor(config.ambientDust.color), rawColor("#fff6e6"));
    this.prints.setLook(rawColor(config.surface.printTint), config.surface.printStrength, config.surface.printLife);
    this.dust.clear();
    this.ambient.clear();
    this.prints.clear();
    this.dust.points.visible = true;
    this.ambient.points.visible = true;
    this.prints.mesh.visible = true;
    this.trimCache(id);
  }

  /** Keep memory low: the world on screen plus, on desktop, the one before it. */
  private trimCache(keep: WorldId) {
    const limit = this.o.mobile ? 1 : 2;
    const others = [...this.stages.keys()].filter((k) => k !== keep);
    while (others.length + 1 > limit) {
      const drop = others.shift();
      const stage = drop ? this.stages.get(drop) : undefined;
      if (!drop || !stage) break;
      if (stage !== this.activeStage) {
        stage.dispose();
        this.stages.delete(drop);
      }
    }
  }

  private applyLights(mix: number, fade: number) {
    mixRig(this.shown, this.fromRig, this.toRig, mix);
    const r = this.shown;
    const dim = lerp(0.18, 1, fade);
    this.sun.color.copy(r.sunColor);
    this.sun.intensity = r.sunI * dim;
    this.sun.position.copy(r.sunDir).multiplyScalar(40);
    this.sun.castShadow = this.shadowsOn;
    this.rimLight.color.copy(r.rimColor);
    this.rimLight.intensity = r.rimI * dim;
    this.rimLight.position.copy(r.rimDir).multiplyScalar(20);
    this.fillLight.color.copy(r.fillColor);
    this.fillLight.intensity = r.fillI * dim;
    this.fillLight.position.copy(r.fillDir).multiplyScalar(20);
    this.hemi.color.copy(r.sky);
    this.hemi.groundColor.copy(r.ground);
    this.hemi.intensity = r.hemiI * dim;
    this.o.renderer.toneMappingExposure = r.exposure;
    this.o.scene.environmentIntensity = r.env * dim;
  }

  /* ---------------------------------------------------------------- effects */
  private updateHooves(dt: number) {
    const { hooves } = this.treadmill.loco;
    LIMBS.forEach((limb, i) => {
      const h = hooves[limb];
      const s = this.hoofPress[i];
      s.x = h.toe.x;
      s.z = h.toe.z - 0.07; // from the toe to the middle of the hoof
      s.press = damp(s.press, hoofPressure(h.contact, h.height), 16, dt);
    });
    this.activeStage?.setHooves(this.hoofPress);
  }

  private onFoot(e: FootEvent) {
    const s = e.surface;
    if (this.tm.fade < 0.3 || s.dust <= 0 || this.reduced) return;
    const r = this.rng;
    const vN = clamp(e.speed / 12, 0, 1);
    const gy = 0.04;
    if (e.kind === "touchdown") {
      const n = Math.round((1 + 6 * vN * vN) * s.dust * this.dustScale * (0.6 + 0.7 * e.impact));
      for (let i = 0; i < n; i++) {
        const k = 0.15 + r() * 0.35;
        this.dust.emit(e.pos.x, gy, e.pos.z, (r() - 0.5) * 0.9, 0.3 + r() * (0.7 + vN * 1.4), -e.speed * 0.1 * k + (r() - 0.5) * 0.9, 0.22 + r() * 0.3, 0.9 + r() * 1.2, (0.16 + r() * 0.2) * s.dust);
      }
      if (s.prints > 0 && e.speed > 0.25) this.prints.place(e.pos.x, 0, e.pos.z, 0, UP, this.time, e.limb[0] === "F" ? 1 : 0.92);
    } else if (e.speed > 2.5) {
      const n = Math.round((1 + 8 * vN * vN) * s.dust * this.dustScale);
      for (let i = 0; i < n; i++) {
        const back = (0.18 + r() * 0.35) * e.speed;
        this.dust.emit(e.pos.x, gy + 0.05, e.pos.z, (r() - 0.5) * 1.2, 0.5 + r() * (0.9 + vN * 2.2), -back + (r() - 0.5) * 1.2, 0.14 + r() * 0.22, 0.8 + r() * 1.3, (0.22 + r() * 0.26) * s.dust);
      }
    }
  }

  private updateEffects(dt: number, fade: number) {
    const stage = this.activeStage;
    if (!stage) return;
    const config = stage.config;
    const px = this.o.renderer.domElement.height || 800;
    const fov = this.o.camera.fov;
    // soft motes hanging in the light, carried by the wind
    this.ambientAcc += dt * config.ambientDust.rate * (this.o.mobile ? 0.4 : 1) * (this.reduced ? 0 : 1) * (fade > 0.5 ? 1 : 0);
    const r = this.rng;
    while (this.ambientAcc >= 1) {
      this.ambientAcc -= 1;
      this.ambient.emit(-4 + r() * 14, 0.3 + r() * 2.6, -9 + r() * 18, config.wind[0] * 0.3, 0.02 * (r() - 0.5), config.wind[2] * 0.3, config.ambientDust.size * (0.5 + r()), 5 + r() * 5, 0.06 + r() * 0.07, 0.6);
    }
    // the dust and motes go out with the scene instead of hanging in the dark while it fades
    this.dust.uniforms.uOpacity.value = fade;
    this.ambient.uniforms.uOpacity.value = fade;
    this.prints.uniforms.uOpacity.value = fade;
    this.dust.update(dt, this.wind, px, fov);
    this.ambient.update(dt, this.wind, px, fov);
    this.prints.update(this.time);
  }

  /** If frames run long for a while, give up the costly extras first: soft shadows, then some pixels. */
  private lowFrames = 0;
  private tier = 0;
  adaptive = true;
  private adapt(dt: number) {
    if (!this.adaptive || dt <= 0) return;
    if (this.frameEma > 0.03) this.lowFrames += dt;
    else this.lowFrames = Math.max(0, this.lowFrames - dt * 0.5);
    if (this.lowFrames > 2.5 && this.tier < 2) {
      this.tier++;
      this.lowFrames = 0;
      if (this.tier === 1) {
        this.sun.shadow.mapSize.set(1024, 1024);
        this.sun.shadow.map?.dispose();
        this.sun.shadow.map = null;
      } else {
        this.shadowsOn = false;
        this.o.renderer.setPixelRatio(Math.min(this.o.renderer.getPixelRatio(), 1));
        this.o.renderer.setSize(this.o.renderer.domElement.clientWidth, this.o.renderer.domElement.clientHeight, false);
      }
    }
  }

  /* ---------------------------------------------------------------- state for the page and for tests */
  get busy() {
    return this.tm.busy;
  }

  telemetry(): TreadmillTelemetry & { world: WorldId; fade: number; phase: string; wantedGait: GaitChoice; speedTarget: number } {
    return { ...this.treadmill.telemetry(), world: this.tm.current, fade: this.tm.fade, phase: this.tm.phase, wantedGait: this.gait, speedTarget: GAIT_SPEED[this.gait] };
  }

  private fail(e: unknown) {
    if (this.failed || this.disposed) return;
    this.failed = true;
    this.o.onError?.(e);
  }

  dispose() {
    this.disposed = true;
    const { scene } = this.o;
    this.activeStage?.group.removeFromParent();
    for (const s of this.stages.values()) s.dispose();
    this.stages.clear();
    for (const t of this.envTargets) t.dispose();
    this.envTargets = [];
    this.envs.clear();
    this.pmrem.dispose();
    for (const l of [this.sun, this.rimLight, this.fillLight, this.hemi]) {
      scene.remove(l);
      l.dispose?.();
    }
    scene.remove(this.sun.target, this.rimLight.target, this.fillLight.target, this.contact, this.dust.points, this.ambient.points, this.prints.mesh);
    this.dust.dispose();
    this.ambient.dispose();
    this.prints.dispose();
    this.contact.geometry.dispose();
    (this.contact.material as THREE.MeshBasicMaterial).map?.dispose();
    (this.contact.material as THREE.Material).dispose();
    scene.fog = null;
    void srgbVec3;
  }
}

export type { WorldConfig };
