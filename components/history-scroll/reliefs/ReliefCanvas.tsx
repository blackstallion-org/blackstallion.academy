"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  Mesh,
  PlaneGeometry,
  SRGBColorSpace,
  Shape,
  Texture,
  ShapeGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ALEXANDER_ROUTE, MAP_EXTENT, RELIEFS } from "@/lib/content/history/reliefs";
import type { ReliefId, ReliefSpec } from "@/lib/content/history/types";
import { fbm, mix, P, terrain } from "./terrain";

type Props = {
  id: ReliefId;
  paused: boolean;
  track: RefObject<HTMLElement | null>;
  onReady: () => void;
  onLost: () => void;
  className: string;
  ready: boolean;
  labels: RefObject<HTMLDivElement | null>;
  plate?: PlateSource;
};

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Geometry built once per mount and disposed on unmount. */
function useGeometry<T extends BufferGeometry>(make: () => T) {
  const [g] = useState(make);
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

/** Small scroll-driven camera travel inside the limits of the relief manifest. Renders on demand only. */
function Rig({ spec, track, fit, target = 0 }: { spec: ReliefSpec; track: RefObject<HTMLElement | null>; fit: number; target?: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const on = () => invalidate();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [invalidate]);
  useFrame(({ camera, size }) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh - r.top) / (vh + r.height));
    const az = lerp(spec.camera.azimuth[0], spec.camera.azimuth[1], p);
    const elev = spec.camera.elevation;
    const dist = 40;
    camera.position.set(Math.sin(az) * Math.cos(elev) * dist, Math.sin(elev) * dist, Math.cos(az) * Math.cos(elev) * dist);
    camera.lookAt(0, target, 0);
    camera.zoom = (size.width / fit) * lerp(spec.camera.zoom[0], spec.camera.zoom[1], p);
    camera.updateProjectionMatrix();
  });
  return null;
}

function Lights() {
  return (
    <>
      <hemisphereLight args={[P.ivory, P.ochre, 1.6]} />
      <directionalLight position={[-6, 10, 6]} intensity={1.5} color={P.ivory} />
    </>
  );
}

/* ---------------------------------------------------------------- IN01, WO02, JH01: the painting in relief */

export type PlateSource = { src: string; depth: string; width: number; height: number; focal: [number, number] };

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/**
 * The scene's own background plate on a shallow mesh. The texture is cropped exactly as the flat plate is (object-fit:
 * cover at its focal point), so at rest the relief and the painting below it are the same picture; scrolling turns the
 * mesh a few hundredths of a radian and the hills and the fort rise out of the paint. Unlit, no tone mapping.
 */
