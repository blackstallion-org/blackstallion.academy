import * as THREE from "three";
import type { Station, StationCtx } from "../engine";
import { textPoints } from "../canvas-text";

/** Points scattered across the sky that converge into a word ahead of the horse as the page ends. */
export function finaleStation(range: [number, number], word: string) {
  return (ctx: StationCtx): Station => {
    const target = textPoints(word, ctx.fonts.sans, 16, ctx.mobile ? 4 : 3);
    const n = target.length / 3;
    const start = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 14 + Math.random() * 26;
      const a = Math.random() * Math.PI * 2;
      const b = (Math.random() - 0.5) * Math.PI;
      start[i * 3] = Math.cos(a) * Math.cos(b) * r;
      start[i * 3 + 1] = Math.sin(b) * r * 0.6 + 4;
      start[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(target, 3));
    geo.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uT: { value: 0 }, uTime: { value: 0 }, uSize: { value: ctx.mobile ? 2.2 : 2.6 }, uPR: { value: Math.min(window.devicePixelRatio || 1, 1.75) } },
      vertexShader: `
        attribute vec3 aStart; attribute float aSeed; uniform float uT; uniform float uTime; uniform float uSize; uniform float uPR;
        varying float vA;
        void main(){
          float t = clamp((uT - aSeed * 0.35) / 0.65, 0.0, 1.0);
          t = 1.0 - pow(1.0 - t, 3.0);
          vec3 p = mix(aStart, position, t);
          p += vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 30.0), 0.0) * 0.06 * (1.0 - t * 0.7);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * uPR * (18.0 / -mv.z) * (0.6 + 0.4 * t);
          vA = 0.25 + 0.75 * t;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard; gl_FragColor = vec4(1.0, 1.0, 1.0, vA); }`,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.position.set(0, 4.2, -ctx.length - 16);
    return {
      id: "finale",
      range,
      build: () => points,
      update: (local, c) => {
        mat.uniforms.uT.value = Math.min(Math.max(local * 1.15, 0), 1);
        mat.uniforms.uTime.value = c.time;
        points.visible = local > -0.4;
      },
    };
  };
}
