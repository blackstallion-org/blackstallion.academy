import * as THREE from "three";

/** Per-ring shape modifier: scales the two radii and shifts the ring along its normal. */
export type ShapeMod = (u: number, theta: number, cosT: number, sinT: number) => {
  rzScale?: number;
  ryScale?: number;
  yShift?: number;
};

function sampleArray(arr: readonly number[], u: number): number {
  const scaled = u * (arr.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  if (idx >= arr.length - 1) return arr[arr.length - 1];
  const s = frac * frac * (3 - 2 * frac);
  return arr[idx] * (1 - s) + arr[idx + 1] * s;
}

const REF_Z = new THREE.Vector3(0, 0, 1);
const tmpNormal = new THREE.Vector3();
const prevNormal = new THREE.Vector3();
const pt = new THREE.Vector3();
const tangent = new THREE.Vector3();

/**
 * Twist-free sagittal lofting: sweeps an elliptical ring along a Catmull-Rom curve, keeping each ring's
 * "up" in the sagittal (XY) plane so sculpted bodies never corkscrew. Re-populating an existing geometry
 * (the animated limbs) writes into its buffers in place, so no GPU buffers leak per frame.
 */
export function populateLoft(
  geo: THREE.BufferGeometry,
  controlPoints: THREE.Vector3[],
  radiiZ: readonly number[],
  radiiY: readonly number[],
  tSegs: number,
  rSegs: number,
  shapeMod?: ShapeMod,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(controlPoints);
  const count = (tSegs + 1) * (rSegs + 1);
  const existing = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  const reuse = !!existing && existing.count === count;
  const positions = reuse ? (existing.array as Float32Array) : new Float32Array(count * 3);
  let k = 0;
  let hasPrev = false;

  for (let i = 0; i <= tSegs; i++) {
    const u = i / tSegs;
    curve.getPointAt(u, pt);
    curve.getTangentAt(u, tangent).normalize();

    tmpNormal.crossVectors(REF_Z, tangent);
    if (tmpNormal.lengthSq() < 0.0001) tmpNormal.set(0, 1, 0);
    else tmpNormal.normalize();
    if (!hasPrev) {
      if (tmpNormal.y < 0 && Math.abs(tangent.x) > 0.35) tmpNormal.negate();
    } else if (tmpNormal.dot(prevNormal) < 0) {
      tmpNormal.negate();
    }
    prevNormal.copy(tmpNormal);
    hasPrev = true;

    let endTaper = 1;
    if (u < 0.035) endTaper = Math.sin((u / 0.035) * (Math.PI * 0.5));
    else if (u > 0.965) endTaper = Math.sin(((1 - u) / 0.035) * (Math.PI * 0.5));
    endTaper = Math.max(0.02, endTaper);

    const baseRz = sampleArray(radiiZ, u) * endTaper;
    const baseRy = sampleArray(radiiY, u) * endTaper;

    for (let j = 0; j <= rSegs; j++) {
      const theta = (j / rSegs) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      let rz = baseRz;
      let ry = baseRy;
      let yShift = 0;
      if (shapeMod) {
        const mod = shapeMod(u, theta, cosT, sinT);
        rz *= mod.rzScale ?? 1;
        ry *= mod.ryScale ?? 1;
        yShift = mod.yShift ?? 0;
      }
      const localY = ry * cosT + yShift;
      const localZ = rz * sinT;
      positions[k++] = pt.x + tmpNormal.x * localY;
      positions[k++] = pt.y + tmpNormal.y * localY;
      positions[k++] = pt.z + tmpNormal.z * localY + localZ;
    }
  }

  if (reuse) {
    existing.needsUpdate = true;
  } else {
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const uvs = new Float32Array(count * 2);
    const indices: number[] = [];
    let q = 0;
    for (let i = 0; i <= tSegs; i++) {
      for (let j = 0; j <= rSegs; j++) {
        uvs[q++] = i / tSegs;
        uvs[q++] = j / rSegs;
      }
    }
    const stride = rSegs + 1;
    for (let i = 0; i < tSegs; i++) {
      for (let j = 0; j < rSegs; j++) {
        const a = i * stride + j;
        const b = (i + 1) * stride + j;
        const c = (i + 1) * stride + j + 1;
        const d = i * stride + j + 1;
        indices.push(a, b, d, b, c, d);
      }
    }
    geo.setIndex(indices);
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function loftMesh(
  controlPoints: THREE.Vector3[],
  radiiZ: readonly number[],
  radiiY: readonly number[],
  tSegs: number,
  rSegs: number,
  material: THREE.Material,
  shapeMod?: ShapeMod,
): THREE.Mesh {
  const geo = populateLoft(new THREE.BufferGeometry(), controlPoints, radiiZ, radiiY, tSegs, rSegs, shapeMod);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export const v3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
