import * as THREE from "three";

/**
 * The visible sky: the Poly Haven panorama (kloppenheim_06_puresky, CC0) stored as an 8-bit WebP in a compressive encoding,
 * y = sqrt(h / (h + 1)), and expanded back to linear HDR here (h = r / (1 - r), r = y^2) so the low sun and the lit cloud edges
 * keep values above 1 for the bloom and the tone curve. Only the top 56.25 % of the panorama is stored (see sky_webp.py).
 * Lookup follows three.js's equirectangular convention, so it lines up with scene.environment built from sky-env.hdr.
 */
export const SKY_CROP = 0.5625;

export const SKY_PARS = /* glsl */ `
uniform sampler2D uSky;
uniform float uSkyCrop;
uniform float uSkyGain;
vec3 skyLookup(vec3 d) {
  d = normalize(d);
  float u = atan(d.z, d.x) * 0.15915494 + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5;   // 1 at the zenith
  // stored band: v in [1 - crop, 1] -> texture t in [0, 1] (t = 1 at the top row, flipY)
  float t = clamp((v - (1.0 - uSkyCrop)) / uSkyCrop, 0.003, 1.0);
  vec3 y = texture2D(uSky, vec2(u, t)).rgb;
  vec3 r = y * y;
  return r / max(vec3(1e-4), 1.0 - r) * uSkyGain;
}`;

export class SkyDome {
  readonly mesh: THREE.Mesh;
  readonly uniforms: Record<string, THREE.IUniform>;
  constructor(tex: THREE.Texture) {
    tex.colorSpace = THREE.NoColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 1;
    this.uniforms = { uSky: { value: tex }, uSkyCrop: { value: SKY_CROP }, uSkyGain: { value: 1 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = position;
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        ${SKY_PARS}
        varying vec3 vDir;
        void main() { gl_FragColor = vec4(skyLookup(vDir), 1.0); }`,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -100;
    // follow the camera so the sky is always infinitely far
    this.mesh.onBeforeRender = (_r, _s, cam) => { this.mesh.position.copy(cam.position); this.mesh.updateMatrixWorld(); };
  }
  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
