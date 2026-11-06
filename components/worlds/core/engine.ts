import * as THREE from "three";
import { HERO_MODEL } from "@/components/3d/marwari-paths";
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

/** film progress per second at most (1 = the whole film); how hard the camera pulls toward the scroll position; how quickly its speed eases */
const MAX_SPEED = 0.05;
const FOLLOW = 3.2;
const EASE = 4.5;

type Slot = { world: World; ready: boolean; loading: Promise<void> };

/** Resolves on the next animation frame (or after 60 ms in a hidden tab, where frames do not run). */
const nextFrame = () => new Promise<void>((resolve) => {
  let done = false;
  const go = () => { if (!done) { done = true; resolve(); } };
  requestAnimationFrame(go);
  setTimeout(go, 60);
});

/** Every plain texture a scene draws with (material maps and shader uniforms, background, environment); render targets and video are skipped. */
function collectTextures(scene: THREE.Scene): THREE.Texture[] {
  const seen = new Set<THREE.Texture>();
  const add = (v: unknown) => {
    const t = v as THREE.Texture | undefined;
    if (t && t.isTexture && !(t as { isRenderTargetTexture?: boolean }).isRenderTargetTexture && !(t as { isVideoTexture?: boolean }).isVideoTexture) seen.add(t);
  };
  add(scene.background);
  add(scene.environment);
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
      for (const v of Object.values(mat)) add(v);
      const u = (mat as THREE.ShaderMaterial).uniforms;
      if (u) for (const k of Object.keys(u)) add(u[k]?.value);
    }
  });
  return [...seen];
}

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
  /** called every frame with the camera's own (smoothed) progress, so the letterbox can move with the picture and not ahead of it */
  onFrame: ((progress: number) => void) | null = null;
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
    this.governor = new FrameGovernor(opts.tier, (t) => this.setTier(t), 1000 / 45, () => this.resize(this.width, this.height));
    this.post.setSamples(opts.tier);
    this.status.tier = opts.tier;
  }

  async start(initial = 0) {
    try {
      this.assets.onProgress = (f) => this.emit({ progress: f });
      const horseReady = this.horse.load(HERO_MODEL, { coatMap: "/worlds/shared/coat-black.webp" });
      this.ctx = { renderer: this.renderer, assets: this.assets, horse: this.horse, quality: this.quality, mobile: this.opts.mobile };
      this.target = this.progress = initial;
      const f = frameAt(initial);
      if (f.a.id === "origins" && !f.b) {
        // Origins only touches the horse when it is entered (after loading), so the horse and the world download together
        await Promise.all([horseReady, this.ensure(f.a.id)]);
      } else {
        await horseReady;
        await this.ensure(f.a.id);
        if (f.b) await this.ensure(f.b.id);
      }
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
          try {
            // compileAsync lets the GPU driver build shaders in parallel without freezing the page
            await this.renderer.compileAsync(slot.world.scene, this.camA);
          } catch {
            this.renderer.compile(slot.world.scene, this.camA);
          }
          // upload the world's textures now, one per frame, so the first frame inside it does not stall on a dozen large uploads
          for (const t of collectTextures(slot.world.scene)) {
            if (this.disposed) break;
            try { this.renderer.initTexture(t); } catch { /* uploaded on first use instead */ }
            await nextFrame();
          }
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
    this.lastInput = performance.now();
    this.wake();
  }

  /** Light mode (the visitor's choice): the lowest tier, locked, for devices that struggle. Off returns to the device's own start. */
  private lite = false;
  setLite(on: boolean) {
    if (on === this.lite) return;
    this.lite = on;
    this.governor.locked = on;
    const t = on ? "low" : this.opts.tier;
    this.governor.force(t);
    this.setTier(t);
  }
  /** time of the last scroll input (ms): the film renders every frame while it moves, and at 30 fps when it rests */
  private lastInput = 0;

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
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality.dpr) * this.governor.scale;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.post.setSize(this.width, this.height, dpr);
    this.wake();
  }

  private setTier(t: TierName) {
    this.quality = { ...TIERS[t] };
    if (this.ctx) this.ctx.quality = this.quality;
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.post.bloomEnabled = this.quality.bloom;
    this.post.setSamples(t);
    for (const s of this.slots.values()) if (s.ready) s.world.setQuality?.(this.quality);
    this.resize(this.width, this.height);
    this.emit({ tier: t });
  }

  /** true while loop() runs: a resize or a tier change inside a frame calls wake(), which must not start a second animation-frame chain */
  private looping = false;
  private wake() {
    if (!this.raf && !this.looping && !this.disposed && this.status.phase === "ready") {
      this.last = performance.now();
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    this.looping = true;
    if (!this.visible) {
      this.last = now;
    } else {
      // while the film moves every frame is drawn (and measured); at rest the ambient life (breath, grass, dust) runs at 30 fps,
      // which halves the heat and battery cost of a page that is only being looked at
      const moving = Math.abs(this.target - this.progress) > 2e-4 || Math.abs(this.vel) > 3e-4 || performance.now() - this.lastInput < 600;
      if (moving || now - this.last >= 28) {
        const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
        this.last = now;
        const t0 = performance.now();
        this.renderer.info.reset();
        this.frame(dt, this.frozen ? 0 : (now - this.t0) / 1000);
        this.cpuMs = performance.now() - t0;
        if (moving) this.governor.tick(dt * 1000, now / 1000);
        // the page does not need the frame rate; development tools do
        if (process.env.NODE_ENV !== "production" && Math.random() < 0.02) this.emit({ fps: Math.round(this.governor.fps) });
      }
    }
    this.raf = requestAnimationFrame(this.loop);
    this.looping = false;
  };

  private frame(dt: number, time: number) {
    // A slow, deliberate glide toward the scroll position. The camera eases in and out (the speed itself is smoothed) and its speed
    // is capped, so a flick of the wheel, a scrollbar drag or a jump to the end still travels through every scene at a pace the
    // eye can follow: the whole film cannot be crossed in under about twenty seconds, and no sequence is skipped.
    const want = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (this.target - this.progress) * FOLLOW));
    this.vel += (want - this.vel) * (1 - Math.exp(-dt * EASE));
    this.progress += this.vel * dt;
    if (Math.abs(this.target - this.progress) < 1e-5 && Math.abs(this.vel) < 2e-4) { this.progress = this.target; this.vel = 0; }
    this.onFrame?.(this.progress);
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
