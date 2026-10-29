// Generated from components/3d/marwari-hair-locks.ts by scripts/build-anatomy-vendor.mjs. Do not edit.
/**
 * Puts the procedural hair of `hair-locks.ts` on the Marwari: measures the neck's skin from the coat mesh, builds the mane, forelock,
 * tail and dock at the current quality tier, skins them to the existing skeleton (so the clips and the gait move them) and shades them.
 * The exported ribbons stay in the file but are hidden (they come back only if the new hair cannot be built).
 *
 *  - Soft edges without dither. The old hair was alpha-to-coverage: on a 4x multisampled canvas that quantises every soft edge to five
 *    levels and shows as stipple on the tail. The hair is now drawn twice: an opaque pass for the strand cores (alpha tested, writes depth,
 *    casts the shadow) and a blended pass for the soft fringe (no depth write), so edges fade smoothly. Lower tiers keep one pass.
 *  - Shading. Roots are near black and in shadow (the layers above them and the neck cover them), tips lighten a little toward a sun-bleached
 *    brown; the highlight is two Kajiya-Kay lobes along the strand (a narrow white one and a wide blue-black one), so the hair has a sheen
 *    that runs with it and not the round highlight of plastic. Each strand of the atlas is tilted on its own (the highlight is a scatter of
 *    glints), the stock isotropic highlight is cut to a fifth and the sum of the strand highlights is bounded by a soft shoulder: the home
 *    hero's studio rig (key in front, rim behind) made the first version light grey.
 *  - Movement. The skeleton carries the locks (they are skinned to the neck, mane and tail bones). On top of that the tail and mane lag
 *    behind the root bone's own motion (a damped spring) and flutter a little at the free end. Reduced motion switches the extra movement off.
 */
