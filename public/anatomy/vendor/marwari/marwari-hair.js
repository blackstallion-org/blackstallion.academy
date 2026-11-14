// Generated from components/3d/marwari-hair.ts by scripts/build-anatomy-vendor.mjs. Do not edit.
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
 * Tail (rebuilt 3 Nov 2026, "Tail Refinement & Perfection"): the tail is a bundle of about 176 solid locks, not a screen of strands. The
 * fine strands are shading only (tone and highlight lines that fade out when they get smaller than a pixel), coverage stays whole inside
 * a lock and ends at its sides and its tip in a one-pixel soft edge, so alpha-to-coverage no longer breaks it into a dither. Locks are
 * darker toward the core of the bundle and lighter on its outside (computed from the geometry when the model loads), and the dock is
 * in shade.
 *
 * UV layout of the ribbons: u = 8 atlas slots across, one slot per ribbon (the atlas is not used by the tail). v runs 1 at the root and
 * 0 at the tip in Blender, which the glTF exporter flips: in the browser uv.y is 0 at the root and 1 at the tip. (The mane branch of
 * the shader below was written the other way round and is left as it was; the tail branch uses uv.y as it is.)
 */
import * as THREE from "three";
/** One random number per ribbon, from the connected components of the index buffer. */
function ribbonSeeds(geo) {
    const n = geo.attributes.position.count;
    const parent = Int32Array.from({ length: n }, (_, i) => i);
    const find = (a) => {
        while (parent[a] !== a) {
            parent[a] = parent[parent[a]];
            a = parent[a];
        }
        return a;
    };
    const idx = geo.index;
    if (idx)
        for (let i = 0; i < idx.count; i += 3) {
            const a = find(idx.getX(i));
            for (const k of [1, 2]) {
                const b = find(idx.getX(i + k));
                if (b !== a)
                    parent[b] = a;
            }
        }
    const seed = new Map();
    const out = new Float32Array(n);
    let s = 1234567;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) {
        const r = find(i);
        if (!seed.has(r))
            seed.set(r, rnd());
        out[i] = seed.get(r);
    }
    return out;
}
/**
 * The direction each strand runs (root toward tip), per vertex, in the mesh's own space: dP/dv from the UVs, averaged over the
 * triangles that share the vertex. The shader used to guess it from screen-space derivatives, which are constant over each 2 x 2
 * block of pixels and showed up as rectangular patches of highlight in the mane.
 */
function strandTangents(geo) {
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const idx = geo.index;
    const out = new Float32Array(pos.count * 3);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), t = new THREE.Vector3();
    const triCount = idx ? idx.count / 3 : pos.count / 3;
    for (let f = 0; f < triCount; f++) {
        const i0 = idx ? idx.getX(f * 3) : f * 3, i1 = idx ? idx.getX(f * 3 + 1) : f * 3 + 1, i2 = idx ? idx.getX(f * 3 + 2) : f * 3 + 2;
        a.fromBufferAttribute(pos, i0);
        b.fromBufferAttribute(pos, i1);
        c.fromBufferAttribute(pos, i2);
        e1.subVectors(b, a);
        e2.subVectors(c, a);
        const du1 = uv.getX(i1) - uv.getX(i0), dv1 = uv.getY(i1) - uv.getY(i0);
        const du2 = uv.getX(i2) - uv.getX(i0), dv2 = uv.getY(i2) - uv.getY(i0);
        const det = du1 * dv2 - du2 * dv1;
        if (Math.abs(det) < 1e-12)
            continue;
        // dP/dv, pointing toward the root (v grows toward the root); only the line matters to the lighting
        t.set(0, 0, 0).addScaledVector(e2, du1).addScaledVector(e1, -du2).divideScalar(det);
        if (t.lengthSq() < 1e-14)
            continue;
        t.normalize();
        for (const i of [i0, i1, i2]) {
            out[i * 3] += t.x;
            out[i * 3 + 1] += t.y;
            out[i * 3 + 2] += t.z;
        }
    }
    for (let i = 0; i < pos.count; i++) {
        t.set(out[i * 3], out[i * 3 + 1], out[i * 3 + 2]);
        if (t.lengthSq() < 1e-12)
            t.set(0, -1, 0);
        else
            t.normalize();
        out[i * 3] = t.x;
        out[i * 3 + 1] = t.y;
        out[i * 3 + 2] = t.z;
    }
    return out;
}
/**
 * Where each tail vertex sits in the bundle, from the geometry itself: x = how far out from the bundle's axis (0 on the axis, 1 at the
 * outside), y = how far toward the horse's body (0 on the back, 1 against the buttocks). The axis and the extent are measured per height
 * band of the rest pose, so it follows whatever tail the file carries. Used only for shading (darker core, lighter outside).
 */
