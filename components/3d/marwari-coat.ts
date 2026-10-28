/**
 * The Marwari's coat shader: everything that is added to the stock physical material through `onBeforeCompile`.
 * Model space is glTF (+Y up, the horse faces +Z, metres); `vRest` is the bind-pose position, so the effects stay glued to the
 * body whatever the skeleton does.
 *
 *  - Black coat grade. The baked colour map leans brown (red exceeds blue by about 5/255) and a warm key light then paints a
 *    black horse chestnut. A real black coat is nearly achromatic in its diffuse reflection and takes its colour from the
 *    specular and the sheen, so the diffuse term keeps only a share of the light's chroma (`chroma`) and the albedo is
 *    desaturated and tinted slightly cool (`coat`). Warm light still shows, on the highlights.
 *  - Coat direction. At load every vertex gets the direction its hair lies in (down the legs, back along the body and neck, toward the
 *    muzzle on the face), from the bone weights. The shader uses it to stretch the highlight along the hair (anisotropic GGX, so a
 *    groomed coat gets long soft highlights across the muscle) and for a hair-scale bump made of fibres that run along it. The bump
 *    fades out when a pixel covers more than a fibre, so it costs nothing at hero distances and cannot shimmer.
 *  - Region roughness: oiled hooves, a matte muzzle, wet lid margins, a little hair-scale roughness variation up close.
 *  - Anatomy highlight: up to four world-space spheres that glow (the plate's hotspots).
 */
import * as THREE from "three";

export type Highlight = {
  /** Up to four world-space spheres (centre + radius) that glow; radius 0 switches a slot off. */
  set: (spheres: { center: THREE.Vector3; radius: number }[]) => void;
  /** 0..1 strength, eased by the caller. */
  strength: { value: number };
  color: { value: THREE.Color };
  /** (desaturation 0..1, gain) applied to the baked colour. The film grades the coat a little further toward black outdoors. */
  coat: { value: THREE.Vector2 };
  /** The grade the studio (hero, plate) uses; whoever changes `coat` puts this back afterwards. */
  coatHome: THREE.Vector2;
  /** Share (0..1) of the light's colour the diffuse term keeps: 0 is a neutral black, 1 is the stock material. */
  chroma: { value: number };
  /** Strength of the hair-scale bump (0 switches it off). */
  micro: { value: number };
};

/** Studio grade of the coat colour map: a third of the baked saturation is left, the original level. */
export const COAT_HOME = new THREE.Vector2(0.65, 1);
/** A slight blue-black cast, luminance-neutral (0.2126 r + 0.7152 g + 0.0722 b = 0.98). */
const COOL = new THREE.Vector3(0.95, 0.985, 1.06);

/** The direction the hair lies in at each bone (bind-pose model space: +Y up, +Z forward). */
function hairDirection(bone: string, out: THREE.Vector3): THREE.Vector3 {
  if (bone === "Head" || bone.startsWith("Eye")) return out.set(0, -0.5, 1);
  if (bone.startsWith("Ear")) return out.set(0, 1, 0.2);
  if (bone.startsWith("Neck") || bone.startsWith("Mane")) return out.set(0, -0.55, -1);
  if (bone.startsWith("Tail")) return out.set(0, -1, -0.2);
  if (/^(Humerus|Femur)/.test(bone)) return out.set(0, -0.9, -0.3);
  if (/^(Forearm|Gaskin|Cannon|Pastern|Hoof)/.test(bone)) return out.set(0, -1, 0);
  return out.set(0, -0.2, -1); // trunk, shoulder blade, hip: the coat lies back
}

/** Per-vertex hair direction, projected onto the surface and blended by the skin weights. */
function hairFlow(mesh: THREE.SkinnedMesh): Float32Array {
  const geo = mesh.geometry;
  const pos = geo.attributes.position, nor = geo.attributes.normal, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
  const names = mesh.skeleton.bones.map((b) => b.name);
  const out = new Float32Array(pos.count * 3);
  const d = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < pos.count; i++) {
    d.set(0, 0, 0);
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w > 0) d.addScaledVector(hairDirection(names[si.getComponent(i, k)], b).normalize(), w);
    }
    n.fromBufferAttribute(nor, i).normalize();
    d.addScaledVector(n, -d.dot(n));
    if (d.lengthSq() < 0.02) d.crossVectors(n, up);
    d.normalize();
    out[i * 3] = d.x;
    out[i * 3 + 1] = d.y;
    out[i * 3 + 2] = d.z;
  }
  return out;
}

