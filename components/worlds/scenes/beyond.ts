import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { CameraPath, key, orbit, type CameraKey, type V3 } from "../core/camera";
import { disposeTree } from "../core/assets";
import { Motes, Sun } from "../core/kit";
import type { QualitySettings } from "../core/quality";
import type { Grade, ShotPose, World, WorldContext } from "../core/types";
import { Planet, PlanetRings } from "./beyond/planet";
import { arcClearance, buildStation, makeMaterials, type LightUniforms } from "./beyond/station";

/**
 * WORLD 04 — BEYOND, the future world.
 * The camera comes out of Legacy's cloud just above a planet's cloud tops, rises out of the atmosphere, turns back to see the
 * whole planet and its gold orbital rings, flies to a small observation station, threads its gyroscope arcs, circles the
 * platform and settles on the black Marwari standing at its edge, looking at the planet.
 *
 * Scale: metres near the station; the planet (radius 1500) sits 11.5 km away, so it keeps real parallax when the camera moves.
 * Assets: public/worlds/beyond (Blender scripts and sources in tools/blender/12_worlds/beyond).
 */
const BASE = "/worlds/beyond";
const UP = new THREE.Vector3(0, 1, 0);
const PLANET_DIR = new THREE.Vector3(-0.35, 0.18, -1).normalize();
const PLANET_DIST = 11500;
const R = 1500;
const C = PLANET_DIR.clone().multiplyScalar(PLANET_DIST);
const SUN = new THREE.Vector3(-0.75, 0.4, 0.75).normalize();
/** the key light on the station: the same sun, lifted higher so its glint on the polished floor stays out of the hero frames */
const KEY = new THREE.Vector3(-0.6, 0.95, -0.25).normalize();
const RING_NORMAL = new THREE.Vector3(0.22, 1, 0.5).normalize();
/** where the horse stands and which way it faces (toward the planet) */
const HORSE = new THREE.Vector3(0.9, 0, 1.4);
const HEADING = Math.atan2(PLANET_DIR.x, PLANET_DIR.z);

