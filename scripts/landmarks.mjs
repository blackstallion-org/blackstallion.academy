import fs from "node:fs";
globalThis.self = globalThis;
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const buf = fs.readFileSync("scratch/uncompressed-horse.glb");
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

loader.parse(arrayBuffer, "", (gltf) => {
  const mesh = gltf.scene.children[0];
  const pos = mesh.geometry.attributes.position;
  
  // In the horse cut:
  // x in [-0.24, 0.005], y in [0.63, 0.99], z in [-0.08, 0.26]
  let earVertex = null; // max Y
  let muzzleVertex = null; // min X, min/mid Y, max Z? Let us find extremes
  let neckVertex = null; // min Y
  
  let maxY = -Infinity;
  let minY = Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  let minZ = Infinity;
  
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (x >= -0.24 && x <= 0.005 && y >= 0.63 && y <= 0.99 && z >= -0.08 && z <= 0.26) {
      if (y > maxY) { maxY = y; earVertex = { x, y, z }; }
      if (y < minY) { minY = y; neckVertex = { x, y, z }; }
      if (x < minX) { minX = x; }
      if (x > maxX) { maxX = x; }
      if (z > maxZ) { maxZ = z; }
      if (z < minZ) { minZ = z; }
    }
  }
  
  // The muzzle is typically the most forward/protruding point in the direction the horse faces.
  // In this statue, the horse faces -X and +Z.
  // Let us find vertex maximizing (-x + z)
  let maxFaceScore = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (x >= -0.24 && x <= 0.005 && y >= 0.63 && y <= 0.99 && z >= -0.08 && z <= 0.26) {
      // Muzzle is lower than ears, protruding
      const score = -x * 2 + z * 1.5 - y * 0.5;
      if (score > maxFaceScore) {
        maxFaceScore = score;
        muzzleVertex = { x, y, z };
      }
    }
  }
  
  console.log("Ear Landmark (highest Y):", earVertex);
  console.log("Neck Landmark (lowest Y):", neckVertex);
  console.log("Muzzle Landmark (protruding):", muzzleVertex);
  console.log("Bounds: X [", minX, maxX, "] Y [", minY, maxY, "] Z [", minZ, maxZ, "]");
});