export function installCoat(mesh: THREE.SkinnedMesh, material: THREE.MeshPhysicalMaterial, muzzle: THREE.Vector3, eyes: { L: THREE.Vector3; R: THREE.Vector3 }): Highlight {
  mesh.geometry.setAttribute("aFlow", new THREE.BufferAttribute(hairFlow(mesh), 3));
  material.anisotropy = 0.38; // switches the anisotropic BRDF on; its frame is replaced by the hair direction in the shader below
  const spheres = { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) };
  const strength = { value: 0 };
  const color = { value: new THREE.Color("#c9a66b") };
  const coat = { value: COAT_HOME.clone() };
  const black = { value: new THREE.Vector4(0.12, COOL.x, COOL.y, COOL.z) };
  const micro = { value: 0.2 };
  const chroma = {
    get value() {
      return black.value.x;
    },
    set value(v: number) {
      black.value.x = v;
    },
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCoat = coat;
    shader.uniforms.uBlack = black;
    shader.uniforms.uHi = spheres;
    shader.uniforms.uHiK = strength;
    shader.uniforms.uHiCol = color;
    shader.uniforms.uMuzzle = { value: muzzle };
    shader.uniforms.uEye = { value: [eyes.L, eyes.R] };
    shader.uniforms.uMicro = micro;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHiW; varying vec3 vRest; varying vec3 vFlowR; varying vec3 vNR; varying vec3 vFlow; attribute vec3 aFlow;")
      .replace("#include <skinnormal_vertex>", "#include <skinnormal_vertex>\nvFlow = normalize(mat3(modelViewMatrix) * (skinMatrix * vec4(aFlow, 0.0)).xyz);")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRest = position; vFlowR = aFlow; vNR = normal;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvHiW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vHiW; varying vec3 vRest; varying vec3 vFlowR; varying vec3 vNR; varying vec3 vFlow; uniform vec4 uHi[4]; uniform float uHiK; uniform vec3 uHiCol; uniform vec3 uMuzzle; uniform vec3 uEye[2]; uniform vec2 uCoat; uniform vec4 uBlack; uniform float uMicro;
        float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float vn3(vec3 x) {
          vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float l = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          // a Kala coat has no markings: the sculpt's faint socks and blaze are pulled down with a soft knee (linear 0.022 .. 0.034)
          float cap = l > 0.022 ? 0.022 + 0.012 * (1.0 - exp(-(l - 0.022) / 0.012)) : l;
          cap = mix(0.0125, cap, 0.55); // the baked colour map is cloudy: keep a little of it, the rest is the hair
          diffuseColor.rgb *= cap / max(l, 1e-5);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(cap), uCoat.x) * uCoat.y * uBlack.yzw;
        }`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          // the sculpt's sock edges are baked into the normal map as zig-zag creases at the pasterns: calm them there
          float band = smoothstep(0.09, 0.13, vRest.y) * (1.0 - smoothstep(0.27, 0.33, vRest.y));
          normal = normalize(mix(normal, nonPerturbedNormal, clamp(0.35 + 0.6 * band, 0.0, 0.9))); // the baked normal map is blotchy at body scale: take a third of it out
          // hair-scale fibres running along the coat; fades out once a pixel is wider than a fibre (about 1.6 mm across)
          float pix = length(dFdx(vRest)) + length(dFdy(vRest));
          float fade = 1.0 - smoothstep(0.0007, 0.0018, pix);
          if (fade > 0.01) {
            vec3 nr = normalize(vNR);
            vec3 fr = normalize(vFlowR - nr * dot(vFlowR, nr));
            vec3 br = cross(nr, fr);
            vec3 q = vec3(dot(vRest, fr) * 55.0, dot(vRest, br) * 620.0, dot(vRest, nr) * 620.0);
            float hgt = vn3(q) * 0.65 + vn3(q * vec3(2.3, 2.1, 2.1) + 7.1) * 0.35;
            vec3 sx = normalize(dFdx(-vViewPosition)), sy = normalize(dFdy(-vViewPosition));
            vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
            float det = dot(sx, r1) * faceDirection;
            vec3 grad = sign(det) * (dFdx(hgt) * r1 + dFdy(hgt) * r2);
            normal = normalize(abs(det) * normal - uMicro * fade * grad);
          }
        }`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
        #ifdef USE_ANISOTROPY
        {
          // the highlight is stretched along the hair, not along the unwrapped UVs
          vec3 tf = normalize(vFlow - normal * dot(vFlow, normal));
          material.anisotropyT = tf;
          material.anisotropyB = normalize(cross(normal, tf));
        }
        #endif`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        {
          // oiled hooves are glossier, the muzzle's skin is soft and matte, the coat's hair varies a little from patch to patch
          float hoofM = 1.0 - smoothstep(0.085, 0.125, vRest.y);
          float muzM = 1.0 - smoothstep(0.05, 0.15, distance(vRest, uMuzzle));
          float fade = 1.0 - smoothstep(1.0, 4.0, length(vViewPosition));
          roughnessFactor = mix(0.5, roughnessFactor, 0.3); // the baked roughness is as cloudy as the colour; a groomed coat is even
          roughnessFactor *= 1.0 + (vn3(vRest * 70.0) - 0.5) * 0.3 * fade;
          roughnessFactor = mix(roughnessFactor, 0.4, hoofM);
          roughnessFactor = mix(roughnessFactor, 0.78, muzM);
          // the wet margin of the lids: a thin glossy ring round each eye (opening about 6 x 3.6 cm, seen from the side)
          vec3 e = vRest - (vRest.x > 0.0 ? uEye[0] : uEye[1]);
          float dd = length(vec2(e.z / 0.032, e.y / 0.02));
          float lid = smoothstep(0.7, 0.95, dd) * (1.0 - smoothstep(1.0, 1.3, dd)) * (1.0 - smoothstep(0.035, 0.06, abs(e.x)));
          roughnessFactor = mix(roughnessFactor, 0.2, lid * 0.85);
        }`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float hi = 0.0;
        for (int i = 0; i < 4; i++) {
          if (uHi[i].w > 0.0) hi = max(hi, 1.0 - smoothstep(uHi[i].w * 0.35, uHi[i].w, distance(vHiW, uHi[i].xyz)));
        }
        totalEmissiveRadiance += uHiCol * hi * uHiK * 0.32;`,
      )
      .replace(
        "vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;",
        `vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
        { float dl = dot(totalDiffuse, vec3(0.2126, 0.7152, 0.0722)); totalDiffuse = mix(vec3(dl) * uBlack.yzw, totalDiffuse, uBlack.x); }`,
      );
  };
  material.customProgramCacheKey = () => "marwari-coat-v8";
  return {
    set(list) {
      spheres.value.forEach((v, i) => {
        const s = list[i];
        if (s) v.set(s.center.x, s.center.y, s.center.z, s.radius);
        else v.set(0, 0, 0, 0);
      });
    },
    strength,
    color,
    coat,
    coatHome: COAT_HOME,
    chroma,
    micro,
  };
}
