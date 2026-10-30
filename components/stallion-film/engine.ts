import * as THREE from "three";
import type { Marwari } from "@/components/3d/marwari";
import { DustSystem, PrintSystem } from "./effects";
import { QUALITY_TIERS, type Environment, type EnvId, type Quality } from "./environment";
import { LifeLayer, SecondaryMotion } from "./life";
import { loadGaits, Locomotor, LIMBS, type FootEvent, type GaitTable } from "./locomotion";
import { clamp, damp, mulberry32 } from "./noise";
import { FootLock, LOCK_RAMP_S } from "./footlock";
import { HoofSound } from "./hoofsound";
import { buildShots, CameraRig, type Shot } from "./shots";
import { ATMOSPHERES, Sky, type Atmosphere } from "./sky";

export type StageCtx = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  horse: Marwari;
  mixer: THREE.AnimationMixer;
  /** hero lights, switched off while the film runs */
  heroLights: THREE.Object3D[];
  /** hero ground contact shadow, hidden while the film runs */
  heroShadow: THREE.Object3D | null;
};

type Beat = { at: number; speed?: number; shot?: string; alert?: number; gazeCamera?: number; attention?: boolean; steer?: boolean };
type Chapter = { env: EnvId; title: string; subtitle: string; beats: Beat[]; loop?: { shots: string[]; every: number; speed: number } };

/** The film, as three scenes of one story. Times are seconds since the chapter began. */
export const CHAPTERS: Record<1 | 2 | 3, Chapter> = {
  1: {
    env: "desert", title: "Heritage", subtitle: "The desert of Marwar",
    beats: [
      { at: 0, speed: 0, shot: "wideEstablish", alert: 0 },
      { at: 1.6, attention: true, alert: 1 },
      { at: 4.8, speed: 1.5, alert: 0, shot: "pushIn" },
      { at: 8.2, speed: 3.4 },
      { at: 10.6, speed: 5.2, shot: "lowProfile" },
      { at: 13.6, speed: 10, shot: "sideTrack" },
      { at: 19, speed: 12, shot: "rearTrack" },
      { at: 24.5, speed: 10, shot: "wideTrack" },
    ],
    loop: { shots: ["sideTrack", "rearTrack", "wideTrack", "lowProfile"], every: 7, speed: 10 },
  },
  2: {
    env: "village", title: "Identity", subtitle: "The village",
    beats: [
      { at: 0, speed: 3.4, shot: "villageSide" },
      { at: 5, speed: 1.7, shot: "villageReveal" },
      { at: 14, shot: "villageGate" },
      { at: 24, shot: "courtyardWide", speed: 1.5 },
    ],
    loop: { shots: ["villageSide", "villageReveal", "courtyardWide"], every: 9, speed: 1.7 },
  },
  3: {
    env: "campus", title: "Excellence", subtitle: "The academy",
    beats: [
      { at: 0, speed: 3.4, shot: "campusFollow" },
      { at: 8, speed: 5.2, shot: "campusSide" },
      { at: 16, shot: "arenaWide" },
      { at: 22, speed: 0, shot: "finalWide", steer: true },
      { at: 29, alert: 1, gazeCamera: 1, shot: "finalClose" },
    ],
  },
};

const TRANSITION: Record<string, 0 | 1 | 2> = { "0>1": 0, "1>2": 1, "2>3": 2, "3>2": 2, "2>1": 1 }; // 0 dark, 1 dust, 2 shade

const VEIL_VS = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const VEIL_FS = /* glsl */ `
uniform float uP; uniform int uMode; uniform vec3 uColor; uniform float uTime; uniform float uAspect;
varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y); }
float fbm(vec2 p) { return 0.5 * n(p) + 0.3 * n(p * 2.1 + 3.0) + 0.2 * n(p * 4.3 + 7.0); }
void main() {
  vec2 q = vec2(vUv.x * uAspect, vUv.y);
  float a;
  if (uMode == 1) {                       // a veil of blown dust
    float d = fbm(q * 2.2 + vec2(uTime * 0.22, uTime * 0.05));
    a = smoothstep(0.0, 0.55, uP * 1.7 + (d - 0.5) * 1.1 - 0.18);
  } else if (uMode == 2) {                // a dark wall sweeping across the frame (passing a gateway)
    float edge = uP * 1.35 - 0.1 - (1.0 - vUv.x) * 0.9 + (fbm(vec2(vUv.y * 3.0, uTime * 0.1)) - 0.5) * 0.12;
    a = smoothstep(0.0, 0.08, edge);
  } else {
    a = pow(uP, 1.2);
  }
  gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));
}`;

export type FilmTelemetry = ReturnType<Locomotor["telemetry"]> & { chapter: number; chapterTime: number; shot: string; quality: number; fps: number; veil: number; ready: boolean; active: boolean; env: string };

export class FilmEngine {
  active = false;
  chapter = 0;
  ready = false;
  quality: Quality;
  loco: Locomotor | null = null;
  env: Environment | null = null;
  onChapter: ((chapter: number) => void) | null = null;
  onReady: (() => void) | null = null;

