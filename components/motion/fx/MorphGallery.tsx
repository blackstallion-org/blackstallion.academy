"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Stills that dissolve into one another through drifting noise instead of a cut or a cross-fade
 * (adapted from the 21st.dev "Morph Gallery"). One WebGL1 pass mixes two textures; an fbm field gives
 * each pixel a threshold, biased by the brightness of the incoming frame, so its light burns through first.
 *
 * Controlled only: the parent owns `index` (the peg-run stages drive it). Images that cannot be uploaded
 * to WebGL (no CORS, no WebGL) fall back to a plain opacity cross-fade. Reduced motion: instant swap.
 * The canvas is decorative; the parent supplies the text equivalent for the current frame.
 */
export type MorphItem = { src: string; alt: string };

type MorphGalleryProps = {
  items: MorphItem[];
  index: number;
  duration?: number;
  noiseScale?: number;
  edge?: number;
  drift?: number;
  className?: string;
};

const VERT = `attribute vec2 a_position; varying vec2 v_uv;
void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform sampler2D u_from; uniform sampler2D u_to; uniform float u_progress; uniform vec2 u_resolution;
uniform float u_fromAspect; uniform float u_toAspect; uniform float u_scale; uniform float u_direction;
uniform float u_edge; uniform float u_drift; varying vec2 v_uv;
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0); m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 v) { float s = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { s += a * snoise(v); v *= 2.0; a *= 0.5; } return s; }
vec2 mirror(vec2 uv) { return 1.0 - abs(1.0 - mod(uv, 2.0)); }
vec2 coverUV(vec2 uv, float imgAspect) {
  float ca = u_resolution.x / u_resolution.y;
  vec2 s = (ca > imgAspect) ? vec2(1.0, imgAspect / ca) : vec2(ca / imgAspect, 1.0);
  return mirror((uv - 0.5) * s + 0.5);
}
void main() {
  float adjusted = u_progress * (1.0 + 2.0 * u_edge) - u_edge;
  float n = fbm(v_uv * u_scale + vec2(0.0, u_progress * u_direction)) * 0.5 + 0.5;
  n = smoothstep(0.0, 2.0, length(texture2D(u_to, coverUV(v_uv, u_toAspect)).rgb) + n);
  float mixFactor = 1.0 - smoothstep(adjusted - u_edge, adjusted + u_edge, n);
  vec2 fromUV = coverUV(v_uv + vec2(0.0, n * u_progress * u_drift * u_direction), u_fromAspect);
  vec2 toUV = coverUV(v_uv + vec2(0.0, n * (1.0 - u_progress) * -0.5 * u_drift * u_direction), u_toAspect);
  gl_FragColor = mix(texture2D(u_from, fromUV), texture2D(u_to, toUV), mixFactor);
}`;

const easeInOutQuint = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1);
  return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

const noop = () => () => {};

export function MorphGallery({ items, index, duration = 1500, noiseScale = 3.5, edge = 0.15, drift = 0.5, className }: MorphGalleryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  // Stills mount only after hydration, so a load error is always seen by onError (no broken-image icon).
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  // Nothing (stills or textures) loads until the gallery is within a screen of the viewport.
  const rootRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [ready, setReady] = useState(false);
  const request = useRef<{ from: number; to: number } | null>(null);
  const previous = useRef(index);
  const initial = useRef(index);
  const sources = items.map((i) => i.src).join("\n");

  useEffect(() => {
    if (previous.current === index) return;
    request.current = { from: previous.current, to: index };
    previous.current = index;
  }, [index]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!near || !canvas || !items.length) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) {
      queueMicrotask(() => setFailed(true));
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const textures: (WebGLTexture | null)[] = items.map(() => null);
    const aspects = items.map(() => 1);
    let raf = 0;
    let disposed = false;
    let from = initial.current;
    let to = initial.current;
    let progress = 1;
    let startedAt = 0;
    let dirty = true;
    let direction = 1;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const u: Record<string, WebGLUniformLocation | null> = {};

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(s)));
      return s;
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h || (canvas.width === w && canvas.height === h)) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const pick = (i: number) => textures[i] ?? textures.find((t) => t) ?? null;

    const draw = () => {
      const pending = request.current;
      if (pending) {
        request.current = null;
        from = progress < 1 ? to : pending.from;
        to = pending.to;
        progress = 0;
        startedAt = performance.now();
        direction = pending.to > pending.from ? 1 : -1;
      }
      if (progress < 1) {
        progress = reduce ? 1 : easeInOutQuint((performance.now() - startedAt) / Math.max(duration, 1));
      }
      const a = pick(from);
      const b = pick(to);
      if (!a || !b) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a);
      gl.uniform1i(u.from, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, b);
      gl.uniform1i(u.to, 1);
      gl.uniform1f(u.progress, progress);
      gl.uniform2f(u.resolution, canvas.width, canvas.height);
      gl.uniform1f(u.fromAspect, aspects[from] ?? 1);
      gl.uniform1f(u.toAspect, aspects[to] ?? 1);
      gl.uniform1f(u.scale, noiseScale);
      gl.uniform1f(u.direction, direction);
      gl.uniform1f(u.edge, Math.max(edge, 0.001));
      gl.uniform1f(u.drift, drift);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    // Draw only while a dissolve runs or a request is waiting; idle frames cost one check.
    const frame = () => {
      if (disposed) return;
      if (progress < 1 || request.current || dirty) {
        dirty = false;
        draw();
      }
      raf = requestAnimationFrame(frame);
    };

    (async () => {
      try {
        program = gl.createProgram()!;
        gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link");
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        for (const name of ["from", "to", "progress", "resolution", "fromAspect", "toAspect", "scale", "direction", "edge", "drift"]) {
          u[name] = gl.getUniformLocation(program, `u_${name}`);
        }
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        let running = false;
        let refused = 0;
        await Promise.all(
          items.map((item, i) =>
            loadImage(item.src).then(
              (img) => {
                if (disposed) return;
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                textures[i] = tex;
                aspects[i] = img.naturalWidth / Math.max(img.naturalHeight, 1);
                if (i === from || i === to) draw();
                if (!running) {
                  running = true;
                  resize();
                  draw();
                  setReady(true);
                  raf = requestAnimationFrame(frame);
                }
              },
              () => {
                refused += 1;
                if (refused === items.length && !disposed) setFailed(true);
              },
            ),
          ),
        );
        // Any frame that could not be uploaded breaks the morph for that step; cross-fade instead.
        if (!disposed && refused > 0) setFailed(true);
      } catch {
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      textures.forEach((t) => t && gl.deleteTexture(t));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
    // index is read through `request`; sources keys the rebuild
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, sources, duration, noiseScale, edge, drift]);

  return (
    <div ref={rootRef} className={cn("film-placeholder relative overflow-hidden bg-night", className)}>
      {/* Always render the stills underneath: they are the fallback, the first paint and the no-WebGL view. */}
      {hydrated && near && items.map((item, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- stacked cross-fade layer shares the WebGL sources
        <img
          key={item.src}
          src={item.src}
          alt=""
          aria-hidden
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
          className="absolute inset-0 block h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none"
          style={{ opacity: i === index && (failed || !ready) ? 1 : 0 }}
        />
      ))}
      {failed ? null : (
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 block h-full w-full" style={{ opacity: ready ? 1 : 0, transition: "opacity 400ms ease" }} />
      )}
    </div>
  );
}
