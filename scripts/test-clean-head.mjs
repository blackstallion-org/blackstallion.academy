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
  
  let count = 0;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (x >= -0.24 && x <= -0.088 && y >= 0.68 && y <= 0.99 && z >= -0.06 && z <= 0.26) {
      count++;
    }
  }
  console.log("Clean horse head count (x in [-0.24, -0.088], y in [0.68, 0.99]):", count);
});
