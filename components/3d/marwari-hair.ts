/**
 * Mane, forelock and tail: 125 alpha-tested ribbons (53 mane, 72 tail, 9 segments each) skinned to the mane and tail bones.
 * The geometry and the atlas are the exported ones; everything here is shading, done in the shader so the model is untouched:
 *
 *  - Alpha to coverage instead of a hard alpha test (the renderer is multisampled), so edges stop stair-stepping.
 *  - Each ribbon is shaped into strands: about sixteen strands across, each with its own length, so tips are ragged and not cut
 *    straight; the flat sides of a ribbon dissolve into wisps; a per-ribbon seed varies tint, strand phase and flutter.
 *  - A Kajiya-Kay highlight along the strand for every directional light: the long soft sheen of black hair, narrow across the
 *    strand and long along it, not the round highlight of a surface.
 *  - A light flutter at the free end of each ribbon, on top of the bone-driven sway (which has only four bones per hair group).
 *  - Flow (added 28 Oct 2026): the tail and mane move like hair, not like a curtain. The tail root bone's own motion drives a damped
 *    spring (lag, overshoot): the hair trails behind the horse, lifts and streams back with speed, and swings on at a turn; each
 *    ribbon fans out a little by its own seed so the flat sheet reads as a bundle; a travelling wave runs root to tip. It works from
 *    the skeleton alone, so it moves in a treadmill study (the pelvis alone moves it), on the courtyard film (the horse travels) and
 *    in the exhibit. `flow.value` scales it (0 turns it off).
 *
 * UV layout of the ribbons (checked in Blender): u = 8 atlas slots across, one slot per ribbon; v = 1 at the root, 0 at the tip.
 */
import * as THREE from "three";

export type Hair = {
  /** Amplitude (metres, model space) of the flutter at the tip; the film sets it from the wind of the place. */
  wind: { value: THREE.Vector3 };
  /** Strength of the strand highlight. */
  sheen: { value: number };
  /** Strength of the motion-driven flow, 0 (off) to 1 (full). */
  flow: { value: number };
};

/** One random number per ribbon, from the connected components of the index buffer. */
function ribbonSeeds(geo: THREE.BufferGeometry): Float32Array {
  const n = geo.attributes.position.count;
  const parent = Int32Array.from({ length: n }, (_, i) => i);
  const find = (a: number): number => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  const idx = geo.index;
  if (idx) for (let i = 0; i < idx.count; i += 3) {
    const a = find(idx.getX(i));
    for (const k of [1, 2]) {
      const b = find(idx.getX(i + k));
      if (b !== a) parent[b] = a;
    }
  }
  const seed = new Map<number, number>();
  const out = new Float32Array(n);
  let s = 1234567;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!seed.has(r)) seed.set(r, rnd());
    out[i] = seed.get(r)!;
  }
  return out;
}

