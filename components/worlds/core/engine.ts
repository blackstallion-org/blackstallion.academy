import * as THREE from "three";
import { HERO_MODEL, HERO_MODEL_MOBILE } from "@/components/3d/marwari-paths";
import { AssetLoader } from "./assets";
import { applyPose, makePose } from "./camera";
import { HorseRig } from "./horse";
import { PostChain } from "./post";
import { FrameGovernor, TIERS, type QualitySettings, type TierName } from "./quality";
import { frameAt, neighbours } from "./timeline";
import type { ShotPose, World, WorldContext, WorldId } from "./types";

/** Each world's code is its own chunk, fetched the first time it is needed. */
const FACTORIES: Record<WorldId, () => Promise<() => World>> = {
  origins: () => import("../scenes/origins").then((m) => m.createOrigins),
  life: () => import("../scenes/life").then((m) => m.createLife),
  legacy: () => import("../scenes/legacy").then((m) => m.createLegacy),
  beyond: () => import("../scenes/beyond").then((m) => m.createBeyond),
};

type Slot = { world: World; ready: boolean; loading: Promise<void> };

export type EngineStatus = { phase: "loading" | "ready" | "failed"; progress: number; world: WorldId; tier: TierName; fps: number; error?: string };

/**
 * The director. Owns the renderer, the one camera (plus a second for the incoming world inside a boundary), the horse, the post
 * chain, world loading (current and both neighbours, nothing further) and disposal of worlds two steps away.
 * Progress comes from scroll (setProgress); the camera eases toward the scroll position with a critically damped follow so a
 * flick of the wheel still reads as a camera move, and it always settles exactly on the pose for that progress.
 */
export class WorldsEngine {
  readonly renderer: THREE.WebGLRenderer;
  private camA = new THREE.PerspectiveCamera(35, 1, 0.1, 20000);
  private camB = new THREE.PerspectiveCamera(35, 1, 0.1, 20000);
  private post: PostChain;
  private assets = new AssetLoader();
  private horse = new HorseRig();
  private slots = new Map<WorldId, Slot>();
  private active = new Set<WorldId>();
  private poseA: ShotPose = makePose();
  private poseB: ShotPose = makePose();
  private target = 0;
  private progress = 0;
  private vel = 0;
  private raf = 0;
  private last = 0;
  private t0 = performance.now();
  private width = 1;
  private height = 1;
  private governor: FrameGovernor;
  private quality: QualitySettings;
  private ctx!: WorldContext;
  private disposed = false;
  private visible = true;
  private center = new THREE.Vector2(0.5, 0.5);
  private tmp = new THREE.Vector3();
  onStatus: ((s: EngineStatus) => void) | null = null;
  status: EngineStatus = { phase: "loading", progress: 0, world: "origins", tier: "high", fps: 60 };
  /** QA: freeze ambient time so a capture is repeatable */
  frozen = false;

  constructor(private canvas: HTMLCanvasElement, private opts: { mobile: boolean; tier: TierName }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", stencil: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // count every pass of a frame (shadow, reflection, both worlds, bloom), reset once per frame in loop()
    this.renderer.info.autoReset = false;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.quality = { ...TIERS[opts.tier] };
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.post = new PostChain(this.renderer);
    this.post.bloomEnabled = this.quality.bloom;
    this.governor = new FrameGovernor(opts.tier, (t) => this.setTier(t));
    this.status.tier = opts.tier;
  }

  async start(initial = 0) {
    try {
      this.assets.onProgress = (f) => this.emit({ progress: f });
      await this.horse.load(this.opts.mobile || this.quality.textures === "lo" ? HERO_MODEL_MOBILE : HERO_MODEL, { coatMap: "/worlds/shared/coat-black.webp" });
      this.ctx = { renderer: this.renderer, assets: this.assets, horse: this.horse, quality: this.quality, mobile: this.opts.mobile };
      this.target = this.progress = initial;
      const f = frameAt(initial);
      await this.ensure(f.a.id);
      if (f.b) await this.ensure(f.b.id);
      this.emit({ phase: "ready", progress: 1 });
      this.preloadAround(initial);
      this.loop(performance.now());
    } catch (e) {
      console.error("[worlds] start failed", e);
      this.emit({ phase: "failed", error: e instanceof Error ? e.message : String(e) });
    }
  }

