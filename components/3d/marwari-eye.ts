/**
 * The Marwari's eyes.
 *
 * `reseatEyes`: in the exported model the two eye domes sit 2 to 5 cm above and in front of the sockets painted into the coat
 * (the left dome floats on the brow, the right one hangs in front of the face: `docs/MARWARI_CINEMATIC_AUDIT.md`, "eye
 * registration"). The offsets below were found against the painted sockets in the bind pose, per eye because the sculpt is not
 * symmetric, and they are applied to the dome geometry at load. They are only applied when the domes are where the current
 * GLB puts them; a re-exported model with the eyes fixed is left alone.
 *
 * `installEye`: the dome is a dark glossy bead in the GLB. The shader paints what a horse's eye shows: a dark amber iris with
 * radial fibres and a darker limbal ring, a wide horizontal pupil, little sclera. The wet cornea is the clear coat of the
 * physical material, which carries the catch-light of the studio's softbox.
 */
import * as THREE from "three";

type Side = "L" | "R";

/** Where the current GLB puts each dome (bind pose, glTF axes) and how far it has to move to sit in the painted socket. */
const KNOWN: Record<Side, { at: [number, number, number]; move: [number, number, number]; scale: number }> = {
  L: { at: [0.104, 1.887, 1.176], move: [-0.004, -0.029, -0.01], scale: 1.28 },
  R: { at: [-0.107, 1.907, 1.155], move: [0.004, -0.045, 0.055], scale: 1.28 },
};
const TOLERANCE = 0.02;

export type EyeCentres = { L: THREE.Vector3; R: THREE.Vector3 };

/** Moves and slightly enlarges each dome in the geometry; returns the dome centres afterwards (the socket centres). */
export function reseatEyes(mesh: THREE.SkinnedMesh): EyeCentres {
  const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
  const skinIndex = mesh.geometry.attributes.skinIndex as THREE.BufferAttribute;
  const names = mesh.skeleton.bones.map((b) => b.name);
  const sides: Record<Side, number[]> = { L: [], R: [] };
  for (let i = 0; i < pos.count; i++) {
    const bone = names[skinIndex.getX(i)];
    if (bone === "Eye_L") sides.L.push(i);
    else if (bone === "Eye_R") sides.R.push(i);
  }
  const out = {} as EyeCentres;
  for (const side of ["L", "R"] as const) {
    const idx = sides[side];
    const c = new THREE.Vector3();
    for (const i of idx) c.add(new THREE.Vector3().fromBufferAttribute(pos, i));
    if (idx.length) c.divideScalar(idx.length);
    const k = KNOWN[side];
    const where = new THREE.Vector3(...k.at);
    if (idx.length && c.distanceTo(where) < TOLERANCE) {
      const v = new THREE.Vector3();
      for (const i of idx) {
        v.fromBufferAttribute(pos, i).sub(c).multiplyScalar(k.scale).add(c).add(new THREE.Vector3(...k.move));
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      c.add(new THREE.Vector3(...k.move));
    }
    out[side] = c;
  }
  pos.needsUpdate = true;
  mesh.geometry.computeBoundingSphere();
  return out;
}

export function installEye(material: THREE.MeshPhysicalMaterial, centres: EyeCentres) {
  const side = (s: Side) => new THREE.Vector3(s === "L" ? 0.93 : -0.93, 0.08, 0.36).normalize();
  const uniforms = { uEyeC: { value: [centres.L, centres.R] }, uEyeD: { value: [side("L"), side("R")] } };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEyeC = uniforms.uEyeC;
    shader.uniforms.uEyeD = uniforms.uEyeD;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRest;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRest = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRest; uniform vec3 uEyeC[2]; uniform vec3 uEyeD[2];")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          int s = vRest.x > 0.0 ? 0 : 1;
          vec3 d = uEyeD[s];
          vec3 n = normalize(vRest - uEyeC[s]);
          float a = acos(clamp(dot(n, d), -1.0, 1.0));
          vec3 hz = normalize(cross(vec3(0.0, 1.0, 0.0), d));
          vec3 vt = cross(d, hz);
          vec2 q = vec2(dot(n, hz), dot(n, vt));
          float irisR = 0.82;
          float iris = 1.0 - smoothstep(irisR - 0.1, irisR, a);
          float pupil = 1.0 - smoothstep(0.8, 1.0, length(q / vec2(0.42, 0.19)));
          float ang = atan(q.y, q.x);
          float fibres = 0.55 + 0.45 * sin(ang * 34.0 + sin(ang * 9.0) * 2.2);
          vec3 irisCol = mix(vec3(0.034, 0.014, 0.005), vec3(0.105, 0.046, 0.014), (1.0 - smoothstep(0.0, irisR, a)) * fibres);
          irisCol *= mix(0.3, 1.0, 1.0 - smoothstep(irisR - 0.3, irisR, a));
          vec3 col = mix(vec3(0.018, 0.011, 0.007), irisCol, iris);
          diffuseColor.rgb = mix(col, vec3(0.0015), pupil * iris);
        }`,
      );
  };
  material.customProgramCacheKey = () => "marwari-eye-v2";
}
