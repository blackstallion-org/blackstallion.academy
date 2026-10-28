import * as THREE from "three/webgpu";
import type { Node, UniformNode } from "three/webgpu";
import {
  Fn,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
  float,
  mod,
  floor,
  abs,
  pow,
  sin,
  clamp,
  mix,
  smoothstep,
  dot,
  select,
  length,
  fract,
  normalWorld,
  positionWorld,
  positionLocal,
  positionView,
  cameraPosition,
  materialColor,
  materialRoughness,
  materialMetalness,
} from "three/tsl";
import { DEFAULT_LOOK, type CloakLook } from "./cloak-look";

/**
 * A node (TSL) material that morphs per pixel from the original opaque surface into transmissive glass.
 *
 * This is the "Predator cloak" material from the React Three Fiber demo, ported without changing its graph:
 * a procedural dissolve mask (a UV grid whose diamond cells grow with progress, or rings that spread from a point in
 * object, world or view space) decides for each fragment whether the surface shows the original PBR response or the
 * cell colour with a metallic shimmer; transmission, a fresnel rim and the mask all follow one `uProgress` value.
 * Differences from the demo, all on the outside of the graph: it takes the source material from the GLB rather than
 * from three named parts, the look comes from `cloak-look.ts`, and smoothing is done here (no extra dependency).
 */
type Uniform<T> = UniformNode<"float", T>;

type MaskInputs = {
  uProgress: Uniform<number>;
  uTime: Uniform<number>;
  uGridWidth: Uniform<number>;
  uGridHeight: Uniform<number>;
  uProjection: Uniform<number>;
  uUvScale: Uniform<number>;
  uFadePower: Uniform<number>;
  uSizeMax: Uniform<number>;
  uCellOffset: Uniform<number>;
  uRingDensity: Uniform<number>;
  uRingWidth: Uniform<number>;
  uRingSpeed: Uniform<number>;
  uCenterX: Uniform<number>;
  uCenterY: Uniform<number>;
  uCenterZ: Uniform<number>;
  uAxisScaleX: Uniform<number>;
  uAxisScaleY: Uniform<number>;
  uAxisScaleZ: Uniform<number>;
};

function buildGridMask(u: MaskInputs) {
  const uvGridMask = Fn(() => {
    const fadeTimer = u.uProgress.mul(1.3);
    const posI = vec2(uv().x.mul(u.uGridWidth).mul(u.uUvScale), uv().y.mul(u.uGridHeight).mul(u.uUvScale));
    const finalPos = mod(posI, 2).sub(vec2(1, 2));
    const posI2 = vec2(floor(posI.x.div(2)).div(u.uGridWidth), floor(posI.y.div(2)).div(u.uGridHeight));
    const size = clamp(pow(fadeTimer.add(posI2.y), u.uFadePower), 0, u.uSizeMax).mul(u.uProgress).abs();
    return float(abs(finalPos.x.add(u.uCellOffset)).add(abs(finalPos.y)).lessThan(size));
  });

  const ringMaskFromPosition = (positionNode: Node<"vec3">) =>
    Fn(() => {
      const local = positionNode.sub(vec3(u.uCenterX, u.uCenterY, u.uCenterZ));
      const scaled = vec3(local.x.mul(u.uAxisScaleX), local.y.mul(u.uAxisScaleY), local.z.mul(u.uAxisScaleZ));
      const dist = length(scaled);
      const phase = dist.mul(u.uRingDensity).sub(u.uTime.mul(u.uRingSpeed));
      const rings = abs(fract(phase).sub(0.5)).mul(2.0);
      const lines = float(1).sub(smoothstep(float(0), u.uRingWidth, rings));
      const revealRadius = u.uSizeMax.mul(clamp(pow(u.uProgress.mul(1.3), float(1).div(u.uFadePower)), 0, 1));
      const reveal = float(dist.lessThan(revealRadius));
      return lines.mul(reveal);
    })();

  const objectRingMask = ringMaskFromPosition(positionLocal);
  const worldRingMask = ringMaskFromPosition(positionWorld);
  const viewRingMask = ringMaskFromPosition(positionView);

  return Fn(() => {
    const uvMask = uvGridMask();
    const isUv = u.uProjection.lessThan(0.5);
    const isObject = u.uProjection.greaterThan(0.5).and(u.uProjection.lessThan(1.5));
    const isWorld = u.uProjection.greaterThan(1.5).and(u.uProjection.lessThan(2.5));
    return select(isUv, uvMask, select(isObject, objectRingMask, select(isWorld, worldRingMask, viewRingMask)));
  })();
}

export type CloakOptions = {
  /** Cells across the UV space (the demo used 40×40 on the head, 60×65 on the body, 20×20 on the helmet). */
  gridWidth?: number;
  gridHeight?: number;
  look?: CloakLook;
  /** Skips the expensive layers (iridescence, clearcoat, dispersion) on weaker devices. */
  quality?: "high" | "low";
  name?: string;
};

export type Cloak = {
  material: THREE.MeshPhysicalNodeMaterial;
  /** Eases progress toward the target (seconds-based, frame-rate independent) and advances the shader clock. */
  step: (dt: number, active: boolean, instant?: boolean) => void;
  readonly progress: number;
  dispose: () => void;
};

/** Critically damped smoothing (the same curve `maath.easing.damp` uses); `velocity` is carried between calls. */
function smoothDamp(current: number, target: number, velocity: number, smoothTime: number, dt: number): [number, number] {
  const omega = 2 / Math.max(0.0001, smoothTime);
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (velocity + omega * change) * dt;
  const nextVelocity = (velocity - omega * temp) * decay;
  let value = target + (change + temp) * decay;
  if ((target - current > 0) === (value > target)) value = target; // never overshoot
  return [value, nextVelocity];
}