import * as THREE from "three";
import { buildDock, buildForelock, buildMane, buildTail, hairMotion, HULL_BINS, mergeHair, ROWS, } from "./hair-locks.js";
export { hairLodForDevice, hairLodForTier } from "./hair-locks.js";
/** The side of the neck the mane falls on (+1 = the horse's left, which most film cameras see; -1 = the right). */
export const MANE_SIDE = 1;
const NECK_BONES = ["Neck_1", "Neck_2", "Neck_3", "Head"];
const MANE_BONES = ["Mane_4", "Mane_3", "Mane_2", "Mane_1"];
const TAIL_BONES = ["Tail_1", "Tail_2", "Tail_3", "Tail_4"];
/* ------------------------------------------------------------------ measuring the neck */
function bindPosition(skeleton, name) {
    const i = skeleton.bones.findIndex((b) => b.name === name);
    if (i < 0)
        return null;
    return new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(skeleton.boneInverses[i]).invert());
}
/** Weights between the two bones whose positions along a polyline bracket `u` (0..1 of its length). */
function alongWeights(names, u, at) {
    if (at <= u[0])
        return [[names[0], 1]];
    for (let i = 0; i < u.length - 1; i++) {
        if (at <= u[i + 1]) {
            const k = (at - u[i]) / Math.max(1e-6, u[i + 1] - u[i]);
            return [[names[i], 1 - k], [names[i + 1], k]];
        }
    }
    return [[names[names.length - 1], 1]];
}
/** The skin's radius round the neck at ring stations (see `NeckStation`), measured on the coat mesh in its bind pose. */
export function neckStations(coat, side, count = 14) {
    const skeleton = coat.skeleton;
    const geo = coat.geometry;
    const pos = geo.attributes.position, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
    const axisPts = NECK_BONES.map((n) => bindPosition(skeleton, n));
    const manePts = MANE_BONES.map((n) => bindPosition(skeleton, n));
    if (axisPts.some((p) => !p) || manePts.some((p) => !p) || !si || !sw)
        return null;
    const A = axisPts;
    const M = manePts;
    const cumA = [0];
    for (let i = 1; i < A.length; i++)
        cumA.push(cumA[i - 1] + A[i].distanceTo(A[i - 1]));
    const totalA = cumA[cumA.length - 1];
    const uA = cumA.map((c) => c / totalA);
    const cumM = [0];
    for (let i = 1; i < M.length; i++)
        cumM.push(cumM[i - 1] + M[i].distanceTo(M[i - 1]));
    const uM = cumM.map((c) => c / cumM[cumM.length - 1]);
    const axisAt = (u) => {
        const d = THREE.MathUtils.clamp(u, 0, 1) * totalA;
        let i = 1;
        while (i < A.length - 1 && cumA[i] < d)
            i++;
        const k = (d - cumA[i - 1]) / Math.max(1e-6, cumA[i] - cumA[i - 1]);
        return new THREE.Vector3().lerpVectors(A[i - 1], A[i], k);
    };
    // the vertices that belong to the neck and head: by their skin weights
    const group = new Set(skeleton.bones.map((b, i) => [b, i]).filter(([b]) => NECK_BONES.includes(b.name) || b.name.startsWith("Mane")).map(([, i]) => i));
    const pts = [];
    for (let i = 0; i < pos.count; i++) {
        let w = 0;
        for (let k = 0; k < 4; k++)
            if (group.has(si.getComponent(i, k)))
                w += sw.getComponent(i, k);
        if (w > 0.4)
            pts.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    if (pts.length < 300)
        return null;
    const worldUp = new THREE.Vector3(0, 1, 0);
    const left = new THREE.Vector3(side, 0, 0);
    const out = [];
    const v = new THREE.Vector3();
    for (let s = 0; s < count; s++) {
        const u = 0.3 + (0.64 * s) / (count - 1);
        const C = axisAt(u);
        const T = axisAt(Math.min(1, u + 0.03)).sub(axisAt(Math.max(0, u - 0.03))).normalize();
        const U = worldUp.clone().addScaledVector(T, -worldUp.dot(T)).normalize();
        const S = new THREE.Vector3().crossVectors(T, U).normalize();
        if (S.dot(left) < 0)
            S.negate();
        const hull = new Array(HULL_BINS).fill(0);
        for (let i = 0; i < pts.length; i += 3) {
            v.set(pts[i] - C.x, pts[i + 1] - C.y, pts[i + 2] - C.z);
            if (Math.abs(v.dot(T)) > 0.05)
                continue;
            const a = v.dot(U), b = v.dot(S);
            const r = Math.hypot(a, b);
            if (r > 0.45)
                continue;
            const bin = Math.min(HULL_BINS - 1, Math.floor(((Math.atan2(b, a) + Math.PI) / (2 * Math.PI)) * HULL_BINS));
            if (r > hull[bin])
                hull[bin] = r;
        }
        // bins with no vertex take their neighbours' radius, then a light smoothing keeps single stray vertices from spiking the surface
        for (let pass = 0; pass < HULL_BINS; pass++) {
            let empty = false;
            for (let b = 0; b < HULL_BINS; b++) {
                if (hull[b] > 0)
                    continue;
                const p = hull[(b + HULL_BINS - 1) % HULL_BINS], n = hull[(b + 1) % HULL_BINS];
                if (p > 0 && n > 0)
                    hull[b] = (p + n) / 2;
                else if (p > 0 || n > 0)
                    hull[b] = Math.max(p, n);
                else
                    empty = true;
            }
            if (!empty)
                break;
        }
        const smooth = hull.map((h, b) => 0.25 * hull[(b + HULL_BINS - 1) % HULL_BINS] + 0.5 * h + 0.25 * hull[(b + 1) % HULL_BINS]);
        const crest = C.clone().addScaledVector(U, smooth[Math.floor(HULL_BINS / 2)]);
        let best = 0, bd = Infinity;
        for (let i = 0; i < M.length - 1; i++) {
            const ab = M[i + 1].clone().sub(M[i]);
            const t = THREE.MathUtils.clamp(crest.clone().sub(M[i]).dot(ab) / ab.lengthSq(), 0, 1);
            const d = M[i].clone().addScaledVector(ab, t).distanceTo(crest);
            if (d < bd) {
                bd = d;
                best = (cumM[i] + t * (cumM[i + 1] - cumM[i])) / cumM[cumM.length - 1];
            }
        }
        out.push({
            center: C.toArray(), tangent: T.toArray(), up: U.toArray(), side: S.toArray(), hull: smooth,
            neck: alongWeights(NECK_BONES, uA, u), mane: alongWeights(MANE_BONES, uM, best),
        });
    }
    return out;
}
/** The midline of the head from the poll down the forehead (bind pose), for the forelock. `head` is the Head bone's bind position. */
export function forelockProfile(coat, head) {
    const pos = coat.geometry.attributes.position;
    const prof = [];
    let prevY = Infinity;
    // From just in front of the ears' bases down the forehead. The skin between the ears is weighted to the ear bones (so a weight filter finds
    // nothing there): take the topmost vertex of a narrow strip on the midline in each slice instead.
    for (let z = head.z + 0.06; z < head.z + 0.3; z += 0.03) {
        let y = -Infinity;
        for (let i = 0; i < pos.count; i++) {
            if (Math.abs(pos.getX(i) - head.x) > 0.02 || Math.abs(pos.getZ(i) - z) > 0.012 || pos.getY(i) < head.y - 0.25)
                continue;
            if (pos.getY(i) > y)
                y = pos.getY(i);
        }
        // the ears curve in over the midline: a point that rises above the one behind it belongs to an ear, not to the forehead
        if (y > -Infinity && y <= prevY + 0.005) {
            prof.push([head.x, y, z]);
            prevY = y;
        }
    }
    return prof.length >= 4 ? prof : null;
}
/* ------------------------------------------------------------------ shading */
const VERT_PARS = /* glsl */ `
attribute float aSeed; attribute float aAcross; attribute float aKind; attribute vec3 aTan;
varying float vSeed; varying float vAcross; varying float vKind; varying float vAlong; varying vec3 vHairT;
uniform float uHairTime; uniform vec3 uWind; uniform vec3 uLagMane; uniform vec3 uLagTail; uniform float uLiftTail; uniform float uMotion;`;
const VERT_MAIN = /* glsl */ `
#include <skinning_vertex>
vSeed = aSeed; vAcross = aAcross; vKind = aKind; vAlong = clamp(1.0 - uv.y, 0.0, 1.0);
vHairT = normalize((modelViewMatrix * vec4((skinMatrix * vec4(aTan, 0.0)).xyz, 0.0)).xyz);
{
  float al = vAlong;
  float notDock = 1.0 - step(2.5, aKind);
  float isTail = step(0.5, aKind) * (1.0 - step(1.5, aKind));
  float ph = aSeed * 6.2831 + uHairTime * 1.6;
  float fl = sin(ph + al * 3.0 + transformed.y * 2.0) * 0.65 + sin(ph * 2.3 + al * 5.0 + transformed.z * 3.0) * 0.35;
  transformed += uWind * fl * al * al * uMotion * notDock;
  transformed += mix(uLagMane, uLagTail, isTail) * pow(al, 1.5) * uMotion * notDock;
  transformed.y += uLiftTail * isTail * pow(al, 1.6) * uMotion;
}`;
const FRAG_PARS = /* glsl */ `
varying float vSeed; varying float vAcross; varying float vKind; varying float vAlong; varying vec3 vHairT;
uniform float uHairK; uniform float uSoft;
float hh1(float x) { return fract(sin(x * 127.1 + 31.7) * 43758.5453); }`;
const FRAG_ALPHA = /* glsl */ `
{
  float a = diffuseColor.a;
  // soft sides and a tip that thins to nothing; the strand structure itself comes from the atlas
  float aj = clamp(vAlong + (fract(vSeed * 3.7) - 0.5) * 0.4, 0.0, 1.0); // each lock changes at its own height: no band across the neck
  float edge = 1.0 - smoothstep(0.55, 1.0, abs(vAcross));
  float tipN = hh1(floor(vSeed * 97.0) + floor(vAlong * 9.0));
  float tip = 1.0 - smoothstep(0.7, 1.0, vAlong + 0.12 * (tipN - 0.5));
  // dense at the root (the atlas's gaps between strands are filled), parting into separate strands toward the tip
  float base = mix(0.92, 0.14, smoothstep(0.05, 0.8, aj));
  float cov = (base + (1.0 - base) * smoothstep(0.1, 0.5, a)) * edge * tip;
  // the mane and forelock fade in over the first part of their length (each lock its own, ragged across): the crest never shows a row of
  // square tops. The tail's roots are inside the dock and stay solid.
  float rampOn = step(vKind, 0.5) + step(1.5, vKind) * (1.0 - step(2.5, vKind));
  float rootRamp = smoothstep(0.0, 0.16 + 0.1 * fract(vSeed * 5.3), vAlong + 0.06 * (hh1(vSeed * 17.0 + floor((vAcross + 1.0) * 3.0)) - 0.5));
  cov *= mix(1.0, rootRamp, rampOn);
  if (vKind > 2.5) cov = 1.0;
  #ifdef HAIR_FRINGE
    if (cov >= 0.55 || cov < 0.03) discard;
    diffuseColor.a = smoothstep(0.03, 0.55, cov) * 0.72;
  #else
    if (cov < mix(0.55, 0.32, uSoft)) discard;
    diffuseColor.a = mix(1.0, smoothstep(0.32, 0.62, cov), uSoft);
  #endif
  // near black at the root, a little brown and lighter at the sun-bleached tips; every lock a touch different
  float tone = 0.78 + 0.44 * fract(vSeed * 7.31);
  float tipMix = smoothstep(0.2, 1.0, aj);
  diffuseColor.rgb = mix(vec3(0.0065, 0.0065, 0.0082), vec3(0.0098, 0.0088, 0.0088), tipMix) * tone;
  diffuseColor.rgb *= mix(0.75, 1.0, smoothstep(0.0, 0.9, aj)); // the roots sit in the shadow of the layers above and of the neck
}
`;
const FRAG_LIGHT = /* glsl */ `
#include <lights_fragment_end>
{
  float rootK = mix(0.3, 1.0, smoothstep(0.0, 0.55, vAlong));
  reflectedLight.indirectDiffuse *= rootK;
  reflectedLight.indirectSpecular *= rootK;
  // The stock highlight (a dielectric's 4% at roughness 0.85, isotropic) is a broad grey wash over every card that faces a key light: under
  // the hero's studio key the mane and tail went light grey. The strand lobes below carry the sheen, along the hair, so the stock one is cut.
  reflectedLight.directSpecular *= 0.2;
  #if NUM_DIR_LIGHTS > 0
  if (vKind < 2.5) {
    // every strand tilts a little differently, so the highlight breaks into glints along the lock and is not one wide bar
    vec3 T0 = normalize(vHairT);
    // the atlas draws 16 strands across a card: each is tilted by its own amount, so only a few are in line with the light at once
    #ifdef USE_MAP
      float strandId = floor(fract(vMapUv.x * 8.0) * 16.0);
    #else
      float strandId = floor((vAcross + 1.0) * 4.0);
    #endif
    float sid = vSeed * 53.0 + strandId;
    vec3 T = normalize(T0 + normalize(cross(T0, normal)) * (hh1(sid) - 0.5) * 1.1 + normal * (hh1(sid + 7.0) - 0.5) * 0.5);
    vec3 strandSpec = vec3(0.0);
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
      vec3 L = directionalLights[i].direction;
      vec3 H = normalize(L + geometryViewDir);
      float th = dot(T, H);
      float s = sqrt(max(0.0, 1.0 - th * th));
      float lit = clamp(dot(normal, L) * 0.5 + 0.5, 0.0, 1.0);
      // a narrow white lobe and a wider blue-black one, both running along the strand
      vec3 spec = vec3(0.9) * pow(s, 90.0) + vec3(0.30, 0.40, 0.75) * 0.32 * pow(s, 24.0);
      strandSpec += directionalLights[i].color * spec * lit * uHairK * rootK * (0.55 + 0.9 * hh1(vSeed * 91.0));
    }
    // A studio rig has a rim light behind the horse and strands that lie across its half vector: the sum can be many times the sun's, and
    // black hair goes white. A soft shoulder keeps the sheen a sheen: linear for the film's single sun, never above about 0.09.
    strandSpec = vec3(0.09) * (vec3(1.0) - exp(-strandSpec / vec3(0.09)));
    reflectedLight.directSpecular += strandSpec;
  }
  #endif
}`;
function hairMaterial(atlas, fringe, sh) {
    const m = new THREE.MeshStandardMaterial({ map: atlas, color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
    m.envMapIntensity = 0.16; // the stock specular is a broad grey veil on black hair; the strand lobes below carry the sheen
    if (fringe) {
        m.transparent = true;
        m.depthWrite = false;
        m.defines = { HAIR_FRINGE: "" };
    }
    else {
        m.alphaTest = 0.5; // the shadow's depth material reads the atlas with this threshold
    }
    m.name = fringe ? "Marwari_HairLocks_fringe" : "Marwari_HairLocks";
    m.onBeforeCompile = (shader) => {
        shader.uniforms.uHairTime = sh.time;
        shader.uniforms.uWind = sh.wind;
        shader.uniforms.uHairK = sh.kSheen;
        shader.uniforms.uLagMane = sh.lagMane;
        shader.uniforms.uLagTail = sh.lagTail;
        shader.uniforms.uLiftTail = sh.liftTail;
        shader.uniforms.uMotion = sh.motion;
        shader.uniforms.uSoft = sh.soft;
        shader.vertexShader = shader.vertexShader
            .replace("#include <common>", `#include <common>\n${VERT_PARS}`)
            .replace("#include <skinning_vertex>", VERT_MAIN);
        shader.fragmentShader = shader.fragmentShader
            .replace("#include <common>", `#include <common>\n${FRAG_PARS}`)
            .replace("#include <alphatest_fragment>", `${FRAG_ALPHA}\n#include <alphatest_fragment>`)
            .replace("#include <lights_fragment_end>", FRAG_LIGHT);
    };
    m.customProgramCacheKey = () => `marwari-hair-locks-v5${fringe ? "f" : "c"}`;
    return m;
}
function toGeometry(d) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(d.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(d.normal, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(d.uv, 2));
    g.setAttribute("aTan", new THREE.BufferAttribute(d.tangent, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(d.seed, 1));
    g.setAttribute("aAcross", new THREE.BufferAttribute(d.across, 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(d.kind, 1));
    g.setAttribute("skinIndex", new THREE.BufferAttribute(d.skinIndex, 4));
    g.setAttribute("skinWeight", new THREE.BufferAttribute(d.skinWeight, 4));
    g.setIndex(new THREE.BufferAttribute(d.index, 1));
    return g;
}
/** A damped spring that follows `-k * velocity` of a bone (in the mesh's own axes): the hair trails the motion, overshoots, settles. */
class Spring {
    pos = new THREE.Vector3();
    vel = new THREE.Vector3();
    /** The bone's smoothed velocity in the mesh's axes (m/s). */
    smooth = new THREE.Vector3();
    prev = new THREE.Vector3();
    target = new THREE.Vector3();
    ready = false;
    update(cur, qInv, scale, dt, k, out) {
        if (!this.ready) {
            this.prev.copy(cur);
            this.ready = true;
            return out;
        }
        this.target.copy(cur).sub(this.prev).divideScalar(dt).applyQuaternion(qInv).divideScalar(scale || 1);
        this.prev.copy(cur);
        this.smooth.lerp(this.target, 1 - Math.exp(-dt * 14));
        this.target.copy(this.smooth).multiplyScalar(-k);
        const m = this.target.length();
        if (m > 0.4)
            this.target.multiplyScalar(0.4 / m);
        const steps = dt > 1 / 50 ? 3 : 1, h = dt / steps;
        for (let i = 0; i < steps; i++) {
            this.vel.x += (62 * (this.target.x - this.pos.x) - 6.2 * this.vel.x) * h;
            this.vel.y += (62 * (this.target.y - this.pos.y) - 6.2 * this.vel.y) * h;
            this.vel.z += (62 * (this.target.z - this.pos.z) - 6.2 * this.vel.z) * h;
            this.pos.addScaledVector(this.vel, h);
        }
        return out.copy(this.pos);
    }
}
export function installHairLocks(coat, legacy, legacyMaterial, bones, opts) {
    const skeleton = legacy.skeleton;
    const bone = {};
    skeleton.bones.forEach((b, i) => { bone[b.name] = i; });
    for (const n of [...NECK_BONES, ...MANE_BONES, ...TAIL_BONES])
        if (bone[n] === undefined)
            return null;
    const stations = neckStations(coat, MANE_SIDE);
    const chainP = TAIL_BONES.map((n) => bindPosition(skeleton, n));
    const headPos = bindPosition(skeleton, "Head");
    if (!stations || chainP.some((p) => !p) || !headPos)
        return null;
    const chain = chainP.map((p) => p.toArray());
    const profile = forelockProfile(coat, headPos);
    const shared = {
        time: { value: 0 }, wind: opts.wind, kSheen: { value: opts.sheen.value * 1.5 }, lagMane: { value: new THREE.Vector3() }, lagTail: { value: new THREE.Vector3() },
        liftTail: { value: 0 }, motion: { value: hairMotion(opts.reducedMotion, 1) }, soft: { value: 0 },
    };
    const flow = { value: 1 };
    const atlas = legacyMaterial.map;
    const core = hairMaterial(atlas, false, shared);
    const fringe = hairMaterial(atlas, true, shared);
    const parent = legacy.parent ?? coat.parent;
    const mk = (geo, material, cast, name) => {
        const m = new THREE.SkinnedMesh(geo, material);
        m.name = name; // the anatomy exhibit finds the hair layer by these names
        m.bind(skeleton, legacy.bindMatrix);
        m.frustumCulled = false;
        m.castShadow = cast;
        m.receiveShadow = true;
        return m;
    };
    let lod = opts.lod;
    let coreMesh = null;
    let fringeMesh = null;
    const build = () => {
        const parts = [
            buildMane({ stations, bone, lod }),
            ...(profile ? [buildForelock({ profile, left: [MANE_SIDE, 0, 0], weights: [["Head", 1]], bone, lod })] : []),
            buildTail({ chain, bone, lod }),
            buildDock({ chain, bone, lod }),
        ];
        return toGeometry(mergeHair(parts));
    };
    const place = () => {
        const geo = build();
        if (coreMesh) {
            coreMesh.geometry.dispose();
            coreMesh.geometry = geo;
        }
        else {
            coreMesh = mk(geo, core, true, "Marwari_HairLocks");
            parent?.add(coreMesh);
        }
        // the fringe shares the geometry; it exists only at the top tier
        if (lod === 0) {
            if (!fringeMesh) {
                fringeMesh = mk(geo, fringe, false, "Marwari_HairLocks_fringe");
                fringeMesh.renderOrder = 4;
                parent?.add(fringeMesh);
            }
            else
                fringeMesh.geometry = geo;
            fringeMesh.visible = true;
        }
        else if (fringeMesh)
            fringeMesh.visible = false;
        // without the blended fringe the edge is softened by alpha to coverage on the multisampled canvas
        shared.soft.value = lod === 0 ? 0 : 1;
        core.alphaToCoverage = lod !== 0;
    };
    place();
    legacy.visible = false;
    legacy.userData.replacedByLocks = true; // so a layer switch (the anatomy exhibit) does not turn the exported ribbons back on over the new hair
    // the extra movement: the tail and mane lag behind their root bone's own motion (a damped spring) and the tail lifts at pace
    const tailRoot = skeleton.bones[bone.Tail_1], neck = skeleton.bones[bone.Neck_3];
    const tailSpring = new Spring(), maneSpring = new Spring();
    const qInv = new THREE.Quaternion(), scale = new THREE.Vector3(), origin = new THREE.Vector3(), cur = new THREE.Vector3();
    let last = 0;
    let forcedReduced = opts.reducedMotion;
    const query = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const onBefore = () => {
        const now = performance.now();
        shared.time.value = now / 1000;
        shared.motion.value = hairMotion(forcedReduced || !!query?.matches, 1);
        shared.kSheen.value = opts.sheen.value * 1.5; // the exported ribbons' default of 0.022 is a strength of about 0.033 for the strand lobes
        const dt = Math.min(0.05, (now - last) / 1000);
        if (dt < 0.004)
            return; // the mesh draws more than once a frame (shadow pass, fringe pass): step once
        last = now;
        if (shared.motion.value === 0 || flow.value <= 0) {
            shared.lagMane.value.multiplyScalar(0.9);
            shared.lagTail.value.multiplyScalar(0.9);
            shared.liftTail.value *= 0.9;
            return;
        }
        coreMesh.matrixWorld.decompose(origin, qInv, scale);
        qInv.invert();
        tailRoot.getWorldPosition(cur);
        tailSpring.update(cur, qInv, scale.x, dt, 0.05, shared.lagTail.value).multiplyScalar(flow.value);
        neck.getWorldPosition(cur);
        maneSpring.update(cur, qInv, scale.x, dt, 0.022, shared.lagMane.value).multiplyScalar(flow.value);
        const speed = Math.hypot(tailSpring.smooth.x, tailSpring.smooth.z);
        shared.liftTail.value += (Math.min(0.26, 0.05 * speed) * flow.value - shared.liftTail.value) * (1 - Math.exp(-dt * 5));
    };
    coreMesh.onBeforeRender = onBefore;
    // a handle for the QA scripts: under reduced motion `motion` is 0 and the lag and lift settle to nothing
    coreMesh.userData.hairShared = shared;
    return {
        get lod() { return lod; },
        flow,
        setLod(next) {
            if (next === lod)
                return;
            lod = next;
            place();
        },
        setReducedMotion(reduced) {
            forcedReduced = reduced;
            shared.motion.value = hairMotion(reduced || !!query?.matches, 1);
        },
        dispose() {
            for (const m of [coreMesh, fringeMesh])
                if (m) {
                    m.removeFromParent();
                }
            coreMesh?.geometry.dispose();
            core.dispose();
            fringe.dispose();
            legacy.visible = true;
            legacy.userData.replacedByLocks = false;
        },
    };
}
/** Rows along a lock at a tier (exported for the tests of the quality tiers). */
export const hairRows = (lod) => ROWS[lod];
