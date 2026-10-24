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
  
  // In object space:
  // Ear tip is at: x = -0.086, y = 0.9786, z = 0.119
  // Let us find vertices connected to the horse head.
  // The horse head is roughly in:
  // x in [-0.25, 0.05]
  // y in [0.65, 0.98]
  // z in [-0.05, 0.28]
  
  let headCount = 0;
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Let us check if this vertex belongs to horse head/neck
    if (x >= -0.25 && x <= 0.08 && y >= 0.65 && y <= 0.98 && z >= -0.10 && z <= 0.32) {
      headCount++;
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
  }
  console.log("Horse head vertex count:", headCount);
  console.log("Horse head min:", min);
  console.log("Horse head max:", max);
});
