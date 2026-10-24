"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./ParticlePortrait.module.css";

const vertex = `
attribute vec2 position;
uniform vec2 uPointer;
uniform vec2 uVelocity;
uniform vec2 uCover;
uniform float uAspect;
uniform float uStrength;
uniform float uTime;
uniform float uSize;
varying vec2 vUv;
varying float vAlpha;
void main() {
  vec2 delta = (position - uPointer) * vec2(uAspect, 1.0);
  float influence = exp(-dot(delta, delta) * 85.0);
  float seed = fract(sin(dot(position, vec2(127.1, 311.7))) * 43758.5453);
  vec2 direction = normalize(delta + vec2(0.0001));
  vec2 offset = direction * influence * uStrength * (0.035 + seed * 0.055);
  offset += uVelocity * influence * uStrength * 0.14;
  offset += vec2(sin(uTime * 1.8 + seed * 30.0), cos(uTime + seed * 40.0)) * influence * uStrength * 0.009;
  gl_Position = vec4((position + offset) * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize * (0.65 + seed * 0.6);
  vUv = position * uCover + (1.0 - uCover) * vec2(0.5, 0.6);
  vAlpha = influence * uStrength * 0.8;
}`;
const fragment = `
precision mediump float;
uniform sampler2D uImage;
varying vec2 vUv;
varying float vAlpha;
void main() {
  float circle = 1.0 - smoothstep(0.25, 0.5, length(gl_PointCoord - 0.5));
  vec4 pigment = texture2D(uImage, vUv);
  gl_FragColor = vec4(pigment.rgb, circle * vAlpha);
}`;

/** Pointer momentum stirs image-coloured particles over an always-present photograph. */
export function ParticlePortrait({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = ref.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const media = window.matchMedia("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)");
    let disposed = false;
    let stop: (() => void) | undefined;
    let booting = false;

    const start = async () => {
      if (!media.matches || disposed || booting || stop) return;
      booting = true;
      const { Renderer, Geometry, Program, Mesh, Texture } = await import("ogl");
      if (disposed || !media.matches) { booting = false; return; }
      let renderer: InstanceType<typeof Renderer>;
      try {
        renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(devicePixelRatio, 1.5), antialias: false, powerPreference: "low-power" });
      } catch { booting = false; return; }
      const gl = renderer.gl;
      const source = new window.Image();
      const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
      const columns = 200;
      const rows = 250;
      const positions = new Float32Array(columns * rows * 2);
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        const index = (y * columns + x) * 2;
        positions[index] = (x + 0.5) / columns;
        positions[index + 1] = (y + 0.5) / rows;
      }
      const geometry = new Geometry(gl, { position: { size: 2, data: positions } });
      const uniforms = {
        uPointer: { value: [0.5, 0.5] }, uVelocity: { value: [0, 0] }, uCover: { value: [1, 1] },
        uAspect: { value: 1 }, uStrength: { value: 0 }, uTime: { value: 0 }, uSize: { value: 3 }, uImage: { value: texture },
      };
      const program = new Program(gl, { vertex, fragment, uniforms, transparent: true, depthTest: false, depthWrite: false, cullFace: false });
      const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS, frustumCulled: false });
      let frame = 0;
      let hovered = false;
      let visible = false;
      let loaded = false;
      let last = 0;
      let target = [0.5, 0.5];
      let previous = [...target];
      const draw = (time: number) => {
        frame = 0;
        if (disposed || !visible || document.hidden || !loaded) return;
        const delta = Math.min((time - last) / 16.67 || 1, 3);
        last = time;
        const blend = 1 - Math.pow(0.87, delta);
        uniforms.uStrength.value += ((hovered ? 1 : 0) - uniforms.uStrength.value) * blend;
        uniforms.uPointer.value = target;
        uniforms.uVelocity.value = [
          (target[0] - previous[0]) / delta + uniforms.uVelocity.value[0] * 0.8,
          (target[1] - previous[1]) / delta + uniforms.uVelocity.value[1] * 0.8,
        ];
        previous = [...target];
        uniforms.uTime.value = time * 0.001;
        renderer.render({ scene: mesh });
        if (hovered || uniforms.uStrength.value > 0.005) frame = requestAnimationFrame(draw);
      };
      const wake = () => { if (!frame && loaded && visible && !document.hidden) { last = 0; frame = requestAnimationFrame(draw); } };
      const resize = () => {
        const width = root.clientWidth;
        const height = root.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        const aspect = width / height;
        const imageAspect = source.naturalWidth / source.naturalHeight || 1;
        uniforms.uAspect.value = aspect;
        uniforms.uCover.value = imageAspect > aspect ? [aspect / imageAspect, 1] : [1, imageAspect / aspect];
        uniforms.uSize.value = Math.max(width / columns, height / rows) * renderer.dpr * 1.1;
      };
      const move = (event: PointerEvent) => {
        const box = root.getBoundingClientRect();
        target = [(event.clientX - box.left) / box.width, 1 - (event.clientY - box.top) / box.height];
        if (!hovered) previous = [...target];
        hovered = true; wake();
      };
      const leave = () => { hovered = false; wake(); };
      const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else wake(); };
      const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); frame = 0; canvas.style.opacity = "0"; };
      const sizeObserver = new ResizeObserver(resize);
      sizeObserver.observe(root);
      const viewportObserver = new IntersectionObserver((entries) => {
        visible = Boolean(entries[0]?.isIntersecting);
        if (!visible) { hovered = false; cancelAnimationFrame(frame); frame = 0; } else wake();
      });
      viewportObserver.observe(root);
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerleave", leave);
      document.addEventListener("visibilitychange", visibility);
      canvas.addEventListener("webglcontextlost", contextLost);
      source.onload = () => { if (!disposed) { texture.image = source; loaded = true; resize(); wake(); } };
      source.src = src;
      stop = () => {
        cancelAnimationFrame(frame);
        source.onload = null;
        sizeObserver.disconnect(); viewportObserver.disconnect();
        root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", leave);
        document.removeEventListener("visibilitychange", visibility); canvas.removeEventListener("webglcontextlost", contextLost);
        geometry.remove(); program.remove(); gl.deleteTexture(texture.texture);
        gl.clear(gl.COLOR_BUFFER_BIT);
        stop = undefined; booting = false;
      };
    };
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) void start().catch(() => { booting = false; }); }, { rootMargin: "350px" });
    observer.observe(root);
    const change = () => { if (!media.matches) stop?.(); else void start().catch(() => { booting = false; }); };
    media.addEventListener("change", change);
    return () => { disposed = true; observer.disconnect(); media.removeEventListener("change", change); stop?.(); };
  }, [src]);

  return <div ref={ref} className={styles.root} data-parallax-skip>
    <Image src={src} alt={alt} fill sizes={sizes} />
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  </div>;
}