  private emit(patch: Partial<EngineStatus>) {
    this.status = { ...this.status, ...patch };
    this.onStatus?.(this.status);
  }

  private ensure(id: WorldId): Promise<void> {
    let s = this.slots.get(id);
    if (!s) {
      const slot = { ready: false } as Slot;
      slot.loading = FACTORIES[id]()
        .then(async (make) => {
          slot.world = make();
          await slot.world.load(this.ctx);
          // compile shaders now, not on the first visible frame
          this.renderer.compile(slot.world.scene, this.camA);
          slot.ready = true;
        })
        .catch((e) => {
          console.error(`[worlds] ${id} failed to load`, e);
          this.slots.delete(id);
          throw e;
        });
      s = slot;
      this.slots.set(id, s);
    }
    return s.loading;
  }

  private preloadAround(p: number) {
    for (const id of neighbours(p)) void this.ensure(id).catch(() => {});
    // free worlds that are two or more steps away (they load again if the reader scrolls back)
    const keep = new Set(neighbours(p));
    for (const [id, s] of this.slots) {
      if (!keep.has(id) && s.ready && !this.active.has(id)) {
        s.world.dispose();
        this.slots.delete(id);
      }
    }
  }

  setProgress(p: number) {
    this.target = Math.min(1, Math.max(0, p));
    this.wake();
  }

