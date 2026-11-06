import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

/**
 * One loader for every world: Draco GLBs, LDR textures (WebP/JPG/PNG) and Radiance HDR skies, cached by URL so a world that is
 * revisited (scrolling back) does not download again. Progress is reported per URL so the page can show one loading bar.
 * Everything a world loads it must dispose itself; the loader only frees its own decoders.
 */
export class AssetLoader {
  private draco = new DRACOLoader();
  private gltf = new GLTFLoader();
  private tex = new THREE.TextureLoader();
  private hdr = new HDRLoader();
  private cache = new Map<string, Promise<unknown>>();
  private progress = new Map<string, number>();
  onProgress: ((fraction: number) => void) | null = null;

  constructor(private base = "") {
    this.draco.setDecoderPath("/draco/");
    this.gltf.setDRACOLoader(this.draco);
  }

  url(path: string) {
    return path.startsWith("http") ? path : `${this.base}${path}`;
  }

  private track(url: string, e: ProgressEvent) {
    if (e.lengthComputable) this.progress.set(url, e.loaded / e.total);
    this.emit();
  }
  private emit() {
    if (!this.onProgress || this.progress.size === 0) return;
    let s = 0;
    for (const v of this.progress.values()) s += v;
    this.onProgress(s / this.progress.size);
  }

  glb(path: string): Promise<GLTF> {
    const url = this.url(path);
    let p = this.cache.get(url) as Promise<GLTF> | undefined;
    if (!p) {
      this.progress.set(url, 0);
      p = new Promise<GLTF>((res, rej) =>
        this.gltf.load(url, (g) => { this.progress.set(url, 1); this.emit(); res(g); }, (e) => this.track(url, e), rej),
      );
      this.cache.set(url, p);
    }
    return p;
  }

  texture(path: string, opts: { srgb?: boolean; repeat?: boolean; anisotropy?: number } = {}): Promise<THREE.Texture> {
    const url = this.url(path);
    const k = `${url}|${opts.srgb ? 1 : 0}|${opts.repeat ? 1 : 0}`;
    let p = this.cache.get(k) as Promise<THREE.Texture> | undefined;
    if (!p) {
      this.progress.set(url, 0);
      p = new Promise<THREE.Texture>((res, rej) =>
        this.tex.load(
          url,
          (t) => {
            t.colorSpace = opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.anisotropy = opts.anisotropy ?? 4;
            this.progress.set(url, 1);
            this.emit();
            res(t);
          },
          undefined,
          rej,
        ),
      );
      this.cache.set(k, p);
    }
    return p;
  }

  /** An equirectangular Radiance .hdr (linear, half float). */
  hdri(path: string): Promise<THREE.DataTexture> {
    const url = this.url(path);
    let p = this.cache.get(url) as Promise<THREE.DataTexture> | undefined;
    if (!p) {
      this.progress.set(url, 0);
      p = new Promise<THREE.DataTexture>((res, rej) =>
        this.hdr.load(url, (t) => { t.mapping = THREE.EquirectangularReflectionMapping; this.progress.set(url, 1); this.emit(); res(t); }, (e) => this.track(url, e), rej),
      );
      this.cache.set(url, p);
    }
    return p;
  }

  dispose() {
    this.draco.dispose();
    this.cache.clear();
  }
}

/** Frees every geometry, material and texture under a root (worlds call this from dispose()). */
export function disposeTree(root: THREE.Object3D) {
  const seen = new Set<THREE.Texture>();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
    for (const mat of mats) {
      for (const v of Object.values(mat as unknown as Record<string, unknown>)) {
        if (v instanceof THREE.Texture && !seen.has(v)) { seen.add(v); v.dispose(); }
      }
      const u = (mat as THREE.ShaderMaterial).uniforms;
      if (u) for (const x of Object.values(u)) if (x?.value instanceof THREE.Texture && !seen.has(x.value)) { seen.add(x.value); x.value.dispose(); }
      mat.dispose();
    }
  });
}
