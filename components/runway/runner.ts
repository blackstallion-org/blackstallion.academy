import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { wireMaterial } from "./wireframe";

export type Runner = {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction;
  dispose: () => void;
};

/**
 * Loads a rigged horse, dresses every skinned mesh in the wireframe material and loops one clip. Lighter than
 * components/3d/marwari.ts (no coat shading, eyes, hair physics or hoof shadows): the runway only needs the silhouette.
 */
export async function loadRunner(url: string, clipName = "Sprint_R"): Promise<Runner> {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  try {
    const gltf = await loader.loadAsync(url);
    const root = gltf.scene;
    const coat = wireMaterial({ meridians: 30, rings: 10 });
    const hair = wireMaterial({ meridians: 60, rings: 26, width: 0.9 });
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      const name = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.name ?? "";
      const old = mesh.material;
      if (name === "Marwari_Eye") mesh.visible = false;
      else mesh.material = name === "Marwari_Hair" ? hair.material : coat.material;
      (Array.isArray(old) ? old : [old]).forEach((m) => {
        Object.values(m).forEach((v) => (v as THREE.Texture)?.isTexture && (v as THREE.Texture).dispose());
        m.dispose();
      });
    });
    const mixer = new THREE.AnimationMixer(root);
    const clip = gltf.animations.find((a) => a.name === clipName) ?? gltf.animations.find((a) => /Gallop|Sprint/.test(a.name)) ?? gltf.animations[0];
    const action = mixer.clipAction(clip);
    action.play();
    return {
      root,
      mixer,
      action,
      dispose: () => {
        mixer.stopAllAction();
        root.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
        coat.material.dispose();
        hair.material.dispose();
      },
    };
  } finally {
    draco.dispose();
  }
}
