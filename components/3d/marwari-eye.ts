/**
 * The Marwari's eyes.
 *
 * The exported model carries each eye as a 3 cm glass bead: round, proud of the face and 2 to 5 cm off the socket painted into
 * the coat (`docs/MARWARI_CINEMATIC_AUDIT.md`, "eye registration"). From any distance it read as a doll's button, not an eye.
 * A horse's eye is the largest of any land mammal: an almond about 5.5 cm long and 3.5 cm high in the opening, dark and wet,
 * under a heavy upper lid (the owner's reference photographs, 4 Nov 2026).
 *
 * `reseatEyes` rebuilds each eye against the head instead of trusting the export. It takes the painted socket (the bead moved
 * by the offsets found in the bind pose, `KNOWN`, when the bead is where the current GLB puts it), reads the face there from the
 * coat itself (the mean surface point and normal of the coat within 2.5 cm), and turns the bead into a wide, shallow ellipsoid
 * set into the face along that normal: its front stands EYE.bulge proud of the coat and the coat cuts the rest away, so the
 * coat's own surface draws an almond opening of EYE.length x EYE.height, like lids. Nothing in the GLB is changed on disk.
 *
 * `installEye` paints what a horse's eye shows: almost all dark iris (deep brown, warmer at its lower edge where light comes
 * through the cornea), a wide horizontal pupil with the granula along its upper edge, the shadow of the upper lid, and a sliver
 * of pinkish sclera at the rear corner only. The wet cornea is the clear coat of the physical material: it carries large, sharp
 * reflections of the studio, which is most of what an eye looks like from a few metres.
 */
import * as THREE from "three";

type Side = "L" | "R";

/** Where the current GLB puts each bead (bind pose, glTF axes) and how far it has to move to sit in the painted socket. */
const KNOWN: Record<Side, { at: [number, number, number]; move: [number, number, number] }> = {
  L: { at: [0.104, 1.887, 1.176], move: [-0.004, -0.029, -0.01] },
  R: { at: [-0.107, 1.907, 1.155], move: [0.004, -0.045, 0.055] },
};
const TOLERANCE = 0.02;

/** The visible opening (metres) and how far the cornea stands proud of the coat; `depth` is the ellipsoid's outward semi-axis. */
export const EYE = { length: 0.057, height: 0.03, bulge: 0.0026, depth: 0.012, face: 0.025, tilt: 0.16, lift: 0.003 };

export type EyeCentres = { L: THREE.Vector3; R: THREE.Vector3 };
/** Per eye: the centre of the opening on the face, the outward normal there, and the axis along the face toward the muzzle. */
export type EyeLayout = Record<Side, { centre: THREE.Vector3; n: THREE.Vector3; hz: THREE.Vector3 }>;

export function reseatEyes(eyes: THREE.SkinnedMesh, coat: THREE.SkinnedMesh): EyeLayout {
  const pos = eyes.geometry.attributes.position as THREE.BufferAttribute;
  const skinIndex = eyes.geometry.attributes.skinIndex as THREE.BufferAttribute;
  const names = eyes.skeleton.bones.map((b) => b.name);
  const sides: Record<Side, number[]> = { L: [], R: [] };
  for (let i = 0; i < pos.count; i++) {
    const bone = names[skinIndex.getX(i)];
    if (bone === "Eye_L") sides.L.push(i);
    else if (bone === "Eye_R") sides.R.push(i);
  }
  const cPos = coat.geometry.attributes.position as THREE.BufferAttribute;
  const cNor = coat.geometry.attributes.normal as THREE.BufferAttribute | undefined;
  const out = {} as EyeLayout;
  const v = new THREE.Vector3();
  for (const side of ["L", "R"] as const) {
    const idx = sides[side];
    const sx = side === "L" ? 1 : -1;
    // the bead: its bounding box, and the centre of the sphere it was cut from (its front pole minus its radius)
    const box = new THREE.Box3();
    for (const i of idx) box.expandByPoint(v.fromBufferAttribute(pos, i));
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.y, size.z) / 2 || 0.0148;
    const sphere = box.getCenter(new THREE.Vector3());
    sphere.x = (sx > 0 ? box.max.x : box.min.x) - sx * radius;
    // the painted socket
    const socket = box.getCenter(new THREE.Vector3());
    const k = KNOWN[side];
    if (socket.distanceTo(new THREE.Vector3(...k.at)) < TOLERANCE) socket.add(new THREE.Vector3(...k.move));
    // the face there, read from the coat
    const p0 = new THREE.Vector3();
    const n = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < cPos.count; i++) {
      v.fromBufferAttribute(cPos, i);
      if (v.x * sx <= 0 || v.distanceToSquared(socket) > EYE.face * EYE.face) continue;
      p0.add(v);
      if (cNor) n.add(new THREE.Vector3().fromBufferAttribute(cNor, i));
      count++;
    }
    if (count) p0.divideScalar(count);
    else p0.copy(socket);
    if (!cNor || n.lengthSq() < 1e-8 || n.x * sx <= 0) n.set(0.93 * sx, 0.08, 0.36);
    n.normalize();
    const centre = socket.clone().addScaledVector(n, -socket.clone().sub(p0).dot(n));
    const hz = new THREE.Vector3(0, 0, 1).addScaledVector(n, -n.z).normalize();
    const vt = new THREE.Vector3().crossVectors(n, hz).multiplyScalar(sx);
    if (vt.y < 0) vt.negate();
    // set like a real horse's eye: the almond tilts down toward the muzzle (front corner low, rear corner high) and sits a little up
    // under the brow, seated into the face rather than standing on it
    {
      const c = Math.cos(EYE.tilt);
      const sn = Math.sin(EYE.tilt);
      const h2 = hz.clone().multiplyScalar(c).addScaledVector(vt, -sn);
      vt.multiplyScalar(c).addScaledVector(hz, sn);
      hz.copy(h2);
      centre.addScaledVector(vt, EYE.lift);
    }
    // the ellipsoid: the plane of the face cuts it at (depth - bulge) from its centre, which shrinks the cut by `cut`
    const t = (EYE.depth - EYE.bulge) / EYE.depth;
    const cut = Math.sqrt(1 - t * t);
    const along = EYE.length / 2 / cut / radius;
    const up = EYE.height / 2 / cut / radius;
    const outS = EYE.depth / radius;
    const middle = centre.clone().addScaledVector(n, -(EYE.depth - EYE.bulge));
    for (const i of idx) {
      v.fromBufferAttribute(pos, i).sub(sphere);
      const o = v.x * sx; // outward
      const y = v.y;
      const z = v.z; // toward the muzzle
      v.copy(middle).addScaledVector(n, o * outS).addScaledVector(vt, y * up).addScaledVector(hz, z * along);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    out[side] = { centre, n, hz };
  }
  pos.needsUpdate = true;
  eyes.geometry.computeVertexNormals();
  eyes.geometry.computeBoundingSphere();
  return out;
}

