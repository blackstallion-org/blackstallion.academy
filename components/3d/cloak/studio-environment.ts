import * as THREE from "three/webgpu";

/**
 * A small museum-lit room used only to light the glass: warm light panels above and at the sides, a dim cool panel in
 * front and a bounce from the floor, rendered once into a prefiltered cube map. Nothing is downloaded (the demo
 * this scene comes from loaded a 7.6 MB HDR photograph of a rainforest, which has no place in a museum).
 */
export function createStudioEnvironment(renderer: THREE.WebGPURenderer): THREE.Texture {
  const room = new THREE.Scene();
  const panel = (hex: string, intensity: number, size: [number, number], position: [number, number, number], rotation: [number, number, number]) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    room.add(mesh);
  };
  // ceiling softbox, warm
  panel("#ffe2b8", 5, [20, 8], [0, 9, 0], [Math.PI / 2, 0, 0]);
  // two amber sides
  panel("#ffcf98", 2.2, [10, 5], [-8, 3, 0], [0, Math.PI / 2, 0]);
  panel("#ffcf98", 2.2, [10, 5], [8, 3, 0], [0, -Math.PI / 2, 0]);
  // a narrow cool strip behind, for the rim on the glass
  panel("#cfe0ff", 3, [14, 1.2], [0, 4, -9], [0, 0, 0]);
  // front fill
  panel("#c8b49a", 0.9, [20, 4], [0, 2, 9], [0, Math.PI, 0]);
  // bounce from a pale floor
  panel("#e6d3b4", 0.9, [20, 20], [0, -3, 0], [-Math.PI / 2, 0, 0]);
  // dark surround
  const shell = new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color("#0c0907"), side: THREE.BackSide }));
  room.add(shell);

  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.03);
  generator.dispose();
  room.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
  return target.texture;
}
