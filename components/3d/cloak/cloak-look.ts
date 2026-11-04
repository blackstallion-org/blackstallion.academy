/**
 * The look of the cloak: glass response and dissolve mask.
 *
 * Values are the parameter sets shipped with the "Predator cloak material" demo (React Three Fiber + TSL; the repository
 * states no licence, see docs/THIRD_PARTY.md), kept as they were tuned there so the transition behaves the same. Only the dissolve cell
 * colour is changed: the demo's pale grey is the ivory role of this site.
 */
export type GlassLook = {
  dispersion: number;
  ior: number;
  thickness: number;
  transmission: number;
  envMapIntensity: number;
  fresnelIntensity: number;
  fresnelColor: string;
  roughness: number;
  metalness: number;
  specularIntensity: number;
  specularColor: string;
  anisotropy: number;
  anisotropyRotation: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence: number;
  iridescenceIOR: number;
  iridescenceThicknessMin: number;
  iridescenceThicknessMax: number;
  sheen: number;
  sheenRoughness: number;
  sheenColor: string;
};

/** 0 = UV grid; 1 / 2 / 3 = expanding rings in object / world / view space. */
export type GridProjection = 0 | 1 | 2 | 3;

export type GridLook = {
  projection: GridProjection;
  uvScale: number;
  fadePower: number;
  sizeMax: number;
  cellOffset: number;
  ringDensity: number;
  ringWidth: number;
  ringSpeed: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  axisScaleX: number;
  axisScaleY: number;
  axisScaleZ: number;
  shimmerSpeed: number;
  shimmerScale: number;
  shimmerNormalScale: number;
  shimmerMin: number;
  cellColor: string;
  metalnessInCell: number;
};

export type CloakLook = { glass: GlassLook; grid: GridLook };

export const GLASS_LOOK: GlassLook = {
  dispersion: 4.1,
  ior: 1.16,
  thickness: 1.6,
  transmission: 1,
  envMapIntensity: 1.8,
  fresnelIntensity: 0.2,
  fresnelColor: "#f2f7ff",
  roughness: 0.3,
  metalness: 0.42,
  specularIntensity: 1,
  specularColor: "#ffffff",
  anisotropy: 0,
  anisotropyRotation: 0,
  clearcoat: 0.07,
  clearcoatRoughness: 0.14,
  iridescence: 0.21,
  iridescenceIOR: 1.36,
  iridescenceThicknessMin: 0,
  iridescenceThicknessMax: 1000,
  sheen: 0,
  sheenRoughness: 0.29,
  sheenColor: "#ffffff",
};

export const GRID_LOOK: GridLook = {
  projection: 0,
  uvScale: 3,
  fadePower: 3.5,
  sizeMax: 20.5,
  cellOffset: 0.25,
  ringDensity: 14,
  ringWidth: 0.12,
  ringSpeed: 0.35,
  centerX: 0,
  centerY: 0,
  centerZ: 0,
  axisScaleX: 1,
  axisScaleY: 1,
  axisScaleZ: 1,
  shimmerSpeed: 2,
  shimmerScale: 15,
  shimmerNormalScale: 10.5,
  shimmerMin: 0.6,
  cellColor: "#ece3d3",
  metalnessInCell: 0.003,
};

export const DEFAULT_LOOK: CloakLook = { glass: GLASS_LOOK, grid: GRID_LOOK };
