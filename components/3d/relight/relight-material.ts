/**
 * The relighting material: a flat photograph that reacts to a point light like a 3D surface, with surface detail and
 * self-shadowing, driven by a depth map. Ported from "Relighting Images with Three.js" by Dominik Fojcik (Codrops,
 * MIT): `src/effect/{plane,light,textures}.js` and `src/effect/nodes/{diffuse,normal,shadow,texture-fit}.js`.
 *
 * The node graphs are the original's, line for line. What changed is the packaging: the original keeps its textures,
 * light and uniforms as module-level singletons and wires a lil-gui debug panel; here they live in one object per
 * instance (so two scenes can coexist and be disposed), the debug panel is gone, and the tuning values are passed in.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- the shader graph below is the original's. three's published
   TSL typings cannot follow the chained node expressions it relies on (texture().size(), .level(), Loop), so the
   nodes are typed `any` inside this file; the exported surface (`Relight`, `RelightTuning`) is fully typed. */
import * as THREE from "three/webgpu";
import {
  Fn,
  Loop,
  cameraFar,
  cameraNear,
  float,
  luminance,
  modelScale,
  positionView,
  positionWorld,
  screenSize,
  screenUV,
  step,
  texture,
  uniform,
  vec2,
  vec3,
  viewZToOrthographicDepth,
} from "three/tsl";
import { bakeDepth, createSmoothDepthTexture } from "./depth-field";

export type RelightTuning = {
  /** Depth smoothing radius as a percent of the working width. */
  depthSmoothing: number;
  displacementScale: number;
  normalScale: number;
  detailScale: number;
  shadowIntensity: number;
  shadowSoftness: number;
  lightColor: string;
  lightIntensity: number;
  /** Falloff: the original stores `decay = 4 − radius`. */
  lightDecay: number;
  /** Height of the light above the picture plane. */
  lightHeight: number;
  ambient: number;
};

/**
 * A warm stable lantern over a dark studio portrait. Tuned on the neural depth maps (scripts/make-depth.py), starting
 * from the original's "demo3" preset (the marble mother) with a warmer, lower light.
 */
export const LANTERN_TUNING: RelightTuning = {
  depthSmoothing: 0.5,
  displacementScale: 1.9,
  normalScale: 2.0,
  detailScale: 0.8,
  shadowIntensity: 0.8,
  shadowSoftness: 0.15,
  lightColor: "#ffcb8f",
  lightIntensity: 9,
  lightDecay: 2.6,
  lightHeight: 1.1,
  ambient: 0.04,
};

/**
 * White marble under a gallery spot: the original's "demo3" preset (surface and shadow values unchanged), with a
 * nearer, broader light so the stone reads white rather than candle-lit on a small stage.
 */
export const MARBLE_TUNING: RelightTuning = {
  depthSmoothing: 0.5,
  displacementScale: 1.9,
  normalScale: 2.16,
  detailScale: 0.7,
  shadowIntensity: 0.86,
  shadowSoftness: 0.152,
  lightColor: "#f2e8dc",
  lightIntensity: 8,
  lightDecay: 2.4,
  lightHeight: 1.5,
  ambient: 0.06,
};

const DETAIL_GAIN = 4;
const DETAIL_LOD = 3;
const DETAIL_STEP_TEXELS = 8;
const GRADIENT_TEXELS = 3;
const SHADOW_STEPS = 12;
const MIN_LIGHT_ANGLE = 0.15;
const SOFTNESS_GROWTH = 3;

type N = any;

export type Relight = {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
  ambient: THREE.AmbientLight;
  /** Fades the picture in and out (0–1), for swapping photographs. */
  fade: { value: number };
  /** Swaps the photograph and its depth map. */
  setImages(map: THREE.Texture, depth: THREE.Texture): void;
  /**
   * Per-frame step: sizes the plane to the view, eases the fade toward `fadeTarget` (returning the new fade) and eases
   * the light toward (x, y) in world units. Mutation lives here, behind a method, so React's purity rules see a call.
   */
  update(frame: { dt: number; halfWidth: number; viewHeight: number; fadeTarget: number; x: number; y: number; reduced: boolean }): number;
  dispose(): void;
};

