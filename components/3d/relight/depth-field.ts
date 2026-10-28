/**
 * Depth smoothing for the relighting effect. Ported unchanged from "Relighting Images with Three.js" by Dominik
 * Fojcik (Codrops, MIT): `src/lib/blur.js` (`smoothBands`) and the baking half of `src/effect/depth-map.js`.
 *
 * Depth maps are 8-bit, so slopes show as stair-steps ("bands") that would light up as ridges. `smoothBands` blurs
 * the field, then clamps every texel to within ±1.5/255 of the original so the shape cannot drift, then blurs a
 * little more. The result is uploaded as a half-float texture for smooth normals and shadow marching.
 */
import * as THREE from "three/webgpu";

const TOLERANCE = 1.5 / 255;
const SMOOTH_RADIUS = 2;
const WORKING_WIDTH = 1024;

type Field = { values: Float32Array; width: number; height: number };

function blurAxis(source: Float32Array, target: Float32Array, width: number, height: number, radius: number) {
  const span = radius * 2 + 1;
  for (let row = 0; row < height; row++) {
    const offset = row * width;
    let sum = source[offset] * radius;
    for (let column = 0; column <= radius; column++) sum += source[offset + Math.min(column, width - 1)];
    for (let column = 0; column < width; column++) {
      target[column * height + row] = sum / span;
      sum -= source[offset + Math.max(column - radius, 0)];
      sum += source[offset + Math.min(column + radius + 1, width - 1)];
    }
  }
}

function boxBlur({ values, width, height }: Field, radius: number) {
  if (radius < 1) return;
  const transposed = new Float32Array(values.length);
  blurAxis(values, transposed, width, height, radius);
  blurAxis(transposed, values, height, width, radius);
}

export function smoothBands(field: Field, radius: number) {
  const original = field.values.slice();
  boxBlur(field, radius);
  for (let i = 0; i < field.values.length; i++) {
    field.values[i] = Math.min(Math.max(field.values[i], original[i] - TOLERANCE), original[i] + TOLERANCE);
  }
  boxBlur(field, SMOOTH_RADIUS);
}

/** A 1×1 mid-grey half-float texture: what the shader samples until the first depth map has been baked. */
export function createSmoothDepthTexture(): THREE.DataTexture {
  const texture = new THREE.DataTexture(new Uint16Array([THREE.DataUtils.toHalfFloat(0.5)]), 1, 1, THREE.RedFormat, THREE.HalfFloatType);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Reads the red channel of a depth image (flipped vertically, as the original does), smooths it and writes it into
 * `target` as half floats. `percent` is the smoothing radius as a share of the working width.
 */
export function bakeDepth(target: THREE.DataTexture, image: CanvasImageSource & { width: number; height: number }, percent: number) {
  const scale = Math.min(1, WORKING_WIDTH / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas is unavailable");
  context.setTransform(1, 0, 0, -1, 0, height);
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const values = new Float32Array(width * height);
  for (let i = 0; i < values.length; i++) values[i] = data[i * 4] / 255;
  smoothBands({ values, width, height }, Math.round((percent / 100) * width));
  const halfFloats = new Uint16Array(values.length);
  for (let i = 0; i < halfFloats.length; i++) halfFloats[i] = THREE.DataUtils.toHalfFloat(values[i]);
  // The texture was created at 1×1 (or at the previous photograph's size) and its GPU storage is fixed, so it is
  // released first; otherwise the upload overruns the old storage ("Offset overflows texture dimensions").
  target.dispose();
  target.image = { data: halfFloats, width, height };
  target.needsUpdate = true;
}
