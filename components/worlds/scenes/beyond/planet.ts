import * as THREE from "three";

/**
 * The planet of World 04: a 3D sphere (so it has real parallax as the camera flies), lit by one sun.
 * Day map, city lights on the night side, drifting clouds with close-range detail (the opening shot skims the cloud tops),
 * ocean glint, a warm terminator, and an analytic atmosphere: a shell whose shader integrates the view ray's path through the
 * air (outside: the thin blue limb; inside: a daylight sky), lit by the sun with a sunset tint at the terminator.
 * Textures: Solar System Scope (CC BY 4.0, from NASA data) — see tools/blender/12_worlds/beyond/SOURCES.md.
 */
export type PlanetOpts = { center: THREE.Vector3; radius: number; sunDir: THREE.Vector3; day: THREE.Texture; data: THREE.Texture };

const NOISE = /* glsl */ `
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn3(p); p = p * 2.07 + 11.3; a *= 0.5; } return s; }
`;

const ATMOS = /* glsl */ `
uniform vec3 uCenter; uniform float uR; uniform float uRa; uniform vec3 uSun; uniform float uSunI; uniform float uAtmoI;
// segment of the ray (o, d) inside a sphere (c, r): returns (t0, t1), t0 > t1 when it misses
vec2 sphereHit(vec3 o, vec3 d, vec3 c, float r) {
  vec3 oc = o - c; float b = dot(oc, d); float cc = dot(oc, oc) - r * r; float h = b * b - cc;
  if (h < 0.0) return vec2(1.0, -1.0);
  h = sqrt(h); return vec2(-b - h, -b + h);
}
// in-scattered light along o + d*[ta, tb] (a cheap 6-step march with exponential density)
vec3 scatter(vec3 o, vec3 d, float ta, float tb) {
  float H = (uRa - uR) * 0.28;
  vec3 beta = vec3(0.30, 0.62, 1.45) * (1.0 / (uRa - uR));
  vec3 sum = vec3(0.0); vec3 od = vec3(0.0);
  float dt = (tb - ta) / 6.0;
  for (int i = 0; i < 6; i++) {
    vec3 p = o + d * (ta + dt * (float(i) + 0.5));
    vec3 n = p - uCenter; float r = length(n); n /= r;
    float dens = exp(-max(r - uR, 0.0) / H);
    od += beta * dens * dt;
    float mu = dot(n, uSun);
    float lit = smoothstep(-0.22, 0.25, mu);
    // sunset: the light that reaches the terminator has lost its blue
    vec3 sunCol = mix(vec3(1.0, 0.42, 0.16), vec3(1.0), smoothstep(-0.05, 0.35, mu));
    sum += sunCol * lit * dens * dt * exp(-od * 0.6);
  }
  float cosT = dot(d, uSun);
  float phase = 0.75 * (1.0 + cosT * cosT) + 0.5 * pow(max(cosT, 0.0), 16.0);
  return sum * beta * phase * uSunI * uAtmoI;
}
`;

export class Planet {
  readonly group = new THREE.Group();
  readonly surface: THREE.Mesh;
  readonly atmosphere: THREE.Mesh;
  private uniforms: Record<string, THREE.IUniform>;
  private atmoU: Record<string, THREE.IUniform>;

