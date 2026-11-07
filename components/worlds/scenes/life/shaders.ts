import * as THREE from "three";

/**
 * World 02's materials. Everything in the inner world is light: the shaders write linear HDR values above 1 where they glow so the
 * bloom pass carries them. Fog is applied by hand (exponential, toward a warm dark) so far structures sink into the murk.
 */

export const NOISE = /* glsl */ `
vec3 h33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn3(p); p = p * 2.02 + 7.3; a *= 0.5; } return s; }
// 3D Voronoi: F1 distance and the nearest feature point
vec4 voro(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d1 = 9.0; vec3 best = vec3(0.0);
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = h33(i + g);
    vec3 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d1 = d; best = r; }
  }
  return vec4(sqrt(d1), best);
}
`;

const FOG = /* glsl */ `
uniform vec3 uFogColor; uniform float uFogDensity;
vec3 applyFog(vec3 col, float dist) { float f = 1.0 - exp(-pow(uFogDensity * dist, 1.6)); return mix(col, uFogColor, f); }
`;

export const fogUniforms = () => ({ uFogColor: { value: new THREE.Color("#1a0e05") }, uFogDensity: { value: 0.012 } });

/* ------------------------------------------------------------------ living cells: translucent membranes covered in glossy vesicles */
export function cellMaterial(shared: Record<string, THREE.IUniform>) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uTime: shared.uTime, uGlow: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec4 aCell; // x: seed, y: bubble scale, z: hue (0 gold .. 1 green), w: pulse phase
      varying vec3 vObj; varying vec3 vN; varying vec3 vView; varying vec4 vCell; varying float vDist;
      void main() {
        vObj = normalize(position);
        vCell = aCell;
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vec4 mv = viewMatrix * wp;
        vView = normalize(cameraPosition - wp.xyz);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${FOG}
      uniform float uTime; uniform float uGlow;
      varying vec3 vObj; varying vec3 vN; varying vec3 vView; varying vec4 vCell; varying float vDist;
      void main() {
        vec3 N = normalize(vN), V = normalize(vView);
        float scale = vCell.y;
        vec3 p = vObj * scale + vCell.x * 13.0;
        vec4 v = voro(p);
        float r = 0.5 + 0.1 * h13(floor(p + v.yzw + 0.5));
        float d = v.x / r;
        float dome = sqrt(max(0.0, 1.0 - d * d));
        // tilt the normal over each vesicle (the dome of a bubble)
        vec3 tangentPush = normalize(-v.yzw) * (1.0 - dome) * step(d, 1.0) * 1.6;
        vec3 n2 = normalize(N + tangentPush);
        float ndv = clamp(dot(n2, V), 0.0, 1.0);
        float rimCell = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);
        vec3 gold = vec3(1.0, 0.62, 0.16);
        vec3 lime = vec3(0.62, 0.95, 0.22);
        vec3 hue = mix(gold, lime, vCell.z);
        float pulse = 0.75 + 0.25 * sin(uTime * 1.3 + vCell.w * 6.2831);
        // membrane between vesicles: dark amber, lit from inside
        vec3 membrane = mix(vec3(0.05, 0.022, 0.005), hue * 0.3, 0.25) * (0.5 + 0.9 * rimCell);
        // vesicle: glossy, a translucent core that glows, a dark ring at its foot, a sharp highlight
        float inBubble = 1.0 - smoothstep(0.92, 1.0, d);
        float ring = smoothstep(0.7, 0.95, d) * inBubble;
        vec3 Ld = normalize(vec3(-0.4, 0.8, 0.45));
        float diff = 0.3 + 0.7 * max(dot(n2, Ld), 0.0);
        vec3 core = hue * (0.1 + 0.9 * pow(dome, 2.0)) * diff * pulse;
        vec3 L = normalize(vec3(-0.4, 0.8, 0.45));
        float spec = pow(max(dot(reflect(-L, n2), V), 0.0), 40.0) * inBubble;
        vec3 col = mix(membrane, core, inBubble * (0.35 + 0.65 * dome));
        col *= 1.0 - ring * 0.8;
        col += spec * vec3(1.0, 0.95, 0.8) * 2.0;
        // the whole cell glows at its silhouette (light scattering through the membrane)
        col += hue * pow(rimCell, 1.4) * 1.1 * pulse;
        col *= uGlow;
        gl_FragColor = vec4(applyFog(col, vDist), 1.0);
      }`,
  });
}

/* ------------------------------------------------------------------ tissue: dark organic walls and floor with glowing veins */
export function tissueMaterial(shared: Record<string, THREE.IUniform>, opts: { displace: number; freq: number; clear?: THREE.Vector4; vein?: number }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uTime: shared.uTime, uDisp: { value: opts.displace }, uFreq: { value: opts.freq }, uClear: { value: opts.clear ?? new THREE.Vector4(0, 0, -1, 0) }, uVein: { value: opts.vein ?? 1 } },
    vertexShader: /* glsl */ `
      ${NOISE}
      uniform float uDisp; uniform float uFreq; uniform vec4 uClear; // clearing: xz centre, radius, flatten
      varying vec3 vW; varying vec3 vN; varying float vDist; varying float vH;
      void main() {
        vec4 wp0 = modelMatrix * vec4(position, 1.0);
        float n = fbm3(wp0.xyz * uFreq);
        float flat_ = uClear.z > 0.0 ? smoothstep(uClear.z * 0.6, uClear.z, length(wp0.xz - uClear.xy)) : 1.0;
        vec3 disp = normal * (n - 0.45) * uDisp * mix(uClear.w, 1.0, flat_);
        vec4 wp = modelMatrix * vec4(position + disp, 1.0);
        vW = wp.xyz; vH = n;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = viewMatrix * wp;
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      ${FOG}
      uniform float uTime; uniform float uVein;
      varying vec3 vW; varying vec3 vN; varying float vDist; varying float vH;
      void main() {
        vec3 dx = dFdx(vW), dy = dFdy(vW);
        vec3 N = normalize(cross(dx, dy));
        vec3 V = normalize(cameraPosition - vW);
        if (dot(N, V) < 0.0) N = -N;
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        // veins: ridged noise, slowly flowing
        vec3 w = vW * 0.07;
        w += (vec3(fbm3(w + 1.7), fbm3(w + 9.2), fbm3(w + 4.4)) - 0.5) * 1.6; // domain warp: veins branch and wander
        vec3 q = w + vec3(0.0, uTime * 0.02, 0.0);
        float rid = 1.0 - abs(2.0 * fbm3(q) - 1.0);
        float vein = pow(rid, 22.0);
        float lump = fbm3(vW * 0.35);
        float fine = pow(1.0 - abs(2.0 * vn3(vW * 0.6 + 3.1) - 1.0), 30.0);
        vec3 base = mix(vec3(0.02, 0.009, 0.003), vec3(0.085, 0.04, 0.012), lump) * (0.25 + 0.75 * ndv);
        vec3 glow = vec3(1.0, 0.52, 0.12) * (vein * 1.5 + fine * 0.12) * uVein * (0.75 + 0.25 * sin(uTime * 0.8 + vW.x * 0.05));
        vec3 rim = vec3(0.9, 0.5, 0.12) * pow(1.0 - ndv, 4.0) * 0.18 * uVein * uVein; // a flat floor seen at a grazing angle must not turn into a gold sheet
        vec3 col = base + glow + rim;
        gl_FragColor = vec4(applyFog(col, vDist), 1.0);
      }`,
  });
}

/* ------------------------------------------------------------------ energy pathways: tubes with pulses running along them */
export function fiberMaterial(shared: Record<string, THREE.IUniform>, seed: number, color: THREE.ColorRepresentation) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uTime: shared.uTime, uSeed: { value: seed }, uColor: { value: new THREE.Color(color) } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vDist; varying float vNdv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vNdv = abs(dot(n, normalize(cameraPosition - wp.xyz)));
        vec4 mv = viewMatrix * wp; vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${FOG}
      uniform float uTime; uniform float uSeed; uniform vec3 uColor;
      varying vec2 vUv; varying float vDist; varying float vNdv;
      void main() {
        float s = fract(vUv.x * 2.5 - uTime * 0.22 + uSeed);
        float pulse = exp(-pow((s - 0.5) / 0.035, 2.0)) * 3.0;
        float core = pow(vNdv, 1.5);
        float a = (0.08 + pulse) * core;
        float fog = exp(-pow(uFogDensity * vDist, 1.6));
        gl_FragColor = vec4(uColor * a * fog, 1.0);
      }`,
  });
}