export function installHair(mesh: THREE.SkinnedMesh, material: THREE.MeshStandardMaterial): Hair {
  mesh.geometry.setAttribute("aSeed", new THREE.BufferAttribute(ribbonSeeds(mesh.geometry), 1));
  material.alphaTest = 0.5;
  material.alphaToCoverage = true;
  material.transparent = false;
  material.depthWrite = true;
  material.side = THREE.DoubleSide;
  material.roughness = 0.62;
  material.envMapIntensity = 0.28;

  const time = { value: 0 };
  const wind = { value: new THREE.Vector3(0.012, 0, -0.008) };
  const sheen = { value: 0.022 };
  const flow = { value: 1 };
  // flow state, all in the mesh's own axes (metres): the tip's displacement and its velocity, plus the lift and the horse's own axes
  const lag = { value: new THREE.Vector3() };
  const lift = { value: 0 };
  const speedN = { value: 0 };
  const fwd = { value: new THREE.Vector3(0, 0, 1) };
  const right = { value: new THREE.Vector3(1, 0, 0) };
  const lagV = new THREE.Vector3();
  const rootNow = new THREE.Vector3();
  const rootPrev = new THREE.Vector3();
  const velWorld = new THREE.Vector3();
  const velLocal = new THREE.Vector3();
  const velSmooth = new THREE.Vector3();
  const target = new THREE.Vector3();
  const accel = new THREE.Vector3();
  const qInv = new THREE.Quaternion();
  const scaleW = new THREE.Vector3();
  let haveRoot = false;
  let lastT = 0;

  // The horse's forward axis in the mesh's space: from the middle of the tail ribbons toward the middle of the mane ribbons.
  {
    const pos = mesh.geometry.attributes.position;
    let tx = 0, tz = 0, tn = 0, mx = 0, mz = 0, mn = 0;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < 1.55) { tx += pos.getX(i); tz += pos.getZ(i); tn++; }
      else { mx += pos.getX(i); mz += pos.getZ(i); mn++; }
    }
    if (tn && mn) {
      fwd.value.set(mx / mn - tx / tn, 0, mz / mn - tz / tn);
      if (fwd.value.lengthSq() > 1e-6) fwd.value.normalize(); else fwd.value.set(0, 0, 1);
      right.value.set(-fwd.value.z, 0, fwd.value.x); // horizontal, at right angles to forward
    }
  }
  const tailRoot = mesh.skeleton?.getBoneByName("Tail_1") ?? null;

  mesh.onBeforeRender = () => {
    const now = performance.now();
    time.value = now / 1000;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    if (dt < 0.004) return; // the mesh renders more than once a frame (shadows): step the hair once
    lastT = now;
    if (!tailRoot || flow.value <= 0) {
      lag.value.multiplyScalar(0.9);
      lift.value *= 0.9;
      return;
    }
    // the root bone's velocity in the horse's own frame: bobbing of the pelvis on the spot, and travel across the ground
    tailRoot.getWorldPosition(rootNow);
    if (!haveRoot) { rootPrev.copy(rootNow); haveRoot = true; return; }
    velWorld.copy(rootNow).sub(rootPrev).divideScalar(dt);
    rootPrev.copy(rootNow);
    mesh.matrixWorld.decompose(velLocal, qInv, scaleW); // velLocal reused as scratch here
    qInv.invert();
    const sc = Math.max(1e-3, scaleW.x);
    velLocal.copy(velWorld).applyQuaternion(qInv).divideScalar(sc);
    const prevSmooth = accel.copy(velSmooth);
    velSmooth.lerp(velLocal, 1 - Math.exp(-dt * 14));
    // The hair trails the horse: target lag is opposite to the (smoothed) velocity; a spring with overshoot follows it
    target.copy(velSmooth).multiplyScalar(-0.05);
    target.y *= 0.4;
    const mag = target.length();
    if (mag > 0.42) target.multiplyScalar(0.42 / mag);
    // acceleration kicks it the other way (a stop swings it forward, a turn swings it out)
    accel.copy(velSmooth).sub(prevSmooth).divideScalar(dt);
    target.addScaledVector(accel, -0.006);
    const steps = dt > 1 / 50 ? 3 : 1;
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      lagV.x += (62 * (target.x - lag.value.x) - 6.2 * lagV.x) * h;
      lagV.y += (62 * (target.y - lag.value.y) - 6.2 * lagV.y) * h;
      lagV.z += (62 * (target.z - lag.value.z) - 6.2 * lagV.z) * h;
      lag.value.addScaledVector(lagV, h);
    }
    const speed = Math.hypot(velSmooth.x, velSmooth.z);
    speedN.value = Math.min(1, speed / 6);
    // at pace the dock lifts and the hair carries out behind; on the spot it hangs
    lift.value += (Math.min(0.26, 0.05 * speed) - lift.value) * (1 - Math.exp(-dt * 5));
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHairTime = time;
    shader.uniforms.uHairWind = wind;
    shader.uniforms.uHairK = sheen;
    shader.uniforms.uHairFlow = flow;
    shader.uniforms.uHairLag = lag;
    shader.uniforms.uHairLift = lift;
    shader.uniforms.uHairSpeed = speedN;
    shader.uniforms.uHairFwd = fwd;
    shader.uniforms.uHairRight = right;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aSeed; uniform float uHairTime; uniform vec3 uHairWind; uniform float uHairFlow; uniform vec3 uHairLag; uniform float uHairLift; uniform float uHairSpeed; uniform vec3 uHairFwd; uniform vec3 uHairRight; varying float vSeed; varying vec2 vHairUv; varying float vTail;")
      .replace(
        "#include <skinning_vertex>",
        `#include <skinning_vertex>
        vSeed = aSeed; vHairUv = uv; vTail = position.y < 1.55 ? 1.0 : 0.0;
        {
          float rootK = clamp(1.0 - uv.y, 0.0, 1.0);
          float ph = aSeed * 6.2831 + uHairTime * 1.6;
          float fl = sin(ph + position.y * 2.5) * 0.65 + sin(ph * 2.3 + position.z * 3.1) * 0.35;
          transformed += uHairWind * fl * rootK * rootK;
          // flow: lag and lift (the spring in installHair), a fan across the ribbons so the sheet becomes a bundle, a wave root to tip
          float tipK = 1.0 - rootK;
          float isTail = position.y < 1.55 ? 1.0 : 0.0;
          float w = pow(tipK, 1.55) * mix(0.35, 1.0, isTail) * uHairFlow;
          float wave = sin(uHairTime * 3.1 - tipK * 4.2 + aSeed * 6.2831);
          transformed += uHairLag * w;
          transformed.y += uHairLift * w;
          transformed += uHairRight * ((aSeed - 0.5) * 0.085 * pow(tipK, 1.4) * isTail * uHairFlow + wave * 0.012 * w * (0.5 + uHairSpeed));
          transformed += uHairFwd * wave * 0.009 * w * (0.4 + uHairSpeed);
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vSeed; varying vec2 vHairUv; varying float vTail; uniform float uHairK;
        float hh(float x) { return fract(sin(x * 127.1 + 31.7) * 43758.5453); }
        float hv(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hh(i.x + i.y * 57.0), hh(i.x + 1.0 + i.y * 57.0), f.x), mix(hh(i.x + (i.y + 1.0) * 57.0), hh(i.x + 1.0 + (i.y + 1.0) * 57.0), f.x), f.y); }
        vec3 hairTangent() {
          vec3 q0 = dFdx(-vViewPosition), q1 = dFdy(-vViewPosition);
          vec2 s0 = dFdx(vHairUv), s1 = dFdy(vHairUv);
          float det = s0.x * s1.y - s1.x * s0.y;
          vec3 pt = (-q0 * s1.x + q1 * s0.x) / (abs(det) < 1e-12 ? 1e-12 : det);
          return normalize(-pt);
        }`,
      )
      .replace(
        "#include <alphatest_fragment>",
        `{
          float lu = fract(vHairUv.x * 8.0);
          float tip = 1.0 - vHairUv.y;
          float sId = floor(lu * 16.0 + vSeed * 7.0);
          float sl = 0.72 + 0.28 * hh(sId + vSeed * 31.0);
          float lenA = 1.0 - smoothstep(sl - 0.12, sl, tip);
          float edge = min(lu, 1.0 - lu);
          float wisp = smoothstep(0.0, mix(0.17 + 0.1 * vSeed, 0.04, vTail), edge + (hv(vec2(sId, tip * 7.0)) - 0.5) * mix(0.14, 0.04, vTail)); // the tail keeps its ribbons butted together: dissolving every edge leaves a bright line between neighbours against a pale background
          // the atlas leaves gaps between strands; seen against the sky they make the tail look see-through, so the gaps are mostly filled and
          // the strand character comes from the ragged tips, the feathered sides and the per-strand tone
          diffuseColor.a = mix(diffuseColor.a, 1.0, mix(0.18, 0.97, vTail)) * lenA * wisp;
          // strand tones: a wide spread across sixteen strands per ribbon aliases into a barcode on the tail, so the tail keeps a third of it
          float tone = 0.5 + 0.6 * hh(sId * 1.7 + vSeed * 13.0);
          diffuseColor.rgb *= mix(tone, 1.0, 0.65 * vTail);
        }
        #include <alphatest_fragment>`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          // a ribbon is flat; hair is round. Bend the lighting normal across the width so highlights roll over the strands instead of
          // flashing across a whole plank.
          float lu2 = fract(vHairUv.x * 8.0);
          vec3 side = normalize(cross(normal, hairTangent()));
          normal = normalize(normal + side * (lu2 - 0.5) * 1.3);
        }`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
        #if NUM_DIR_LIGHTS > 0
        {
          vec3 T = hairTangent();
          for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
            vec3 L = directionalLights[i].direction;
            vec3 H = normalize(L + geometryViewDir);
            float th = dot(T, H);
            float s = sqrt(max(0.0, 1.0 - th * th));
            float lit = clamp(dot(normal, L) * 0.5 + 0.5, 0.0, 1.0);
            float spec = pow(s, 28.0) * 0.55 + pow(s, 7.0) * 0.45;
            reflectedLight.directSpecular += directionalLights[i].color * spec * lit * uHairK * (0.5 + 0.8 * hh(vSeed * 91.0));
          }
        }
        #endif`,
      );
  };
  material.customProgramCacheKey = () => "marwari-hair-v6";
  return { wind, sheen, flow };
}