export function createRelight(tuning: RelightTuning = LANTERN_TUNING): Relight {
  const mapNode: N = texture(new THREE.Texture());
  const depthNode: N = texture(new THREE.Texture());
  const smoothDepth = createSmoothDepthTexture();
  const smoothDepthNode: N = texture(smoothDepth);

  const uDisplacementScale = uniform(tuning.displacementScale);
  const uNormalScale = uniform(tuning.normalScale);
  const uDetailScale = uniform(tuning.detailScale);
  const uShadowIntensity = uniform(tuning.shadowIntensity);
  const uShadowSoftness = uniform(tuning.shadowSoftness);
  const uDepthThreshold = uniform(0);
  const uFade = uniform(0);

  const light = new THREE.PointLight(tuning.lightColor, tuning.lightIntensity, 0, tuning.lightDecay);
  light.position.set(1.2, 0.8, tuning.lightHeight);
  const ambient = new THREE.AmbientLight("#ffffff", tuning.ambient);
  const uLightPosition = uniform(light.position);

  // texture-fit.js
  const coverScaleNode: N = Fn(() => {
    const viewAspect = screenSize.x.div(screenSize.y).toVar();
    const mapSize = vec2(mapNode.size()).toVar();
    const imageAspect = mapSize.x.div(mapSize.y).toVar();
    return imageAspect.greaterThan(viewAspect).select(vec2(viewAspect.div(imageAspect), 1), vec2(1, imageAspect.div(viewAspect)));
  });
  const coverUv: N = Fn(() => screenUV.flipY().sub(0.5).mul(coverScaleNode()).add(0.5));

  // diffuse.js
  const diffuseNode: N = Fn(([vUv, depth]: [N, N]) => mapNode.sample(vUv).rgb.mul(step(uDepthThreshold, depth)).mul(uFade));

  // normal.js
  const depthGradient: N = Fn(([vUv, stepSize]: [N, N]) => {
    const alongX = vec2(stepSize.x, 0);
    const alongY = vec2(0, stepSize.y);
    const left = smoothDepthNode.sample(vUv.sub(alongX)).r;
    const right = smoothDepthNode.sample(vUv.add(alongX)).r;
    const bottom = smoothDepthNode.sample(vUv.sub(alongY)).r;
    const top = smoothDepthNode.sample(vUv.add(alongY)).r;
    return vec2(right.sub(left), top.sub(bottom)).mul(0.5);
  });
  const detailGradient: N = Fn(([vUv, stepSize]: [N, N]) => {
    const alongX = vec2(stepSize.x, 0);
    const alongY = vec2(0, stepSize.y);
    const sampleMap = (uvNode: N) => mapNode.sample(uvNode).level(DETAIL_LOD).rgb;
    const left = luminance(sampleMap(vUv.sub(alongX)));
    const right = luminance(sampleMap(vUv.add(alongX)));
    const bottom = luminance(sampleMap(vUv.sub(alongY)));
    const top = luminance(sampleMap(vUv.add(alongY)));
    return vec2(right.sub(left), top.sub(bottom)).mul(0.5);
  });
  const normalNode: N = Fn(([vUv]: [N]) => {
    const stepSize = vec2(GRADIENT_TEXELS).div(vec2(smoothDepthNode.size()));
    const slope = depthGradient(vUv, stepSize)
      .mul(coverScaleNode())
      .div(stepSize.mul(modelScale.xy))
      .mul(uDisplacementScale)
      .mul(uNormalScale);
    const detail = detailGradient(vUv, vec2(DETAIL_STEP_TEXELS).div(vec2(mapNode.size()))).mul(uDetailScale).mul(DETAIL_GAIN);
    const shape = vec3(slope.x.negate(), slope.y.negate(), float(1));
    return shape.add(vec3(detail.x.negate(), detail.y.negate(), 0)).normalize();
  });

  // shadow.js
  const shadowNode: N = Fn(([vUv, depth]: [N, N]) => {
    const surfacePosition = vec3(positionWorld.xy, depth.sub(1).mul(uDisplacementScale));
    const surfaceToLight = uLightPosition.sub(surfacePosition);
    const lightDirection = surfaceToLight.div(surfaceToLight.length().max(0.001));
    const surfaceDepth = smoothDepthNode.sample(vUv).r;
    const remainingDepth = surfaceDepth.oneMinus();
    const rayOffset = lightDirection.xy
      .div(lightDirection.z.max(MIN_LIGHT_ANGLE))
      .mul(uDisplacementScale)
      .mul(coverScaleNode())
      .div(modelScale.xy)
      .mul(remainingDepth);
    const maxOcclusion = float(0).toVar();
    Loop(SHADOW_STEPS, ({ i }: N) => {
      const rayProgress = float(i).add(1).div(SHADOW_STEPS);
      const rayDepth = surfaceDepth.add(remainingDepth.mul(rayProgress));
      const blockerDepth = smoothDepthNode.sample(vUv.add(rayOffset.mul(rayProgress))).r;
      const sampleSoftness = uShadowSoftness.mul(rayProgress.mul(SOFTNESS_GROWTH).add(1));
      const sampleOcclusion = blockerDepth.sub(rayDepth).div(sampleSoftness).clamp(0, 1);
      maxOcclusion.assign(maxOcclusion.max(sampleOcclusion));
    });
    const lightFacingMask = lightDirection.z.greaterThan(0).select(1, 0);
    return maxOcclusion.mul(uShadowIntensity).mul(lightFacingMask).oneMinus();
  });

  // plane.js
  const vUv: N = coverUv();
  const depth: N = depthNode.sample(vUv).r;
  const material = new THREE.MeshPhongNodeMaterial({ specular: 0x000000 });
  material.colorNode = diffuseNode(vUv, depth);
  material.normalNode = normalNode(vUv);
  material.aoNode = shadowNode(vUv, depth);
  material.depthNode = viewZToOrthographicDepth(positionView.z.add(depth.sub(1).mul(uDisplacementScale)), cameraNear, cameraFar);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  let depthImage: (CanvasImageSource & { width: number; height: number }) | null = null;

  return {
    mesh,
    light,
    ambient,
    fade: uFade,
    update({ dt, halfWidth, viewHeight, fadeTarget, x, y, reduced }) {
      mesh.scale.set(halfWidth * 2, viewHeight, 1);
      uFade.value = THREE.MathUtils.damp(uFade.value, fadeTarget, reduced ? 40 : 7, dt);
      light.position.x = THREE.MathUtils.damp(light.position.x, x, reduced ? 40 : 8, dt);
      light.position.y = THREE.MathUtils.damp(light.position.y, y, reduced ? 40 : 8, dt);
      return uFade.value;
    },
    setImages(map, depthTexture) {
      map.colorSpace = THREE.SRGBColorSpace;
      const previousMap = mapNode.value;
      const previousDepth = depthNode.value;
      mapNode.value = map;
      depthNode.value = depthTexture;
      previousMap.dispose();
      previousDepth.dispose();
      depthImage = depthTexture.image as CanvasImageSource & { width: number; height: number };
      bakeDepth(smoothDepth, depthImage, tuning.depthSmoothing);
    },
    dispose() {
      mapNode.value.dispose();
      depthNode.value.dispose();
      smoothDepth.dispose();
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