export const eyeCentres = (layout: EyeLayout): EyeCentres => ({ L: layout.L.centre, R: layout.R.centre });

export function installEye(material: THREE.MeshPhysicalMaterial, layout: EyeLayout) {
  const uniforms = {
    uEyeC: { value: [layout.L.centre, layout.R.centre] },
    uEyeN: { value: [layout.L.n, layout.R.n] },
    uEyeH: { value: [layout.L.hz, layout.R.hz] },
    uEyeS: { value: new THREE.Vector2(EYE.length / 2, EYE.height / 2) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRest;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRest = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRest; uniform vec3 uEyeC[2]; uniform vec3 uEyeN[2]; uniform vec3 uEyeH[2]; uniform vec2 uEyeS;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          int s = vRest.x > 0.0 ? 0 : 1;
          vec3 nn = uEyeN[s];
          vec3 hz = uEyeH[s];
          vec3 vt = normalize(cross(nn, hz)); vt *= sign(vt.y + 1e-5);
          vec3 p = vRest - uEyeC[s];
          // across the opening: x toward the muzzle, y up, both -1..1 at the lids
          vec2 q = vec2(dot(p, hz) / uEyeS.x, dot(p, vt) / uEyeS.y);
          // the iris is round on the real eye: measure it in a circle the height of the opening
          vec2 qi = vec2(q.x * uEyeS.x / uEyeS.y, q.y);
          float r = length(qi);
          float ang = atan(qi.y, qi.x);
          float lower = smoothstep(0.15, -0.9, q.y);
          float fibres = 0.6 + 0.4 * sin(ang * 46.0 + sin(ang * 11.0) * 2.4) * (0.5 + 0.5 * sin(r * 26.0));
          vec3 irisCol = mix(vec3(0.016, 0.008, 0.004), vec3(0.11, 0.05, 0.016), lower * fibres * smoothstep(0.3, 0.9, r));
          irisCol *= 1.0 - 0.55 * smoothstep(1.05, 1.35, r); // the limbal ring darkens toward the corners
          irisCol *= mix(1.0, 0.3, smoothstep(0.2, 0.9, q.y)); // the shadow of the heavy upper lid
          // the pupil: a wide horizontal ellipse a little below centre, the granula (dark lumps) along its upper edge
          float pupil = 1.0 - smoothstep(0.85, 1.0, length(vec2(qi.x / 0.62, (qi.y + 0.06) / 0.26)));
          float gran = (1.0 - smoothstep(0.7, 1.0, length(vec2(qi.x / 0.4, (qi.y - 0.2) / 0.11)))) * (0.6 + 0.4 * sin(qi.x * 34.0));
          vec3 col = mix(irisCol, vec3(0.0015, 0.001, 0.0008), max(pupil, gran * 0.85));
          // a sliver of pinkish-white sclera in the rear corner only
          float scl = smoothstep(-0.86, -1.0, q.x) * (1.0 - smoothstep(-0.05, 0.35, q.y)) * (1.0 - smoothstep(0.35, 0.6, -q.y));
          col = mix(col, vec3(0.2, 0.13, 0.11), scl * 0.7);
          diffuseColor.rgb = col;
        }`,
      );
  };
  material.customProgramCacheKey = () => "marwari-eye-v3";
}