  private ctx: StageCtx | null = null;
  private life: LifeLayer | null = null;
  private footLock: FootLock | null = null;
  private secondary: SecondaryMotion | null = null;
  private sky = new Sky();
  private envSky: Sky | null = null;
  private dust: DustSystem | null = null;
  private ambient: DustSystem | null = null;
  private prints: PrintSystem | null = null;
  private veil: THREE.Mesh | null = null;
  private veilState = { p: 0, target: 0, mode: 0 as 0 | 1 | 2, phase: "idle" as "idle" | "out" | "in", pendingChapter: -1, waiting: false };
  private sun = new THREE.DirectionalLight(0xffffff, 3);
  private hemi = new THREE.HemisphereLight(0xffffff, 0x886644, 1);
  private shots: Record<string, Shot> = {};
  private rig = new CameraRig();
  private tChapter = 0;
  private currentShot = "";
  private beatIndex = -1;
  private loopIndex = -1;
  private desired = 0;
  private locked = false;
  private lastEnv: string = "";
  private gaits: GaitTable | null = null;
  private frameTimes: number[] = [];
  private tierCooldown = 0;
  /** A tier chosen by the visitor or a QA run (high, medium, low); null leaves the choice to the frame-time governor. */
  private pinnedTier: 0 | 1 | 2 | 3 | null = null;
  private time = 0;
  private hoofSound = new HoofSound();
  private envTexture: THREE.Texture | null = null;
  /** The PMREM render target behind `envTexture`: disposing the texture alone leaves the target (and a texture slot) allocated. */
  private envTarget: THREE.WebGLRenderTarget | null = null;
  private heroEnv: THREE.Texture | null = null;
  private heroEnvIntensity = 0.45;
  private heroExposure = 1.45;
  private heroFar = 60;
  private heroFov = 30;
  private gazeVec = { yaw: 0, pitch: 0, weight: 0 };
  private rng = mulberry32(21);
  private pmrem: THREE.PMREMGenerator | null = null;
  private loading = new Map<EnvId, Promise<(q: Quality) => Environment>>();
  private wind = new THREE.Vector3();
  private quietFrames = 0;
  private forward = new THREE.Vector3();
  private tmpV = new THREE.Vector3();
  fps = 60;
  /** QA: freeze the director script (speed/shot are then set from outside). */
  manual = false;

  constructor(private opts: { mobile: boolean }) {
    this.quality = { ...QUALITY_TIERS[opts.mobile ? 2 : 0] };
  }

  /* -------------------------------------------------------------- lifecycle */
  async attach(ctx: StageCtx) {
    this.ctx = ctx;
    this.life = new LifeLayer(ctx.horse);
    this.secondary = new SecondaryMotion(ctx.horse);
    // the hair shader's own flow (lag, lift, fan) adds to the bone springs above; a little less of it here keeps the two from doubling
    ctx.horse.hair.flow.value = 0.8;
    this.shots = buildShots();
    this.dust = new DustSystem(this.opts.mobile ? 360 : 720);
    this.ambient = new DustSystem(this.opts.mobile ? 90 : 220);
    this.prints = new PrintSystem(this.opts.mobile ? 70 : 140);
    for (const d of [this.dust, this.ambient]) { d.points.visible = false; ctx.scene.add(d.points); }
    this.prints.mesh.visible = false;
    ctx.scene.add(this.prints.mesh);
    this.sky.mesh.visible = false;
    ctx.scene.add(this.sky.mesh);
    this.sun.visible = false;
    this.hemi.visible = false;
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 160;
    ctx.scene.add(this.sun, this.sun.target, this.hemi);
    this.makeVeil(ctx);
    ctx.horse.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    this.pmrem = new THREE.PMREMGenerator(ctx.renderer);
    this.applyQuality();
    this.gaits = await loadGaits();
    this.loco = new Locomotor(ctx.horse, ctx.mixer, this.gaits, { height: () => 0, normal: (_x, _z, out) => (out ?? new THREE.Vector3()).set(0, 1, 0) });
    this.loco.onFootEvent = (e) => this.onFoot(e);
    this.footLock = new FootLock(ctx.horse, this.loco);
    this.heroFov = ctx.camera.fov;
    this.heroFar = ctx.camera.far;
    this.ready = true;
    this.onReady?.();
  }

