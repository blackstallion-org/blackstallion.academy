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
  
  // Let us find the highest point (top of the horse ears or rider)
  let maxY = -Infinity;
  let maxX = -Infinity;
  let minX = Infinity;
  let maxZ = -Infinity;
  let minZ = Infinity;
  
  let horseEarTip = null;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > maxY) {
      maxY = y;
      horseEarTip = { x, y, z };
    }
  }
  console.log("Max Y point:", horseEarTip);
  
  // Histogram of X for vertices with Y > 0.75
  const bins = {};
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (y > 0.7) {
      const bin = (Math.floor(x * 20) / 20).toFixed(2);
      bins[bin] = (bins[bin] || 0) + 1;
    }
  }
  console.log("X distribution for Y > 0.7:", bins);
});
