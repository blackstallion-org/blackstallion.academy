/**
 * One world's scenery, assembled: sky, far ring, ground and the two fields of cut-outs. Loading is asynchronous (the art is
 * fetched on demand and kept out of the first page load); once built, `update` only moves numbers.
 */
import * as THREE from "three";
import { createGrass, type GrassField, type HoofPress } from "./grass";
import { ringScroll } from "./math";
import { ATLAS } from "./atlas-data";
import {
  createGround, createRing, createSky, createSpriteField, loadTexture, makeWorldUniforms, srgbVec3, type SpriteField, type WorldUniforms,
} from "./materials";
import type { WorldConfig } from "./types";

export type StageOptions = { mobile: boolean; anisotropy: number; shadows: boolean };

export class WorldStage {
  readonly group = new THREE.Group();
  readonly uniforms: WorldUniforms = makeWorldUniforms();
  readonly sunDir = new THREE.Vector3();
  private readonly textures: THREE.Texture[] = [];
  private sky!: ReturnType<typeof createSky>;
  private ring!: ReturnType<typeof createRing>;
  private ground!: ReturnType<typeof createGround>;
  private fields: SpriteField[] = [];
  private grass: GrassField | null = null;
  private disposed = false;

  private constructor(readonly config: WorldConfig) {
    this.group.name = `world-${config.id}`;
  }

  /** Fetches the art and builds the layers. Rejects if any picture fails to load, so the caller can fall back. */
  static async load(config: WorldConfig, opts: StageOptions): Promise<WorldStage> {
    const stage = new WorldStage(config);
    await stage.build(opts);
    return stage;
  }

  private async build(opts: StageOptions) {
    const { config } = this;
    const pick = (full: string, mobile?: string) => (opts.mobile && mobile ? mobile : full);
    const an = opts.anisotropy;
    const specs = [config.mid, ...(config.extra ?? []), config.fore];
    // one picture per file, however many fields draw from it
    const urls = [...new Set(specs.map((f) => pick(f.image, f.imageMobile)))];
    const [albedo, normal, ring, ...atlases] = await Promise.all([
      loadTexture(pick(config.ground.albedo, config.ground.albedoMobile), { srgb: true, repeat: true, anisotropy: an }),
      config.ground.normal ? loadTexture(pick(config.ground.normal, config.ground.normalMobile), { repeat: true, anisotropy: an }) : Promise.resolve(undefined),
      loadTexture(pick(config.distant.image, config.distant.imageMobile), { repeat: "x", anisotropy: 2 }),
      ...urls.map((url) => loadTexture(url, { anisotropy: 2 })),
    ]);
    const maps = new Map(urls.map((url, i) => [url, atlases[i]]));
    this.textures.push(albedo, ring, ...atlases);
    if (normal) this.textures.push(normal);
    if (this.disposed) return this.dispose();

    const u = this.uniforms;
    u.uFogDensity.value = config.fog.density;
    srgbVec3(config.fog.color, u.uFogColor.value);
    this.sunDir.set(...config.light.sunDir).normalize();
    u.uSunDir.value.copy(this.sunDir);
    u.uWind.value.set(...config.wind);

    this.sky = createSky(u);
    this.sky.set(config.sky);
    this.ring = createRing(config.distant, ring, u);
    this.ground = createGround(config.ground, { albedo, normal }, u);
    const shadowColor = config.shadowColor ?? "#2a1a10";
    this.fields = specs.map((spec) => {
      const data = ATLAS[spec.atlas];
      const map = maps.get(pick(spec.image, spec.imageMobile));
      if (!data || !map) throw new Error(`Missing sprite atlas data for ${config.id}: ${spec.atlas}`);
      return createSpriteField(spec, data, map, u, { mobile: opts.mobile, shadows: opts.shadows, shadowColor });
    });
    this.group.add(this.sky.mesh, this.ring.mesh, this.ground.mesh, ...this.fields.map((f) => f.group));
    if (config.grass) {
      this.grass = createGrass(config.grass, u, { mobile: opts.mobile });
      this.group.add(this.grass.mesh);
    }
  }

  /** Where the four hooves are (in the horse's frame) and how hard each presses: the grass parts around them. */
  setHooves(hooves: readonly HoofPress[]) {
    this.grass?.setHooves(hooves);
  }

  /** Slides the world by the total distance travelled and keeps the sky and far ring centred on the camera. */
  update(distance: number, time: number, camera: THREE.Camera) {
    const u = this.uniforms;
    u.uTime.value = time;
    u.uScroll.value = ((distance % 65536) + 65536) % 65536;
    this.sky.mesh.position.copy(camera.position);
    this.ring.mesh.position.set(camera.position.x, 0, camera.position.z);
    const turns = ringScroll(distance, this.config.distant.radius, this.config.distant.repeats);
    this.ring.uniforms.uOffset.value = -(turns - Math.floor(turns));
    this.ground.update(distance);
    for (const f of this.fields) f.update(distance, time);
    this.grass?.update(distance);
  }

  /** 1 = shown, 0 = faded to the night colour. */
  setFade(f: number) {
    this.uniforms.uFade.value = f;
    this.group.visible = f > 0.002;
  }

  /** Every picture this world holds, so they can be sent to the GPU ahead of the first frame. */
  get textureList(): readonly THREE.Texture[] {
    return this.textures;
  }

  dispose() {
    this.disposed = true;
    this.group.removeFromParent();
    for (const f of this.fields) f.dispose();
    this.fields = [];
    this.grass?.dispose();
    this.grass = null;
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    });
    for (const t of this.textures) t.dispose();
    this.textures.length = 0;
  }
}