  private makeVeil(ctx: StageCtx) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VEIL_VS, fragmentShader: VEIL_FS, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uP: { value: 0 }, uMode: { value: 0 }, uColor: { value: new THREE.Color("#171513") }, uTime: { value: 0 }, uAspect: { value: 1.6 } },
    });
    this.veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    this.veil.frustumCulled = false;
    this.veil.renderOrder = 1000;
    this.veil.visible = false;
    ctx.scene.add(this.veil);
  }

  dispose() {
    const ctx = this.ctx;
    if (this.active) this.deactivate();
    this.env?.dispose();
    if (ctx) {
      for (const o of [this.dust?.points, this.ambient?.points, this.prints?.mesh, this.sky.mesh, this.veil, this.sun, this.sun.target, this.hemi]) if (o) ctx.scene.remove(o);
    }
    this.hoofSound.dispose();
    this.dust?.dispose(); this.ambient?.dispose(); this.prints?.dispose(); this.sky.dispose(); this.envSky?.dispose();
    this.envTarget?.dispose();
    this.envTarget = null;
    this.envTexture = null;
    this.pmrem?.dispose();
    if (this.veil) { this.veil.geometry.dispose(); (this.veil.material as THREE.Material).dispose(); }
    this.sun.dispose();
    this.hemi.dispose();
    this.ctx = null;
    this.ready = false;
  }

  /* -------------------------------------------------------------- scroll */
  /** 0..1 progress through the pinned film section. */
  setProgress(p: number) {
    if (this.locked) return;
    const hys = 0.012;
    const thresholds = [0.045, 0.36, 0.65];
    let c = this.desired;
    // hysteresis around each boundary
    const raw = p < thresholds[0] ? 0 : p < thresholds[1] ? 1 : p < thresholds[2] ? 2 : 3;
    if (raw !== c) {
      const boundary = thresholds[Math.min(raw, c)] ?? 0;
      if (Math.abs(p - boundary) > hys) c = raw;
    }
    this.desired = c;
  }

  /** Jump the film to a chapter (0 = hero), used by the chapter buttons and by tests. */
  goTo(chapter: number) {
    this.desired = clamp(Math.round(chapter), 0, 3);
    this.locked = true;
  }

  /** Hand the chapter back to the scroll position. */
  unlock() {
    this.locked = false;
  }

  preload(chapter: number) {
    if (chapter >= 1 && chapter <= 3) void this.loadEnv(CHAPTERS[chapter as 1 | 2 | 3].env);
  }

  private loadEnv(kind: EnvId) {
    let p = this.loading.get(kind);
    if (!p) {
      p =
        kind === "desert" ? import("./scenery/desert").then((m) => m.createDesert)
        : kind === "village" ? import("./scenery/village").then((m) => m.createVillage)
        : import("./scenery/campus").then((m) => m.createCampus);
      this.loading.set(kind, p);
    }
    return p;
  }

  /* -------------------------------------------------------------- transitions */
  private startTransition(to: number) {
    const key = `${this.chapter}>${to}`;
    const mode = to === 0 || this.chapter === 0 ? 0 : (TRANSITION[key] ?? 0);
    this.veilState.mode = mode;
    this.veilState.phase = "out";
    this.veilState.target = 1;
    this.veilState.pendingChapter = to;
    this.veilState.waiting = false;
    if (to >= 1) void this.loadEnv(CHAPTERS[to as 1 | 2 | 3].env);
    const mat = this.veil!.material as THREE.ShaderMaterial;
    mat.uniforms.uMode.value = mode;
    const atm = this.env?.atmosphere ?? ATMOSPHERES.desert;
    (mat.uniforms.uColor.value as THREE.Color).set(mode === 0 ? "#171513" : mode === 1 ? new THREE.Color(atm.fog).multiplyScalar(0.95) : "#17120e");
    this.veil!.visible = true;
  }

  private async swapTo(to: number) {
    const ctx = this.ctx!;
    if (to === 0) {
      this.deactivate();
      this.chapter = 0;
      this.onChapter?.(0);
      return;
    }
    const chapter = CHAPTERS[to as 1 | 2 | 3];
    const create = await this.loadEnv(chapter.env);
    if (!this.active) this.activate();
    // the old place goes, the new one arrives
    if (this.env) { ctx.scene.remove(this.env.group); this.env.dispose(); }
    const env = create(this.quality);
    this.env = env;
    ctx.scene.add(env.group);
    this.applyEnvironment(env);
    const loco = this.loco!;
    loco.setGround(env.terrain);
    ctx.horse.contacts.ground = (x, z) => env.terrain.height(x, z);
    loco.surfaceAt = (x, z) => env.surface(x, z);
    env.path.reset();
    // the horse arrives already moving: from rest the desert opens in stillness, the village and the academy open at a trot
    const keepSpeed = to === 1 ? (this.chapter === 0 ? 0 : loco.speed) : clamp(loco.speed, 3.4, 6);
    loco.place(env.start.x, env.start.z, env.start.heading, keepSpeed);
    loco.targetSpeed = keepSpeed;
    this.chapter = to;
    this.tChapter = 0;
    this.beatIndex = -1;
    this.loopIndex = -1;
    this.currentShot = "";
    this.dust?.clear();
    this.prints?.clear();
    this.rig.snap();
    this.rig.cut(this.shots[chapter.beats[0].shot ?? "wideEstablish"], this.shotCtx(), true);
    this.applyBeat(chapter, 0, true);
    this.onChapter?.(to);
  }

  private applyEnvironment(env: Environment) {
    const ctx = this.ctx!;
    const atm: Atmosphere = env.atmosphere;
    this.sky.set(atm);
    ctx.scene.fog = new THREE.FogExp2(new THREE.Color(atm.fog), atm.fogDensity);
    this.sun.color.set(atm.sunColor);
    this.sun.intensity = atm.sunIntensity;
    this.hemi.color.set(atm.hemiSky);
    this.hemi.groundColor.set(atm.hemiGround);
    this.hemi.intensity = atm.hemiIntensity;
    ctx.renderer.toneMappingExposure = atm.exposure;
    // reflections that match the sky of this place
    if (this.pmrem) {
      if (!this.envSky) {
        this.envSky = new Sky();
        this.envSky.mesh.geometry.dispose();
        this.envSky.mesh.geometry = new THREE.SphereGeometry(50, 24, 16);
      }
      this.envSky.set(atm);
      const tmp = new THREE.Scene();
      tmp.add(this.envSky.mesh);
      this.envTarget?.dispose();
      const rt = this.pmrem.fromScene(tmp, 0, 0.1, 100);
      this.envTarget = rt;
      this.envTexture = rt.texture;
      ctx.scene.environment = this.envTexture;
      ctx.scene.environmentIntensity = atm.envIntensity;
    }
    const lightTint = new THREE.Color(atm.sunColor).lerp(new THREE.Color(atm.hemiSky), 0.55);
    this.dust?.setLook(env.surface(0, 0).color, lightTint);
    this.ambient?.setLook(env.surface(0, 0).color, lightTint);
    this.prints?.setLook(new THREE.Color(env.surface(0, 0).color).multiplyScalar(0.28), env.id === "desert" ? 0.55 : env.id === "campus" ? 0.4 : 0.22, 16);
    this.wind.copy(env.wind);
    this.secondary?.setWind(env.wind);
    this.sun.shadow.camera.left = -env.shadowRadius;
    this.sun.shadow.camera.right = env.shadowRadius;
    this.sun.shadow.camera.top = env.shadowRadius;
    this.sun.shadow.camera.bottom = -env.shadowRadius;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.applyQuality();
  }

  private activate() {
    const ctx = this.ctx!;
    this.active = true;
    this.heroEnv = ctx.scene.environment;
    this.heroEnvIntensity = ctx.scene.environmentIntensity;
    this.heroExposure = ctx.renderer.toneMappingExposure;
    ctx.heroLights.forEach((l) => (l.visible = false));
    // outdoors the coat is graded a touch darker than in the studio, and the sun's warmth stays on the highlights
    ctx.horse.highlight.coat.value.set(0.5, 0.92);
    ctx.horse.contacts.strength = 0.6; // the sun casts the real shadow; the blobs add the soft occlusion at the sole
    if (ctx.heroShadow) ctx.heroShadow.visible = false;
    for (const d of [this.dust, this.ambient]) if (d) d.points.visible = true;
    if (this.prints) this.prints.mesh.visible = true;
    this.sky.mesh.visible = true;
    this.sun.visible = true;
    this.hemi.visible = true;
    ctx.renderer.shadowMap.enabled = true;
    ctx.camera.far = 2600;
    ctx.camera.near = 0.15;
    ctx.camera.updateProjectionMatrix();
  }

  private deactivate() {
    const ctx = this.ctx!;
    this.active = false;
    this.loco?.release();
    if (this.env) { ctx.scene.remove(this.env.group); this.env.dispose(); this.env = null; }
    ctx.heroLights.forEach((l) => (l.visible = true));
    ctx.horse.highlight.coat.value.copy(ctx.horse.highlight.coatHome);
    ctx.horse.contacts.strength = 1;
    ctx.horse.contacts.ground = () => 0;
    if (ctx.heroShadow) ctx.heroShadow.visible = true;
    for (const d of [this.dust, this.ambient]) if (d) { d.points.visible = false; d.clear(); }
    if (this.prints) { this.prints.mesh.visible = false; this.prints.clear(); }
    this.sky.mesh.visible = false;
    this.sun.visible = false;
    this.hemi.visible = false;
    ctx.scene.fog = null;
    ctx.scene.environment = this.heroEnv;
    ctx.scene.environmentIntensity = this.heroEnvIntensity;
    ctx.renderer.toneMappingExposure = this.heroExposure;
    ctx.camera.far = this.heroFar;
    ctx.camera.near = 0.1;
    ctx.camera.fov = this.heroFov;
    ctx.camera.updateProjectionMatrix();
    this.footLock?.undo();
    this.life?.undo();
    this.secondary?.undo();
  }

  /* -------------------------------------------------------------- director */
  private shotCtx() {
    const l = this.loco!;
    return { P: l.position, heading: l.heading, speed: l.speed, aspect: this.aspect, groundAt: (x: number, z: number) => this.env?.terrain.height(x, z) ?? 0 };
  }
  aspect = 1.6;

  private applyBeat(chapter: Chapter, i: number, instant = false) {
    const loco = this.loco!;
    const b = chapter.beats[i];
    if (b.speed !== undefined) loco.targetSpeed = b.speed;
    if (b.alert !== undefined) loco.alertTarget = b.alert;
    this.gazeVec.weight = b.gazeCamera ?? (b.gazeCamera === 0 ? 0 : this.gazeVec.weight);
    if (b.gazeCamera === undefined && i === 0) this.gazeVec.weight = 0;
    if (b.shot && b.shot !== this.currentShot) { this.cutShot(b.shot, instant); }
    if (b.attention) this.playOnce("Attention_Response");
  }

  private cutShot(id: string, instant = false) {
    const s = this.shots[id];
    if (!s) return;
    this.currentShot = id;
    this.rig.cut(s, this.shotCtx(), instant);
  }

  playOnce(name: string) {
    const clip = this.ctx?.horse.clips.get(name);
    if (!clip || !this.ctx) return;
    const a = this.ctx.mixer.clipAction(clip);
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = false;
    a.reset().play();
  }

  private runDirector(dt: number) {
    if (this.chapter === 0 || this.manual) return;
    const ch = CHAPTERS[this.chapter as 1 | 2 | 3];
    this.tChapter += dt;
    while (this.beatIndex + 1 < ch.beats.length && ch.beats[this.beatIndex + 1].at <= this.tChapter) {
      this.beatIndex++;
      this.applyBeat(ch, this.beatIndex);
    }
    if (ch.loop && this.beatIndex === ch.beats.length - 1) {
      const lastAt = ch.beats[ch.beats.length - 1].at;
      const k = Math.floor((this.tChapter - lastAt) / ch.loop.every);
      if (k !== this.loopIndex) {
        this.loopIndex = k;
        this.loco!.targetSpeed = ch.loop.speed;
        // the last scripted shot holds for one full period before the loop starts cutting
        if (k > 0) this.cutShot(ch.loop.shots[(((k - 1) % ch.loop.shots.length) + ch.loop.shots.length) % ch.loop.shots.length]);
      }
    }
  }

  /* -------------------------------------------------------------- per-frame hooks (called by the stage) */
  allowIdleEvents() {
    return !this.active || (this.loco?.speed ?? 0) < 0.15;
  }

  /** Remove last frame's additive layers before the mixer rewrites the skeleton. */
  undo() {
    this.footLock?.undo();
    this.life?.undo();
    this.secondary?.undo();
  }

  beforeMixer(dt: number, aspect: number) {
    if (!this.ready || !this.ctx || !this.loco) return;
    this.aspect = aspect;
    this.time += dt;
    // scroll-requested chapter changes
    if (this.veilState.phase === "idle" && this.desired !== this.chapter) {
      this.startTransition(this.desired);
    }
    this.updateVeil(dt);
    if (!this.active) return;
    this.runDirector(dt);
    const loco = this.loco;
    const env = this.env;
    if (!env) return;
    // steer along the path
    if (!(this.chapter === 3 && this.beatIndex >= 3)) {
      const look = clamp(3 + loco.speed * 0.9, 3, 16);
      const t = env.path.target(loco.position.x, loco.position.z, look);
      loco.steerTo = t;
    } else {
      loco.steerTo = null;
    }
    loco.update(dt);
    const life = this.life!;
    life.moving = clamp(loco.weights.Gait ?? 0, 0, 1);
    life.exertion = loco.exertion;
    life.speed = loco.speed;
    life.headQuiet = loco.alertShare;
    life.update(dt);
    loco.idleTimeScale = life.idleTimeScale;
  }

  afterMixer(dt: number) {
    if (!this.ready || !this.ctx || !this.loco || !this.active) return;
    const loco = this.loco;
    this.life!.apply();
    const sec = this.secondary!;
    sec.step(dt, loco.accelLocal.x, loco.accelLocal.y, loco.speed, this.life!.tailImpulse);
    sec.apply();
    this.footLock?.apply(dt);
    loco.sense(Math.max(dt, 1e-3));
    this.updateWorld(dt);
  }

  private updateWorld(dt: number) {
    const ctx = this.ctx!;
    const loco = this.loco!;
    const env = this.env!;
    // frame-time bookkeeping and adaptive quality
    this.frameTimes.push(dt);
    if (this.frameTimes.length >= 60) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.fps = 1 / avg;
      this.frameTimes.length = 0;
      this.tierCooldown = Math.max(0, this.tierCooldown - 1);
      if (this.pinnedTier !== null) this.quietFrames = 0;
      else if (avg > 0.027 && this.quality.tier < 3 && this.tierCooldown === 0) { this.setTier((this.quality.tier + 1) as 0 | 1 | 2 | 3); this.tierCooldown = 3; this.quietFrames = 0; }
      else if (avg < 0.0145) { this.quietFrames++; if (this.quietFrames >= 6 && this.quality.tier > (this.opts.mobile ? 1 : 0) && this.tierCooldown === 0) { this.setTier((this.quality.tier - 1) as 0 | 1 | 2 | 3); this.tierCooldown = 3; this.quietFrames = 0; } }
      else this.quietFrames = 0;
    }
    env.update(dt, loco.position, this.time, this.quality);
    // sun and shadows follow the horse
    const sd = env.atmosphere.sunDir.clone().normalize();
    this.sun.position.copy(loco.position).addScaledVector(sd, 70);
    this.sun.target.position.copy(loco.position);
    this.sun.target.updateMatrixWorld();
    // snap the shadow frustum to texel steps to avoid crawling
    this.sun.castShadow = this.quality.shadows;
    this.dust?.update(dt, this.wind, ctx.renderer.domElement.height, ctx.camera.fov);
    this.emitAmbient(dt);
    this.ambient?.update(dt, this.wind, ctx.renderer.domElement.height, ctx.camera.fov);
    this.prints?.update(this.time);
    this.sky.follow(ctx.camera, this.time);
    void LIMBS;
  }

  /**
   * Quality presets over the four tiers: "high" is tier 0 (2048 shadow map, full scatter), "medium" tier 1, "low" tier 3 (no cast
   * shadow, a quarter of the scatter and dust); "auto" (the default) lets the frame-time governor move between tiers.
   * The place being shown keeps the terrain it was built with; shadows, scatter and particle budgets change at once.
   */
  setPreset(p: "auto" | "high" | "medium" | "low") {
    this.pinnedTier = p === "auto" ? null : ({ high: 0, medium: 1, low: 3 } as const)[p];
    this.quietFrames = 0;
    if (this.pinnedTier !== null) this.setTier(this.pinnedTier);
  }

  get preset(): "auto" | "high" | "medium" | "low" {
    return this.pinnedTier === null ? "auto" : (["high", "medium", "low", "low"] as const)[this.pinnedTier];
  }

  private setTier(t: 0 | 1 | 2 | 3) {
    this.quality = { ...QUALITY_TIERS[t] };
    this.applyQuality();
  }

  private applyQuality() {
    const q = this.quality;
    this.dust?.setBudget(Math.floor((this.opts.mobile ? 360 : 720) * q.dust));
    this.ambient?.setBudget(Math.floor((this.opts.mobile ? 90 : 220) * q.dust));
    this.prints?.setBudget(Math.floor((this.opts.mobile ? 70 : 140) * Math.max(0.5, q.dust)));
    this.sun.castShadow = q.shadows;
    if (this.sun.shadow.mapSize.x !== q.shadowSize) {
      this.sun.shadow.mapSize.set(q.shadowSize, q.shadowSize);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
  }

  private emitAmbient(dt: number) {
    const a = this.ambient;
    if (!a || !this.loco) return;
    const rate = (this.env?.id === "desert" ? 26 : 9) * this.quality.dust;
    let n = rate * dt;
    while (n > 0) {
      if (n < 1 && this.rng() > n) break;
      n -= 1;
      const p = this.loco.position;
      const r = 3 + this.rng() * 16;
      const ang = this.rng() * Math.PI * 2;
      const x = p.x + Math.cos(ang) * r, z = p.z + Math.sin(ang) * r;
      const y = (this.env?.terrain.height(x, z) ?? 0) + 0.25 + this.rng() * 2.4;
      a.emit(x, y, z, this.wind.x * 0.5, 0.05, this.wind.z * 0.5, 0.03 + this.rng() * 0.05, 2.5 + this.rng() * 2.5, 0.5, 0.2);
    }
  }

  /** Dust and prints are made only where a hoof actually strikes or leaves the ground. */
  private onFoot(e: FootEvent) {
    const s = e.surface;
    if (e.kind === "touchdown" && this.active && this.ctx) {
      const cam = this.ctx.camera;
      this.tmpV.copy(e.pos).sub(cam.position);
      const dist = this.tmpV.length();
      const right = this.camRight.setFromMatrixColumn(cam.matrixWorld, 0);
      this.hoofSound.hit(e.impact, s.hardness, clamp(this.tmpV.normalize().dot(right) * 1.4, -1, 1), dist);
    }
    const q = this.quality;
    const dust = this.dust;
    if (!dust || s.dust <= 0) return;
    const vN = clamp(e.speed / 12, 0, 1);
    const fx = Math.sin(e.heading), fz = Math.cos(e.heading);
    const gy = (this.env?.terrain.height(e.pos.x, e.pos.z) ?? 0) + 0.04;
    const r = this.rng;
    if (e.kind === "touchdown") {
      const n = Math.round((1 + 6 * vN * vN) * s.dust * q.dust * (0.6 + 0.7 * e.impact));
      for (let i = 0; i < n; i++) {
        const k = 0.15 + r() * 0.35;
        dust.emit(e.pos.x, gy, e.pos.z, -fx * e.speed * 0.1 * k + (r() - 0.5) * 0.9, 0.3 + r() * (0.7 + vN * 1.4), -fz * e.speed * 0.1 * k + (r() - 0.5) * 0.9, 0.22 + r() * 0.3, 0.9 + r() * 1.2, (0.16 + r() * 0.2) * s.dust);
      }
      if (s.prints > 0 && e.speed > 0.25) {
        const n3 = this.env!.terrain.normal(e.pos.x, e.pos.z, this.tmpV);
        this.prints?.place(e.pos.x, this.env!.terrain.height(e.pos.x, e.pos.z), e.pos.z, e.heading, n3, this.time, e.limb[0] === "F" ? 1 : 0.92);
      }
    } else if (e.speed > 2.5) {
      const n = Math.round((1 + 8 * vN * vN) * s.dust * q.dust);
      for (let i = 0; i < n; i++) {
        const back = (0.18 + r() * 0.35) * e.speed;
        dust.emit(e.pos.x, gy + 0.05, e.pos.z, -fx * back + (r() - 0.5) * 1.2, 0.5 + r() * (0.9 + vN * 2.2), -fz * back + (r() - 0.5) * 1.2, 0.14 + r() * 0.22, 0.8 + r() * 1.3, (0.22 + r() * 0.26) * s.dust, 2.0);
      }
    }
    void damp;
  }

  private updateVeil(dt: number) {
    const v = this.veilState;
    if (v.phase === "idle" || !this.veil) return;
    const mat = this.veil.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = this.time;
    mat.uniforms.uAspect.value = this.aspect;
    const speed = v.phase === "out" ? 1 / 0.85 : 1 / 1.3;
    v.p = clamp(v.p + (v.target > v.p ? 1 : -1) * dt * speed, 0, 1);
    mat.uniforms.uP.value = v.p;
    if (v.phase === "out" && v.p >= 1 && !v.waiting) {
      v.waiting = true;
      void this.swapTo(v.pendingChapter).then(() => {
        v.phase = "in";
        v.target = 0;
      });
    } else if (v.phase === "in" && v.p <= 0) {
      v.phase = "idle";
      this.veil.visible = false;
    }
  }

  /** The camera for this frame, or null while the hero is in charge. */
  cameraPose() {
    if (!this.active || !this.loco || !this.env || !this.ctx) return null;
    return this.clearOfSet(this.rig.update(0, this.shotCtx()));
  }

  private camClear = new THREE.Vector3();
  private camRight = new THREE.Vector3();
  private clearOfSet(pose: { pos: THREE.Vector3; look: THREE.Vector3; fov: number }) {
    const avoid = this.env?.avoidCamera;
    if (!avoid) return pose;
    this.camClear.copy(pose.pos);
    avoid.call(this.env, this.camClear);
    return { pos: this.camClear, look: pose.look, fov: pose.fov };
  }

  /** Advance the rig by dt and return the pose (called once per frame by the stage). */
  stepCamera(dt: number) {
    if (!this.active || !this.loco || !this.env) return null;
    return this.clearOfSet(this.rig.update(dt, this.shotCtx()));
  }

  /** Gaze: toward the camera during the closing frame, otherwise quiet. */
  gaze(camera: THREE.Camera) {
    if (!this.active || !this.loco) return null;
    const w = this.gazeVec.weight;
    if (w <= 0.001) return { yaw: 0, pitch: 0, weight: 1 };
    const head = this.ctx!.horse.bones.Head;
    if (!head) return { yaw: 0, pitch: 0, weight: 1 };
    head.getWorldPosition(this.tmpV);
    const local = this.ctx!.horse.root.worldToLocal(camera.position.clone());
    const hp = this.ctx!.horse.root.worldToLocal(this.tmpV.clone());
    local.sub(hp);
    const yaw = clamp(Math.atan2(local.x, local.z), -1.0, 1.0);
    const pitch = clamp(-Math.atan2(local.y, Math.hypot(local.x, local.z)), -0.35, 0.5);
    return { yaw: yaw * w, pitch: pitch * w, weight: 1 };
  }

  get inFilm() {
    return this.active || this.veilState.phase !== "idle";
  }
  get chapterInfo() {
    return this.chapter >= 1 ? CHAPTERS[this.chapter as 1 | 2 | 3] : null;
  }
  get veilAmount() {
    return this.veilState.p;
  }

  /* -------------------------------------------------------------- QA */
  telemetry(): FilmTelemetry | null {
    if (!this.loco) return null;
    return { ...this.loco.telemetry(), chapter: this.chapter, chapterTime: this.tChapter, shot: this.currentShot, quality: this.quality.tier, fps: this.fps, veil: this.veilState.p, ready: this.ready, active: this.active, env: this.env?.id ?? "" };
  }
  /**
   * QA: step the same physics + mixer + contact sensing synchronously (no rendering) through a list of
   * [target speed m/s, seconds] steps and summarise, per step, what the feet did once the speed had settled:
   * stance slip, ground penetration, footfall order, measured stride length/frequency and the airborne fraction.
   */
  qaRun(steps: [number, number][], dt = 1 / 120) {
    if (!this.ctx || !this.loco || !this.active) return null;
    this.manual = true;
    const loco = this.loco;
    const mixer = this.ctx.mixer;
    const results: Record<string, unknown>[] = [];
    for (const [speed, seconds] of steps) {
      loco.targetSpeed = speed;
      const n = Math.round(seconds / dt);
      const slip: Record<string, number[]> = { FL: [], FR: [], HL: [], HR: [] };
      const downs: Record<string, { t: number; x: number; z: number }[]> = { FL: [], FR: [], HL: [], HR: [] };
      const order: string[] = [];
      let airborne = 0, airborneStrict = 0, counted = 0, minToe = 1, maxTouchGap = 0, maxSpeedErr = 0, maxPen = 0, sumCorr = 0;
      const tdSpeeds: number[] = [];
      const lockedSlip: number[] = [];
      const wasContact: Record<string, boolean> = { FL: false, FR: false, HL: false, HR: false };
      const gaitCount: Record<string, number> = {};
      // foot-lock check: every authored stance, from touchdown to lift-off, must be held for its middle part
      const LOCK_LO = 0.16, LOCK_HI = 0.82, LOCK_FULL = 0.99;
      const stance: Record<string, { inStance: boolean; bad: boolean; mid: number; engaged: boolean }> = Object.fromEntries(LIMBS.map((l) => [l, { inStance: false, bad: false, mid: 0, engaged: false }]));
      const lock = { stances: 0, fullyLocked: 0, neverEngaged: 0, midFrames: 0, midUnlocked: 0, residualSum: 0, residualMax: 0, offsetMax: 0 };
      for (let i = 0; i < n; i++) {
        this.undo();
        this.beforeMixer(dt, this.aspect);
        mixer.update(dt);
        this.afterMixer(dt);
        const settled = Math.abs(loco.speed - speed) < 0.06 && i > n * 0.35;
        if (!settled) {
          for (const l of LIMBS) stance[l].inStance = false;
          continue;
        }
        const fl = this.footLock;
        for (const l of LIMBS) {
          const u = loco.stancePhase(l);
          const st = stance[l];
          if (u !== null) {
            if (!st.inStance) { st.inStance = true; st.bad = false; st.mid = 0; st.engaged = false; }
            if (fl && fl.legs[l].engaged) st.engaged = true;
            if (fl && u >= LOCK_LO && u <= LOCK_HI && fl.legs[l].tStance >= LOCK_RAMP_S) {
              const d = fl.debug[l];
              lock.midFrames++;
              st.mid++;
              if (d.weight < LOCK_FULL) { st.bad = true; lock.midUnlocked++; }
              lock.residualSum += d.residual;
              lock.residualMax = Math.max(lock.residualMax, d.residual);
              lock.offsetMax = Math.max(lock.offsetMax, d.maxOffset);
            }
          } else if (st.inStance) {
            st.inStance = false;
            if (!st.engaged) lock.neverEngaged++;
            if (st.mid > 0) {
              lock.stances++;
              if (!st.bad) lock.fullyLocked++;
            }
          }
        }
        counted++;
        gaitCount[loco.gait] = (gaitCount[loco.gait] ?? 0) + 1;
        maxSpeedErr = Math.max(maxSpeedErr, Math.abs(loco.speed - speed));
        let any = false;
        let low = false;
        maxPen = Math.max(maxPen, loco.penetration);
        sumCorr += loco.groundCorrection;
        for (const l of LIMBS) {
          const h = loco.hooves[l];
          if (h.stanceSlip > 0) slip[l].push(h.stanceSlip);
          if (h.lockedSlip > 0 && this.footLock && this.footLock.legs[l].tStance >= LOCK_RAMP_S) lockedSlip.push(h.lockedSlip);
          if (h.height < 0.04) low = true;
          if (h.contact) {
            any = true;
            minToe = Math.min(minToe, h.height);
            if (!wasContact[l]) { downs[l].push({ t: loco.telemetry().time, x: h.toe.x, z: h.toe.z }); order.push(l); tdSpeeds.push(h.touchdownSpeed); maxTouchGap = Math.max(maxTouchGap, Math.abs(h.height)); }
          }
          wasContact[l] = h.contact;
        }
        if (!any) airborne++;
        if (!low) airborneStrict++;
      }
      const rms = (a: number[]) => (a.length ? Math.sqrt(a.reduce((x, y) => x + y * y, 0) / a.length) : 0);
      const all = ([] as number[]).concat(...Object.values(slip));
      // stride from successive touchdowns of the same hoof
      const strides: number[] = [], periods: number[] = [];
      for (const l of LIMBS) for (let k = 1; k < downs[l].length; k++) { strides.push(Math.hypot(downs[l][k].x - downs[l][k - 1].x, downs[l][k].z - downs[l][k - 1].z)); periods.push(downs[l][k].t - downs[l][k - 1].t); }
      const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
      results.push({
        target: speed, speed: +loco.speed.toFixed(2), gait: Object.entries(gaitCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "", samples: counted,
        slipRmsMps: +rms(all).toFixed(3), slipRmsPerLimb: Object.fromEntries(LIMBS.map((l) => [l, +rms(slip[l]).toFixed(3)])),
        slipFractionOfSpeed: +(rms(all) / Math.max(speed, 0.3)).toFixed(3),
        minToeHeightInContactM: +minToe.toFixed(3), strideLengthM: +mean(strides).toFixed(2), strideFrequencyHz: +(mean(periods) ? 1 / mean(periods) : 0).toFixed(2),
        lock: {
          lockedSlipRmsMps: +rms(lockedSlip).toFixed(3), stances: lock.stances, fullyLocked: lock.fullyLocked, neverEngaged: lock.neverEngaged, midFrames: lock.midFrames, midUnlocked: lock.midUnlocked,
          residualMeanM: +(lock.midFrames ? lock.residualSum / lock.midFrames : 0).toFixed(4), residualMaxM: +lock.residualMax.toFixed(3),
          offsetMaxDeg: +((lock.offsetMax * 180) / Math.PI).toFixed(1),
        },
        touchdownSpeedMps: +mean(tdSpeeds).toFixed(2), maxPenetrationBeforeFixM: +maxPen.toFixed(3), meanGroundCorrectionM: +(counted ? sumCorr / counted : 0).toFixed(4), groundedSamples: all.length, airborneFraction: +(counted ? airborneStrict / counted : 0).toFixed(3), airborneFractionLoose: +(counted ? airborne / counted : 0).toFixed(3), footfallOrder: order.slice(0, 12).join(" "), speedErr: +maxSpeedErr.toFixed(3),
      });
    }
    return results;
  }

  /** QA: cast a ray through a point of the canvas (px, py in CSS pixels) at the horse and report the bind-pose position of the hit. */
  qaPick(px: number, py: number) {
    const ctx = this.ctx;
    if (!ctx) return null;
    const rect = ctx.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((px - rect.left) / rect.width) * 2 - 1, -(((py - rect.top) / rect.height) * 2 - 1));
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, ctx.camera);
    const mesh = ctx.horse.mesh;
    mesh.skeleton.update();
    const hits = rc.intersectObject(mesh, false);
    const h = hits[0];
    if (!h || h.faceIndex == null) return null;
    const g = mesh.geometry;
    const idx = g.index!;
    const pos = g.attributes.position;
    const a = idx.getX(h.faceIndex * 3), b = idx.getX(h.faceIndex * 3 + 1), c = idx.getX(h.faceIndex * 3 + 2);
    const bind = new THREE.Vector3(
      (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3,
      (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3,
      (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3,
    );
    return { world: h.point.toArray(), bind: bind.toArray(), distance: h.distance };
  }

  /** QA: take manual control of speed and shot. */
  setManual(opts: { speed?: number; shot?: string; alert?: number }) {
    this.manual = true;
    if (opts.speed !== undefined && this.loco) this.loco.targetSpeed = opts.speed;
    if (opts.alert !== undefined && this.loco) this.loco.alertTarget = opts.alert;
    if (opts.shot) this.cutShot(opts.shot);
  }
}
