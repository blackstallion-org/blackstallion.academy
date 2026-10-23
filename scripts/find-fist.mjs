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
  
  // The fist is holding the reins.
  // In the statue, the rider stands at +X. The rider reaches his left hand to the reins.
  // So the hand is around max X of the horse head, around Y = 0.70 to 0.82.
  // Let us inspect vertices with X in [-0.03, 0.05], Y in [0.70, 0.85]
  let count = 0;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (x > -0.04 && y >= 0.70 && y <= 0.85 && z >= 0.05 && z <= 0.25) {
      count++;
    }
  }
  console.log("Suspect fist vertices count (x > -0.04, y in [0.70, 0.85]):", count);
});
