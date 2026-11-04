import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

/**
 * The floor and the backdrop of a dark photographic studio, for a black horse that needs both to read: the floor is a glossy
 * surface that shows the horse upside down, softened and fading with distance from the hooves, and the backdrop is a deep room with
 * a faint pool of warm light behind the animal.
 *
 * The floor is a real mirror (three's `Reflector`: the scene drawn a second time from under the floor into a small render target),
 * so it is for devices that can afford a second pass; `lib/3d/device-tier.ts` keeps it off phones and tablets, which get the
 * soft contact shadow of `contact.ts` alone. It draws nothing but the reflection, added onto the backdrop, so there is no floor
 * colour to match and no horizon line.
 */

const FLOOR_SIZE = 14;

const FloorShader = {
  name: "StudioFloorShader",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) },
    uStrength: { value: 0.8 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec2 vFloor;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vFloor = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform vec2 uTexel;
    uniform float uStrength;
    varying vec4 vUv;
    varying vec2 vFloor;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      // plane-local y runs towards the back of the room (world -z); the pool is an ellipse a little longer than the horse
      vec2 q = vec2(vFloor.x / 2.9, (vFloor.y + 0.3) / 3.7);
      float d = length(q);
      float fade = 1.0 - smoothstep(0.22, 1.0, d);
      fade *= fade;
      vec2 uv = vUv.xy / vUv.w;
      // a glossy floor, not a mirror: the further from the hooves, the softer the reflection
      float radius = 1.1 + 3.4 * smoothstep(0.0, 0.85, d);
      vec3 sum = vec3(0.0);
      float total = 0.0;
      for (int i = 0; i < 14; i++) {
        float angle = float(i) * 2.399963;
        float ring = sqrt((float(i) + 0.5) / 14.0);
        float w = 1.0 - 0.55 * ring;
        sum += texture2D(tDiffuse, uv + vec2(cos(angle), sin(angle)) * ring * radius * uTexel).rgb * w;
        total += w;
      }
      gl_FragColor = vec4(sum / total * uStrength * fade, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

export type StudioFloor = {
  mesh: THREE.Mesh;
  /** Match the reflection's resolution to the canvas (CSS pixels); it is drawn at about a half of them. */
  resize(width: number, height: number): void;
  strength: { value: number };
  dispose(): void;
};

export function createStudioFloor(width: number, height: number): StudioFloor {
  const floor = new Reflector(new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), {
    shader: FloorShader,
    textureWidth: 512,
    textureHeight: 512,
    multisample: 0, // the reflection is blurred anyway
    clipBias: 0.003,
  });
  floor.rotation.x = -Math.PI / 2;
  floor.name = "studio-floor";
  floor.renderOrder = 3; // after the contact shadow and the pool of light, so the reflection is not dimmed by them
  const material = floor.material as THREE.ShaderMaterial;
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;

  // The mirror must see the horse on black: take the backdrop out of the scene while the reflection is drawn.
  const draw = floor.onBeforeRender;
  floor.onBeforeRender = function (renderer, scene, camera, geometry, mat, group) {
    const background = scene.background;
    scene.background = null;
    draw.call(this, renderer, scene, camera, geometry, mat, group);
    scene.background = background;
  };

  const target = floor.getRenderTarget();
  const strength = material.uniforms.uStrength;
  const resize = (w: number, h: number) => {
    const rw = Math.max(256, Math.round(w * 0.5));
    const rh = Math.max(256, Math.round(h * 0.5));
    target.setSize(rw, rh);
    material.uniforms.uTexel.value.set(1 / rw, 1 / rh);
  };
  resize(width, height);

  return {
    mesh: floor,
    resize,
    strength,
    dispose() {
      floor.geometry.dispose();
      floor.dispose();
    },
  };
}

/**
 * The room behind the horse as a screen-sized gradient: near black with a pool of warm light low behind the animal and a vignette
 * toward the corners. `base` and `glow` come from the page's colour tokens (the caller reads them), never hard-coded here.
 */
export function createBackdrop(base: THREE.Color, glow: THREE.Color): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  if (g) {
    const rgb = (c: THREE.Color, a: number) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
    g.fillStyle = rgb(base, 1);
    g.fillRect(0, 0, size, size);
    const pool = g.createRadialGradient(size * 0.5, size * 0.66, 0, size * 0.5, size * 0.66, size * 0.62);
    pool.addColorStop(0, rgb(glow, 0.34));
    pool.addColorStop(0.5, rgb(glow, 0.1));
    pool.addColorStop(1, rgb(glow, 0));
    g.fillStyle = pool;
    g.fillRect(0, 0, size, size);
    const vignette = g.createRadialGradient(size / 2, size / 2, size * 0.32, size / 2, size / 2, size * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.62)");
    g.fillStyle = vignette;
    g.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