const v3 = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
/** The floor's reflection: a soft (blurred) image, faded toward the rim of the disc, added over the polished floor. */
const MIRROR_SHADER = {
  name: "BeyondFloorMirror",
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null } },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vL;
    void main() { vUv = textureMatrix * vec4(position, 1.0); vL = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color; uniform sampler2D tDiffuse; varying vec4 vUv; varying vec2 vL;
    void main() {
      vec2 uv = vUv.xy / vUv.w;
      vec2 px = vec2(0.0025, 0.004);
      vec3 b = texture2D(tDiffuse, uv).rgb * 0.36;
      b += texture2D(tDiffuse, uv + vec2(px.x, px.y)).rgb * 0.16;
      b += texture2D(tDiffuse, uv + vec2(-px.x, px.y)).rgb * 0.16;
      b += texture2D(tDiffuse, uv + vec2(px.x, -px.y)).rgb * 0.16;
      b += texture2D(tDiffuse, uv + vec2(-px.x, -px.y)).rgb * 0.16;
      float fade = 1.0 - smoothstep(3.5, 8.6, length(vL));
      gl_FragColor = vec4(b * color * fade, 1.0);
    }`,
};
/** objects on this layer appear in the polished floor's reflection (every tier) */
const REFLECT_LAYER = 2;

/**
 * The roll that keeps a horizon level when "up" is not world +Y (near the planet, up is the local surface normal).
 * applyPose builds camera.up from the roll in the XY plane; this finds the roll whose up projects onto `up` across the view.
 */
function levelRoll(pos: THREE.Vector3, look: THREE.Vector3, up: THREE.Vector3) {
  // search the roll whose camera Y axis comes closest to `up` (applyPose: camera.up = (sin roll, cos roll, 0), then lookAt)
  const m = new THREE.Matrix4();
  const y = new THREE.Vector3();
  let best = 0;
  let bestDot = -Infinity;
  for (let i = 0; i < 720; i++) {
    const r = (i / 720) * Math.PI * 2;
    m.lookAt(pos, look, new THREE.Vector3(Math.sin(r), Math.cos(r), 0));
    y.setFromMatrixColumn(m, 1);
    const d = y.dot(up);
    if (d > bestDot) { bestDot = d; best = r; }
  }
  return best > Math.PI ? best - Math.PI * 2 : best;
}

function buildPath(): CameraPath {
  const uo = PLANET_DIR.clone().negate(); // planet -> station
  // the opening is over the planet's sunlit north, where the surface normal is close to world up, so the horizon stays level
  // (and the roll eases to zero without a swing) as the camera rises and turns toward the station
  const nA = UP.clone().add(uo.clone().multiplyScalar(0.25)).add(SUN.clone().multiplyScalar(0.3)).normalize();
  const tA = uo.clone().sub(nA.clone().multiplyScalar(uo.dot(nA))).normalize();
  const side = new THREE.Vector3().crossVectors(uo, UP).normalize();
  const at = (n: number, t: number, s = 0, u = 0) => C.clone().add(nA.clone().multiplyScalar(R + n)).add(tA.clone().multiplyScalar(t)).add(side.clone().multiplyScalar(s)).add(UP.clone().multiplyScalar(u));
  // horse frame: f toward the planet, r to its right
  const f = new THREE.Vector3(Math.sin(HEADING), 0, Math.cos(HEADING));
  const r = new THREE.Vector3().crossVectors(f, UP).normalize();
  const H = HORSE;
  const hp = (back: number, right: number, up: number) => H.clone().addScaledVector(f, -back).addScaledVector(r, right).addScaledVector(UP, up);

  const keys: CameraKey[] = [
    // A: just above the cloud tops, looking along the horizon; then rising, pitching up, the clouds falling away
    key("cloudtops", 0.0, v3(at(6, 0)), v3(at(-22, 420)), 46, { roll: levelRoll(at(6, 0), at(-22, 420), nA) }),
    key("rising", 0.11, v3(at(70, 120)), v3(at(-110, 700)), 47, { roll: levelRoll(at(70, 120), at(-110, 700), nA) }),
    key("above", 0.2, v3(at(650, 450)), v3(at(-520, 2000, 200)), 48, { roll: levelRoll(at(650, 450), at(-520, 2000, 200), nA) }),
    // B: the whole planet and its rings
    key("planet", 0.3, v3(C.clone().addScaledVector(uo, R + 5600).addScaledVector(side, 1900).addScaledVector(UP, 1300)), v3(C.clone().addScaledVector(side, 420)), 40),
    key("rings", 0.39, [300, 110, 560], v3(C.clone().multiplyScalar(0.04)), 34),
    // C: in through the gyroscope arcs
    key("approach", 0.47, [110, 34, 170], [4, 4, -4], 38),
    key("through", 0.54, [38, 10, 52], [0, 2, 0], 40),
    // D: round the platform (a strong frame of horse and planet near local 0.65, the global hold at 0.9)
    ...orbit("orbit", 0.6, 0.8, { center: [H.x, 1.3, H.z], radius: [17, 10], from: 0.62, to: -0.1, height: [2.4, 1.9], look: v3(H.clone().addScaledVector(f, 9).addScaledVector(r, -4).setY(3.2)) }, [36, 34], 5),
    // E: the horse, the hero (rear three-quarter from its left, the planet ahead of it)
    key("hero", 0.88, v3(hp(5.6, -2.7, 1.55)), v3(hp(-4, 0.4, 1.75)), 36),
    // F: the brand composition: planet top centre, horse centre-right, calm lower centre for the call to action
    key("final", 1.0, v3(hp(7.6, -3.0, 1.4)), v3(hp(-40, 4.6, 0.6)), 37),
  ];
  return new CameraPath(keys);
}

const GRADE: Grade = {
  exposure: 1.05,
  bloom: [0.55, 0.45, 0.95],
  lift: new THREE.Color(0.88, 0.94, 1.12),
  gain: new THREE.Color(1.06, 1.0, 0.9),
  saturation: 0.9,
  vignette: 0.5,
  grain: 0.035,
};

/** Image-based light for reflections: deep space, a blue lobe from the planet, gold from the platform below, a hot sun. */
function makeEnv(renderer: THREE.WebGLRenderer) {
  const s = new THREE.Scene();
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uPlanet: { value: PLANET_DIR }, uSun: { value: SUN } },
    vertexShader: /* glsl */ `varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform vec3 uPlanet; uniform vec3 uSun; varying vec3 vD;
      void main() { vec3 d = normalize(vD);
        vec3 c = vec3(0.004, 0.006, 0.012);
        c += vec3(0.16, 0.26, 0.48) * pow(max(dot(d, uPlanet), 0.0), 24.0) * 1.1;
        c += vec3(1.0, 0.62, 0.28) * smoothstep(-0.05, -0.6, d.y) * 0.55;
        c += vec3(1.0, 0.72, 0.4) * exp(-pow((d.y + 0.02) / 0.05, 2.0)) * 0.12;
        c += vec3(1.0, 0.92, 0.8) * pow(max(dot(d, uSun), 0.0), 120.0) * 6.0;
        gl_FragColor = vec4(c, 1.0); }`,
  });
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), m));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0, 0.1, 100);
  pm.dispose();
  m.dispose();
  return rt;
}

export function createBeyond(): World {
  const scene = new THREE.Scene();
  scene.name = "beyond";
  const path = buildPath();
  const lightU: LightUniforms = { uTime: { value: 0 }, uGain: { value: 1 } };
  let envRT: THREE.WebGLRenderTarget | null = null;
  let planet: Planet | null = null;
  let rings: PlanetRings | null = null;
  let motes: Motes | null = null;
  let sun: Sun | null = null;
  let arcGroup: THREE.Object3D | null = null;
  const owned: THREE.Texture[] = [];
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const moons: THREE.Mesh[] = [];
  let galaxy: THREE.Mesh | null = null;
  let renderer: THREE.WebGLRenderer;
  let q: QualitySettings;
  let horseCtx: WorldContext | null = null;
  let mirror: Reflector | null = null;
  const reflectHorse = (on: boolean) => horseCtx?.horse.group.traverse((o) => (on ? o.layers.enable(REFLECT_LAYER) : o.layers.disable(REFLECT_LAYER)));

  const world: World = {
    id: "beyond",
    scene,
    grade: GRADE,
    usesHorse: true,

    async load(ctx: WorldContext) {
      renderer = ctx.renderer;
      q = ctx.quality;
      const tier = q.textures;
      const [stars, day, data, moonTex, galTex, platform, arcs] = await Promise.all([
        ctx.assets.texture(`${BASE}/stars-${tier}.webp`, { srgb: true }),
        ctx.assets.texture(`${BASE}/earth-day-${tier}.webp`, { srgb: true, anisotropy: 8 }),
        ctx.assets.texture(`${BASE}/earth-data-${tier}.webp`, { anisotropy: 8 }),
        ctx.assets.texture(`${BASE}/moon.webp`, { srgb: true }),
        ctx.assets.texture(`${BASE}/galaxy.webp`, { srgb: true }),
        ctx.assets.glb(`${BASE}/beyond-platform.glb`),
        ctx.assets.glb(`${BASE}/beyond-arcs.glb`),
      ]);
      owned.push(stars, day, data, moonTex, galTex);
      stars.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = stars;
      scene.backgroundIntensity = 0.9;
      // the panorama's poles (where an equirect pinches) turned to the sides, where no shot looks
      scene.backgroundRotation.set(0, 0, Math.PI / 2);
      envRT = makeEnv(renderer);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 1;

      planet = new Planet({ center: C, radius: R, sunDir: SUN, day, data });
      scene.add(planet.group);
      rings = new PlanetRings(C, R, RING_NORMAL, SUN, q.density);
      scene.add(rings.group);

      // moons: lit by the same sun, far enough to sit still against the stars
      const moonMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1, metalness: 0, envMapIntensity: 0 });
      for (const [pos, rad] of [
        [new THREE.Vector3(-7600, 2300, -6400), 300],
        [new THREE.Vector3(5200, 1500, -8200), 120],
      ] as [THREE.Vector3, number][]) {
        const mm = new THREE.Mesh(new THREE.SphereGeometry(rad, 48, 24), moonMat);
        mm.position.copy(pos);
        mm.frustumCulled = false;
        moons.push(mm);
        scene.add(mm);
      }

      // the galaxy, a sprite far away, upper right of the hero frame
      const gdir = new THREE.Vector3(0.13, 0.25, -0.99).normalize();
      galaxy = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: galTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.5, 1.4, 1.3), fog: false }),
      );
      galaxy.position.copy(gdir.multiplyScalar(16000));
      galaxy.lookAt(0, 0, 0);
      galaxy.rotateZ(0.65);
      galaxy.scale.set(3600, 1900, 1);
      galaxy.renderOrder = -5;
      galaxy.frustumCulled = false;
      scene.add(galaxy);

      // the station
      const mats = makeMaterials(lightU, envRT.texture);
      const st = buildStation(platform, arcs, mats);
      arcGroup = st.arcGroup;
      scene.add(st.group);

      // light: the sun (key/rim from behind-left), a cool planet fill, warm platform glow, a little ambient
      sun = new Sun(scene, KEY, "#fff0dc", 2.0, 9);
      sun.setShadowSize(q.shadowSize, q.shadows);
      sun.follow(HORSE);
      // the planet's cool fill comes from the planet's side but high, so its glint on the floor falls outside every frame
      const fill = new THREE.DirectionalLight("#86a6dc", 0.45);
      fill.position.set(PLANET_DIR.x, 0, PLANET_DIR.z).normalize().setY(1.6).multiplyScalar(100);
      scene.add(fill);
      for (const a of [0.3, 2.4, 4.4]) {
        const pl = new THREE.PointLight("#ffb062", 2.2, 10, 2);
        pl.position.set(HORSE.x + Math.cos(a) * 3.0, 1.1, HORSE.z + Math.sin(a) * 3.0);
        scene.add(pl);
      }
      scene.add(new THREE.HemisphereLight("#33415e", "#4a3018", 0.35));

      // the polished floor: a planar reflection of the horse, the planet, its rings and the arcs, added over the floor (high tier)
      mirror = new Reflector(new THREE.CircleGeometry(8.6, 96), {
        textureWidth: Math.round(Math.min(1600, window.innerWidth * 0.6)),
        textureHeight: Math.round(Math.min(1000, window.innerHeight * 0.6)),
        color: new THREE.Color(0.3, 0.28, 0.26),
        clipBias: 0.002,
        multisample: 0,
        shader: MIRROR_SHADER,
      });
      const mm = mirror.material as THREE.ShaderMaterial;
      mm.transparent = true;
      mm.blending = THREE.AdditiveBlending;
      mm.depthWrite = false;
      mirror.rotation.x = -Math.PI / 2;
      mirror.position.y = 0.0015;
      const getCam = mirror.getReflectionCamera.bind(mirror);
      mirror.getReflectionCamera = (cam: THREE.Camera) => { const rc = getCam(cam); rc.layers.set(REFLECT_LAYER); return rc; };
      // the star field is not reflected (the floor would read as glass); only the lit things are
      const before = mirror.onBeforeRender.bind(mirror);
      const clear = new THREE.Color();
      mirror.onBeforeRender = (r, sc, cam, geo, mat, grp) => {
        // (the renderer is shared with the other worlds, which may leave their own clear colour on it)
        const bg = sc.background;
        r.getClearColor(clear);
        const ca = r.getClearAlpha();
        sc.background = null;
        r.setClearColor(0x000000, 1);
        before(r, sc, cam, geo, mat, grp);
        r.setClearColor(clear, ca);
        sc.background = bg;
      };
      // (the arcs, moons and galaxy are left out: they are rarely in the reflected view and would cost a second draw each)
      for (const o of [planet.group, rings.group]) o.traverse((x) => x.layers.enable(REFLECT_LAYER));
      mirror.visible = true;
      scene.add(mirror);

      motes = new Motes({ count: Math.round(700 * q.density), box: [44, 16, 44], center: { x: HORSE.x, y: 5, z: HORSE.z }, size: 0.035, color: "#ffcf8a", drift: [0.05, 0.03, -0.02], swirl: 0.6, additive: true, opacity: 0.55, seed: 41 });
      scene.add(motes.points);

      if (process.env.NODE_ENV !== "production") {
        // dev check: the lens never passes through an arc beam
        let worst = Infinity;
        let at = 0;
        const pose = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 35, roll: 0 };
        for (let i = 0; i <= 400; i++) {
          path.at(i / 400, pose);
          const d = arcClearance(pose.pos, st.arcGroup);
          if (d < worst) { worst = d; at = i / 400; }
        }
        (window as unknown as { __beyondClearance: unknown }).__beyondClearance = { worst, at };
        if (worst < 1.5) console.warn(`[beyond] camera passes ${worst.toFixed(2)} m from an arc at p=${at}`);
      }
    },

    enter(ctx) {
      ctx.horse.attach(scene, HORSE, HEADING, { ground: () => 0, contactStrength: 0.8 });
      ctx.horse.setGait(null);
      horseCtx = ctx;
      reflectHorse(true);
    },

    exit() {
      reflectHorse(false);
    },

    update(p: number, _dt: number, time: number, out: ShotPose, aspect: number) {
      path.at(p, out);
      // narrow (portrait) screens: on the platform shots, turn the lens toward the horse so it stays in frame, and tip it
      // down a little so the horse sits above the call to action
      if (aspect < 1.2) {
        const k = THREE.MathUtils.smoothstep(p, 0.56, 0.95) * THREE.MathUtils.clamp((1.2 - aspect) / 0.7, 0, 1);
        if (k > 0) {
          // and come a little closer, so the horse is not lost on a phone
          const dolly = 0.38 * k * THREE.MathUtils.smoothstep(p, 0.78, 1);
          const lookOff = tmpA.subVectors(out.look, out.pos);
          tmpB.set(HORSE.x, 1.4, HORSE.z);
          out.pos.lerp(tmpB, dolly);
          out.look.copy(out.pos).add(lookOff);
          const len = tmpA.subVectors(out.look, out.pos).length();
          tmpA.normalize();
          tmpB.set(HORSE.x, 1.2, HORSE.z).sub(out.pos).normalize();
          tmpA.lerp(tmpB, 0.62 * k).normalize();
          tmpA.y -= 0.1 * k * THREE.MathUtils.smoothstep(p, 0.85, 1);
          out.look.copy(out.pos).addScaledVector(tmpA.normalize(), len);
        }
      }
      planet?.update(time);
      rings?.update(time, renderer.getPixelRatio());
      motes?.update(time, renderer.getPixelRatio());
      lightU.uTime.value = time;
      // a slight turn of the head toward the planet, the nose lifting a little as the camera settles
      horseCtx?.horse.look(0.14, -0.06 - 0.06 * Math.max(0, (p - 0.8) / 0.2));
    },

    setQuality(nq) {
      q = nq;
      sun?.setShadowSize(q.shadowSize, q.shadows);
      if (mirror) mirror.visible = true;
    },

    dispose() {
      reflectHorse(false);
      if (mirror) { mirror.geometry.dispose(); mirror.dispose(); }
      planet?.dispose();
      rings?.dispose();
      motes?.dispose();
      for (const m of moons) m.geometry.dispose();
      (moons[0]?.material as THREE.Material | undefined)?.dispose();
      if (galaxy) { galaxy.geometry.dispose(); (galaxy.material as THREE.Material).dispose(); }
      if (arcGroup) disposeTree(arcGroup.parent ?? arcGroup);
      for (const t of owned) t.dispose();
      envRT?.dispose();
      scene.clear();
    },
  };
  return world;
}
