import * as THREE from "three";
import { CameraPath, key } from "../core/camera";
import type { Grade, ShotPose, World, WorldContext, WorldId } from "../core/types";

/** Placeholder world used while a world module is being built: a flat ground, a sky colour and the horse. */
export function stubWorld(id: WorldId, sky: string, ground: string, usesHorse = true): World {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(sky, 30, 400);
  const grade: Grade = { exposure: 1, bloom: [0.4, 0.5, 0.9], lift: "#ffffff", gain: "#ffffff", saturation: 1, vignette: 0.35, grain: 0.03 };
  const path = new CameraPath([
    key("wide", 0, [0, 18, -60], [0, 1.4, 0], 40),
    key("medium", 0.5, [4, 2, -7], [0, 1.4, 0], 32),
    key("close", 1, [0.9, 1.75, 1.4], [0.15, 1.7, 0.8], 22),
  ]);
  let ctx: WorldContext;
  return {
    id, scene, grade, usesHorse,
    async load(c) {
      ctx = c;
      const g = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: ground, roughness: 1 }));
      g.receiveShadow = true;
      scene.add(g, new THREE.HemisphereLight("#ffffff", ground, 1.2));
      const sun = new THREE.DirectionalLight("#ffe2b8", 3);
      sun.position.set(30, 40, -20);
      scene.add(sun);
    },
    enter(c) { if (usesHorse) c.horse.attach(scene, { x: 0, y: 0, z: 0 }, 0); },
    exit() {},
    update(p: number, _dt: number, _t: number, out: ShotPose) { path.at(p, out); void ctx; },
    dispose() { scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material | undefined)?.dispose?.(); }); },
  };
}