/* ------------------------------------------------------------------ the horse of light: x-ray shell, muscles, bones (skinned) */
export function xrayMaterial(color: THREE.ColorRepresentation, opts: { rimPower: number; body: number; rim: number; strands?: number; cut?: boolean }) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uRim: { value: opts.rim }, uBody: { value: opts.body }, uPow: { value: opts.rimPower }, uLevel: { value: 1 }, uTime: { value: 0 }, uStrand: { value: opts.strands ?? 0 }, uCut: { value: new THREE.Vector4(-1, -1, -1, -1) }, ...fogUniforms() },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      #include <common>
      #include <skinning_pars_vertex>
      varying vec3 vN; varying vec3 vV; varying float vDist; varying vec3 vW; varying vec3 vL; varying float vCut; uniform vec4 uCut;
      void main() {
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        vN = normalize(mat3(modelMatrix) * objectNormal);
        vV = normalize(cameraPosition - wp.xyz);
        vW = wp.xyz; vL = position;
        // weight on the bones listed in uCut (the exhibit's own tail, which is replaced by the strand tail)
        vCut = 0.0;
        #ifdef USE_SKINNING
        for (int k = 0; k < 4; k++) { float id = skinIndex[k]; if (id == uCut.x || id == uCut.y || id == uCut.z || id == uCut.w) vCut += skinWeight[k]; }
        #endif
        vec4 mv = viewMatrix * wp; vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uRim; uniform float uBody; uniform float uPow; uniform float uLevel; uniform float uTime; uniform float uStrand;
      uniform vec3 uFogColor; uniform float uFogDensity;
      varying vec3 vN; varying vec3 vV; varying float vDist; varying vec3 vW; varying vec3 vL; varying float vCut;
      void main() {
        float ndv = abs(dot(normalize(vN), normalize(vV)));
        float rim = pow(1.0 - ndv, uPow);
        // faint travelling bands: the light moving through the body
        float band = 0.85 + 0.15 * sin(vW.y * 9.0 - uTime * 2.0 + vW.x * 3.0);
        vec3 col = uColor * (uBody * ndv * 0.6 + uRim * rim) * band * uLevel;
        // hair: split the glow into separate fine strands (dark gaps between them) so it reads as flowing hair, not one white mass
        if (uStrand > 0.0) {
          float a = sin(vL.x * 330.0 + sin(vL.y * 9.0 + vL.z * 6.0) * 2.4);
          float b = sin(vL.z * 380.0 - sin(vL.y * 6.0) * 2.2 + 1.7);
          float st = smoothstep(-0.1, 0.95, a * 0.6 + b * 0.5 + 0.15) * 1.6;
          col *= mix(1.0, st, uStrand);
        }
        col *= 1.0 - smoothstep(0.15, 0.7, vCut);
        float fog = exp(-pow(uFogDensity * vDist, 1.6));
        gl_FragColor = vec4(col * fog, 1.0);
      }`,
  });
}

/**
 * The horse of light (public/models/horse-of-light.glb, one static textured mesh): lit gold body with a fresnel rim, and a gallop
 * made in the vertex shader, since the model has no rig. Model-space frame: +X toward the head, +Y up, Z across the body.
 * uBox = (tail x, head x, ground y, top y), uHalfZ the half width. Each leg swings about its shoulder or hip, more toward the hoof
 * (a curve, not a hinge); the body rocks and bobs twice per stride. uPhase is the stride in cycles, uRun the amount (0 stands still).
 */
export function lightHorseMaterial(map: THREE.Texture | null, box: THREE.Vector4, halfZ: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map }, uHasMap: { value: map ? 1 : 0 }, uBox: { value: box }, uHalfZ: { value: halfZ }, uPhase: { value: 0 }, uRun: { value: 1 },
      uLevel: { value: 1 }, uInner: { value: 0 }, uTime: { value: 0 }, uKey: { value: new THREE.Vector3(-0.4, 0.8, 0.45).normalize() }, ...fogUniforms(),
    },
    side: THREE.DoubleSide,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform vec4 uBox; uniform float uHalfZ; uniform float uPhase; uniform float uRun;
      varying vec3 vN; varying vec3 vV; varying float vDist; varying vec2 vUv; varying vec3 vW;
      const float TAU = 6.2831853;
      vec2 rot(vec2 p, vec2 c, float a) { float s = sin(a), k = cos(a); p -= c; return vec2(k * p.x - s * p.y, s * p.x + k * p.y) + c; }
      void main() {
        vec3 p = position; vec3 n = normal;
        float len = uBox.y - uBox.x, h = uBox.w - uBox.z;
        float u = (p.x - uBox.x) / len;          // 0 tail .. 1 head
        float v = (p.y - uBox.z) / h;            // 0 hoof .. 1 top
        float hipY = uBox.z + h * 0.52;
        // Every weight below is a smooth ramp, never a step: neighbouring vertices always move almost alike, so a leg bends as one
        // piece and never tears from the body or from the leg beside it.
        float fore = smoothstep(0.42, 0.66, u);                    // hind pair .. fore pair
        float side = smoothstep(-uHalfZ * 0.5, uHalfZ * 0.5, p.z);  // far leg .. near leg
        // rotary gallop: hind pair, then fore pair; the leading leg of each pair a little after its partner
        float ph = (uPhase + fore * 0.4 + side * 0.1) * TAU;
        // how much of the swing a vertex takes: none at the body, rising down the leg (more at the hoof than at the knee, so the
        // leg curves like a pendulum instead of hinging); nothing at the head, chest front or tail
        float down = 1.0 - smoothstep(0.12, 0.5, v);
        float legW = down * down * (3.0 - 2.0 * down) * smoothstep(0.05, 0.16, u) * (1.0 - smoothstep(0.84, 0.94, u));
        float pivotX = uBox.x + len * mix(0.3, 0.7, fore);
        float swing = sin(ph) * mix(0.2, 0.17, fore) * uRun * legW;
        p.xy = rot(p.xy, vec2(pivotX, hipY), swing);
        n.xy = rot(n.xy, vec2(0.0), swing);
        // the head and neck nod with the stride
        float neck = smoothstep(0.7, 0.9, u) * smoothstep(0.45, 0.7, v);
        float nod = sin(uPhase * TAU + 0.6) * 0.05 * uRun * neck;
        p.xy = rot(p.xy, vec2(uBox.x + len * 0.74, uBox.z + h * 0.66), nod);
        // the whole body rocks (nose up, then down) and lifts twice per stride
        float rock = sin(uPhase * TAU - 0.8) * 0.035 * uRun;
        p.xy = rot(p.xy, vec2(uBox.x + len * 0.5, hipY), rock);
        n.xy = rot(n.xy, vec2(0.0), rock + nod);
        p.y += (0.5 + 0.5 * sin(uPhase * TAU * 2.0)) * h * 0.03 * uRun;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vN = normalize(mat3(modelMatrix) * n);
        vV = normalize(cameraPosition - wp.xyz);
        vW = wp.xyz; vUv = uv;
        vec4 mv = viewMatrix * wp; vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform float uHasMap; uniform float uLevel; uniform float uInner; uniform float uTime; uniform vec3 uKey;
      uniform vec3 uFogColor; uniform float uFogDensity;
      varying vec3 vN; varying vec3 vV; varying float vDist; varying vec2 vUv; varying vec3 vW;
      void main() {
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        if (!gl_FrontFacing) N = -N;
        vec3 base = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : vec3(1.0, 0.7, 0.35);
        base = pow(base, vec3(2.2));
        float ndl = max(dot(N, uKey), 0.0);
        float ndv = max(dot(N, V), 0.0);
        vec3 H = normalize(uKey + V);
        float spec = pow(max(dot(N, H), 0.0), 48.0);
        float rim = pow(1.0 - ndv, 2.4);
        // key light from above-front, warm bounce from the glowing floor below, a hot rim from the light behind it
        float bounce = 0.5 + 0.5 * -N.y;
        vec3 col = base * (0.18 + 1.25 * ndl) + base * vec3(1.0, 0.55, 0.22) * bounce * 0.35;
        col += vec3(1.0, 0.82, 0.55) * spec * 0.9;
        col += vec3(1.0, 0.62, 0.26) * rim * 2.0;
        // the light moving through the body (brighter on the anatomy beats)
        float band = 0.5 + 0.5 * sin(vW.y * 7.0 - uTime * 2.0 + vW.x * 2.5);
        col += base * (0.35 + uInner) * band * 0.6;
        if (uLevel < 0.01) discard;
        float fog = exp(-pow(uFogDensity * vDist, 1.6));
        // the silhouette feathers out over the last few degrees, so the outline reads soft instead of stair-stepped at any resolution
        float edge = mix(0.3, 1.0, smoothstep(0.0, 0.28, ndv));
        gl_FragColor = vec4(mix(uFogColor, col, fog), clamp(uLevel, 0.0, 1.0) * edge);
      }`,
  });
}

/** A soft four-ray star (the bright sparks of the reference), drawn once into a canvas. */
export function sparkTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.08, "rgba(255,236,190,0.9)");
  grad.addColorStop(0.3, "rgba(255,190,90,0.18)");
  grad.addColorStop(1, "rgba(255,160,60,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = "lighter";
  for (const [w, a] of [[1.6, 0], [1.6, Math.PI / 2], [0.8, Math.PI / 4], [0.8, -Math.PI / 4]] as [number, number][]) {
    g.save();
    g.translate(64, 64);
    g.rotate(a);
    const lg = g.createLinearGradient(-64, 0, 64, 0);
    lg.addColorStop(0, "rgba(255,200,120,0)");
    lg.addColorStop(0.5, "rgba(255,240,210,0.9)");
    lg.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = lg;
    g.fillRect(-64, -w, 128, w * 2);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