  constructor(private o: PlanetOpts) {
    const R = o.radius;
    const Ra = R * 1.035;
    this.uniforms = {
      uDay: { value: o.day },
      uData: { value: o.data },
      uCenter: { value: o.center.clone() },
      uR: { value: R },
      uRa: { value: Ra },
      uSun: { value: o.sunDir.clone().normalize() },
      uSunI: { value: 2.1 },
      uAtmoI: { value: 0.32 },
      uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vW; varying vec2 vUv; varying vec3 vN;
        void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDay; uniform sampler2D uData; uniform float uTime;
        ${ATMOS}
        ${NOISE}
        varying vec3 vW; varying vec2 vUv; varying vec3 vN;
        void main() {
          vec3 N = normalize(vW - uCenter);
          vec3 V = normalize(cameraPosition - vW);
          float camDist = length(cameraPosition - vW);
          float NdL = dot(N, uSun);
          vec3 day = texture2D(uDay, vUv).rgb;
          vec4 dat = texture2D(uData, vUv);
          float cl = texture2D(uData, vUv + vec2(uTime * 0.00025, 0.0)).g;
          // close range: break the cloud texels into billows (the opening shot skims the cloud tops)
          float near = 1.0 - smoothstep(60.0, 900.0, camDist);
          if (near > 0.0) {
            float n = fbm3(vW * 0.09 + vec3(uTime * 0.02, 0.0, uTime * 0.01));
            float n2 = fbm3(vW * 0.6);
            cl = clamp(mix(cl, smoothstep(0.32, 0.72, cl * 0.6 + n * 0.7 + (n2 - 0.5) * 0.25), near), 0.0, 1.0);
          }
          float ocean = dat.b;
          float lit = smoothstep(-0.08, 0.22, NdL);
          // ground: Lambert with a soft terminator, deepened oceans, a sun glint on water
          vec3 ground = day * 0.85 * max(NdL, 0.0) * uSunI * mix(1.0, 0.75, ocean);
          vec3 H = normalize(uSun + V);
          ground += ocean * pow(max(dot(N, H), 0.0), 160.0) * uSunI * 0.45 * vec3(1.0, 0.86, 0.66) * lit;
          // clouds: bright, lit, with a self-shadowed underside toward the terminator
          // billows: close up, the cloud tops get relief from the same noise (lit tops, shaded troughs)
          float relief = near > 0.0 ? mix(1.0, 0.62 + 0.55 * fbm3(vW * 0.22 + 3.1), near) : 1.0;
          vec3 cloud = vec3(0.93, 0.93, 0.92) * (0.012 + 0.988 * max(NdL, 0.0)) * uSunI * 0.62 * relief;
          vec3 col = mix(ground, cloud, cl * 0.92);
          // twilight band
          float tw = exp(-pow((NdL + 0.01) / 0.06, 2.0));
          col += vec3(1.0, 0.5, 0.22) * tw * 0.1 * (0.3 + 0.7 * cl);
          // city lights on the night side, warm, dimmed under cloud
          float night = 1.0 - smoothstep(-0.18, 0.06, NdL);
          float cities = pow(max(dat.r - 0.07, 0.0) / 0.93, 1.5);
          col += vec3(1.0, 0.7, 0.38) * cities * night * (1.0 - cl * 0.8) * 9.0;
          // the air between the eye and the ground
          vec2 ha = sphereHit(cameraPosition, -V, uCenter, uRa);
          float ta = max(ha.x, 0.0);
          float tb = camDist;
          if (tb > ta) {
            vec3 s = scatter(cameraPosition, -V, ta, tb);
            col = col * exp(-(tb - ta) / (uRa - uR) * vec3(0.02, 0.04, 0.08)) + s * 0.55;
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.surface = new THREE.Mesh(new THREE.SphereGeometry(R, 192, 96), mat);
    this.surface.position.copy(o.center);
    // the texture's prime meridian faces away from the station; turn it so a lit continent faces the camera
    this.surface.rotation.y = 2.75;
    this.surface.name = "planet";
    this.surface.frustumCulled = false;

    this.atmoU = {
      uCenter: this.uniforms.uCenter,
      uR: this.uniforms.uR,
      uRa: this.uniforms.uRa,
      uSun: this.uniforms.uSun,
      uSunI: this.uniforms.uSunI,
      uAtmoI: this.uniforms.uAtmoI,
    };
    const atmo = new THREE.ShaderMaterial({
      uniforms: this.atmoU,
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false,
      transparent: false, // stays in the opaque list, drawn first (renderOrder), so later opaque objects cover it
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        ${ATMOS}
        varying vec3 vW;
        void main() {
          vec3 d = normalize(vW - cameraPosition);
          vec2 ha = sphereHit(cameraPosition, d, uCenter, uRa);
          if (ha.y <= 0.0) discard;
          vec2 hp = sphereHit(cameraPosition, d, uCenter, uR);
          if (hp.y > 0.0 && hp.x > 0.0) discard; // the planet's own shader draws the air over the ground
          float ta = max(ha.x, 0.0);
          float tb = ha.y;
          vec3 s = scatter(cameraPosition, d, ta, tb);
          gl_FragColor = vec4(s, 1.0);
        }`,
    });
    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(Ra, 96, 48), atmo);
    this.atmosphere.position.copy(o.center);
    this.atmosphere.renderOrder = -20;
    this.atmosphere.frustumCulled = false;
    this.group.add(this.atmosphere, this.surface);
  }

  update(time: number) {
    this.uniforms.uTime.value = time;
  }

  dispose() {
    this.surface.geometry.dispose();
    (this.surface.material as THREE.Material).dispose();
    this.atmosphere.geometry.dispose();
    (this.atmosphere.material as THREE.Material).dispose();
  }
}

/**
 * The orbital rings: flat bands in the planet's ring plane made of segmented gold-metal panels with lit edges, plus thin light
 * lines; the planet's shadow falls across them (analytic). Small lights travel along them (orbital traffic).
 */
export class PlanetRings {
  readonly group = new THREE.Group();
  private mats: THREE.ShaderMaterial[] = [];
  private traffic: THREE.Points;
  private trafficU: Record<string, THREE.IUniform>;

  constructor(center: THREE.Vector3, R: number, normal: THREE.Vector3, sunDir: THREE.Vector3, density = 1) {
    this.group.position.copy(center);
    this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.clone().normalize());
    const bands: [number, number, number, number][] = [
      // inner, outer, segments, brightness
      [1.5, 1.565, 900, 1.0],
      [1.6, 1.618, 1400, 0.7],
      [1.74, 1.79, 1100, 0.9],
      [2.02, 2.19, 1600, 0.75],
      [2.24, 2.252, 2200, 1.1],
    ];
    for (const [a, b, segs, k] of bands) {
      const g = new THREE.RingGeometry(R * a, R * b, 720, 1);
      g.rotateX(-Math.PI / 2);
      const m = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uIn: { value: R * a }, uOut: { value: R * b }, uSegs: { value: segs }, uK: { value: k },
          uSun: { value: sunDir.clone().normalize() }, uCenter: { value: center.clone() }, uR: { value: R }, uTime: { value: 0 },
          uNormal: { value: normal.clone().normalize() },
        },
        vertexShader: /* glsl */ `varying vec3 vW; varying vec3 vL; void main() { vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uIn; uniform float uOut; uniform float uSegs; uniform float uK; uniform vec3 uSun; uniform vec3 uCenter; uniform float uR; uniform float uTime; uniform vec3 uNormal;
          varying vec3 vW; varying vec3 vL;
          float h11(float x) { return fract(sin(x * 91.17) * 43758.55); }
          void main() {
            float r = length(vL.xz);
            float w = (r - uIn) / (uOut - uIn);
            float ang = atan(vL.z, vL.x) / 6.2831853 + 0.5;
            float s = ang * uSegs;
            float id = floor(s);
            float f = fract(s);
            // panels with gaps, an open lattice; the pattern averages out where it gets finer than a pixel (no moire)
            float fw = fwidth(s);
            float gapSharp = smoothstep(0.0, 0.08, f) * smoothstep(1.0, 0.92, f) * step(0.22, h11(id));
            float gap = mix(gapSharp, 0.62, smoothstep(0.25, 0.9, fw));
            float ew = max(0.03, fwidth(w) * 1.5);
            float edge = exp(-pow(w / ew, 2.0)) + exp(-pow((1.0 - w) / ew, 2.0));
            // planet shadow: does the ray toward the sun hit the planet?
            vec3 oc = vW - uCenter; float b = dot(oc, uSun); float c = dot(oc, oc) - uR * uR; float hh = b * b - c;
            float shadow = (hh > 0.0 && -b - sqrt(hh) > 0.0) ? 0.0 : 1.0;
            float ndl = abs(dot(uNormal, uSun));
            vec3 metal = vec3(0.5, 0.38, 0.24) * (0.22 + 0.7 * ndl) * (0.25 + 0.75 * shadow) * (0.6 + 0.4 * h11(id + 7.0));
            // gold light along the edges, with slow travelling pulses
            float pulse = 0.5 + 0.5 * sin(ang * 6.2831853 * 14.0 - uTime * 0.6 + w * 3.0);
            vec3 light = vec3(1.0, 0.7, 0.36) * edge * (0.55 + 0.75 * pulse) * uK;
            vec3 col = metal * gap + light;
            float a = clamp(gap * 0.22 + edge, 0.0, 1.0);
            gl_FragColor = vec4(col, a);
          }`,
      });
      this.mats.push(m);
      const mesh = new THREE.Mesh(g, m);
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      this.group.add(mesh);
    }
    // traffic: points circling on the rings
    const n = Math.round(420 * density);
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n * 2);
    const radii = [1.53, 1.61, 1.765, 2.1, 2.246];
    for (let i = 0; i < n; i++) {
      const r = R * radii[i % radii.length] * (1 + (Math.random() - 0.5) * 0.006);
      pos[i * 3] = r;
      rnd[i * 2] = Math.random() * Math.PI * 2;
      rnd[i * 2 + 1] = (0.004 + Math.random() * 0.01) * (i % 2 ? 1 : -1);
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    tg.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 2));
    this.trafficU = { uTime: { value: 0 }, uPx: { value: 1 } };
    this.traffic = new THREE.Points(
      tg,
      new THREE.ShaderMaterial({
        uniforms: this.trafficU,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `uniform float uTime; uniform float uPx; attribute vec2 aRnd; varying float vB;
          void main() { float a = aRnd.x + uTime * aRnd.y; float r = position.x; vec3 p = vec3(cos(a) * r, 0.0, sin(a) * r);
            vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(9000.0 / -mv.z, 1.5, 5.0) * uPx; vB = 0.6 + 0.4 * sin(uTime * 2.0 + aRnd.x * 30.0); }`,
        fragmentShader: /* glsl */ `varying float vB; void main() { vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 18.0); gl_FragColor = vec4(vec3(1.0, 0.78, 0.45) * 3.0 * vB, a); }`,
      }),
    );
    this.traffic.frustumCulled = false;
    this.group.add(this.traffic);
  }

  update(time: number, px: number) {
    for (const m of this.mats) m.uniforms.uTime.value = time;
    this.trafficU.uTime.value = time;
    this.trafficU.uPx.value = px;
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose?.();
    });
  }
}
