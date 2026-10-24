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
  
  let fistCount = 0;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // In test_composition_v5, the fist was visible.
    // Let us find vertices with x > -0.06 and y in [0.65, 0.85] and z in [0.08, 0.22]
    if (x > -0.06 && y >= 0.65 && y <= 0.85 && z >= 0.08 && z <= 0.22) {
      fistCount++;
    }
  }
  console.log("Fist cluster count:", fistCount);
});