function PlateRelief({ spec, track, plate, onLoaded }: { spec: ReliefSpec; track: Props["track"]; plate: PlateSource; onLoaded: () => void }) {
  const { size, invalidate } = useThree();
  const [built, setBuilt] = useState<{ geo: BufferGeometry; tex: Texture } | null>(null);
  const mesh = useRef<Mesh>(null);

  useEffect(() => {
    let live = true;
    let made: { geo: BufferGeometry; tex: Texture } | null = null;
    Promise.all([loadImage(plate.src), loadImage(plate.depth)]).then(([img, dimg]) => {
      if (!live) return;
      const aspect = size.width / size.height;
      const scale = Math.max(size.width / plate.width, size.height / plate.height);
      const u = size.width / (plate.width * scale), v = size.height / (plate.height * scale);
      const u0 = (1 - u) * plate.focal[0], v0 = (1 - v) * (1 - plate.focal[1]);
      const tex = new Texture(img);
      tex.colorSpace = SRGBColorSpace;
      tex.repeat.set(u, v);
      tex.offset.set(u0, v0);
      tex.needsUpdate = true;
      const c = document.createElement("canvas");
      c.width = dimg.width;
      c.height = dimg.height;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(dimg, 0, 0);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      const geo = new PlaneGeometry(1, 1 / aspect, 256, 144);
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const tu = u0 + uv.getX(i) * u, tv = v0 + uv.getY(i) * v;
        const x = Math.min(c.width - 1, Math.max(0, Math.round(tu * (c.width - 1))));
        const y = Math.min(c.height - 1, Math.max(0, Math.round((1 - tv) * (c.height - 1))));
        pos.setZ(i, (px[(y * c.width + x) * 4] / 255) * 0.055);
      }
      pos.needsUpdate = true;
      made = { geo, tex };
      setBuilt(made);
      invalidate();
      requestAnimationFrame(() => requestAnimationFrame(onLoaded));
    });
    return () => {
      live = false;
      made?.geo.dispose();
      made?.tex.dispose();
    };
  }, [plate, size.width, size.height, invalidate, onLoaded]);

  useEffect(() => {
    const on = () => invalidate();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [invalidate]);

  useFrame(({ camera, size: s }) => {
    const el = track.current, m = mesh.current;
    if (!el || !m) return;
    const r = el.getBoundingClientRect();
    const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height));
    m.rotation.y = lerp(spec.camera.azimuth[0], spec.camera.azimuth[1], p);
    m.rotation.x = -spec.camera.elevation * (p - 0.5);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.zoom = s.width * lerp(spec.camera.zoom[0], spec.camera.zoom[1], p);
    camera.updateProjectionMatrix();
  });

  if (!built) return null;
  return (
    <mesh ref={mesh} geometry={built.geo}>
      <meshBasicMaterial map={built.tex} toneMapped={false} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- AL04: the route on a shallow painted map */

/** Keeps the HTML labels over their stops: projected each rendered frame, written straight to the DOM. */
function Labels({ labels, points }: { labels: Props["labels"]; points: { name: string; v: Vector3 }[] }) {
  const [tmp] = useState(() => new Vector3());
  useFrame(({ camera, size }) => {
    const root = labels.current;
    if (!root) return;
    for (const { name, v } of points) {
      const el = root.querySelector<HTMLElement>(`[data-stop="${name}"]`);
      if (!el) continue;
      tmp.copy(v).project(camera);
      el.style.left = `${((tmp.x + 1) / 2) * size.width}px`;
      el.style.top = `${((1 - tmp.y) / 2) * size.height}px`;
    }
  });
  return null;
}

const MAP_W = 20;
const MAP_D = (MAP_W * (MAP_EXTENT.lat[1] - MAP_EXTENT.lat[0])) / (MAP_EXTENT.lon[1] - MAP_EXTENT.lon[0]);
const toXZ = (lon: number, lat: number): [number, number] => [
  ((lon - MAP_EXTENT.lon[0]) / (MAP_EXTENT.lon[1] - MAP_EXTENT.lon[0]) - 0.5) * MAP_W,
  (0.5 - (lat - MAP_EXTENT.lat[0]) / (MAP_EXTENT.lat[1] - MAP_EXTENT.lat[0])) * MAP_D,
];

/** Simplified coastlines for orientation (lon, lat). Not survey data; no political borders. */
const SEAS: [number, number][][] = [
  [[18, 40], [19.5, 40.3], [20.5, 39], [21.5, 37], [22.5, 36.5], [23.5, 38], [23, 40.5], [24, 40.9], [26, 40.8], [26.3, 40.1], [26.8, 39.5], [26.5, 38.4], [27.2, 37.5], [28.5, 36.7], [30, 36.3], [31.5, 36.7], [33, 36.2], [34.5, 36.8], [36, 36.8], [36, 35.5], [35.8, 34.5], [35.1, 33], [34.5, 31.5], [33.5, 31.1], [32, 31.3], [31, 31.6], [30, 31.3], [29, 30.9], [27, 31.3], [25, 31.6], [23, 32.4], [21, 32.8], [20, 32], [19.5, 30.5], [18, 30.5]],
  [[28, 41.2], [29, 41.2], [31, 41.1], [33, 42], [35, 42], [36.5, 41.3], [38.5, 41], [40, 41], [41.5, 41.5], [41.6, 42.6], [40, 43.5], [38, 44], [28.5, 44], [27.8, 42.5]],
  [[47, 44], [47.5, 43], [47.8, 42], [48.6, 41.2], [49.5, 40.3], [49.4, 39], [48.9, 38.4], [49.2, 37.6], [50.5, 37], [52, 36.7], [53.9, 37], [54, 38], [53, 39], [53, 40.5], [52.8, 41.5], [52.5, 42.5], [51.3, 43.2], [50.5, 44]],
  [[48, 30], [49, 29.8], [50.3, 29.2], [50.8, 28], [51.5, 27.8], [53, 26.8], [54.5, 26.6], [56.3, 27.1], [57.3, 25.7], [59, 25.4], [61.5, 25.2], [64, 25.3], [66.5, 25.4], [67.4, 24.8], [67.8, 24], [51.6, 24], [51.5, 25.3], [51, 26], [50.2, 26.2], [50, 27], [49.2, 27.6], [48.4, 28.5]],
  [[32.5, 30], [33.6, 27.8], [35.3, 24], [36.6, 24], [35, 28], [34.4, 28.2]],
];
const RIVERS: [number, number][][] = [
  [[31.2, 30.6], [31, 27], [32.6, 25.7], [32.9, 24]],
  [[38.5, 37], [38.3, 36], [40.1, 35], [41.9, 34.4], [43.8, 33], [44.4, 32.5], [46, 31], [47.6, 30.4], [48, 30]],
  [[42.2, 37.3], [43.1, 36.3], [43.6, 35], [44.4, 33.3], [45.6, 32.5], [47.4, 31], [47.6, 30.4]],
  [[74, 35], [72.5, 33.9], [71.6, 32.9], [71, 30], [69.5, 28], [68.4, 25.5], [67.8, 24]],
  [[75, 34.2], [74, 33.2], [73.6, 32.9], [72.8, 32.2], [72.3, 31.5]],
];
const RANGES: [number, number, number][] = [[33, 37.4, 0.5], [48, 33.5, 0.55], [52, 36.2, 0.45], [69, 35.4, 0.8], [71.5, 36.5, 0.7], [21.8, 40.2, 0.35]];

function RouteMap({ track, labels }: { track: Props["track"]; labels: Props["labels"] }) {
  const ground = (x: number, z: number) => {
    let h = 0.05 * fbm(x * 0.8, z * 0.8);
    for (const [lon, lat, s] of RANGES) {
      const [cx, cz] = toXZ(lon, lat);
      h += s * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 0.9) * (0.6 + 0.6 * fbm(x * 2, z * 2));
    }
    return h;
  };
  const land = useGeometry(() => terrain(MAP_W, MAP_D, 120, 40, ground, (x, z, y) => mix(P.land, y > 0.25 ? P.granite : P.leaf, y > 0.25 ? (y - 0.25) * 2 : fbm(x, z) * 0.45)));
  const seas = useGeometry(() => {
    const shapes = SEAS.map((poly) => new Shape(poly.map(([lon, lat]) => { const [x, z] = toXZ(lon, lat); return new Vector2(x, -z); })));
    const g = new ShapeGeometry(shapes);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.07, 0);
    return g;
  });
  const rivers = useGeometry(() => {
    const parts = RIVERS.map((r) => new TubeGeometry(new CatmullRomCurve3(r.map(([lon, lat]) => { const [x, z] = toXZ(lon, lat); return new Vector3(x, ground(x, z) + 0.04, z); })), 60, 0.025, 4, false));
    const merged = mergeGeometries(parts);
    parts.forEach((t) => t.dispose());
    return merged;
  });
  const route = useGeometry(() => new TubeGeometry(new CatmullRomCurve3(ALEXANDER_ROUTE.map(({ lon, lat }) => { const [x, z] = toXZ(lon, lat); return new Vector3(x, ground(x, z) + 0.14, z); }), false, "centripetal"), 240, 0.05, 6, false));
  const pin = useGeometry(() => new ConeGeometry(0.09, 0.28, 8));
  const [stops] = useState(() => ALEXANDER_ROUTE.map(({ name, lon, lat }) => { const [x, z] = toXZ(lon, lat); return { name, v: new Vector3(x, ground(x, z) + 0.45, z) }; }));
  return (
    <>
      <Rig spec={RELIEFS.AL04} track={track} fit={MAP_W * 1.02} target={0} />
      <Lights />
      <mesh geometry={land}>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <mesh geometry={seas}>
        <meshLambertMaterial color={P.sea} />
      </mesh>
      <mesh geometry={rivers}>
        <meshLambertMaterial color={P.sea} />
      </mesh>
      <mesh geometry={route}>
        <meshLambertMaterial color={P.vermilion} />
      </mesh>
      {ALEXANDER_ROUTE.map(({ name, lon, lat }) => {
        const [x, z] = toXZ(lon, lat);
        return (
          <mesh key={name} geometry={pin} position={[x, ground(x, z) + 0.28, z]} rotation={[Math.PI, 0, 0]}>
            <meshLambertMaterial color={P.gold} />
          </mesh>
        );
      })}
      <Labels labels={labels} points={stops} />
    </>
  );
}



/** The relief's WebGL canvas: orthographic, DPR capped at 1.5, renders only when the page scrolls, stops when paused. */
export default function ReliefCanvas({ id, paused, track, onReady, onLost, className, ready, labels, plate }: Props) {
  const spec = RELIEFS[id];
  return (
    <Canvas
      className={className}
      data-ready={ready}
      orthographic
      dpr={[1, 1.5]}
      frameloop={paused ? "never" : "demand"}
      camera={{ position: [0, 20, 30], near: 0.1, far: 200, zoom: 40 }}
      flat
      gl={{ antialias: true, alpha: spec.kind === "plate", powerPreference: "low-power" }}
      onCreated={({ gl, scene, invalidate }) => {
        if (spec.kind === "map") scene.background = new Color("#2f4f7f");
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost();
        });
        invalidate();
        if (spec.kind === "map") requestAnimationFrame(() => requestAnimationFrame(onReady));
      }}
    >
      {spec.kind === "plate" && plate ? <PlateRelief spec={spec} track={track} plate={plate} onLoaded={onReady} /> : <RouteMap track={track} labels={labels} />}
    </Canvas>
  );
}