  /** Jump without easing (keyboard chapter jumps under reduced motion, tests). */
  jump(p: number) {
    this.target = this.progress = Math.min(1, Math.max(0, p));
    this.vel = 0;
    this.wake();
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) this.wake();
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality.dpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.post.setSize(this.width, this.height, dpr);
    this.wake();
  }

  private setTier(t: TierName) {
    this.quality = { ...TIERS[t] };
    this.ctx.quality = this.quality;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.post.bloomEnabled = this.quality.bloom;
    for (const s of this.slots.values()) if (s.ready) s.world.setQuality?.(this.quality);
    this.resize(this.width, this.height);
    this.emit({ tier: t });
  }

  private wake() {
    if (!this.raf && !this.disposed && this.status.phase === "ready") {
      this.last = performance.now();
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    if (this.visible) {
      const t0 = performance.now();
      this.renderer.info.reset();
      this.frame(dt, this.frozen ? 0 : (now - this.t0) / 1000);
      this.cpuMs = performance.now() - t0;
      this.governor.tick(dt * 1000, now / 1000);
      if (Math.random() < 0.02) this.emit({ fps: Math.round(this.governor.fps) });
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame(dt: number, time: number) {
    // critically damped follow toward the scroll target (stiffness ~ 1/0.35 s)
    const k = 18;
    const c = 2 * Math.sqrt(k);
    const acc = k * (this.target - this.progress) - c * this.vel;
    this.vel += acc * dt;
    this.progress += this.vel * dt;
    if (Math.abs(this.target - this.progress) < 1e-5 && Math.abs(this.vel) < 1e-5) { this.progress = this.target; this.vel = 0; }
    const f = frameAt(this.progress);
    const aspect = this.width / this.height;
    const slotA = this.slots.get(f.a.id);
    const slotB = f.b ? this.slots.get(f.b.id) : undefined;
    if (!slotA?.ready) {
      void this.ensure(f.a.id).catch(() => {});
      return;
    }
    if (Math.random() < 0.05) this.preloadAround(this.progress);
    // which worlds are live this frame (enter/exit hand the horse over)
    const live = new Set<WorldId>([f.a.id]);
    if (f.b && slotB?.ready) live.add(f.b.id);
    for (const id of this.active) if (!live.has(id)) this.slots.get(id)?.world.exit();
    // the horse goes to the world that holds the larger share of the frame; it enters last so it owns the horse
    // (a world that does not use the hero horse never takes it, so the outgoing world keeps it until its last frame)
    const bTakes = !!(f.b && slotB?.ready && slotB.world.usesHorse && (f.mix > 0.5 || !slotA.world.usesHorse));
    const owner = bTakes ? f.b!.id : f.a.id;
    let entered = false;
    for (const id of live) if (!this.active.has(id) && id !== owner) { this.slots.get(id)!.world.enter(this.ctx); entered = true; }
    if (entered || !this.active.has(owner) || this.lastOwner !== owner) this.slots.get(owner)!.world.enter(this.ctx);
    this.lastOwner = owner;
    this.active = live;
    this.emit2(owner);

    const ownerWorld = this.slots.get(owner)!.world;
    const other = owner === f.a.id ? (slotB?.ready ? slotB.world : null) : slotA.world;
    const pOwner = owner === f.a.id ? f.a.p : f.b!.p;
    const pOther = owner === f.a.id ? f.b?.p ?? 0 : f.a.p;
    // the horse animates once per frame, in the world that owns it
    this.horse.update(dt, time);
    ownerWorld.update(pOwner, dt, time, owner === f.a.id ? this.poseA : this.poseB, aspect);
    if (other && f.b) other.update(pOther, dt, time, owner === f.a.id ? this.poseB : this.poseA, aspect);
    applyPose(this.camA, this.poseA, aspect);
    if (f.b) applyPose(this.camB, this.poseB, aspect);

    const wa = slotA.world;
    // a world may leave its own clear colour on the shared renderer (a reflection pass): reset it for the frame
    this.renderer.setClearColor(0x000000, 1);
    if (f.b && slotB?.ready) {
      if (f.mode === "iris") {
        // the iris opens on the eye as it appears on screen
        this.horse.bone("Eye_L", this.tmp).project(this.camA);
        this.center.set(this.tmp.x * 0.5 + 0.5, this.tmp.y * 0.5 + 0.5);
        if (Math.abs(this.tmp.x) > 1.2 || Math.abs(this.tmp.y) > 1.2) this.center.set(0.5, 0.5);
      } else this.center.set(0.5, 0.5);
      if (this.quality.dualRender) {
        this.post.draw({ scene: wa.scene, camera: this.camA, grade: wa.grade }, { scene: slotB.world.scene, camera: this.camB, grade: slotB.world.grade }, f.mix, f.mode, time, this.center);
      } else {
        const dom = f.mix < 0.5 ? { scene: wa.scene, camera: this.camA, grade: wa.grade } : { scene: slotB.world.scene, camera: this.camB, grade: slotB.world.grade };
        this.post.draw(dom, dom, f.mix, "fade", time);
      }
    } else {
      this.post.draw({ scene: wa.scene, camera: this.camA, grade: wa.grade }, null, 0, null, time);
    }
  }
  private lastOwner: WorldId | null = null;
  /** CPU time of the last frame's JS + draw submission (ms) */
  cpuMs = 0;
  private emit2(world: WorldId) {
    if (this.status.world !== world) this.emit({ world });
  }

  /** QA hooks (window.__worlds in development): progress, pose and timing. */
  debug() {
    return { progress: this.progress, target: this.target, frame: frameAt(this.progress), pose: { pos: this.poseA.pos.toArray(), look: this.poseA.look.toArray(), fov: this.poseA.fov }, tier: this.quality.tier, fps: this.governor.fps, cpuMs: this.cpuMs, info: this.renderer.info.render };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    for (const s of this.slots.values()) if (s.ready) s.world.dispose();
    this.slots.clear();
    this.horse.dispose();
    this.post.dispose();
    this.assets.dispose();
    this.renderer.dispose();
    if (!this.canvas.isConnected) this.renderer.forceContextLoss();
  }
}
