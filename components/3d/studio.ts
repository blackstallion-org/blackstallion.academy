import * as THREE from "three";

/**
 * A small photographic studio, rendered once into a prefiltered cube map: one large softbox high on the camera side, a kicker
 * behind and above, two tall strips behind the horse for the rim (cool on its right, warm on its left), a dim fill on the
 * right and a pale floor bounce, all inside a dark room. Reflections of these soft panels are what reveal the form of a black
 * coat (long soft highlights along the neck, back and croup); the stock `RoomEnvironment` gave small hard windows instead.
 * Nothing is downloaded. The caller disposes the returned target.
 */
export function createStudioEnv(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const room = new THREE.Scene();
  const panel = (hex: string, intensity: number, size: [number, number], position: [number, number, number]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), side: THREE.DoubleSide }));
    mesh.position.set(...position);
    mesh.lookAt(0, 1.1, 0);
    room.add(mesh);
  };
  panel("#fff1de", 4.4, [5, 3.5], [3.4, 5.8, 3.6]); // key softbox, front left, high
  panel("#fff6ea", 3, [4, 1.2], [0, 6.5, -3.5]); // kicker, behind and above
  panel("#d6e4ff", 9, [0.9, 5], [-4.2, 3, -4.6]); // rim, back right, cool
  panel("#ffe2bd", 6, [0.9, 5], [4.6, 3, -4]); // rim, back left, warm
  panel("#cfd8ee", 1.1, [1.4, 4], [-5, 2.4, 3.4]); // fill, front right
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color("#3a2f27").multiplyScalar(0.35), side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.15;
  room.add(floor);
  room.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color("#0b0908"), side: THREE.BackSide })));

  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.02);
  generator.dispose();
  room.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
  return target;
}