type PhysicalSource = THREE.MeshStandardMaterial & Partial<Pick<THREE.MeshPhysicalMaterial, "normalScale">>;

export function createCloak(source: THREE.Material | null, options: CloakOptions = {}): Cloak {
  const { gridWidth = 40, gridHeight = 40, look = DEFAULT_LOOK, quality = "high", name = "Cloak" } = options;
  const { glass: g, grid: s } = look;
  const high = quality === "high";
  const from = source as PhysicalSource | null;

  const uTime = uniform(0);
  const uProgress = uniform(0);
  const uGridWidth = uniform(gridWidth);
  const uGridHeight = uniform(gridHeight);
  const uFresnelIntensity = uniform(g.fresnelIntensity);
  const uFresnelColor = uniform(new THREE.Color(g.fresnelColor));
  const uTransmission = uniform(g.transmission);
  const uCellColor = uniform(new THREE.Color(s.cellColor));

  const uProjection = uniform(s.projection);
  const uUvScale = uniform(s.uvScale);
  const uFadePower = uniform(s.fadePower);
  const uSizeMax = uniform(s.sizeMax);
  const uCellOffset = uniform(s.cellOffset);
  const uRingDensity = uniform(s.ringDensity);
  const uRingWidth = uniform(s.ringWidth);
  const uRingSpeed = uniform(s.ringSpeed);
  const uCenterX = uniform(s.centerX);
  const uCenterY = uniform(s.centerY);
  const uCenterZ = uniform(s.centerZ);
  const uAxisScaleX = uniform(s.axisScaleX);
  const uAxisScaleY = uniform(s.axisScaleY);
  const uAxisScaleZ = uniform(s.axisScaleZ);
  const uShimmerSpeed = uniform(s.shimmerSpeed);
  const uShimmerScale = uniform(s.shimmerScale);
  const uShimmerNormalScale = uniform(s.shimmerNormalScale);
  const uShimmerMin = uniform(s.shimmerMin);
  const uMetalnessInCell = uniform(s.metalnessInCell);

  const material = new THREE.MeshPhysicalNodeMaterial({
    name,
    map: from?.map ?? null,
    normalMap: from?.normalMap ?? null,
    roughnessMap: from?.roughnessMap ?? null,
    metalnessMap: from?.metalnessMap ?? null,
    aoMap: from?.aoMap ?? null,
    roughness: from ? from.roughness : g.roughness,
    metalness: from ? from.metalness : g.metalness,
    ior: g.ior,
    thickness: g.thickness,
    transmission: 0,
    dispersion: 0,
    envMapIntensity: g.envMapIntensity,
    specularIntensity: g.specularIntensity,
    specularColor: new THREE.Color(g.specularColor),
    clearcoat: high ? g.clearcoat : 0,
    clearcoatRoughness: g.clearcoatRoughness,
    iridescence: high ? g.iridescence : 0,
    iridescenceIOR: g.iridescenceIOR,
    iridescenceThicknessRange: [g.iridescenceThicknessMin, g.iridescenceThicknessMax],
    sheen: g.sheen,
    sheenRoughness: g.sheenRoughness,
    sheenColor: new THREE.Color(g.sheenColor),
    anisotropy: g.anisotropy,
    anisotropyRotation: g.anisotropyRotation,
    side: from?.side ?? THREE.FrontSide,
  });
  if (from?.normalScale) material.normalScale.copy(from.normalScale);
  material.aoMapIntensity = from?.aoMapIntensity ?? 1;
  material.map = from?.map ?? null;

  const glassMix = smoothstep(0, 0.08, uProgress);
  material.transmissionNode = glassMix.mul(uTransmission);

  const gridMask = buildGridMask({
    uProgress,
    uTime,
    uGridWidth,
    uGridHeight,
    uProjection,
    uUvScale,
    uFadePower,
    uSizeMax,
    uCellOffset,
    uRingDensity,
    uRingWidth,
    uRingSpeed,
    uCenterX,
    uCenterY,
    uCenterZ,
    uAxisScaleX,
    uAxisScaleY,
    uAxisScaleZ,
  });

  material.colorNode = mix(materialColor, vec4(uCellColor, 1.0), gridMask);
  material.roughnessNode = mix(
    materialRoughness,
    clamp(
      pow(sin(uProgress.mul(uShimmerScale).add(uTime.mul(uShimmerSpeed)).add(normalWorld.y.mul(uShimmerNormalScale))), 2),
      uShimmerMin,
      1,
    ),
    gridMask,
  );
  material.metalnessNode = mix(materialMetalness, uMetalnessInCell, gridMask);

  const fresnelMask = smoothstep(0.4, 0.85, uProgress);
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const NdotV = clamp(dot(normalWorld, viewDir), 0, 1);
  const fresnel = pow(float(1).sub(NdotV), 4).mul(fresnelMask);
  material.emissiveNode = uFresnelColor.mul(fresnel).mul(uFresnelIntensity);

  let progress = 0;
  let velocity = 0;
  let clock = 0;

  return {
    material,
    step(dt, active, instant = false) {
      clock += dt;
      uTime.value = clock;
      const target = active ? 1 : 0;
      if (instant) {
        progress = target;
        velocity = 0;
      } else {
        [progress, velocity] = smoothDamp(progress, target, velocity, 1.2, Math.min(dt, 0.1));
        if (Math.abs(progress - target) < 0.0005) progress = target;
      }
      uProgress.value = progress;
      const gl = Math.min(1, progress / 0.08);
      material.dispersion = high ? gl * gl * (3 - 2 * gl) * g.dispersion : 0;
    },
    get progress() {
      return progress;
    },
    dispose() {
      material.dispose();
    },
  };
}