function bundleDepth(geo, fwdX, fwdZ) {
    const pos = geo.attributes.position;
    const n = pos.count;
    const out = new Float32Array(n * 2).fill(0.5);
    const BINS = 40, Y0 = 0, Y1 = 1.55;
    const bin = (y) => Math.min(BINS - 1, Math.max(0, Math.floor(((y - Y0) / (Y1 - Y0)) * BINS)));
    const cx = new Float64Array(BINS), cz = new Float64Array(BINS), cn = new Float64Array(BINS);
    for (let i = 0; i < n; i++) {
        const y = pos.getY(i);
        if (y >= Y1)
            continue;
        const b = bin(y);
        cx[b] += pos.getX(i);
        cz[b] += pos.getZ(i);
        cn[b]++;
    }
    for (let b = 0; b < BINS; b++)
        if (cn[b]) {
            cx[b] /= cn[b];
            cz[b] /= cn[b];
        }
    const dist = Array.from({ length: BINS }, () => []);
    for (let i = 0; i < n; i++) {
        const y = pos.getY(i);
        if (y >= Y1)
            continue;
        const b = bin(y);
        dist[b].push(Math.hypot(pos.getX(i) - cx[b], pos.getZ(i) - cz[b]));
    }
    const ext = new Float64Array(BINS);
    for (let b = 0; b < BINS; b++) {
        const d = dist[b].sort((p, q) => p - q);
        ext[b] = d.length ? Math.max(0.02, d[Math.floor(d.length * 0.94)]) : 0.05;
    }
    for (let i = 0; i < n; i++) {
        const y = pos.getY(i);
        if (y >= Y1)
            continue;
        const b = bin(y);
        const dx = pos.getX(i) - cx[b], dz = pos.getZ(i) - cz[b];
        const r = Math.hypot(dx, dz) / ext[b];
        out[i * 2] = Math.min(1, r);
        // + toward the horse: dot with forward, then 0.5 + 0.5 * that, weighted by how far out the vertex is
        const f = (dx * fwdX + dz * fwdZ) / Math.max(1e-4, Math.hypot(dx, dz));
        out[i * 2 + 1] = 0.5 + 0.5 * f * Math.min(1, r * 1.4);
    }
    return out;
}
export function installHair(mesh, material) {
    mesh.geometry.setAttribute("aSeed", new THREE.BufferAttribute(ribbonSeeds(mesh.geometry), 1));
    mesh.geometry.setAttribute("aTan", new THREE.BufferAttribute(strandTangents(mesh.geometry), 3));
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
            if (pos.getY(i) < 1.55) {
                tx += pos.getX(i);
                tz += pos.getZ(i);
                tn++;
            }
            else {
                mx += pos.getX(i);
                mz += pos.getZ(i);
                mn++;
            }
        }
        if (tn && mn) {
            fwd.value.set(mx / mn - tx / tn, 0, mz / mn - tz / tn);
            if (fwd.value.lengthSq() > 1e-6)
                fwd.value.normalize();
            else
                fwd.value.set(0, 0, 1);
            right.value.set(-fwd.value.z, 0, fwd.value.x); // horizontal, at right angles to forward
        }
    }
    mesh.geometry.setAttribute("aBundle", new THREE.BufferAttribute(bundleDepth(mesh.geometry, fwd.value.x, fwd.value.z), 2));
    const tailRoot = mesh.skeleton?.getBoneByName("Tail_1") ?? null;
    mesh.onBeforeRender = () => {
        const now = performance.now();
        time.value = now / 1000;
        const dt = Math.min(0.05, (now - lastT) / 1000);
        if (dt < 0.004)
            return; // the mesh renders more than once a frame (shadows): step the hair once
        lastT = now;
        if (!tailRoot || flow.value <= 0) {
            lag.value.multiplyScalar(0.9);
            lift.value *= 0.9;
            return;
        }
        // the root bone's velocity in the horse's own frame: bobbing of the pelvis on the spot, and travel across the ground
        tailRoot.getWorldPosition(rootNow);
        if (!haveRoot) {
            rootPrev.copy(rootNow);
            haveRoot = true;
            return;
        }
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
        if (mag > 0.42)
            target.multiplyScalar(0.42 / mag);
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
            .replace("#include <common>", "#include <common>\nattribute float aSeed; attribute vec3 aTan; attribute vec2 aBundle; varying vec2 vBundle; varying vec3 vHairT; uniform float uHairTime; uniform vec3 uHairWind; uniform float uHairFlow; uniform vec3 uHairLag; uniform float uHairLift; uniform float uHairSpeed; uniform vec3 uHairFwd; uniform vec3 uHairRight; varying float vSeed; varying vec2 vHairUv; varying float vTail;")
            .replace("#include <skinning_vertex>", `#include <skinning_vertex>
        vSeed = aSeed; vHairUv = uv; vBundle = aBundle; vTail = position.y < 1.55 ? 1.0 : 0.0;
        vHairT = normalize((modelViewMatrix * vec4((skinMatrix * vec4(aTan, 0.0)).xyz, 0.0)).xyz);
        {
          float rootK = clamp(1.0 - uv.y, 0.0, 1.0);
          float ph = aSeed * 6.2831 + uHairTime * 1.6;
          float fl = sin(ph + position.y * 2.5) * 0.65 + sin(ph * 2.3 + position.z * 3.1) * 0.35;
          float tipK0 = 1.0 - rootK;
          float isTail0 = position.y < 1.55 ? 1.0 : 0.0;
          transformed += uHairWind * fl * tipK0 * tipK0; // mane and tail flutter at their free ends (uv.y runs 0 root .. 1 tip; the mane used to flutter at the crest)
          // flow: lag and lift (the spring in installHair), a fan across the ribbons so the sheet becomes a bundle, a wave root to tip
          float tipK = 1.0 - rootK;
          float isTail = position.y < 1.55 ? 1.0 : 0.0;
          float w = pow(tipK, 1.55) * mix(0.35, 1.0, isTail) * uHairFlow;
          float wave = sin(uHairTime * 3.1 - tipK * 4.2 + aSeed * 6.2831);
          transformed += uHairLag * w;
          transformed.y += uHairLift * w;
          transformed += uHairRight * ((aSeed - 0.5) * 0.05 * pow(tipK, 1.4) * isTail * uHairFlow + wave * 0.012 * w * (0.5 + uHairSpeed));
          transformed += uHairFwd * wave * 0.009 * w * (0.4 + uHairSpeed);
        }`);
        shader.fragmentShader = shader.fragmentShader
            .replace("#include <common>", `#include <common>
        varying float vSeed; varying vec2 vHairUv; varying float vTail; varying vec3 vHairT; varying vec2 vBundle; uniform float uHairK;
        float hh(float x) { return fract(sin(x * 127.1 + 31.7) * 43758.5453); }
        float hv(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hh(i.x + i.y * 57.0), hh(i.x + 1.0 + i.y * 57.0), f.x), mix(hh(i.x + (i.y + 1.0) * 57.0), hh(i.x + 1.0 + (i.y + 1.0) * 57.0), f.x), f.y); }
        vec3 hairTangentScreen() {
          vec3 q0 = dFdx(-vViewPosition), q1 = dFdy(-vViewPosition);
          vec2 s0 = dFdx(vHairUv), s1 = dFdy(vHairUv);
          float det = s0.x * s1.y - s1.x * s0.y;
          vec3 pt = (-q0 * s1.x + q1 * s0.x) / (abs(det) < 1e-12 ? 1e-12 : det);
          return normalize(-pt);
        }
        // Mane and tail take their strand direction per vertex (smooth). The screen-space estimate the mane used to take jumped at every card
        // edge and lit each lock with a light outline (4 Nov 2026).
        vec3 hairTangent() { return normalize(vHairT); }`)
            .replace("#include <alphatest_fragment>", `{
          float lu = fract(vHairUv.x * 8.0);
          float tip = 1.0 - vHairUv.y;
          float edge = min(lu, 1.0 - lu);
          float isT = step(0.5, vTail);
          // MANE (4 Nov 2026): solid locks, like the tail. It used to cut sixteen strands across each ribbon, each with its own length and
          // tone, read with uv.y the old way round: the strands were transparent at the crest and whole at their ends, so the mane hung off
          // the neck, and strands narrower than a pixel went to alpha-to-coverage dither (grey stripes and specks). Now coverage is whole from
          // the crest, ends in a soft edge at the lock's sides and at its tip (each lock its own length), and the strands only change tone.
          float alongM = vHairUv.y;                                  // 0 at the crest, 1 at the tip
          float wobM = (hv(vec2(alongM * 5.0 + vSeed * 23.0, vSeed * 37.0)) - 0.5) * 0.08;
          float lenEndM = 0.88 + 0.12 * hh(vSeed * 47.0 + 5.0);
          float aM = smoothstep(0.03, 0.2, edge + wobM) * (1.0 - smoothstep(lenEndM - 0.07, lenEndM, alongM));
          float swM = lu * 18.0 + (hv(vec2(alongM * 2.0 + vSeed * 11.0, vSeed * 5.0)) - 0.5) * 1.6;
          float strandM = (hh(floor(swM) + vSeed * 61.0) - 0.5) * (1.0 - smoothstep(0.1, 0.24, fwidth(swM)));
          float toneM = (0.5 + 0.14 * hh(vSeed * 89.0 + 7.0)) * (1.0 + strandM * 0.22);   // as dark as the coat: a lighter mane showed every card
          // TAIL: a solid lock. Coverage is whole across the card and ends in a soft one-pixel edge at its sides (which wander a little
          // along the length, so no lock has a ruled edge) and at its tip; the card's own geometry narrows to a point, so the tip needs
          // no strand pattern. The fine strands below change tone and highlight only, never coverage, and fade out when they are smaller
          // than a pixel, so nothing here can turn into dither.
          float along = vHairUv.y;                                   // 0 at the dock, 1 at the tip
          float wob = (hv(vec2(along * 5.0 + vSeed * 17.0, vSeed * 40.0)) - 0.5) * 0.08;
          float aT = smoothstep(0.03, 0.2, edge + wob) * (1.0 - smoothstep(0.945, 0.995, along));
          diffuseColor.a = mix(aM, aT, isT);
          float sw = lu * 22.0 + (hv(vec2(along * 2.0 + vSeed * 9.0, vSeed * 3.0)) - 0.5) * 1.6;
          float swc = lu * 5.0 + (hv(vec2(along * 1.3 + vSeed * 5.0, vSeed * 7.0)) - 0.5) * 1.2;   // clumps of strands, about five across a lock
          float groupK = (hh(floor(swc) + vSeed * 33.0) - 0.5) * (1.0 - smoothstep(0.1, 0.28, fwidth(swc)));
          float strandK = (hh(floor(sw) + vSeed * 57.0) - 0.5) * (1.0 - smoothstep(0.1, 0.24, fwidth(sw))) + groupK * 0.8;
                    float lockTone = 0.88 + 0.24 * hh(vSeed * 91.0 + 3.0);     // lock to lock
          float outer = vBundle.x;                                    // 0 on the bundle's axis .. 1 on its outside
          float against = vBundle.y;                                  // 1 against the buttocks
          float bundleK = mix(0.62, 1.06, smoothstep(0.05, 0.95, outer)) * mix(1.0, 0.8, smoothstep(0.55, 0.95, against));
          float dockShade = mix(0.38, 1.0, smoothstep(0.0, 0.26, along));  // the dock is in the shade of the croup
          vec3 tailCol = vec3(0.0135, 0.0092, 0.0068) * (1.0 + strandK * 0.15) * lockTone * bundleK * dockShade;   // strand tone quietened: locks read as solid, not speckled
          diffuseColor.rgb = mix(diffuseColor.rgb * toneM, tailCol, isT);
        }
        #include <alphatest_fragment>`)
            .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        {
          // a ribbon is flat; hair is round. Bend the lighting normal across the width so highlights roll over the strands instead of
          // flashing across a whole plank.
          float lu2 = fract(vHairUv.x * 8.0);
          vec3 side = normalize(cross(normal, hairTangent()));
          float sw2 = lu2 * 22.0 + (hv(vec2(vHairUv.y * 2.0 + vSeed * 9.0, vSeed * 3.0)) - 0.5) * 1.6;
          float rip = 0.0;   // the tail used to take a per-strand normal jitter here; at mid distance it read as stipple, so it is off
          normal = normalize(normal + side * ((lu2 - 0.5) * 1.3 + rip * 0.9));
        }`)
            .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
        // the tail sits darker against a pale sky: the stock GGX lobes (a bright grey wash on every card, bent normals and all) are cut to a
        // fraction and the highlight comes from the strand term below, which is narrow across the strand and long along it
        reflectedLight.indirectSpecular *= 0.3;   // the mane too (4 Nov 2026): its full grey wash made the locks read as planks
        reflectedLight.directSpecular *= 0.16;
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
            float isTl = 1.0;   // mane and tail share the strand highlight (the mane used to take the stock lobe at full strength)
            float sw3 = fract(vHairUv.x * 8.0) * 22.0 + (hv(vec2(vHairUv.y * 2.0 + vSeed * 9.0, vSeed * 3.0)) - 0.5) * 1.6;
            float strandHi = 1.0 + (hh(floor(sw3) + vSeed * 57.0) - 0.5) * 1.6 * (1.0 - smoothstep(0.1, 0.24, fwidth(sw3))) * isTl;
            // the sheen of a bundle is not one grey sheet: it comes and goes from clump to clump and along the length, in long soft bands
            strandHi *= mix(1.0, 0.25 + 1.5 * hv(vec2(fract(vHairUv.x * 8.0) * 4.0 + vSeed * 13.0, vHairUv.y * 3.0 + vSeed * 7.0)), isTl);
            reflectedLight.directSpecular += directionalLights[i].color * spec * lit * uHairK * (0.5 + 0.8 * hh(vSeed * 91.0)) * mix(1.0, 0.32 * strandHi, isTl);
          }
        }
        #endif`);
    };
    material.customProgramCacheKey = () => "marwari-hair-v12";
    return { wind, sheen, flow };
}
