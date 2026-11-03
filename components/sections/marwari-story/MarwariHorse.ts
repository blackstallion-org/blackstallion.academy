/**
 * The Marwari of the cavalry story. It is the existing BSAH horse (components/3d/marwari.ts, HERO_MODEL), loaded once and
 * played with its own rigged clips: Idle_Breathing loops, Blink and Tail_Sway run beside it, Head_Turn and Ear_Rotate
 * are played now and then, and createGaze turns the neck and head toward the story's drive value. The camera orbits the
 * horse by `drive.yaw`, which the story scrubs from scroll.
 *
 * It is an imperative controller, not a React component, so one WebGL context survives the move between chapters: the
 * canvas element is re-parented with `moveTo` and keeps rendering. It is created only on the client, through a dynamic
 * import from MarwariStory, so three.js stays out of the first load. Reduced motion never reaches this module.
 */
import * as THREE from "three";
import {
  addLights,
  createGaze,
  createTimer,
  disposeObject,
  loadMarwari,
  releaseRenderer,
  type Marwari,
} from "@/components/3d/marwari";
import { createStudioEnv } from "@/components/3d/studio";
import { HERO_MODEL, HERO_MODEL_MOBILE } from "@/components/3d/marwari-paths";

/** Written by the story on every scroll update; read by the horse every frame. */
export type HorseDrive = {
  /** Camera orbit around the horse, radians. */
  yaw: number;
  /** Neck and head turn, radians (positive turns toward the horse's left). */
  head: number;
  /** Whole-horse opacity, 0 to 1. Zero stops rendering. */
  fade: number;
};

export type HorseHandle = {
  element: HTMLDivElement;
  moveTo: (parent: HTMLElement) => void;
  dispose: () => void;
};

/** The camera's base direction (the three-quarter side view used on the fleet page), rotated by drive.yaw. */
const VIEW = new THREE.Vector3(1, 0.07, 0.62).normalize();
const UP = new THREE.Vector3(0, 1, 0);

export function createMarwariHorse(opts: { mobile: boolean }, drive: HorseDrive): HorseHandle | null {
  const element = document.createElement("div");
  element.className = "ms-horse";
  element.setAttribute("aria-hidden", "true");

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  element.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  let env: THREE.WebGLRenderTarget | null = null;
  try {
    env = createStudioEnv(renderer);
    scene.environment = env.texture;
  } catch {
    /* lights only */
  }
  const rig = addLights(scene);
  const sun = rig.lights[0] as THREE.DirectionalLight;
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.1, far: 20 });
  sun.shadow.camera.updateProjectionMatrix();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ color: 0x1a120c, opacity: 0.4 }),
  );
  ground.receiveShadow = true;
  scene.add(ground);

  const timer = createTimer();
  const size = { height: 2.1, cx: 0, cz: 0 };
  const target = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let distance = 4;
  let horse: Marwari | null = null;
  let mixer: THREE.AnimationMixer | null = null;
  let gaze: ReturnType<typeof createGaze> | null = null;
  let raf = 0;
  let visible = false;
  let disposed = false;
  let nextHead = 8;
  let nextEar = 6;

  const once = (name: string, weight: number) => {
    const clip = horse?.clips.get(name);
    if (!clip || !mixer) return;
    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.setEffectiveWeight(weight);
    action.fadeIn(0.35).play();
  };

  /** Frames the standing horse: hoof line at y = 0, ear tips at the top, centred on its barrel. */
  const place = () => {
    const w = element.clientWidth;
    const h = Math.max(1, element.clientHeight);
    if (!w) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w / h < 0.9;
    const fill = narrow ? 0.6 : 0.7; // share of the frame's height the horse fills
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    distance = size.height / (fill * 2 * tan);
    target.set(size.cx, size.height * 0.5, size.cz);
    camera.updateProjectionMatrix();
  };

  const orbit = () => {
    dir.copy(VIEW).applyAxisAngle(UP, drive.yaw);
    camera.position.copy(target).addScaledVector(dir, distance);
    camera.lookAt(target);
  };

  const kick = () => {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  };

  const frame = () => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, timer.delta());
    if (drive.fade > 0.001) {
      if (mixer && gaze) {
        gaze.undo();
        mixer.update(dt);
        nextHead -= dt;
        if (nextHead <= 0) {
          once("Head_Turn", 0.7);
          nextHead = 9 + Math.random() * 6;
        }
        nextEar -= dt;
        if (nextEar <= 0) {
          once("Ear_Rotate", 0.7);
          nextEar = 7 + Math.random() * 6;
        }
        const t = timer.elapsed;
        gaze.apply(drive.head + Math.sin(t * 0.45) * 0.04, Math.sin(t * 0.31) * 0.02);
      }
      orbit();
      renderer.render(scene, camera);
    }
    element.style.opacity = String(Math.max(0, Math.min(1, drive.fade)));
    if (visible) raf = requestAnimationFrame(frame);
  };

  const { promise, dispose: disposeLoader } = loadMarwari(opts.mobile ? HERO_MODEL_MOBILE : HERO_MODEL);
  promise
    .then((m) => {
      if (disposed) {
        disposeObject(m.root);
        return;
      }
      horse = m;
      m.hair.sheen.value *= 0.5;
      m.root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true;
      });
      m.contacts.strength = 0.55;
      scene.add(m.root, m.contacts.group);
      mixer = new THREE.AnimationMixer(m.root);
      for (const name of ["Idle_Breathing", "Blink", "Tail_Sway"]) {
        const clip = m.clips.get(name);
        if (clip) mixer.clipAction(clip).play();
      }
      gaze = createGaze(m);
      mixer.update(0);
      m.root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(m.mesh);
      const tip = (b?: THREE.Object3D) => (b ? b.getWorldPosition(new THREE.Vector3()).y : 0);
      size.height = Math.max(box.max.y, tip(m.bones.Ear_Tip_L), tip(m.bones.Ear_Tip_R)) + 0.04;
      size.cx = (box.min.x + box.max.x) / 2;
      size.cz = (box.min.z + box.max.z) / 2;
      place();
      kick();
    })
    .catch(() => {
      /* the story stays readable without the horse */
    });

  const ro = new ResizeObserver(() => {
    place();
    kick();
  });
  ro.observe(element);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) kick();
  });
  io.observe(element);

  return {
    element,
    moveTo(parent) {
      if (element.parentElement !== parent) parent.appendChild(element);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      disposeLoader();
      if (horse) {
        scene.remove(horse.root, horse.contacts.group);
        disposeObject(horse.root);
      }
      scene.remove(ground);
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      env?.dispose();
      element.remove();
      releaseRenderer(renderer);
    },
  };
}
